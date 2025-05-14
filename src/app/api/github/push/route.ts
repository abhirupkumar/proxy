
// app/api/github/push/route.ts
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { Octokit } from '@octokit/rest';

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await req.json() as { workspaceId: string };

        // Get the user from database
        const dbUser = await db.user.findUnique({
            where: { clerkId: user.id },
            select: {
                id: true,
                githubToken: true,
            },
        });

        if (!dbUser || !dbUser.githubToken) {
            return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
        }

        // Find workspace and associated GitHub repo
        const workspace = await db.workspace.findUnique({
            where: {
                id: workspaceId,
                userId: dbUser.id,
            },
            include: {
                githubRepo: true,
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        if (!workspace.githubRepo) {
            return NextResponse.json({ error: 'No GitHub repository connected to this workspace' }, { status: 400 });
        }

        if (!workspace.fileData) {
            return NextResponse.json({ error: 'No file data to push' }, { status: 400 });
        }

        // Initialize Octokit with GitHub token
        const octokit = new Octokit({ auth: dbUser.githubToken });
        const { repoOwner, repoName } = workspace.githubRepo;

        try {
            // Get default branch
            const repoInfo = await octokit.repos.get({
                owner: repoOwner,
                repo: repoName,
            });

            const defaultBranch = repoInfo.data.default_branch;

            // Get the latest commit on the default branch
            const refData = await octokit.git.getRef({
                owner: repoOwner,
                repo: repoName,
                ref: `heads/${defaultBranch}`,
            });
            const latestCommitSha = refData.data.object.sha;

            // Get the tree of the latest commit
            const commitData = await octokit.git.getCommit({
                owner: repoOwner,
                repo: repoName,
                commit_sha: latestCommitSha,
            });
            const treeSha = commitData.data.tree.sha;

            // Prepare files for the new tree
            const fileData = workspace.fileData as Record<string, any>;
            const files = Object.entries(fileData).map(([path, content]) => ({
                path,
                mode: '100644' as '100644', // Regular file
                type: 'blob' as 'blob',
                content: content.code as string,
            }));

            // Create a new tree
            const newTree = await octokit.git.createTree({
                owner: repoOwner,
                repo: repoName,
                base_tree: treeSha,
                tree: files,
            });

            // Create a new commit with the specified commit message
            const newCommit = await octokit.git.createCommit({
                owner: repoOwner,
                repo: repoName,
                message: 'feat: Implement ' + workspace.title,
                tree: newTree.data.sha,
                parents: [latestCommitSha],
            });

            // Update the reference to point to the new commit
            await octokit.git.updateRef({
                owner: repoOwner,
                repo: repoName,
                ref: `heads/${defaultBranch}`,
                sha: newCommit.data.sha,
            });

            // Update last synced timestamp and mark changes as pushed
            await db.gitHubRepo.update({
                where: { id: workspace.githubRepo.id },
                data: { lastSynced: new Date() },
            });

            // Mark changes as pushed
            await db.workspace.update({
                where: { id: workspaceId },
                data: { isChangesPushed: true },
            });

            return NextResponse.json({
                success: true,
                message: 'Successfully pushed changes to GitHub'
            });
        } catch (error: any) {
            console.error('Error pushing to GitHub:', error);
            return NextResponse.json({
                error: error.message || 'Failed to push to GitHub'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in push API:', error);
        return NextResponse.json({ error: 'Failed to push to GitHub' }, { status: 500 });
    }
}

export const runtime = "edge";
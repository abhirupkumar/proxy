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

        const { workspaceId, repoName, description, isPrivate } = await req.json();

        // Validate input
        if (!workspaceId || !repoName) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

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

        // Check if workspace belongs to user
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

        // Initialize Octokit with GitHub token
        const octokit = new Octokit({ auth: dbUser.githubToken });

        // Get authenticated user's info
        const { data: githubUser } = await octokit.users.getAuthenticated();

        // Create repository
        try {
            const { data: repo } = await octokit.repos.createForAuthenticatedUser({
                name: repoName,
                description: description || `Repository for ${workspace.title || 'Proxyai.tech workspace'}`,
                private: isPrivate === true,
                auto_init: true, // Initialize with README
            });

            // Store repo info in database
            if (workspace.githubRepo) {
                await db.gitHubRepo.update({
                    where: { id: workspace.githubRepo.id },
                    data: {
                        repoName: repo.name,
                        repoOwner: repo.owner.login,
                        repoUrl: repo.html_url,
                    },
                });
            } else {
                await db.gitHubRepo.create({
                    data: {
                        repoName: repo.name,
                        repoOwner: repo.owner.login,
                        repoUrl: repo.html_url,
                        workspaceId,
                    },
                });
            }

            // Push initial code
            if (workspace.fileData) {
                // Create the initial commit by pushing the workspace data
                await pushWorkspaceToRepo(octokit, repo.owner.login, repo.name, workspace.fileData);

                // Mark changes as pushed
                await db.workspace.update({
                    where: { id: workspaceId },
                    data: { isChangesPushed: true },
                });
            }

            return NextResponse.json({
                success: true,
                repoUrl: repo.html_url
            });
        } catch (error: any) {
            console.error('Error creating repository:', error);
            return NextResponse.json({
                error: error.message || 'Failed to create repository'
            }, { status: 500 });
        }
    } catch (error) {
        console.error('Error in create-repo API:', error);
        return NextResponse.json({ error: 'Failed to create repository' }, { status: 500 });
    }
}

// Helper function to push workspace data to a new repository
async function pushWorkspaceToRepo(octokit: any, owner: string, repo: string, fileData: any) {
    try {
        // Get the default branch reference
        const { data: refData } = await octokit.git.getRef({
            owner,
            repo,
            ref: 'heads/main', // Using main as the default branch
        });

        const mainBranchSha = refData.object.sha;

        // Get the tree that the commit points to
        const { data: commitData } = await octokit.git.getCommit({
            owner,
            repo,
            commit_sha: mainBranchSha,
        });

        const treeSha = commitData.tree.sha;

        // Prepare files for the new tree
        const files = Object.entries(fileData).map(([path, content]) => ({
            path,
            mode: '100644', // Regular file
            type: 'blob',
            content: typeof content === 'string' ? content : JSON.stringify(content),
        }));

        // Create a new tree
        const { data: newTree } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: treeSha,
            tree: files,
        });

        // Create a commit
        const { data: newCommit } = await octokit.git.createCommit({
            owner,
            repo,
            message: 'Initial commit from Proxyaii.tech',
            tree: newTree.sha,
            parents: [mainBranchSha],
        });

        // Update the reference
        await octokit.git.updateRef({
            owner,
            repo,
            ref: 'heads/main',
            sha: newCommit.sha,
        });

        return true;
    } catch (error) {
        console.error('Error pushing initial code to repository:', error);
        throw error;
    }
}
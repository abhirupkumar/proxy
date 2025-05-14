import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { Octokit } from '@octokit/rest';
import { pushWorkspaceToRepo } from '@/lib/queries';

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId, repoName, description, isPrivate } = await req.json() as {
            workspaceId: string;
            repoName: string;
            description: string;
            isPrivate: boolean;
        };

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

export const runtime = "edge";
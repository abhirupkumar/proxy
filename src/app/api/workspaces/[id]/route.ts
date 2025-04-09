// app/api/workspaces/[id]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const workspaceId = params.id;

        // Find user in database
        const dbUser = await db.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Get workspace
        const workspace = await db.workspace.findUnique({
            where: {
                id: workspaceId,
                userId: dbUser.id,
            },
            select: {
                id: true,
                title: true,
                githubRepo: {
                    select: {
                        repoName: true,
                        repoOwner: true,
                        repoUrl: true,
                        lastSynced: true,
                    },
                },
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        return NextResponse.json(workspace);
    } catch (error) {
        console.error('Error fetching workspace:', error);
        return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 });
    }
}
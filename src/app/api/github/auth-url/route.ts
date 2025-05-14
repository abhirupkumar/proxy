import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { env } from 'env';

// GitHub OAuth App credentials (store these in environment variables)
const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID!;
const GITHUB_REDIRECT_URI = env.GITHUB_REDIRECT_URI!;

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { workspaceId } = await req.json() as any;

        // Check if workspace belongs to user
        const dbUser = await db.user.findUnique({
            where: { clerkId: user.id },
        });

        if (!dbUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const workspace = await db.workspace.findUnique({
            where: {
                id: workspaceId,
                userId: dbUser.id,
            },
        });

        if (!workspace) {
            return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
        }

        // Generate GitHub OAuth URL with necessary scopes
        // For repository access, we need 'repo' scope
        const scope = 'repo';
        const state = Buffer.from(JSON.stringify({ workspaceId })).toString('base64');

        const authUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${GITHUB_REDIRECT_URI}&scope=${scope}&state=${state}`;

        return NextResponse.json({ authUrl });
    } catch (error) {
        console.error('Error generating GitHub auth URL:', error);
        return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
    }
}

export const runtime = "edge";
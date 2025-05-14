// app/api/github/callback/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { env } from 'env';

// GitHub OAuth App credentials (store these in environment variables)
const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET!;

export async function GET(request: Request) {
    try {
        const url = new URL(request.url);
        const code = url.searchParams.get('code');
        const stateParam = url.searchParams.get('state');

        if (!code || !stateParam) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        // Decode the state parameter to get workspaceId
        const { workspaceId } = JSON.parse(Buffer.from(stateParam, 'base64').toString());

        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Exchange code for access token
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const tokenData = await tokenResponse.json() as any;

        if (!tokenData.access_token) {
            return NextResponse.json({ error: 'Failed to obtain access token' }, { status: 400 });
        }

        // Store the token in the user record
        await db.user.update({
            where: {
                clerkId: user.id,
            },
            data: {
                githubToken: tokenData.access_token,
            },
        });

        // Redirect to create repository page
        // return NextResponse.redirect(`${env.NEXT_PUBLIC_HOST}/github/create-repo?workspaceId=${workspaceId}`);
        return NextResponse.redirect(`${env.NEXT_PUBLIC_HOST}/workspace/${workspaceId}`);
    } catch (error) {
        console.error('Error handling GitHub callback:', error);
        return NextResponse.json({ error: 'Failed to process GitHub callback' }, { status: 500 });
    }
}

export const runtime = "edge";
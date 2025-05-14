import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
    try {
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ isAuthorized: false });
        }

        const dbUser = await db.user.findUnique({
            where: { clerkId: user.id },
            select: { githubToken: true },
        });

        // Check if user has a GitHub token
        const isAuthorized = !!dbUser?.githubToken;

        return NextResponse.json({ isAuthorized });
    } catch (error) {
        console.error('Error checking GitHub auth:', error);
        return NextResponse.json({ isAuthorized: false, error: 'Failed to check GitHub authorization' });
    }
}

export const runtime = "edge";
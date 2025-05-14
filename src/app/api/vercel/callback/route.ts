import { handleVercelCallback } from '@/lib/actions/vercel';
import { env } from 'env';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code || !state) {
            return NextResponse.redirect(
                `${env.NEXT_PUBLIC_HOST}?error=Missing+parameters`
            );
        }

        const result = await handleVercelCallback(code, state);

        // Redirect back to app with success
        return NextResponse.redirect(
            `${env.NEXT_PUBLIC_HOST}?vercelConnected=true&vercelUser=${encodeURIComponent(result.user.username || result.user.name)}`
        );
    } catch (error) {
        console.error('Error handling Vercel callback:', error);
        return NextResponse.redirect(
            `${env.NEXT_PUBLIC_HOST}?error=${encodeURIComponent(
                error instanceof Error ? error.message : 'Failed to connect to Vercel'
            )}`
        );
    }
}

export const runtime = "edge";
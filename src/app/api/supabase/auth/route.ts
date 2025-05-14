// app/api/supabase/auth/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { env } from 'env';

// Generate a random string for state parameter
function generateRandomString(length: number) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

// Auth initiation endpoint
export async function GET(request: NextRequest) {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the redirect_uri parameter
    const url = new URL(request.url);
    const redirectUri = url.searchParams.get('redirect_uri') || '/';

    // Generate and store a state parameter to prevent CSRF
    const state = generateRandomString(32);

    // Store the state and redirect URI in the user record
    await db.user.update({
        where: { clerkId: userId },
        data: {
            vercelState: state, // Reusing vercelState field for supabase state
        },
    });

    // Construct the Supabase OAuth URL
    const clientId = env.SUPABASE_CLIENT_ID;
    const supabaseOAuthUrl = new URL('https://api.supabase.com/v1/oauth/authorize');

    supabaseOAuthUrl.searchParams.set('client_id', clientId || '');
    supabaseOAuthUrl.searchParams.set('response_type', 'code');
    supabaseOAuthUrl.searchParams.set('state', state);
    supabaseOAuthUrl.searchParams.set('redirect_uri', `${env.NEXT_PUBLIC_HOST}/api/supabase/callback`);
    supabaseOAuthUrl.searchParams.set('scope', 'all');

    // Save the original redirect URI for use after OAuth flow completes
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    supabaseOAuthUrl.searchParams.set('redirect_params', encodedRedirectUri);

    return NextResponse.redirect(supabaseOAuthUrl.toString());
}

export const runtime = "edge";
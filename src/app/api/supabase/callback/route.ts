// app/api/auth/callback/supabase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { env } from 'env';

export async function GET(request: NextRequest) {
    const redirectTo = (await cookies()).get('supabase-redirect')?.value || '/';
    (await cookies()).delete('supabase-redirect');
    try {
        const searchParams = request.nextUrl.searchParams;
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        // Check for errors first
        if (error) {
            console.error('OAuth error:', error, errorDescription);
            return NextResponse.redirect(new URL(`${redirectTo}?error=oauth_error`, request.url));
        }

        // Verify the state to prevent CSRF
        const savedState = (await cookies()).get('supabase-oauth-state')?.value;
        if (!savedState || savedState !== state) {
            console.error('State mismatch', { savedState, state });
            return NextResponse.redirect(new URL(`${redirectTo}?error=state_mismatch`, request.url));
        }

        // Clean up the state cookie
        (await cookies()).delete('supabase-oauth-state');

        if (!code) {
            return NextResponse.redirect(new URL(`${redirectTo}?error=no_code`, request.url));
        }

        // Exchange the code for a token
        const tokenResponse = await fetch('https://api.supabase.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                client_id: env.SUPABASE_CLIENT_ID!,
                client_secret: env.SUPABASE_CLIENT_SECRET!,
                redirect_uri: `${env.NEXT_PUBLIC_HOST}/api/supabase/callback`,
            }),
        });

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text();
            console.error('Token exchange failed:', error);
            return NextResponse.redirect(new URL(`${redirectTo}?error=token_exchange`, request.url));
        }

        const tokenData = await tokenResponse.json();
        const accessToken = tokenData.access_token;

        if (!accessToken) {
            return NextResponse.redirect(new URL(`${redirectTo}?error=no_access_token`, request.url));
        }

        // Get user info
        // const userResponse = await fetch('https://api.supabase.com/v1/profile', {
        //     headers: {
        //         Authorization: `Bearer ${accessToken}`,
        //     },
        // });

        // if (!userResponse.ok) {
        //     const error = await userResponse.text();
        //     console.error('Failed to get user info: ', error);
        //     return NextResponse.redirect(new URL(`${redirectTo}?error=user_info`, request.url));
        // }

        // const userData = await userResponse.json();

        // Store the token in the database
        const currentClerkUser = await currentUser();
        if (!currentClerkUser?.id) {
            return NextResponse.redirect(new URL('/sign-in?error=not_authenticated', request.url));
        }

        // Update user with Supabase token
        await db.user.update({
            where: { clerkId: currentClerkUser?.id },
            data: {
                supabaseToken: accessToken,
            },
        });


        return NextResponse.redirect(new URL(redirectTo, request.url));
    } catch (error) {
        console.error('OAuth callback error:', error);
        return NextResponse.redirect(new URL(`${redirectTo}?error=callback_error`, request.url));
    }
}

export const runtime = "edge";
'use client'

import React, { useEffect } from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { MessagesProvider } from '@/context/MessagesContext'
import { UserDetailProvider } from '@/context/UserDetailContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { api } from '../../convex/_generated/api'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

    // const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // useEffect(() => {
    //     IsAuthenticated();
    // }, []);

    // const IsAuthenticated = async () => {
    //     if (typeof window !== 'undefined') {
    //         const user = JSON.parse(localStorage.getItem('user') ?? "");
    //         const result = await convex.query(api.users.GetUser, {
    //             email: user?.email
    //         })
    //         console.log(result);
    //     }
    // }

    return <ClerkProvider appearance={{ baseTheme: dark }}>
        {/* <ConvexProvider client={convex}> */}
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_KEY!}>.
            <UserDetailProvider>
                <MessagesProvider>
                    <NextThemesProvider {...props}>{children}</NextThemesProvider>
                </MessagesProvider>
            </UserDetailProvider>
        </GoogleOAuthProvider>
        {/* </ConvexProvider> */}
    </ClerkProvider>
}
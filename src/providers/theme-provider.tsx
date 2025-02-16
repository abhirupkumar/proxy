'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { MessagesProvider } from '@/context/MessagesContext'
import { UserDetailProvider } from '@/context/UserDetailContext'
import { GoogleOAuthProvider } from '@react-oauth/google'

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    return <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_AUTH_KEY!}>.
        <UserDetailProvider>
            <MessagesProvider>
                <NextThemesProvider {...props}>{children}</NextThemesProvider>
            </MessagesProvider>
        </UserDetailProvider>
    </GoogleOAuthProvider>
}
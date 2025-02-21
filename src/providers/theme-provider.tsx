'use client'

import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { MessagesProvider } from '@/context/MessagesContext'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

    return <ClerkProvider appearance={{ baseTheme: dark }}>
        <MessagesProvider>
            <NextThemesProvider {...props}>{children}</NextThemesProvider>
        </MessagesProvider>
    </ClerkProvider>
}
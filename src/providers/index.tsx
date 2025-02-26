'use client'

import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { MessagesProvider } from '@/context/MessagesContext'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { SidebarProvider } from '@/components/ui/sidebar'
import Header from '@/components/custom/header'
import AppSidebar from '@/components/custom/app-sidebar'

export function Provider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

    return <ClerkProvider appearance={{ baseTheme: dark }}>
        <MessagesProvider>
            <NextThemesProvider {...props}>
                <Header />
                <SidebarProvider>
                    <AppSidebar />
                    {children}
                </SidebarProvider>
            </NextThemesProvider>
        </MessagesProvider>
    </ClerkProvider>
}
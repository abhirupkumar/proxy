'use client'

import React from 'react'
import { WorkspaceDataProvider } from '@/context/WorkspaceDataContext'
import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { SidebarProvider } from '@/components/ui/sidebar'
import Header from '@/components/custom/header'
import AppSidebar from '@/components/custom/app-sidebar'
import dynamic from 'next/dynamic'
import { TooltipProvider } from '@/components/ui/tooltip'
const NextThemesProvider = dynamic(
    () => import('next-themes').then((e) => e.ThemeProvider),
    {
        ssr: false,
    }
)

export function Provider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {

    return <ClerkProvider appearance={{ baseTheme: dark }}>
        <NextThemesProvider //dark mode
            {...props}
        >
            <TooltipProvider>
                <WorkspaceDataProvider>
                    <Header />
                    <SidebarProvider defaultOpen={false}>
                        <AppSidebar />
                        {children}
                    </SidebarProvider>
                </WorkspaceDataProvider>
            </TooltipProvider>
        </NextThemesProvider>
    </ClerkProvider>
}
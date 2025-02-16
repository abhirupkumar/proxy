"use client";

import { ThemeProvider } from '@/providers/theme-provider';
import React from 'react'
import Header from '../header';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
        >
            <Header />
            {children}
        </ThemeProvider>
    )
}

export default Layout;
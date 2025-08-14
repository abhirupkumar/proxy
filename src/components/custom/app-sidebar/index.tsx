import { Button, buttonVariants } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { MessageCircle, PanelsLeftBottom } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import WorkspaceHistory from '../workspace-history';
import ToggleSidebar from '../toggle-sidebar';
import SidebarFooterComponent from '../SidebarFooterComponent';
import { useTheme } from 'next-themes';

const AppSidebar = () => {
    const { theme } = useTheme();
    const { toggleSidebar } = useSidebar();
    return (
        <Sidebar collapsible="offcanvas" suppressHydrationWarning>
            <SidebarHeader className='p-4'>
                <Link href="/">
                    {theme === 'dark' ? <Image src="/logo-dark.svg" alt="Logo" width={120} height={40} /> :
                        <Image src="/logo-white.svg" alt="Logo" width={120} height={40} />}
                </Link>
            </SidebarHeader>
            <SidebarContent className='p-4 space-y-4'>
                <Link href='/' onClick={toggleSidebar} className={`${buttonVariants({})} w-full justify-start items-center`}>
                    <MessageCircle className="mr-2 h-5 w-5" />
                    <span className="text-md">Start New Chat</span>
                </Link>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Your Chats</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <WorkspaceHistory />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-800">
                <SidebarFooterComponent />
            </SidebarFooter>
        </Sidebar>
    )
}

export default AppSidebar;

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
        <Sidebar collapsible="offcanvas" >
            <SidebarHeader className='p-5'>
                <Link href="/">
                    <Image src={theme == 'dark' ? "/logo-dark.svg" : "/logo-white.svg"} alt="Logo" width={100} height={100} />
                </Link>
            </SidebarHeader>
            <SidebarContent className='p-5'>
                <Link href='/' onClick={toggleSidebar} className={buttonVariants()}> <MessageCircle /> Start New Chat</Link>
                <SidebarGroup />
                <SidebarGroupLabel>Your Chats</SidebarGroupLabel>
                <SidebarGroupContent>
                    <SidebarMenu>
                        <WorkspaceHistory />
                    </SidebarMenu>
                </SidebarGroupContent>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter>
                <SidebarFooterComponent />
            </SidebarFooter>
            <SidebarRail className='mt-auto h-fit'>
                <ToggleSidebar />
            </SidebarRail>
        </Sidebar>
    )
}

export default AppSidebar;
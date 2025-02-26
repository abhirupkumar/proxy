import { Button, buttonVariants } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader, SidebarRail, useSidebar } from '@/components/ui/sidebar';
import { MessageCircle, PanelsLeftBottom } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import WorkspaceHistory from '../workspace-history';
import ToggleSidebar from '../toggle-sidebar';

const AppSidebar = () => {
    const { toggleSidebar } = useSidebar();
    return (
        <Sidebar collapsible="offcanvas" >
            <SidebarHeader className='p-5'>
                <Link href="/">
                    <Image src="/logo-dark.svg" alt="Logo" width={100} height={100} />
                </Link>
            </SidebarHeader>
            <SidebarContent className='p-5'>
                <Link href='/' onClick={toggleSidebar} className={buttonVariants()}> <MessageCircle /> Start New Chat</Link>
                <SidebarGroup />
                <WorkspaceHistory />
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
            <SidebarRail className='mt-auto h-fit'>
                <ToggleSidebar />
            </SidebarRail>
        </Sidebar>
    )
}

export default AppSidebar;
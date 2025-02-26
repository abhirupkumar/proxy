import { Button } from '@/components/ui/button';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from '@/components/ui/sidebar';
import { MessageCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

const AppSidebar = () => {
    return (
        <Sidebar>
            <SidebarHeader className='p-5'>
                <Link href="/">
                    <Image src="/logo-dark.svg" alt="Logo" width={100} height={100} />
                </Link>
            </SidebarHeader>
            <SidebarContent className='p-5'>
                <Button> <MessageCircle /> Start New Chat</Button>
                <SidebarGroup />
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter />
        </Sidebar>
    )
}

export default AppSidebar;
"use client"

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { getAllWorkspaces, getWorkspace } from '@/lib/queries';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'

const WorkspaceHistory = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [workspaceList, setWorkspaceList] = useState<any>();
    const { toggleSidebar } = useSidebar();

    useEffect(() => {
        if (isLoaded && isSignedIn) {
            getAllWorkspacesFromClient();
        }
    }, [isSignedIn, user])

    const getAllWorkspacesFromClient = async () => {
        const workspaces = await getAllWorkspaces(user?.id!);
        setWorkspaceList(workspaces)
    }

    const truncate = (str: string | undefined | null) => {
        if (!str) return "New Chat";
        if (str.length > 20) {
            return str.substr(0, 20) + '...';
        }
        return str;
    }

    return (
        <div className='flex flex-col'>
            {workspaceList && workspaceList?.map((workspace: any, index: number) => {
                return (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild>
                            <Link onClick={toggleSidebar} href={`/workspace/${workspace.id}`} className=''>
                                {truncate(workspace.message[0].content)}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </div>
    )
}

export default WorkspaceHistory;
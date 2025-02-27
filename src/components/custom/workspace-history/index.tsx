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
        console.log(user?.id)
        const workspaces = await getAllWorkspaces(user?.id!);
        setWorkspaceList(workspaces)
    }

    return (
        <div className='flex flex-col'>
            {workspaceList && workspaceList?.map((workspace: any, index: number) => {
                return (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild>
                            <Link onClick={toggleSidebar} href={`/workspace/${workspace.id}`} className=''>
                                {workspace.message[0].content || "New Chat"}
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </div>
    )
}

export default WorkspaceHistory;
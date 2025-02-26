"use client"

import { useSidebar } from '@/components/ui/sidebar';
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
        <div>
            <h2 className='font-medium text-lg'>Your Chats</h2>
            <div className='flex flex-col'>
                {workspaceList && workspaceList?.map((workspace: any, index: number) => {
                    return (
                        <Link onClick={toggleSidebar} href={`/workspace/${workspace.id}`} key={index} className='text-sm text-gray-400 mt-2 font-black hover:bg-background/20 py-1 px-2 rounded-full hover:text-gray-200 w-full text-left'>
                            {workspace.message[0].content || "New Chat"}
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}

export default WorkspaceHistory;
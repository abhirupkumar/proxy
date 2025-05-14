"use client"

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { deleteWorkspace, getAllWorkspaces } from '@/lib/queries';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DeleteButton from '../delete-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { env } from 'env';

const WorkspaceHistory = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [workspaceList, setWorkspaceList] = useState<any>();
    const { toggleSidebar } = useSidebar();
    const router = useRouter();

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
        if (str.length > 24) {
            return str.substr(0, 24) + '...';
        }
        return str;
    }

    const handleDelete = async (id: string) => {
        await deleteWorkspace(id);
        router.push('/')
    }

    const handleToggle = (id: string) => {
        window.location.href = `${env.NEXT_PUBLIC_HOST}/workspace/${id}`
        toggleSidebar();
    }

    return (
        <div className='flex flex-col items-start'>
            {workspaceList && workspaceList?.map((workspace: any, index: number) => {
                return (
                    <SidebarMenuItem key={index} className='flex w-full items-center'>
                        <SidebarMenuButton title={workspace.title ?? "New Chat"} className='flex justify-between items-center w-full flex-1 group'>
                            <span onClick={() => handleToggle(workspace.id)}>{truncate(workspace.title ?? "New Chat")}</span>
                            <DeleteButton className="ml-auto cursor-pointer h-4 hidden group-hover:block absolute right-0" onClick={() => handleDelete(workspace.id)} />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </div>
    )
}

export default WorkspaceHistory;
"use client"

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { deleteWorkspace, getAllWorkspaces } from '@/lib/queries';
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import DeleteButton from '../delete-button';

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
        if (str.length > 23) {
            return str.substr(0, 23) + '...';
        }
        return str;
    }

    const handleDelete = async (id: string) => {
        await deleteWorkspace(id);
        router.push('/')
    }

    return (
        <div className='flex flex-col'>
            {workspaceList && workspaceList?.map((workspace: any, index: number) => {
                return (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton className='flex'>
                            <Link onClick={toggleSidebar} href={`/workspace/${workspace.id}`} className='flex-1'>
                                {truncate(workspace.title ?? workspace.Messages[0].content)}
                            </Link>
                            <DeleteButton onClick={() => handleDelete(workspace.id)} />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )
            })}
        </div>
    )
}

export default WorkspaceHistory;
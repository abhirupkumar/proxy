"use client"

import { SidebarMenuButton, SidebarMenuItem, useSidebar } from '@/components/ui/sidebar';
import { deleteWorkspace, getAllWorkspaces } from '@/lib/queries';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import DeleteButton from '../delete-button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { env } from 'env';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const WorkspaceHistory = () => {
    const { isLoaded, isSignedIn, user } = useUser();
    const [workspaceList, setWorkspaceList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { toggleSidebar } = useSidebar();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            getAllWorkspacesFromClient();
        } else if (isLoaded && !isSignedIn) {
            setLoading(false);
        }
    }, [isLoaded, isSignedIn, user]);

    const getAllWorkspacesFromClient = async () => {
        setLoading(true);
        try {
            const workspaces = await getAllWorkspaces(user!.id);
            setWorkspaceList(workspaces || []);
        } catch (error) {
            console.error("Failed to fetch workspaces:", error);
            setWorkspaceList([]);
        } finally {
            setLoading(false);
        }
    };

    const truncate = (str: string | undefined | null, length = 24) => {
        if (!str) return "New Chat";
        return str.length > length ? str.substring(0, length) + '...' : str;
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await deleteWorkspace(id);
            setWorkspaceList(prev => prev.filter(ws => ws.id !== id));
            router.push('/');
        } catch (error) {
            console.error("Failed to delete workspace:", error);
        }
    };

    const handleNavigate = (id: string) => {
        router.push(`/workspace/${id}`);
        if (toggleSidebar) {
            toggleSidebar();
        }
    };

    const memoizedWorkspaces = useMemo(() => {
        return workspaceList.map(workspace => (
            <SidebarMenuItem key={workspace.id} className="w-full group">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <SidebarMenuButton
                            title={workspace.title ?? "New Chat"}
                            className="flex justify-between items-center w-full text-sm font-medium"
                            onClick={() => handleNavigate(workspace.id)}
                        >
                            <span className="truncate">{truncate(workspace.title)}</span>
                            <DeleteButton
                                className="ml-2 h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => handleDelete(workspace.id, e)}
                            />
                        </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="center">
                        <p>{workspace.title ?? "New Chat"}</p>
                    </TooltipContent>
                </Tooltip>
            </SidebarMenuItem>
        ));
    }, [workspaceList, router, toggleSidebar]);

    if (loading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                ))}
            </div>
        );
    }

    return (
        <div className={cn('flex flex-col items-start space-y-1', { 'mt-4': workspaceList.length > 0 })}>
            {workspaceList.length > 0 ? memoizedWorkspaces : <p className="text-sm text-gray-500 dark:text-gray-400">No chat history.</p>}
        </div>
    );
}

export default WorkspaceHistory;

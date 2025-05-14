'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronRight, Loader2, PlusCircle, RefreshCw, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSupabase } from '@/context/SupabaseContext';
import { useToast } from '@/hooks/use-toast';
import { getSupabaseOAuthUrl } from '@/lib/actions/supabase';
import Image from 'next/image';

interface SupabaseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId?: string;
}

export function SupabaseModal({ open, onOpenChange, workspaceId }: SupabaseModalProps) {
    const { toast } = useToast()
    const {
        connection,
        isConnecting,
        isFetchingStats,
        isFetchingApiKeys,
        isProjectsExpanded,
        setIsProjectsExpanded,
        handleConnect,
        handleDisconnect,
        selectProject,
        handleCreateProject,
        updateToken,
        loadSupabaseStats,
    } = useSupabase();

    useEffect(() => {
        if (connection.isConnected) {
            loadSupabaseStats();
        }
    }, []);

    const [isRedirecting, setIsRedirecting] = useState(false);

    const handleOAuthConnect = async () => {
        try {

            // Get the OAuth URL and redirect
            const url = await getSupabaseOAuthUrl(workspaceId);
            window.location.href = url;
        } catch (error) {
            console.error('Failed to start OAuth flow:', error);
            toast({
                title: "Error",
                description: "Failed to fetch Supabase OAuth URL",
                variant: "destructive",
            })
            return null;
        }
    };

    const handleRefresh = async () => {
        await loadSupabaseStats();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Image src="/supabase.svg" height={20} width={20} alt="supabase-icon" />
                        Supabase Connection
                    </DialogTitle>
                </DialogHeader>

                {!connection.isConnected ? (
                    <div className="grid gap-4 py-4">
                        <div>
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleOAuthConnect}
                                disabled={isConnecting || isRedirecting}
                            >
                                {isRedirecting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Image src="/supabase.svg" height={20} width={20} alt="supabase-icon" />
                                )}
                                Connect with Supabase
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                                    Connected
                                </Badge>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDisconnect}
                                disabled={isConnecting}
                            >
                                Disconnect
                            </Button>
                        </div>

                        <div className="border rounded-md mb-4">
                            <div
                                className="flex items-center justify-between p-3 cursor-pointer"
                                onClick={() => setIsProjectsExpanded(!isProjectsExpanded)}
                            >
                                <div className="flex items-center gap-2">
                                    {isProjectsExpanded ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    <span>Your Projects{connection.stats ? ` (${connection.stats.totalProjects})` : ''}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRefresh();
                                        }}
                                        title="Refresh projects"
                                        disabled={isFetchingStats}
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isFetchingStats ? 'animate-spin' : ''}`} />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleCreateProject();
                                        }}
                                        title="Create new project"
                                    >
                                        <PlusCircle className="h-4 w-4" />
                                    </Button>
                                </div>

                            </div>

                            {isProjectsExpanded && (
                                <div className="px-3 pb-3">
                                    <div className="text-center my-2">
                                        <p className="text-sm text-muted-foreground">
                                            Select a project or create a new one for this chat
                                        </p>
                                    </div>

                                    {isFetchingStats ? (
                                        <div className="flex justify-center my-4">
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        </div>
                                    ) : connection.stats?.projects && connection.stats.projects.length > 0 ? (
                                        <ScrollArea className="max-h-[200px]">
                                            {connection.stats.projects.map((project) => (
                                                <div
                                                    key={project.id}
                                                    className={`flex items-center justify-between p-2 my-1 rounded-md ${connection.selectedProjectId === project.id
                                                        ? 'bg-muted'
                                                        : 'hover:bg-muted'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-2 w-2 rounded-full bg-green-500" />
                                                        <div>
                                                            <p className="text-sm font-medium">{project.name}</p>
                                                            <p className="text-xs text-muted-foreground">{project.region}</p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={() => selectProject(project.id)}
                                                        disabled={isFetchingApiKeys}
                                                    >
                                                        {isFetchingApiKeys && connection.selectedProjectId === project.id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                                        ) : null}
                                                        {connection.selectedProjectId === project.id ? 'Selected' : 'Select'}
                                                    </Button>
                                                </div>
                                            ))}
                                        </ScrollArea>
                                    ) : (
                                        <div className="text-center my-4">
                                            <p className="text-sm text-muted-foreground">No projects found</p>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="mt-2"
                                                onClick={handleCreateProject}
                                            >
                                                <PlusCircle className="h-4 w-4 mr-2" />
                                                Create a new project
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <DialogFooter className="flex items-center justify-between">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

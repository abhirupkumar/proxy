'use client';

import { useState, useRef, useEffect } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { RocketIcon, RefreshCw, Loader2, ExternalLink, CheckCircle, XCircle, AlertTriangle, MoreVertical } from 'lucide-react';
import { useVercel } from '@/context/VercelContext';
import VercelConnectModal from './vercel-connect-model';
import VercelProjectModal from './vercel-project-model';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';
import { cn, getStatusText } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface VercelDeployButtonProps {
    workspaceId: string;
}

const renderStatusIcon = (status: string) => {
    switch (status) {
        case 'READY':
        case 'SUCCEEDED':
        case 'PROMOTED':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
        case 'ERROR':
        case 'FAILED':
            return <XCircle className="h-4 w-4 text-red-500" />;
        case 'BUILDING':
        case 'INITIALIZING':
        case 'QUEUED':
            return <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />;
        case 'CANCELED':
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
        case 'NONE':
        default:
            return null;
    }
};

export default function VercelDeployButton({ workspaceId }: VercelDeployButtonProps) {
    const {
        vercelState,
        refreshVercelProjects,
        deployProject,
        disconnectVercel,
        setIsModalOpen,
        isModalOpen,
        selectedProject,
        setSelectedProject,
        deploymentInfo,
        loading
    } = useVercel();
    const { resolvedTheme } = useTheme();

    const [isDeploying, setIsDeploying] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const { workspaceData } = useWorkspaceData();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleDeployClick = async () => {
        if (!vercelState.isConnected) {
            setIsModalOpen(true);
            return;
        }

        if (workspaceData?.vercelProject) {
            await handleDeploy(workspaceData.vercelProject.projectId);
            return;
        }

        setShowProjectModal(true);
        await refreshVercelProjects();
    };

    const handleDeploy = async (projectId: string) => {
        try {
            setIsDeploying(true);
            await deployProject(workspaceId, projectId);
        } finally {
            setIsDeploying(false);
        }
    };

    const handleProjectSelected = async (projectId: string) => {
        await handleDeploy(projectId);
        setShowProjectModal(false);
    };

    const openDeployedSite = () => {
        if (deploymentInfo.url) {
            const url = deploymentInfo.url.startsWith('http')
                ? deploymentInfo.url
                : `https://${deploymentInfo.url}`;

            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleMenuClick = () => {
        if (!vercelState.isConnected) {
            setIsModalOpen(true);
            return;
        }

        if (workspaceData?.vercelProject) {
            handleDeploy(workspaceData.vercelProject.projectId)
            return;
        }
        setShowProjectModal(true)
    }

    const handleDisconnect = async () => {
        await disconnectVercel();
    };

    return (
        <>
            <div ref={dropdownRef} className={cn("!p-0", buttonVariants({ variant: 'outline' }))}>
                <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 relative"
                            disabled={isDeploying || vercelState.isConnecting || loading}
                        >
                            {vercelState.isConnected && (
                                <div className="absolute top-0 right-0 h-2 w-2 rounded-full bg-green-500 shadow-md" />
                            )}
                            {isDeploying ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            {resolvedTheme == 'dark' ? <Image src="/vercel.svg" height={13} width={13} alt="vercel-icon" /> : <Image src="/vercel-white.png" height={15} width={15} alt="vercel-icon" />}
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Deploy to Vercel
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleMenuClick} disabled={isDeploying || vercelState.isConnecting || loading} className='cursor-pointer'>
                            {workspaceData?.vercelProject ? "Redeploy" : "Deploy"}
                        </DropdownMenuItem>
                        {vercelState.isConnected && <DropdownMenuItem onClick={handleDisconnect} disabled={isDeploying || vercelState.isConnecting || loading} className='cursor-pointer'>
                            Disconnect
                        </DropdownMenuItem>}
                        {(deploymentInfo.status === 'SUCCEEDED' || deploymentInfo.status === 'PROMOTED') && deploymentInfo.url && (
                            <DropdownMenuItem onClick={openDeployedSite}>
                                Open deployed site
                            </DropdownMenuItem>
                        )}
                        {deploymentInfo && deploymentInfo.status !== 'NONE' && <DropdownMenuSeparator />}

                        {deploymentInfo && deploymentInfo.status !== 'NONE' && (
                            <DropdownMenuItem disabled>
                                <div className="flex items-center gap-1">
                                    {renderStatusIcon(deploymentInfo.status)}
                                    <span className="text-xs text-muted-foreground">{getStatusText(deploymentInfo.status)}</span>
                                </div>
                                {deploymentInfo.status === 'ERROR'
                                    ? `Deployment failed: ${deploymentInfo.error || 'Unknown error'}`
                                    : `Deployment status: ${getStatusText(deploymentInfo.status)}`
                                }
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <VercelConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnected={() => setShowProjectModal(true)}
            />

            <VercelProjectModal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                workspaceId={workspaceId}
                onProjectSelected={handleProjectSelected}
            />
        </>
    );
}
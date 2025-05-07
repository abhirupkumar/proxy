'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RocketIcon, RefreshCw, Loader2, ExternalLink, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useVercel } from '@/context/VercelContext';
import VercelConnectModal from './vercel-connect-model';
import VercelProjectModal from './vercel-project-model';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { getWorkspace } from '@/lib/queries';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';
import { getStatusText } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

    const handleDeployClick = async () => {
        // Check if connected to Vercel first
        if (!vercelState.isConnected) {
            setIsModalOpen(true);
            return;
        }

        if (workspaceData?.vercelProject) {
            await handleDeploy(workspaceData.vercelProject.projectId);
            return;
        }

        // Otherwise, show the project selection modal
        setShowProjectModal(true);
        await refreshVercelProjects(); // Refresh project list
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

    // Open the deployed site in a new tab
    const openDeployedSite = () => {
        if (deploymentInfo.url) {
            // Check if the URL already has a protocol
            const url = deploymentInfo.url.startsWith('http')
                ? deploymentInfo.url
                : `https://${deploymentInfo.url}`;

            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <>
            <Button
                onClick={handleDeployClick}
                className="flex items-center gap-2"
                variant="outline"
                disabled={isDeploying || vercelState.isConnecting || loading}
            >
                {isDeploying ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                    </>
                ) : (
                    <>
                        {resolvedTheme == 'dark' ? <Image src="/vercel.svg" height={13} width={13} alt="vercel-icon" /> : <Image src="/vercel-white.png" height={15} width={15} alt="vercel-icon" />}
                        {workspaceData?.vercelProject ? "Redeploy" : "Deploy"}
                    </>
                )}
            </Button>

            {/* Status indicator */}
            {deploymentInfo && deploymentInfo.status !== 'NONE' && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1">
                                {renderStatusIcon(deploymentInfo.status)}
                                <span className="text-xs text-muted-foreground">{getStatusText(deploymentInfo.status)}</span>
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            {deploymentInfo.status === 'ERROR'
                                ? `Deployment failed: ${deploymentInfo.error || 'Unknown error'}`
                                : `Deployment status: ${getStatusText(deploymentInfo.status)}`
                            }
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Open site button */}
            {(deploymentInfo.status === 'SUCCEEDED' || deploymentInfo.status === 'PROMOTED') && deploymentInfo.url && (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={openDeployedSite}
                                className="h-8 w-8 p-0"
                            >
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            Open deployed site
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )}

            {/* Connection Modal */}
            <VercelConnectModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConnected={() => setShowProjectModal(true)}
            />

            {/* Project Selection Modal */}
            <VercelProjectModal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                workspaceId={workspaceId}
                onProjectSelected={handleProjectSelected}
            />
        </>
    );
}
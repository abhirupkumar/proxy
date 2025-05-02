'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RocketIcon, RefreshCw, Loader2 } from 'lucide-react';
import { useVercel } from '@/context/VercelContext';
import VercelConnectModal from './vercel-connect-model';
import VercelProjectModal from './vercel-project-model';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { getWorkspace } from '@/lib/queries';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';

interface VercelDeployButtonProps {
    workspaceId: string;
}

export default function VercelDeployButton({ workspaceId }: VercelDeployButtonProps) {
    const {
        vercelState,
        refreshVercelProjects,
        deployProject,
        setIsModalOpen,
        isModalOpen,
        selectedProject,
        setSelectedProject
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

    return (
        <>
            <Button
                onClick={handleDeployClick}
                className="flex items-center gap-2"
                variant="outline"
                disabled={isDeploying || vercelState.isConnecting}
            >
                {isDeploying ? (
                    <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Deploying...
                    </>
                ) : (
                    <>
                        {resolvedTheme == 'dark' ? <Image src="/vercel.svg" height={13} width={13} alt="vercel-icon" /> : <Image src="/vercel-white.png" height={15} width={15} alt="vercel-icon" />}
                        Deploy
                    </>
                )}
            </Button>

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
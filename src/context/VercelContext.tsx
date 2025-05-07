'use client';

import { createVercelProject, deployToVercel, disconnectVercel, getVercelAuthUrl, getVercelProjects, getVercelUser } from '@/lib/actions/vercel';
import { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useWorkspaceData } from './WorkspaceDataContext';

// Define types
export type VercelProject = {
    id: string;
    name: string;
    accountId: string;
    createdAt: number;
    updatedAt: number;
    framework?: string;
    link?: {
        productionBranch?: string;
        type?: string;
        org?: string;
        repo?: string;
    };
    latestDeployments?: any[];
};

export type VercelUser = {
    id: string;
    name: string;
    email: string;
    username: string;
};

export type VercelState = {
    isConnected: boolean;
    isConnecting: boolean;
    isFetchingStats: boolean;
    user: VercelUser | null;
    token: string | null;
    stats: {
        projects: VercelProject[];
        totalProjects: number;
    } | null;
};

type VercelContextType = {
    vercelState: VercelState;
    connectVercel: () => Promise<void>;
    disconnectVercel: () => Promise<void>;
    refreshVercelProjects: () => Promise<void>;
    createProject: (workspaceId: string, projectData: any) => Promise<any>;
    deployProject: (workspaceId: string, projectId: string, environmentVariables?: Record<string, string>) => Promise<any>;
    isModalOpen: boolean;
    setIsModalOpen: (value: boolean) => void;
    selectedProject: VercelProject | null;
    setSelectedProject: (project: VercelProject | null) => void;
    deploymentInfo: DeploymentInfo;
    setDeploymentInfo: Dispatch<SetStateAction<DeploymentInfo>>
    loading: boolean;
};

const initialState: VercelState = {
    isConnected: false,
    isConnecting: false,
    isFetchingStats: false,
    user: null,
    token: null,
    stats: null,
};

interface DeploymentInfo {
    status: 'BUILDING' | 'ERROR' | 'SUCCEEDED' | 'CANCELED' | 'PROMOTED' | 'NONE';
    url?: string;
    error?: string;
    deploymentId?: string;
}

const VercelContext = createContext<VercelContextType | undefined>(undefined);

export function VercelProvider({ children }: { children: ReactNode }) {
    const [vercelState, setVercelState] = useState<VercelState>(initialState);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<VercelProject | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { workspaceData } = useWorkspaceData();
    const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo>({ status: 'NONE' });
    const { toast } = useToast();

    useEffect(() => {
        if (workspaceData != null && workspaceData.vercelProject && workspaceData.vercelProject.deployments) {
            const deployments = workspaceData.vercelProject.deployments.sort((a: any, b: any) => a.createdAt - b.createdAt)
            const latestDeploment = deployments[deployments.length - 1];
            setDeploymentInfo({
                status: latestDeploment?.status,
                url: latestDeploment?.url ?? "",
                error: "",
                deploymentId: latestDeploment?.deploymentId
            })
        }
    }, [workspaceData])

    // Check URL for Vercel connection parameters
    useEffect(() => {
        const getVerselState = async () => {
            const vercelUser: VercelUser = (await getVercelUser()) as any;
            if (!vercelUser)
                toast({
                    title: "Vercel Error"
                })
            setVercelState(prev => ({
                ...prev,
                isConnected: true,
                user: {
                    id: vercelUser.id,
                    name: vercelUser.name,
                    email: vercelUser.email,
                    username: vercelUser.username
                }
            }));
            refreshVercelProjects();
        }

        getVerselState();
    }, []);

    const updateVercelState = (updates: Partial<VercelState>) => {
        setVercelState(prev => {
            const newState = { ...prev, ...updates };

            return newState;
        });
    };

    const connectVercel = async () => {
        try {
            updateVercelState({ isConnecting: true });

            // Get auth URL using server action
            const { url } = await getVercelAuthUrl();

            if (url) {
                window.location.href = url;
            } else {
                throw new Error('Failed to get Vercel authorization URL');
            }
        } catch (error) {
            console.error('Vercel connection error:', error);
            toast({
                title: "Error",
                description: 'Failed to connect to Vercel',
                variant: "destructive",
            });
            updateVercelState({ isConnecting: false });
        }
    };

    const handleDisconnect = async () => {
        try {
            // Call server action to remove token from user record
            await disconnectVercel();

            // Clear local state
            updateVercelState({
                token: null,
                user: null,
                stats: null,
                isConnected: false
            });

            toast({
                title: "Success",
                description: 'Disconnected from Vercel',
            });
        } catch (error) {
            console.error('Failed to disconnect from Vercel', error);
            toast({
                title: "Error",
                description: 'Failed to disconnect from Vercel',
                variant: "destructive",
            });
        }
    };

    const refreshVercelProjects = async () => {
        try {
            updateVercelState({ isFetchingStats: true });

            const { projects } = await getVercelProjects();

            updateVercelState({
                isFetchingStats: false,
                stats: {
                    projects: projects || [],
                    totalProjects: projects?.length || 0,
                },
            });
        } catch (error) {
            console.error('Vercel API Error:', error);
            toast({
                title: "Error",
                description: 'Failed to fetch Vercel statistics',
                variant: "destructive",
            });
            updateVercelState({ isFetchingStats: false });
        }
        finally {
            setLoading(false);
        }
    };

    const createProject = async (workspaceId: string, projectData: any) => {
        try {
            const result = await createVercelProject(workspaceId, projectData);
            toast({
                title: "Success",
                description: 'Project created successfully',
            });

            // Refresh projects list
            refreshVercelProjects();

            return result;
        } catch (error) {
            console.log(error)
            console.error('Failed to create Vercel project:', error);
            toast({
                title: "Error",
                description: `Failed to create project: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
            });
            throw error;
        }
    };

    const deployProject = async (workspaceId: string, projectId: string, environmentVariables?: Record<string, string>) => {
        try {
            const result = await deployToVercel(workspaceId, projectId, environmentVariables);
            toast({
                title: "Success",
                description: `Deployment initiated successfully`,
            });
            return result;
        } catch (error) {
            console.error('Deployment error:', error);
            toast({
                title: "Error",
                description: `Deployment Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                variant: "destructive",
            });
            throw error;
        }
    };

    return (
        <VercelContext.Provider
            value={{
                vercelState,
                connectVercel,
                disconnectVercel: handleDisconnect,
                refreshVercelProjects,
                createProject,
                deployProject,
                isModalOpen,
                setIsModalOpen,
                selectedProject,
                setSelectedProject,
                deploymentInfo,
                setDeploymentInfo,
                loading
            }}
        >
            {children}
        </VercelContext.Provider>
    );
}

export function useVercel() {
    const context = useContext(VercelContext);
    if (context === undefined) {
        throw new Error('useVercel must be used within a VercelProvider');
    }
    return context;
}
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
    SupabaseConnectionState,
    SupabaseStats,
    SupabaseProject,
    SupabaseCredentials
} from '@/lib/types';
import { fetchSupabaseStats, fetchProjectApiKeys, connectToSupabase, disconnectFromSupabase } from '@/lib/actions/supabase';
import { useToast } from '@/hooks/use-toast';

interface SupabaseContextType {
    connection: SupabaseConnectionState;
    setConnection: React.Dispatch<React.SetStateAction<SupabaseConnectionState>>;
    isConnecting: boolean;
    setIsConnecting: React.Dispatch<React.SetStateAction<boolean>>;
    isFetchingStats: boolean;
    isFetchingApiKeys: boolean;
    isProjectsExpanded: boolean;
    isDropdownOpen: boolean;
    setIsProjectsExpanded: (expanded: boolean) => void;
    setIsDropdownOpen: (open: boolean) => void;
    handleConnect: () => Promise<boolean>;
    handleDisconnect: () => Promise<void>;
    selectProject: (projectId: string) => Promise<void>;
    handleCreateProject: () => void;
    updateToken: (token: string) => void;
    loadSupabaseStats: () => Promise<void>;
}

const defaultConnectionState: SupabaseConnectionState = {
    token: null,
    isConnected: false,
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function useSupabase() {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
}

interface SupabaseProviderProps {
    children: ReactNode;
}

export function SupabaseProvider({
    children,
}: SupabaseProviderProps) {
    const router = useRouter();
    const { toast } = useToast()

    const initialState: SupabaseConnectionState = {
        token: null,
        isConnected: false,
    };

    const [connection, setConnection] = useState<SupabaseConnectionState>(initialState);
    const [isConnecting, setIsConnecting] = useState(true);
    const [isFetchingStats, setIsFetchingStats] = useState(false);
    const [isFetchingApiKeys, setIsFetchingApiKeys] = useState(false);
    const [isProjectsExpanded, setIsProjectsExpanded] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Fetch projects on mount if we have a token
    useEffect(() => {
        if (connection.token && !connection.stats) {
            loadSupabaseStats();
        }
    }, [connection.token]);

    const loadSupabaseStats = async () => {
        if (!connection.token) return;

        setIsFetchingStats(true);
        try {
            const data = await fetchSupabaseStats(connection.token);

            setConnection(prev => ({
                ...prev,
                stats: data.stats,
            }));
        } catch (error) {
            console.error('Failed to fetch Supabase stats:', error);
            toast({
                title: "Error",
                description: 'Failed to load Supabase projects',
                variant: "destructive",
            })
        } finally {
            setIsFetchingStats(false);
        }
    };

    const updateConnection = (newConnection: Partial<SupabaseConnectionState>) => {
        setConnection(prevState => {
            const currentState = { ...prevState };

            if (newConnection.token !== undefined) {
                const newToken = newConnection.token !== undefined ? newConnection.token : currentState.token;
                newConnection.isConnected = !!(newToken);
            }

            if (newConnection.selectedProjectId !== undefined) {
                if (newConnection.selectedProjectId && currentState.stats?.projects) {
                    const selectedProject = currentState.stats.projects.find(
                        (project) => project.id === newConnection.selectedProjectId
                    );

                    if (selectedProject) {
                        newConnection.project = selectedProject;
                    } else if (newConnection.selectedProjectId) {
                        newConnection.project = {
                            id: newConnection.selectedProjectId,
                            name: `Project ${newConnection.selectedProjectId.substring(0, 8)}...`,
                            region: 'unknown',
                            organization_id: '',
                            status: 'active',
                            created_at: new Date().toISOString(),
                        };
                    }
                } else if (newConnection.selectedProjectId === '') {
                    newConnection.project = undefined;
                    newConnection.credentials = undefined;
                }
            }

            return { ...currentState, ...newConnection };
        });
    };

    const handleConnect = async () => {
        if (!connection.token) {
            toast({
                title: "Error",
                description: 'Please enter your Supabase token',
                variant: "destructive",
            })
            return false;
        }

        setIsConnecting(true);

        try {
            const cleanToken = connection.token.trim();
            const result = await connectToSupabase(cleanToken);

            if (result.error) {
                throw new Error(result.error);
            }

            updateConnection({
                token: cleanToken,
                stats: result.stats,
            });

            toast({
                title: "Success",
                description: 'Successfully connected to Supabase',
            })
            setIsProjectsExpanded(true);
            return true;
        } catch (error) {
            console.error('Connection error:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to connect to Supabase',
                variant: "destructive",
            })
            updateConnection({ token: null });
            return false;
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        setIsConnecting(true);
        await disconnectFromSupabase();
        updateConnection({ token: null, selectedProjectId: undefined });
        setIsConnecting(false);
        toast({
            title: "Success",
            description: 'Disconnected from Supabase',
        })
        setIsDropdownOpen(false);

        // You could add a server action call here to clear the user's token in the database
    };

    const selectProject = async (projectId: string) => {
        if (!connection.token) return;

        updateConnection({
            selectedProjectId: projectId,
        });

        if (projectId) {
            try {
                setIsFetchingApiKeys(true);
                const keys = await fetchProjectApiKeys(projectId, connection.token);

                if (keys) {
                    updateConnection({
                        credentials: {
                            anonKey: keys.anonKey,
                            supabaseUrl: keys.supabaseUrl,
                        },
                    });

                    toast({
                        title: "Success",
                        description: 'Project selected successfully',
                    })
                }
            } catch (error) {
                console.error('Failed to fetch API keys:', error);
                toast({
                    title: "Error",
                    description: 'Selected project but failed to fetch API keys',
                    variant: "destructive",
                })
            } finally {
                setIsFetchingApiKeys(false);
            }
        }

        setIsDropdownOpen(false);
    };

    const handleCreateProject = () => {
        window.open('https://app.supabase.com/new/new-project', '_blank');
    };

    const updateToken = (token: string) => {
        updateConnection({ token });
    };

    const value = {
        connection,
        setConnection,
        isConnecting,
        setIsConnecting,
        isFetchingStats,
        isFetchingApiKeys,
        isProjectsExpanded,
        setIsProjectsExpanded,
        isDropdownOpen,
        setIsDropdownOpen,
        handleConnect,
        handleDisconnect,
        selectProject,
        handleCreateProject,
        updateToken,
        loadSupabaseStats
    };

    return (
        <SupabaseContext.Provider value={value}>
            {children}
        </SupabaseContext.Provider>
    );
}
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Database } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSupabase } from '@/context/SupabaseContext';
import Image from 'next/image';
import { SupabaseModal } from './supabase-model';

interface SupabaseConnectButtonProps {
    workspaceId: string;
}

export function SupabaseButton({ workspaceId }: SupabaseConnectButtonProps) {
    const { connection } = useSupabase();
    const isConnected = connection.isConnected && !!connection.selectedProjectId;
    const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

    return (
        <>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className={cn(
                                "relative h-9 w-9 mr-3"
                            )}
                            onClick={() => setIsSupabaseModalOpen(true)}
                        >
                            <Image src="/supabase.svg" height={15} width={15} alt="supabase-icon" />
                            {isConnected && (
                                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-500" />
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        {isConnected
                            ? `Connected to ${connection.project?.name || 'Supabase'}`
                            : 'Connect to Supabase'}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <SupabaseModal
                open={isSupabaseModalOpen}
                onOpenChange={setIsSupabaseModalOpen}
                workspaceId={workspaceId}
            />
        </>
    );
}
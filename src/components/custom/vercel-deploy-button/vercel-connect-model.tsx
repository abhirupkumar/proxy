'use client';

import { useState, useEffect } from 'react';
import { useVercel } from '@/context/VercelContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut, RefreshCw } from 'lucide-react';

interface VercelConnectModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConnected?: () => void;
}

export default function VercelConnectModal({ isOpen, onClose, onConnected }: VercelConnectModalProps) {
    const { vercelState, connectVercel, disconnectVercel, refreshVercelProjects } = useVercel();
    const [isRefreshing, setIsRefreshing] = useState(false);

    const handleConnect = async () => {
        await connectVercel();
    };

    const handleDisconnect = async () => {
        await disconnectVercel();
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshVercelProjects();
        } finally {
            setIsRefreshing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Connect to Vercel</DialogTitle>
                    <DialogDescription>
                        {vercelState.isConnected
                            ? `Connected as ${vercelState.user?.username || vercelState.user?.name || 'Unknown'}`
                            : 'Connect your Vercel account to deploy your workspace'}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {vercelState.isConnected ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium">Account</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {vercelState.user?.username || vercelState.user?.name || 'Unknown'}
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={handleDisconnect}
                                    className="flex items-center gap-2"
                                >
                                    <LogOut className="h-4 w-4" />
                                    Disconnect
                                </Button>
                            </div>

                            {vercelState.stats && (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-sm font-medium">Projects</h3>
                                        <p className="text-sm text-muted-foreground">{vercelState.stats.totalProjects} available</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing || vercelState.isFetchingStats}
                                        className="flex items-center gap-2"
                                    >
                                        {isRefreshing || vercelState.isFetchingStats ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="h-4 w-4" />
                                        )}
                                        Refresh
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center">
                            <Button
                                onClick={handleConnect}
                                disabled={vercelState.isConnecting}
                                className="flex items-center gap-2 mx-auto"
                            >
                                {vercelState.isConnecting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 116 100"
                                        fill="currentColor"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            clipRule="evenodd"
                                            d="M57.5 0L115 100H0L57.5 0Z"
                                        />
                                    </svg>
                                )}
                                {vercelState.isConnecting ? 'Connecting...' : 'Connect to Vercel'}
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
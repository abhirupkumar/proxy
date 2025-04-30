'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { disconnectVercel, fetchVercelStats, isConnecting, updateVercelConnection, vercelConnection } from '@/lib/vercel';
import { useToast } from '@/hooks/use-toast';
import { getUserVercelToken, removeVercelToken, saveVercelToken } from '@/lib/actions/vercel';
import { ExternalLink, Link2OffIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function VercelConnect() {
    const [tokenInput, setTokenInput] = useState('');
    const $vercelConnection = useStore(vercelConnection);
    const $isConnecting = useStore(isConnecting);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    // Check for existing token on mount
    useEffect(() => {
        async function checkExistingToken() {
            setIsLoading(true);
            const result = await getUserVercelToken();

            if (result.success && result.token) {
                isConnecting.set(true);
                try {
                    // Verify token and get user info
                    const response = await fetch('https://api.vercel.com/v2/user', {
                        headers: {
                            Authorization: `Bearer ${result.token}`,
                        },
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        updateVercelConnection({
                            token: result.token,
                            user: userData,
                        });

                        // Fetch projects
                        await fetchVercelStats(result.token);
                    } else {
                        toast({
                            variant: "destructive",
                            title: "Connection Error",
                            description: "Saved Vercel token is invalid"
                        });
                        await removeVercelToken();
                        disconnectVercel();
                    }
                } catch (error) {
                    console.error('Error verifying token:', error);
                    toast({
                        variant: "destructive",
                        title: "Connection Error",
                        description: "Error connecting to Vercel"
                    });
                    disconnectVercel();
                } finally {
                    isConnecting.set(false);
                }
            }
            setIsLoading(false);
        }

        checkExistingToken();
    }, [toast]);

    async function handleConnect(e: React.FormEvent) {
        e.preventDefault();
        if (!tokenInput.trim()) {
            toast({
                variant: "destructive",
                title: "Missing Token",
                description: "Please enter a valid Vercel token"
            });
            return;
        }

        isConnecting.set(true);
        try {
            const result = await saveVercelToken(tokenInput);

            if (result.success) {
                updateVercelConnection({
                    token: tokenInput,
                    user: result.user,
                });

                // Fetch projects
                await fetchVercelStats(tokenInput);

                toast({
                    title: "Success",
                    description: "Successfully connected to Vercel"
                });
                setTokenInput('');
            } else {
                toast({
                    variant: "destructive",
                    title: "Connection Failed",
                    description: result.error || "Failed to connect to Vercel"
                });
            }
        } catch (error) {
            console.error('Error connecting to Vercel:', error);
            toast({
                variant: "destructive",
                title: "Connection Error",
                description: "Error connecting to Vercel"
            });
        } finally {
            isConnecting.set(false);
        }
    }

    async function handleDisconnect() {
        try {
            await removeVercelToken();
            disconnectVercel();
            toast({
                title: "Disconnected",
                description: "Successfully disconnected from Vercel"
            });
        } catch (error) {
            console.error('Error disconnecting from Vercel:', error);
            toast({
                variant: "destructive",
                title: "Disconnect Error",
                description: "Error disconnecting from Vercel"
            });
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Connect to Vercel</CardTitle>
                    <CardDescription>Link your Vercel account to deploy your projects</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    if ($vercelConnection.user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Vercel Connection</CardTitle>
                    <CardDescription>Your Vercel account is connected</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4 mb-4">
                        {$vercelConnection.user.avatar && (
                            <img
                                src={$vercelConnection.user.avatar}
                                alt="Avatar"
                                className="w-10 h-10 rounded-full"
                            />
                        )}
                        <div>
                            <p className="font-medium">{$vercelConnection.user.name}</p>
                            <p className="text-sm text-gray-500">{$vercelConnection.user.email}</p>
                        </div>
                    </div>

                    {$vercelConnection.stats && (
                        <div className="mt-4">
                            <p className="text-sm font-medium mb-2">
                                {$vercelConnection.stats.totalProjects} Projects Connected
                            </p>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button
                        variant="secondary"
                        onClick={handleDisconnect}
                        className="flex items-center space-x-2"
                    >
                        <Link2OffIcon className="h-4 w-4" />
                        <span>Disconnect</span>
                    </Button>

                    <Button
                        variant="outline"
                        className="flex items-center space-x-2"
                        onClick={() => window.open('https://vercel.com/dashboard', '_blank')}
                    >
                        <ExternalLink className="h-4 w-4" />
                        <span>Open Dashboard</span>
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Connect to Vercel</CardTitle>
                <CardDescription>Link your Vercel account to deploy your projects</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleConnect} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="token" className="text-sm font-medium">
                            Vercel Access Token
                        </label>
                        <Input
                            id="token"
                            type="password"
                            placeholder="Enter your Vercel access token"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            disabled={$isConnecting}
                        />
                        <p className="text-xs text-gray-500">
                            You can create a token in{" "}
                            <a
                                href="https://vercel.com/account/tokens"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                Vercel Account Settings
                            </a>
                        </p>
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Button
                    type="submit"
                    onClick={handleConnect}
                    disabled={$isConnecting || !tokenInput.trim()}
                    className="w-full"
                >
                    {$isConnecting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        "Connect to Vercel"
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
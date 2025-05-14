import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GithubIcon, Loader2, ChevronDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface GitHubConnectButtonProps {
    workspaceId: string;
    isConnected?: boolean;
    repoUrl?: string;
    hasUnpushedChanges?: boolean;
    workspaceTitle?: string;
}

export function GithubConnectButton({
    workspaceId,
    isConnected = false,
    repoUrl,
    hasUnpushedChanges = false,
    workspaceTitle = ""
}: GitHubConnectButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [repoName, setRepoName] = useState(workspaceTitle);
    const [repoDescription, setRepoDescription] = useState('Repository for ' + repoName);
    const [isPrivate, setIsPrivate] = useState(true);
    const [error, setError] = useState('');
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const initiateGitHubAuth = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/github/auth-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workspaceId }),
            });

            const data = await response.json() as any;
            if (data.authUrl) {
                sessionStorage.setItem('github_connect_workspace', workspaceId);
                window.location.href = data.authUrl;
            } else {
                setError('Failed to initiate Github connection');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error connecting to Github:', error);
            setError('Failed to connect to Github');
            setIsLoading(false);
        }
    };

    const createRepository = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/github/create-repo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    workspaceId,
                    repoName,
                    description: repoDescription,
                    isPrivate,
                }),
            });

            const data = await response.json() as any;

            if (response.ok) {
                router.refresh();
                setIsPopoverOpen(false);
            } else {
                setError(data.error || 'Failed to create repository');
            }
        } catch (error) {
            console.error('Error creating repository:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const pushToGitHub = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/github/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ workspaceId }),
            });

            const data = await response.json() as any;

            if (response.ok) {
                alert('Successfully pushed code to Github!');
                router.refresh();
                setIsPopoverOpen(false);
            } else {
                setError(data.error || 'Failed to push code');
            }
        } catch (error) {
            console.error('Error pushing to Github:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConnectClick = () => {
        initiateGitHubAuth();
        setIsPopoverOpen(false);
    }

    const handleCreateRepoClick = () => {
        setOpen(true);
        setIsPopoverOpen(false);
    }

    const handlePushChangesClick = () => {
        pushToGitHub();
        setIsPopoverOpen(false);
    }

    return (
        <div className="flex flex-col gap-2 ml-3">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className="flex items-center !px-2.5"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <span className='relative'>
                                <GithubIcon className="h-4 w-4" />
                                {isConnected && (
                                    <div className="absolute -top-2.5 -right-2.5 h-2 w-2 rounded-full bg-green-500 shadow-md" />
                                )}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60">
                    <div className="grid gap-2">
                        {!isConnected && (
                            <Button variant="ghost" onClick={handleConnectClick} disabled={isLoading}>
                                Connect to Github
                            </Button>
                        )}
                        {isConnected && repoUrl === "" && (
                            <Button variant="ghost" onClick={handleCreateRepoClick} disabled={isLoading}>
                                Create Repository
                            </Button>
                        )}
                        {isConnected && repoUrl !== "" && hasUnpushedChanges && (
                            <Button variant="ghost" onClick={handlePushChangesClick} disabled={isLoading}>
                                Push Changes
                            </Button>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {open && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen px-4 py-4">
                        <div className="fixed inset-0 transition-opacity">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg leading-6 font-medium text-gray-900">
                                    Create Github Repository
                                </h3>
                                <div className="mt-2">
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="repoName">Repository Name</Label>
                                            <Input
                                                id="repoName"
                                                value={repoName}
                                                onChange={(e) => setRepoName(e.target.value)}
                                                placeholder="my-awesome-project"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Description (Optional)</Label>
                                            <Input
                                                id="description"
                                                value={repoDescription}
                                                onChange={(e) => setRepoDescription(e.target.value)}
                                                placeholder="Description of your project"
                                            />
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="private"
                                                checked={isPrivate}
                                                onCheckedChange={(checked) => setIsPrivate(checked === true)}
                                            />
                                            <Label htmlFor="private">Private repository</Label>
                                        </div>

                                        {error && (
                                            <p className="text-sm text-red-500">{error}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <Button
                                    onClick={createRepository}
                                    disabled={isLoading || !repoName}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>Create Repository</>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
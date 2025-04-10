// components/GitHubConnectButton.tsx
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GithubIcon, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface GitHubConnectButtonProps {
    workspaceId: string;
    isConnected?: boolean;
    repoUrl?: string;
    hasUnpushedChanges?: boolean;
    workspaceTitle?: string;
}

export default function GithubConnectButton({
    workspaceId,
    isConnected = false,
    repoUrl,
    hasUnpushedChanges = false,
    workspaceTitle = ""
}: GitHubConnectButtonProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isCreatingRepo, setIsCreatingRepo] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [repoName, setRepoName] = useState(workspaceTitle);
    const [repoDescription, setRepoDescription] = useState('Repository for ' + repoName);
    const [isPrivate, setIsPrivate] = useState(true);
    const [error, setError] = useState('');

    // Function to initiate GitHub OAuth flow
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

            const data = await response.json();
            if (data.authUrl) {
                // Store workspaceId in session storage to retrieve after OAuth
                sessionStorage.setItem('github_connect_workspace', workspaceId);
                // Redirect to GitHub authorization page
                window.location.href = data.authUrl;
            } else {
                setError('Failed to initiate GitHub connection');
                setIsLoading(false);
            }
        } catch (error) {
            console.error('Error connecting to GitHub:', error);
            setError('Failed to connect to GitHub');
            setIsLoading(false);
        }
    };

    // Function to handle the initial button click
    const handleButtonClick = () => {
        if (!isConnected) {
            // If not connected, start OAuth flow
            initiateGitHubAuth();
        } else if (repoUrl == "") {
            // If connected and has changes, push them
            setOpen(true);
        } else if (hasUnpushedChanges) {
            // If connected and has changes, push them
            pushToGitHub();
        } else {
            // All done
            setOpen(false);
        }
    };

    // Function to create a new repository
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

            const data = await response.json();

            if (response.ok) {
                router.refresh(); // Refresh the page to show updated connection status
                setOpen(false);
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

    // Function to push code to GitHub
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

            const data = await response.json();

            if (response.ok) {
                // Show success notification
                alert('Successfully pushed code to GitHub!');
                router.refresh(); // Refresh to update the button state
            } else {
                setError(data.error || 'Failed to push code');
            }
        } catch (error) {
            console.error('Error pushing to GitHub:', error);
            setError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Determine button text based on state
    const getButtonText = () => {
        if (isLoading) return "Processing...";
        if (!isConnected) return "Connect GitHub";
        if (repoUrl == "") return "Create Repo";
        if (hasUnpushedChanges) return "Push Changes";
        return "";
    };

    return (
        <div className="flex flex-col gap-2">
            <Button
                variant={hasUnpushedChanges ? "default" : "outline"}
                onClick={handleButtonClick}
                disabled={isLoading}
                className="flex items-center gap-2"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                    </>
                ) : (
                    <>
                        <GithubIcon className="h-4 w-4" />
                        {getButtonText()}
                    </>
                )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Create GitHub Repository</DialogTitle>
                        <DialogDescription>
                            Create a new repository to store your code.
                        </DialogDescription>
                    </DialogHeader>
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
                    <DialogFooter>
                        <Button onClick={() => setOpen(false)} variant="outline">
                            Cancel
                        </Button>
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
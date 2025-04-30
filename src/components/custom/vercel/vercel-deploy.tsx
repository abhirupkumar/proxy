'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { getWorkspaceVercelProject, createVercelProject, deployToVercel, deleteVercelProject, checkDeploymentStatus } from '@/lib/actions/vercel';
import {
    getDeploymentStatusText,
    getDeploymentStatusColor,
    formatDate,
    getProductionUrl,
    frameworkOptions,
    getFrameworkDefaults
} from '@/lib/utils/vercel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Github, ExternalLink, Rocket, Loader2, Calendar, Trash2, Play, RefreshCw, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isDeploying, vercelConnection } from '@/lib/vercel';

interface VercelDeployProps {
    workspaceId: string;
    hasGithubRepo: boolean;
    githubRepoName?: string;
    githubRepoOwner?: string;
}

export default function VercelDeploy({ workspaceId, hasGithubRepo, githubRepoName, githubRepoOwner }: VercelDeployProps) {
    const $vercelConnection = useStore(vercelConnection);
    const $isDeploying = useStore(isDeploying);

    const [isLoading, setIsLoading] = useState(true);
    const [projectData, setProjectData] = useState<any>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { toast } = useToast();

    // New project form state
    const [projectName, setProjectName] = useState('');
    const [framework, setFramework] = useState('nextjs');
    const [buildCommand, setBuildCommand] = useState('');
    const [installCommand, setInstallCommand] = useState('');
    const [outputDirectory, setOutputDirectory] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Set defaults when framework changes
    useEffect(() => {
        const defaults = getFrameworkDefaults(framework);
        setBuildCommand(defaults.buildCommand || '');
        setInstallCommand(defaults.installCommand || '');
        setOutputDirectory(defaults.outputDirectory || '');
    }, [framework]);

    // Set project name based on GitHub repo
    useEffect(() => {
        if (githubRepoName && !projectName) {
            setProjectName(githubRepoName);
        }
    }, [githubRepoName, projectName]);

    // Load project data from database
    useEffect(() => {
        async function loadProjectData() {
            setIsLoading(true);
            try {
                const result = await getWorkspaceVercelProject(workspaceId);
                if (result.success) {
                    setProjectData(result.project);
                }
            } catch (error) {
                console.error('Error loading project data:', error);
            } finally {
                setIsLoading(false);
            }
        }

        if ($vercelConnection.token) {
            loadProjectData();
        } else {
            setIsLoading(false);
        }
    }, [$vercelConnection.token, workspaceId, refreshKey]);

    // Poll for deployment status updates
    useEffect(() => {
        if (!projectData?.deployments?.length) return;

        const latestDeployment = projectData.deployments[0];
        if (['BUILDING', 'QUEUED'].includes(latestDeployment.status)) {
            const intervalId = setInterval(async () => {
                try {
                    const result = await checkDeploymentStatus(latestDeployment.id);
                    if (result.success) {
                        if (!['BUILDING', 'QUEUED'].includes(result?.deployment!.status)) {
                            clearInterval(intervalId);
                            // Refresh the project data
                            setRefreshKey(prev => prev + 1);

                            if (result.deployment!.status === 'READY') {
                                toast({
                                    title: "Deployment Successful",
                                    description: "Your project has been deployed successfully!",
                                });
                            } else if (result.deployment!.status === 'ERROR') {
                                toast({
                                    variant: "destructive",
                                    title: "Deployment Failed",
                                    description: "There was an error deploying your project.",
                                });
                            }
                        }
                    }
                } catch (error) {
                    console.error('Error checking deployment status:', error);
                    clearInterval(intervalId);
                }
            }, 5000); // Check every 5 seconds

            return () => clearInterval(intervalId);
        }
    }, [projectData, toast]);

    // Handle creating a new project
    async function handleCreateProject() {
        if (!projectName.trim()) {
            toast({
                variant: "destructive",
                title: "Missing Project Name",
                description: "Please enter a project name"
            });
            return;
        }

        isDeploying.set(true);
        try {
            const result = await createVercelProject(workspaceId, {
                name: projectName,
                framework,
                buildCommand: buildCommand || undefined,
                installCommand: installCommand || undefined,
                outputDirectory: outputDirectory || undefined,
            });

            if (result.success) {
                toast({
                    title: "Project Created",
                    description: "Your Vercel project has been created and deployment has started"
                });
                setOpenDialog(false);
                setRefreshKey(prev => prev + 1);
            } else {
                toast({
                    variant: "destructive",
                    title: "Project Creation Failed",
                    description: result.error || "Failed to create Vercel project"
                });
            }
        } catch (error) {
            console.error('Error creating project:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        } finally {
            isDeploying.set(false);
        }
    }

    // Handle deploying an existing project
    async function handleDeploy() {
        isDeploying.set(true);
        try {
            const result = await deployToVercel(workspaceId);

            if (result.success) {
                toast({
                    title: "Deployment Started",
                    description: "Your deployment has been queued"
                });
                setRefreshKey(prev => prev + 1);
            } else {
                toast({
                    variant: "destructive",
                    title: "Deployment Failed",
                    description: result.error || "Failed to deploy project"
                });
            }
        } catch (error) {
            console.error('Error deploying project:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        } finally {
            isDeploying.set(false);
        }
    }

    // Handle deleting a project
    async function handleDeleteProject() {
        if (!confirm("Are you sure you want to delete this Vercel project? This will remove it from both Vercel and Proxy.")) {
            return;
        }

        try {
            const result = await deleteVercelProject(workspaceId);

            if (result.success) {
                toast({
                    title: "Project Deleted",
                    description: "Your Vercel project has been deleted"
                });
                setProjectData(null);
            } else {
                toast({
                    variant: "destructive",
                    title: "Deletion Failed",
                    description: result.error || "Failed to delete project"
                });
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            toast({
                variant: "destructive",
                title: "Error",
                description: "An unexpected error occurred"
            });
        }
    }

    // If not connected to Vercel
    if (!$vercelConnection.token) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deploy to Vercel</CardTitle>
                    <CardDescription>Connect your Vercel account to deploy this workspace</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTitle>Not Connected</AlertTitle>
                        <AlertDescription>
                            Please connect your Vercel account in settings before deploying.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // If no GitHub repo is connected
    if (!hasGithubRepo) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deploy to Vercel</CardTitle>
                    <CardDescription>Connect your GitHub repository to deploy to Vercel</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTitle>GitHub Repository Required</AlertTitle>
                        <AlertDescription>
                            Please connect a GitHub repository to this workspace before deploying to Vercel.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Deploy to Vercel</CardTitle>
                    <CardDescription>Loading deployment information...</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-6">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </CardContent>
            </Card>
        );
    }

    // If project exists, show project details
    if (projectData) {
        const latestDeployment = projectData.deployments?.[0];
        const productionUrl = getProductionUrl(projectData);

        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>{projectData.projectName}</CardTitle>
                            <CardDescription>Vercel Project</CardDescription>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(productionUrl, '_blank')}
                        >
                            <Globe className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {latestDeployment && (
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Latest Deployment</span>
                                <Badge
                                    className={getDeploymentStatusColor(latestDeployment.status)}
                                >
                                    {getDeploymentStatusText(latestDeployment.status)}
                                </Badge>
                            </div>

                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>{formatDate(latestDeployment.createdAt)}</span>
                            </div>

                            {latestDeployment.url && (
                                <div className="flex items-center space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => window.open(`https://${latestDeployment.url}`, '_blank')}
                                        className="text-xs flex items-center"
                                    >
                                        <ExternalLink className="h-3 w-3 mr-2" />
                                        View Deployment
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    <Separator />

                    <div className="space-y-2">
                        <div className="flex items-center">
                            <Github className="h-4 w-4 mr-2" />
                            <span className="text-sm">
                                {githubRepoOwner}/{githubRepoName}
                            </span>
                        </div>

                        {projectData.framework && (
                            <div className="flex items-center">
                                <span className="text-sm">
                                    Framework: <span className="font-medium">{projectData.framework}</span>
                                </span>
                            </div>
                        )}
                    </div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="deployments">
                            <AccordionTrigger className="text-sm">Recent Deployments</AccordionTrigger>
                            <AccordionContent>
                                {projectData.deployments?.length > 0 ? (
                                    <div className="space-y-3">
                                        {projectData.deployments.map((deployment: any) => (
                                            <div
                                                key={deployment.id}
                                                className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                                            >
                                                <div>
                                                    <Badge
                                                        className={getDeploymentStatusColor(deployment.status)}
                                                    >
                                                        {getDeploymentStatusText(deployment.status)}
                                                    </Badge>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {formatDate(deployment.createdAt)}
                                                    </div>
                                                </div>

                                                {deployment.url && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => window.open(`https://${deployment.url}`, '_blank')}
                                                    >
                                                        <ExternalLink className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-500">No deployments yet</div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Trash2 className="h-5 w-5 text-red-500" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64">
                            <div className="space-y-4">
                                <div className="text-sm font-medium">Delete this project?</div>
                                <p className="text-xs text-gray-500">
                                    This will permanently delete the Vercel project and remove the connection.
                                </p>
                                <div className="flex justify-end">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleDeleteProject}
                                    >
                                        Delete Project
                                    </Button>
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>

                    <Button
                        variant="default"
                        onClick={handleDeploy}
                        disabled={$isDeploying || (latestDeployment && ['BUILDING', 'QUEUED'].includes(latestDeployment.status))}
                        className="flex items-center space-x-2"
                    >
                        {$isDeploying || (latestDeployment && ['BUILDING', 'QUEUED'].includes(latestDeployment.status)) ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Deploying...</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                <span>Deploy</span>
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    // If no project exists, show create button
    return (
        <Card>
            <CardHeader>
                <CardTitle>Deploy to Vercel</CardTitle>
                <CardDescription>Deploy this workspace to Vercel</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center space-y-4 py-6">
                    <Rocket className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                        <h3 className="font-medium text-lg">Ready to Deploy</h3>
                        <p className="text-sm text-gray-500">
                            Deploy your GitHub repository to Vercel with just a few clicks.
                        </p>
                    </div>

                    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                        <DialogTrigger asChild>
                            <Button className="flex items-center space-x-2">
                                <Rocket className="h-4 w-4" />
                                <span>Create Vercel Project</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Create Vercel Project</DialogTitle>
                                <DialogDescription>
                                    Configure your new Vercel project for deployment.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="project-name">Project Name</Label>
                                    <Input
                                        id="project-name"
                                        value={projectName}
                                        onChange={(e) => setProjectName(e.target.value)}
                                        placeholder="Enter project name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="framework">Framework</Label>
                                    <Select value={framework} onValueChange={setFramework}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a framework" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {frameworkOptions.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <Button
                                    variant="outline"
                                    type="button"
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="w-full text-sm"
                                >
                                    {showAdvanced ? "Hide" : "Show"} Advanced Settings
                                </Button>

                                {showAdvanced && (
                                    <div className="space-y-4 border rounded-md p-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="install-command">Install Command</Label>
                                            <Input
                                                id="install-command"
                                                value={installCommand}
                                                onChange={(e) => setInstallCommand(e.target.value)}
                                                placeholder="npm install"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="build-command">Build Command</Label>
                                            <Input
                                                id="build-command"
                                                value={buildCommand}
                                                onChange={(e) => setBuildCommand(e.target.value)}
                                                placeholder="npm run build"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="output-dir">Output Directory</Label>
                                            <Input
                                                id="output-dir"
                                                value={outputDirectory}
                                                onChange={(e) => setOutputDirectory(e.target.value)}
                                                placeholder="dist"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setOpenDialog(false)}
                                    disabled={$isDeploying}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    onClick={handleCreateProject}
                                    disabled={$isDeploying || !projectName.trim()}
                                >
                                    {$isDeploying ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create & Deploy"
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardContent>
        </Card>
    );
}
'use client';

import { useState } from 'react';
import { useVercel, VercelProject } from '@/context/VercelContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDate } from '@/lib/utils';
import { Loader2, RefreshCw, PlusCircle, ArrowUpDown, ExternalLink } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';

interface VercelProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    workspaceId: string;
    onProjectSelected: (projectId: string) => void;
}

const FRAMEWORKS = [
    { id: 'nextjs', name: 'Next.js', value: 'nextjs' },
    { id: 'react', name: 'Create React App', value: 'create-react-app' },
    { id: 'vue', name: 'Vue', value: 'vue' },
    { id: 'svelte', name: 'Svelte', value: 'svelte' },
    { id: 'static', name: 'Static Site', value: 'vite' },
    { id: 'other', name: 'Other', value: 'other' }
];

export default function VercelProjectModal({
    isOpen,
    onClose,
    workspaceId,
    onProjectSelected
}: VercelProjectModalProps) {
    const { vercelState, refreshVercelProjects, createProject } = useVercel();
    const { template, workspaceData } = useWorkspaceData();
    const [activeTab, setActiveTab] = useState('existing');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state for new project
    const [newProject, setNewProject] = useState({
        name: workspaceData?.artifactId ?? "",
        framework: FRAMEWORKS.find(framework => framework.id == template)?.value || 'Other',
        buildCommand: 'npm run build',
        installCommand: 'npm install',
        outputDirectory: "",
        environmentVariables: ''
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await refreshVercelProjects();
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleSelectProject = () => {
        if (selectedProjectId) {
            onProjectSelected(selectedProjectId);
        }
    };

    const handleCreateProject = async () => {
        try {
            setIsCreating(true);

            // Parse environment variables
            const envVars: Record<string, string> = {};
            if (newProject.environmentVariables.trim()) {
                // Parse env variables from textarea (variable=value format, one per line)
                newProject.environmentVariables.split('\n').forEach(line => {
                    const [key, value] = line.split('=');
                    if (key && value) {
                        envVars[key.trim()] = value.trim();
                    }
                });
            }

            const result = await createProject(workspaceId, {
                name: newProject.name,
                framework: newProject.framework,
                buildCommand: newProject.buildCommand,
                installCommand: newProject.installCommand,
                outputDirectory: newProject.outputDirectory,
                environmentVariables: envVars
            });

            // Use the new project for deployment
            if (result.project?.projectId) {
                onProjectSelected(result.project.projectId);
                onClose();
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Deploy to Vercel</DialogTitle>
                    <DialogDescription>
                        Select an existing project or create a new one for deployment
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="existing">Existing Projects</TabsTrigger>
                        <TabsTrigger value="new">Create New Project</TabsTrigger>
                    </TabsList>

                    <TabsContent value="existing" className="space-y-4 max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-medium">
                                {vercelState.stats?.totalProjects} Projects Available
                            </h3>
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

                        {vercelState.stats?.projects && vercelState.stats.projects.length > 0 ? (
                            <RadioGroup value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
                                <div className="space-y-2">
                                    {vercelState.stats.projects.map((project: VercelProject) => {
                                        const latestDeployment = project.latestDeployments?.[0];
                                        const deploymentUrl = latestDeployment?.url ?
                                            `https://${latestDeployment.url}` :
                                            project.link?.type === 'github' ?
                                                `https://vercel.com/${project.link.org}/${project.link.repo}` :
                                                null;

                                        return (
                                            <div
                                                key={project.id}
                                                className={`border rounded-md p-4 hover:bg-accent/50 cursor-pointer transition-colors ${selectedProjectId === project.id ? 'border-primary bg-accent' : ''}`}
                                                onClick={() => setSelectedProjectId(project.id)}
                                            >
                                                <div className="flex items-start">
                                                    <RadioGroupItem value={project.id} id={`project-${project.id}`} className="mt-1" />
                                                    <div className="ml-3 flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <Label htmlFor={`project-${project.id}`} className="text-base font-medium">
                                                                {project.name}
                                                            </Label>
                                                            {deploymentUrl && (
                                                                <a
                                                                    href={deploymentUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <ExternalLink className="h-3 w-3" />
                                                                    View
                                                                </a>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1">
                                                            {project.framework ? (
                                                                <span className="inline-flex items-center bg-secondary text-secondary-foreground text-xs px-2 py-0.5 rounded mr-2">
                                                                    {project.framework}
                                                                </span>
                                                            ) : null}
                                                            <span>Created {formatDate(new Date(project.createdAt))}</span>
                                                            {latestDeployment && (
                                                                <span className="ml-2">
                                                                    • Last deployed {formatDate(new Date(latestDeployment.createdAt))}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </RadioGroup>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                {vercelState.isFetchingStats ? (
                                    <div className="flex flex-col items-center">
                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                        <p>Loading projects...</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <p>No projects found</p>
                                        <Button
                                            variant="link"
                                            onClick={() => setActiveTab('new')}
                                            className="mt-2"
                                        >
                                            Create a new project
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="new" className="space-y-4">
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="project-name">Project Name *</Label>
                                <Input
                                    id="project-name"
                                    placeholder="my-awesome-project"
                                    value={newProject.name}
                                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="framework">Framework</Label>
                                <Select
                                    value={newProject.framework}
                                    onValueChange={(value) => setNewProject({ ...newProject, framework: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select framework" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {FRAMEWORKS.map(framework => (
                                            <SelectItem key={framework.id} value={framework.value}>
                                                {framework.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="install-command">Install Command</Label>
                                <Input
                                    id="install-command"
                                    placeholder="npm install"
                                    value={newProject.installCommand}
                                    onChange={(e) => setNewProject({ ...newProject, installCommand: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="build-command">Build Command</Label>
                                <Input
                                    id="build-command"
                                    placeholder="npm run build"
                                    value={newProject.buildCommand}
                                    onChange={(e) => setNewProject({ ...newProject, buildCommand: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="output-dir">Output Directory</Label>
                                <Input
                                    id="output-dir"
                                    placeholder=".next, dist, build, etc."
                                    value={newProject.outputDirectory}
                                    onChange={(e) => setNewProject({ ...newProject, outputDirectory: e.target.value })}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="env-vars">Environment Variables (optional)</Label>
                                <Textarea
                                    id="env-vars"
                                    placeholder="API_KEY=value&#10;DATABASE_URL=value&#10;(one per line, KEY=value format)"
                                    value={newProject.environmentVariables}
                                    onChange={(e) => setNewProject({ ...newProject, environmentVariables: e.target.value })}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    These will be added to any environment variables found in your .env files
                                </p>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="flex justify-between sm:justify-between">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>

                    {activeTab === 'existing' ? (
                        <Button
                            onClick={handleSelectProject}
                            disabled={!selectedProjectId}
                            className="flex items-center gap-2"
                        >
                            <ArrowUpDown className="h-4 w-4" />
                            Deploy to Selected
                        </Button>
                    ) : (
                        <Button
                            onClick={handleCreateProject}
                            disabled={!newProject.name || isCreating}
                            className="flex items-center gap-2"
                        >
                            {isCreating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <PlusCircle className="h-4 w-4" />
                            )}
                            {isCreating ? 'Creating...' : 'Create & Deploy'}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
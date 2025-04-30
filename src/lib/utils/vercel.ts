import { VercelProject } from "../types";

// Get readable status for a deployment
export function getDeploymentStatusText(status: string): string {
    const statusMap: Record<string, string> = {
        BUILDING: 'Building',
        ERROR: 'Failed',
        READY: 'Live',
        CANCELED: 'Canceled',
        QUEUED: 'Queued'
    };

    return statusMap[status] || 'Unknown';
}

// Get color for deployment status
export function getDeploymentStatusColor(status: string): string {
    const colorMap: Record<string, string> = {
        BUILDING: 'bg-yellow-100 text-yellow-800',
        ERROR: 'bg-red-100 text-red-800',
        READY: 'bg-green-100 text-green-800',
        CANCELED: 'bg-gray-100 text-gray-800',
        QUEUED: 'bg-blue-100 text-blue-800'
    };

    return colorMap[status] || 'bg-gray-100 text-gray-800';
}

// Format date to readable format
export function formatDate(dateString?: string | Date | null): string {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    }).format(date);
}

// Get production URL
export function getProductionUrl(project: VercelProject): string {
    if (!project) return '';

    // For projects with custom domains
    if (project.url) {
        return project.url.startsWith('http') ? project.url : `https://${project.url}`;
    }

    // For projects without custom domains, use default Vercel domain
    return `https://${project.name}.vercel.app`;
}

// Common framework options for selection
export const frameworkOptions = [
    { label: 'Next.js', value: 'nextjs' },
    { label: 'React', value: 'create-react-app' },
    { label: 'Vue', value: 'vue' },
    { label: 'Nuxt', value: 'nuxt' },
    { label: 'Svelte', value: 'svelte' },
    { label: 'SvelteKit', value: 'sveltekit' },
    { label: 'Astro', value: 'astro' },
    { label: 'Remix', value: 'remix' },
    { label: 'Gatsby', value: 'gatsby' },
    { label: 'Solid', value: 'solid' },
    { label: 'Static HTML', value: 'static' },
];

// Get framework defaults for common settings
export function getFrameworkDefaults(framework: string) {
    const defaults: Record<string, { buildCommand?: string, installCommand?: string, outputDirectory?: string }> = {
        'nextjs': {
            buildCommand: 'next build',
            installCommand: 'npm install',
            outputDirectory: '.next'
        },
        'create-react-app': {
            buildCommand: 'npm run build',
            installCommand: 'npm install',
            outputDirectory: 'build'
        },
        'vue': {
            buildCommand: 'npm run build',
            installCommand: 'npm install',
            outputDirectory: 'dist'
        },
        'nuxt': {
            buildCommand: 'nuxt build',
            installCommand: 'npm install',
            outputDirectory: '.output'
        },
        'svelte': {
            buildCommand: 'npm run build',
            installCommand: 'npm install',
            outputDirectory: 'public'
        },
        'sveltekit': {
            buildCommand: 'npm run build',
            installCommand: 'npm install',
            outputDirectory: 'build'
        },
        'astro': {
            buildCommand: 'astro build',
            installCommand: 'npm install',
            outputDirectory: 'dist'
        },
        'remix': {
            buildCommand: 'remix build',
            installCommand: 'npm install',
            outputDirectory: 'public'
        },
        'gatsby': {
            buildCommand: 'gatsby build',
            installCommand: 'npm install',
            outputDirectory: 'public'
        },
        'solid': {
            buildCommand: 'npm run build',
            installCommand: 'npm install',
            outputDirectory: 'dist'
        },
        'static': {
            buildCommand: '',
            installCommand: '',
            outputDirectory: ''
        }
    };

    return defaults[framework] || { buildCommand: '', installCommand: '', outputDirectory: '' };
}
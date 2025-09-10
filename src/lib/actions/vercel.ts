'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { currentUser } from '@clerk/nextjs/server';
import { db } from '../db';
import { extractEnvVariables } from '../utils';
import { env } from 'env';

// Type definitions
type VercelProjectCreateParams = {
    name: string;
    framework?: string;
    buildCommand?: string;
    installCommand?: string;
    outputDirectory?: string;
    environmentVariables?: Record<string, string>;
};

export async function getVercelAuthUrl() {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) throw new Error('Not authenticated');

    const clientId = env.VERCEL_CLIENT_ID;
    const redirectUri = `${env.NEXT_PUBLIC_HOST}/api/vercel/callback`;

    if (!clientId) throw new Error('Vercel client ID not configured');

    // Generate a random state for CSRF protection
    const state = Math.random().toString(36).substring(2);

    // Store state in session to verify callback
    // This should be properly stored in a secure way in production
    await db.user.update({
        where: { clerkId: userId },
        data: {
            // Using a temporary field to store state
            // In production, use a proper session store
            vercelState: state, // Temporarily use this field to store vercel state
        }
    });

    const scope = 'user read write';

    return {
        url: `https://vercel.com/integrations/proxy-studio/new?state=${state}`
    };
}

export async function handleVercelCallback(code: string, state: string) {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) throw new Error('Not authenticated');

    // Verify state to prevent CSRF
    const user = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!user || user.vercelState !== state) {
        throw new Error('Invalid state parameter');
    }

    // Exchange code for access token
    const clientId = env.VERCEL_CLIENT_ID;
    const clientSecret = env.VERCEL_CLIENT_SECRET;
    const redirectUri = `${env.NEXT_PUBLIC_HOST}/api/vercel/callback`;

    if (!clientId || !clientSecret) {
        throw new Error('Vercel client credentials not configured');
    }

    const response = await fetch('https://api.vercel.com/v2/oauth/access_token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code'
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to get access token: ${response.status}`);
    }

    const data = await response.json();
    const accessToken = data.access_token;

    // Get user info
    const userResponse = await fetch('https://api.vercel.com/v2/user', {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        }
    });

    if (!userResponse.ok) {
        throw new Error(`Failed to get user info: ${userResponse.status}`);
    }

    const userData = await userResponse.json();

    // Store token in database
    await db.user.update({
        where: { clerkId: userId },
        data: {
            vercelToken: accessToken,
            vercelState: null,
            vercelUser: userData.user || userData
        }
    });

    return {
        user: userData.user,
        token: accessToken
    };
}

export async function disconnectVercel() {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) throw new Error('Not authenticated');

    await db.user.update({
        where: { clerkId: userId },
        data: {
            vercelToken: null
        }
    });

    return { success: true };
}

export async function getVercelUser() {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) return null;

    const dbUser = await db.user.findUnique({
        where: {
            clerkId: userId
        },
    })
    if (dbUser?.vercelUser && dbUser?.vercelUser != null)
        return dbUser?.vercelUser;
    return null;
}

export async function getVercelProjects() {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) return { projects: null }

    const user = await db.user.findUnique({
        where: { clerkId: userId }
    });

    if (!user?.vercelToken) {
        throw new Error('Not connected to Vercel');
    }

    const response = await fetch('https://api.vercel.com/v9/projects', {
        headers: {
            Authorization: `Bearer ${user.vercelToken}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch projects: ${response.status}`);
    }

    const data = await response.json();

    // Fetch latest deployment for each project
    const projectsWithDeployments = await Promise.all(
        (data.projects || []).map(async (project: any) => {
            try {
                const deploymentsResponse = await fetch(
                    `https://api.vercel.com/v6/deployments?projectId=${project.id}&limit=1`,
                    {
                        headers: {
                            Authorization: `Bearer ${user.vercelToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (deploymentsResponse.ok) {
                    const deploymentsData = await deploymentsResponse.json();
                    return {
                        ...project,
                        latestDeployments: deploymentsData.deployments || []
                    };
                }

                return project;
            } catch (error) {
                console.error(`Error fetching deployments for project ${project.id}:`, error);
                return project;
            }
        })
    );

    return { projects: projectsWithDeployments };
}

export async function createVercelProject(
    workspaceId: string,
    projectParams: VercelProjectCreateParams
) {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) throw new Error('Not authenticated');

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            workspaces: {
                where: { id: workspaceId }
            }
        }
    });

    if (!user?.vercelToken) {
        throw new Error('Not connected to Vercel');
    }

    if (user.workspaces.length === 0) {
        throw new Error('Workspace not found');
    }

    // Create project on Vercel
    const response = await fetch('https://api.vercel.com/v11/projects', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${user.vercelToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: projectParams.name,
            framework: projectParams.framework || null,
            buildCommand: projectParams.buildCommand || null,
            installCommand: projectParams.installCommand || null,
            outputDirectory: projectParams.outputDirectory || null,
            environmentVariables: Object.entries(projectParams.environmentVariables || {}).map(
                ([key, value]) => ({
                    key,
                    value,
                    target: ['production', 'preview', 'development']
                })
            )
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Failed to create project: ${response.status}`);
    }

    const projectData = await response.json();

    // Save project in database
    const vercelProject = await db.vercelProject.create({
        data: {
            projectId: projectData.id,
            projectName: projectData.name,
            projectUrl: projectData.link ? `https://${projectData.link}` : null,
            teamId: projectData.teamId || null,
            buildCommand: projectParams.buildCommand || null,
            installCommand: projectParams.installCommand || null,
            outputDirectory: projectParams.outputDirectory || null,
            framework: projectParams.framework || null,
            workspace: {
                connect: { id: workspaceId }
            }
        }
    });

    revalidatePath(`/workspace/${workspaceId}`);

    return { project: vercelProject };
}

export async function deployToVercel(
    workspaceId: string,
    projectId: string,
    environmentVariables?: Record<string, string>
) {
    const currentClerkUser = await currentUser();
    const userId = currentClerkUser?.id || null;
    if (!userId) throw new Error('Not authenticated');

    const user = await db.user.findUnique({
        where: { clerkId: userId },
        include: {
            workspaces: {
                where: { id: workspaceId },
                include: {
                    vercelProject: true
                }
            }
        }
    });

    if (!user?.vercelToken) {
        throw new Error('Not connected to Vercel');
    }

    if (user.workspaces.length === 0 || !user.workspaces[0].vercelProject) {
        throw new Error('Workspace or Vercel project not found');
    }

    const workspace = user.workspaces[0];
    const vercelProject = workspace.vercelProject;

    if (vercelProject?.projectId !== projectId) {
        throw new Error('Project ID does not match workspace configuration');
    }

    // Prepare files from workspace
    const fileData = workspace.fileData as Record<string, { code: string }> | null;

    if (!fileData) {
        throw new Error('No files found in workspace');
    }

    // Extract environment variables from .env files
    let envVars: Record<string, string> = {};

    if (fileData['.env']?.code || fileData['.env.local']?.code) {
        const envContent = fileData['.env']?.code || fileData['.env.local']?.code || '';
        envVars = extractEnvVariables(envContent);
    }

    // Merge with provided environment variables
    if (environmentVariables) {
        envVars = { ...envVars, ...environmentVariables };
    }

    // Update environment variables in Vercel project if needed
    if (Object.keys(envVars).length > 0) {
        await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.vercelToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(
                Object.entries(envVars).map(([key, value]) => ({
                    key,
                    value,
                    target: ['production', 'preview', 'development'],
                    type: 'plain'
                }))
            )
        });
    }

    // Format files for Vercel deployment
    const files: Array<{ data: string, encoding: string, file: string }> = [];

    Object.entries(fileData).forEach(([path, { code }]) => {
        // Skip .git files and env files
        if (!path.startsWith('.git/') && path !== '.env' && path !== '.env.local') {
            files.push({ data: code, encoding: "utf-8", file: path });
        }
    });

    // Create deployment
    const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${user.vercelToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: vercelProject.projectName,
            files,
            target: 'production'
        })
    });

    if (!deployResponse.ok) {
        const error = await deployResponse.json();
        throw new Error(error.error?.message || `Deployment failed: ${deployResponse.status}`);
    }

    const deploymentData = await deployResponse.json();

    // Save deployment info in database
    const deployment = await db.vercelDeployment.create({
        data: {
            deploymentId: deploymentData.id,
            url: deploymentData.url ? `https://${deploymentData.url}` : null,
            status: deploymentData.readyState || 'BUILDING',
            project: {
                connect: { id: vercelProject.id }
            },
            meta: deploymentData
        }
    });

    // Update last deployed timestamp
    await db.vercelProject.update({
        where: { id: vercelProject.id },
        data: { lastDeployed: new Date() }
    });

    revalidatePath(`/workspace/${workspaceId}`);

    return { deployment };
}
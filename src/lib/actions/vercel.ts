'use server';

import { currentUser } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import { db } from '../db';
import { VercelDeploymentConfig } from '../types';

export async function saveVercelToken(token: string) {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        // Verify token by making a test API call
        const response = await fetch('https://api.vercel.com/v2/user', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Invalid Vercel token');
        }

        // Get user info from response
        const userData = await response.json();

        // Find user by clerk ID
        const user = await db.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Update user with Vercel token
        await db.user.update({
            where: { id: user.id },
            data: { vercelToken: token },
        });

        revalidatePath('/settings');

        return { success: true, user: userData };
    } catch (error) {
        console.error('Error saving Vercel token:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getUserVercelToken() {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { vercelToken: true },
        });

        if (!user || !user.vercelToken) {
            return { success: false, error: 'Vercel token not found' };
        }

        return { success: true, token: user.vercelToken };
    } catch (error) {
        console.error('Error getting Vercel token:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function removeVercelToken() {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Update user with Vercel token
        await db.user.update({
            where: { id: user.id },
            data: { vercelToken: null },
        });

        revalidatePath('/settings');

        return { success: true };
    } catch (error) {
        console.error('Error removing Vercel token:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function createVercelProject(workspaceId: string, config: VercelDeploymentConfig) {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, vercelToken: true },
        });

        if (!user || !user.vercelToken) {
            throw new Error('Vercel token not found');
        }

        const workspace = await db.workspace.findUnique({
            where: { id: workspaceId, userId: user.id },
            include: { githubRepo: true },
        });

        if (!workspace) {
            throw new Error('Workspace not found');
        }

        if (!workspace.githubRepo) {
            throw new Error('GitHub repository not connected to this workspace');
        }

        // Create project on Vercel
        const projectResponse = await fetch('https://api.vercel.com/v9/projects', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.vercelToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: config.name,
                framework: config.framework || 'nextjs',
                gitRepository: {
                    type: 'github',
                    repo: `${workspace.githubRepo.repoOwner}/${workspace.githubRepo.repoName}`,
                },
                buildCommand: config.buildCommand,
                installCommand: config.installCommand,
                outputDirectory: config.outputDirectory,
                environmentVariables: config.environmentVariables,
            }),
        });

        if (!projectResponse.ok) {
            const errorData = await projectResponse.json();
            throw new Error(`Failed to create Vercel project: ${JSON.stringify(errorData)}`);
        }

        const projectData = await projectResponse.json();

        // Save project to database
        const vercelProject = await db.vercelProject.create({
            data: {
                projectId: projectData.id,
                projectName: projectData.name,
                projectUrl: projectData.link,
                framework: config.framework,
                buildCommand: config.buildCommand,
                installCommand: config.installCommand,
                outputDirectory: config.outputDirectory,
                workspaceId: workspace.id,
            },
        });

        // Trigger deployment
        const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.vercelToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: projectData.id,
                target: 'production',
            }),
        });

        if (!deployResponse.ok) {
            const errorData = await deployResponse.json();
            console.error('Deployment failed:', errorData);
            // We'll still consider the project creation successful even if deployment fails
        } else {
            const deployData = await deployResponse.json();

            // Save deployment to database
            await db.vercelDeployment.create({
                data: {
                    deploymentId: deployData.id,
                    url: deployData.url,
                    status: deployData.status,
                    projectId: vercelProject.id,
                    meta: deployData,
                },
            });
        }

        revalidatePath(`/workspaces/${workspaceId}`);
        return { success: true, projectId: projectData.id };
    } catch (error) {
        console.error('Error creating Vercel project:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function getWorkspaceVercelProject(workspaceId: string) {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true },
        });

        if (!user) {
            throw new Error('User not found');
        }

        const vercelProject = await db.vercelProject.findUnique({
            where: { workspaceId },
            include: {
                deployments: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        return { success: true, project: vercelProject };
    } catch (error) {
        console.error('Error fetching Vercel project:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deployToVercel(workspaceId: string) {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, vercelToken: true },
        });

        if (!user || !user.vercelToken) {
            throw new Error('Vercel token not found');
        }

        const vercelProject = await db.vercelProject.findUnique({
            where: { workspaceId },
        });

        if (!vercelProject) {
            throw new Error('Vercel project not found for this workspace');
        }

        // Trigger deployment
        const deployResponse = await fetch(`https://api.vercel.com/v13/deployments`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.vercelToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                projectId: vercelProject.projectId,
                target: 'production',
            }),
        });

        if (!deployResponse.ok) {
            const errorData = await deployResponse.json();
            throw new Error(`Failed to create deployment: ${JSON.stringify(errorData)}`);
        }

        const deployData = await deployResponse.json();

        // Save deployment to database
        const deployment = await db.vercelDeployment.create({
            data: {
                deploymentId: deployData.id,
                url: deployData.url,
                status: deployData.status,
                projectId: vercelProject.id,
                meta: deployData,
            },
        });

        // Update the lastDeployed timestamp
        await db.vercelProject.update({
            where: { id: vercelProject.id },
            data: { lastDeployed: new Date() },
        });

        revalidatePath(`/workspaces/${workspaceId}`);
        return { success: true, deploymentId: deployment.id };
    } catch (error) {
        console.error('Error deploying to Vercel:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function checkDeploymentStatus(deploymentId: string) {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { vercelToken: true },
        });

        if (!user || !user.vercelToken) {
            throw new Error('Vercel token not found');
        }

        const deployment = await db.vercelDeployment.findUnique({
            where: { id: deploymentId },
            include: { project: true },
        });

        if (!deployment) {
            throw new Error('Deployment not found');
        }

        // Fetch the latest status from Vercel
        const response = await fetch(`https://api.vercel.com/v13/deployments/${deployment.deploymentId}`, {
            headers: {
                Authorization: `Bearer ${user.vercelToken}`,
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch deployment status: ${response.status}`);
        }

        const deploymentData = await response.json();

        // Update deployment status in the database
        const updatedDeployment = await db.vercelDeployment.update({
            where: { id: deploymentId },
            data: {
                status: deploymentData.status,
                url: deploymentData.url,
                meta: deploymentData,
            },
        });

        return { success: true, deployment: updatedDeployment };
    } catch (error) {
        console.error('Error checking deployment status:', error);
        return { success: false, error: (error as Error).message };
    }
}

export async function deleteVercelProject(workspaceId: string) {
    try {
        const currentClerkUser = await currentUser();
        const userId = currentClerkUser?.id || null;
        if (!userId) {
            throw new Error('Unauthorized');
        }

        const user = await db.user.findUnique({
            where: { clerkId: userId },
            select: { id: true, vercelToken: true },
        });

        if (!user || !user.vercelToken) {
            throw new Error('Vercel token not found');
        }

        const vercelProject = await db.vercelProject.findUnique({
            where: { workspaceId },
        });

        if (!vercelProject) {
            throw new Error('Vercel project not found for this workspace');
        }

        // Delete project from Vercel
        const deleteResponse = await fetch(`https://api.vercel.com/v9/projects/${vercelProject.projectId}`, {
            method: 'DELETE',
            headers: {
                Authorization: `Bearer ${user.vercelToken}`,
            },
        });

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            console.error('Failed to delete project from Vercel:', errorData);
            // Continue with database deletion even if the API call fails
        }

        // Delete project from database (cascade will delete deployments)
        await db.vercelProject.delete({
            where: { id: vercelProject.id },
        });

        revalidatePath(`/workspaces/${workspaceId}`);
        return { success: true };
    } catch (error) {
        console.error('Error deleting Vercel project:', error);
        return { success: false, error: (error as Error).message };
    }
}
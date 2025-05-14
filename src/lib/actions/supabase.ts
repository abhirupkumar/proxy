'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { SupabaseApiKey, SupabaseProject, SupabaseStats } from '@/lib/types';
import { auth, currentUser } from '@clerk/nextjs/server';
import { db } from '../db';
import { Prisma } from '@prisma/client/edge';
import { env } from 'env';

/**
 * Connect to Supabase using a token
 */
export async function connectToSupabase(token: string) {
    try {
        const cleanToken = token.trim();

        const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                Authorization: `Bearer ${cleanToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!projectsResponse.ok) {
            const errorText = await projectsResponse.text();
            console.error('Projects fetch failed:', errorText);
            return { error: 'Failed to fetch projects' };
        }

        const projects = (await projectsResponse.json()) as SupabaseProject[];

        // Filter unique projects by ID
        const uniqueProjectsMap = new Map<string, SupabaseProject>();
        for (const project of projects) {
            if (!uniqueProjectsMap.has(project.id)) {
                uniqueProjectsMap.set(project.id, project);
            }
        }

        const uniqueProjects = Array.from(uniqueProjectsMap.values());
        uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        const userData = {
            email: 'Connected',
            role: 'Admin',
        };

        // Store the token in the user's record in the database
        const currentClerUser = await currentUser();
        if (currentClerUser?.id) {
            await db.user.update({
                where: { clerkId: currentClerUser?.id },
                data: {
                    supabaseToken: cleanToken,
                },
            });
        }

        return {
            stats: {
                projects: uniqueProjects,
                totalProjects: uniqueProjects.length,
            } as SupabaseStats,
        };

    } catch (error) {
        console.error('Supabase API error:', error);
        return {
            error: error instanceof Error ? error.message : 'Authentication failed',
        };
    }
}

/**
 * Fetch Supabase stats (projects)
 */
export async function fetchSupabaseStats(token: string) {
    try {
        const projectsResponse = await fetch('https://api.supabase.com/v1/projects', {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!projectsResponse.ok) {
            throw new Error('Failed to fetch projects');
        }

        const projects = (await projectsResponse.json()) as SupabaseProject[];

        // Filter unique projects by ID
        const uniqueProjectsMap = new Map<string, SupabaseProject>();
        for (const project of projects) {
            if (!uniqueProjectsMap.has(project.id)) {
                uniqueProjectsMap.set(project.id, project);
            }
        }

        const uniqueProjects = Array.from(uniqueProjectsMap.values());
        uniqueProjects.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        return {
            stats: {
                projects: uniqueProjects,
                totalProjects: uniqueProjects.length,
            } as SupabaseStats,
        };
    } catch (error) {
        console.error('Error fetching Supabase stats:', error);
        throw error;
    }
}

/**
 * Fetch API keys for a specific project
 */
export async function fetchProjectApiKeys(projectId: string, token: string) {
    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/api-keys`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch API keys: ${response.statusText}`);
        }

        const apiKeys = await response.json() as SupabaseApiKey[];
        const anonKey = apiKeys.find((key) => key.name === 'anon' || key.name === 'public');

        if (anonKey) {
            const supabaseUrl = `https://${projectId}.supabase.co`;
            return { anonKey: anonKey.api_key, supabaseUrl };
        }

        return null;
    } catch (error) {
        console.error('Error fetching project API keys:', error);
        throw error;
    }
}

/**
 * Associate a Supabase project with a workspace
 */
export async function associateSupabaseProject(
    workspaceId: string,
    projectId: string,
    supabaseUrl: string,
    anonKey: string
) {
    try {
        // Get project details
        const currentClerUser = await currentUser();
        if (!currentClerUser?.id) {
            throw new Error('User not authenticated');
        }

        const user = await db.user.findUnique({
            where: { clerkId: currentClerUser?.id },
        });

        if (!user?.supabaseToken) {
            throw new Error('Supabase token not found');
        }

        // Get project details from Supabase
        const projectsResponse = await fetch(`https://api.supabase.com/v1/projects/${projectId}`, {
            headers: {
                Authorization: `Bearer ${user.supabaseToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!projectsResponse.ok) {
            throw new Error('Failed to fetch project details');
        }

        const projectDetails = await projectsResponse.json() as SupabaseProject;

        // Create or update SupabaseProject in our database
        const supabaseProject = await db.supabaseProject.upsert({
            where: { workspaceId },
            update: {
                projectId,
                projectName: projectDetails.name,
                projectRegion: projectDetails.region,
                supabaseUrl,
                anonKey,
                organizationId: projectDetails.organization_id,
                status: projectDetails.status,
                database: projectDetails.database || Prisma.JsonNull,
                lastAccessed: new Date(),
            },
            create: {
                projectId,
                projectName: projectDetails.name,
                projectRegion: projectDetails.region,
                supabaseUrl,
                anonKey,
                workspaceId,
                organizationId: projectDetails.organization_id,
                status: projectDetails.status,
                database: projectDetails.database || Prisma.JsonNull,
            },
        });

        return supabaseProject;
    } catch (error) {
        console.error('Error associating Supabase project with workspace:', error);
        throw error;
    }
}

/**
 * Get Supabase OAuth URL
 */
export async function getSupabaseOAuthUrl(workspaceId?: string) {
    try {
        if (workspaceId) {
            (await cookies()).set('supabase-redirect', `/workspace/${workspaceId}`);
        } else {
            (await cookies()).set('supabase-redirect', '/');
        }
        const clientId = env.SUPABASE_CLIENT_ID;
        if (!clientId) {
            throw new Error('SUPABASE_CLIENT_ID is not defined');
        }

        // Generate a random state for CSRF protection
        const state = Math.random().toString(36).substring(2);
        (await cookies()).set('supabase-oauth-state', state, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 10, // 10 minutes
            path: '/',
        });

        const redirectUri = `${env.NEXT_PUBLIC_HOST}/api/supabase/callback`;

        const authUrl = new URL('https://api.supabase.com/v1/oauth/authorize');
        authUrl.searchParams.append('client_id', clientId);
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('state', state);

        return authUrl.toString();
    } catch (error) {
        console.error('Error generating Supabase OAuth URL:', error);
        throw error;
    }
}

/**
 * Disconnect from Supabase
 */
export async function disconnectFromSupabase() {
    try {
        const currentClerUser = await currentUser();
        if (!currentClerUser?.id) {
            throw new Error('User not authenticated');
        }

        await db.user.update({
            where: { clerkId: currentClerUser?.id },
            data: {
                supabaseToken: null,
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Error disconnecting from Supabase:', error);
        throw error;
    }
}

/**
 * Execute a query against Supabase
 */
export async function executeSupabaseQuery(projectId: string, query: string) {
    try {
        const currentClerUser = await currentUser();
        if (!currentClerUser?.id) {
            throw new Error('User not authenticated');
        }

        const user = await db.user.findUnique({
            where: { clerkId: currentClerUser?.id },
        });

        if (!user?.supabaseToken) {
            throw new Error('Supabase token not found');
        }

        const response = await fetch(`https://api.supabase.com/v1/projects/${projectId}/database/query`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${user.supabaseToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            let errorData;

            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { message: errorText };
            }

            return {
                error: {
                    status: response.status,
                    message: errorData.message || errorData.error || errorText,
                    details: errorData,
                }
            };
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Query execution error:', error);
        return {
            error: {
                message: error instanceof Error ? error.message : 'Query execution failed',
                stack: error instanceof Error ? error.stack : undefined,
            }
        };
    }
}
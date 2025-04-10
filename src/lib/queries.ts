"use server";

import { ReactBasePrompt } from "@/data/BasePrompts";
import { db } from "@/lib/db";
import { clerkClient, currentUser } from "@clerk/nextjs/server";

export const getUser = async () => {
    try {
        const user = await currentUser();
        const dbUser = await db.user.findUnique({
            where: {
                clerkId: user?.id!,
            },
        });
        if (!dbUser) {
            const newUser = await db.user.create({
                data: {
                    email: user?.emailAddresses[0].emailAddress!,
                    clerkId: user?.id!,
                    firstname: user?.firstName || "",
                    lastname: user?.lastName || "",
                },
            });
            return newUser;
        }
        return dbUser;
    }
    catch (error: any) {
        return null;
    }
}

export const createWorkspace = async (messages: { role: string, content: string }, user: any, scrapeUrl: string) => {
    try {
        const workspace = await db.workspace.create({
            data: {
                userId: user.id,
                fileData: ReactBasePrompt,
                Messages: {
                    create: {
                        role: messages.role,
                        content: messages.content,
                        url: scrapeUrl
                    }
                }
            },
        });
        return workspace;
    }
    catch (error: any) {
        return null;
    }
}

export const getWorkspace = async (id: string) => {
    try {
        const workspace = await db.workspace.findUnique({
            where: {
                id: id,
            },
            include: {
                Messages: true,
                githubRepo: true,
            },
        });
        return workspace;
    }
    catch (error: any) {
        console.log(error)
        return null;
    }
}

export const onCurrentUser = async () => {
    const user = await currentUser();
    if (user == null) return null;
    const userData = await db.user.findUnique({
        where: {
            clerkId: user.id
        }
    })

    return userData
}

export const getAllWorkspaces = async (userId: string) => {
    try {
        const workspaces = await db.workspace.findMany({
            where: {
                User: {
                    clerkId: userId,
                }
            },
            include: {
                Messages: {
                    select: {
                        role: true,
                        content: true,
                    }
                },
            }
        });
        return workspaces;
    }
    catch (error: any) {
        return null;
    }
}

export const updateWorkspace = async (id: any, messages: any, llmmessage: any, files?: any) => {
    let data: { message: any; llmmessage: any; fileData?: any } = {
        message: messages,
        llmmessage: llmmessage
    }
    if (files) {
        data.fileData = files;
    }
    try {
        const workspace = await db.workspace.update({
            where: {
                id: id,
            },
            data: data
        })
        return workspace;
    }
    catch (error: any) {
        return null;
    }
}


export const deleteWorkspace = async (id: any) => {
    try {
        const workspace = await db.workspace.delete({
            where: {
                id: id,
            },
        });
        return workspace;
    }
    catch (error: any) {
        return null;
    }
}

export async function onFilesUpdate(id: string, files: any) {
    await db.workspace.update({
        where: {
            id: id,
        },
        data: {
            fileData: files,
            isChangesPushed: false
        }
    })
    console.log(files)
}

export async function onMessagesUpdate(id: string | null, role: string, content: string, workspaceId: string, scrapeUrl: string) {
    if (id == null) {
        await db.message.create({
            data: {
                role: role,
                content: content,
                workspaceId: workspaceId,
                url: scrapeUrl
            }
        })
    }
    else {
        await db.message.upsert({
            where: {
                id: id,
            },
            update: {
                role: role,
                content: content
            },
            create: {
                id: id,
                role: role,
                content: content,
                workspaceId: workspaceId
            }
        })
    }
}

export async function onShellCommand(shellCommand: string) {
    //npm run build && npm run start
    const commands = shellCommand.split("&&");
    for (const command of commands) {
        // console.log(`Running command: ${command}`);

        // await db.action.create({
        //     data: {
        //         projectId,
        //         promptId,
        //         content: `Ran command: ${command}`,
        //     },
        // });
    }
}

export async function onIdAndTitleUpdate(id: string, title: string, artifactId: string) {
    await db.workspace.update({
        where: {
            id: id,
        },
        data: {
            title: title,
            artifactId: artifactId
        }
    })
}

export const getClerkClient = async () => {
    return await clerkClient();
}

export async function pushWorkspaceToRepo(octokit: any, owner: string, repo: string, fileData: any) {
    try {
        // Get the default branch reference
        const { data: refData } = await octokit.git.getRef({
            owner,
            repo,
            ref: 'heads/main', // Using main as the default branch
        });

        const mainBranchSha = refData.object.sha;

        // Get the tree that the commit points to
        const { data: commitData } = await octokit.git.getCommit({
            owner,
            repo,
            commit_sha: mainBranchSha,
        });

        const treeSha = commitData.tree.sha;

        // Prepare files for the new tree
        const files = Object.entries(fileData).map(([path, content]: [path: string, content: any]) => ({
            path,
            mode: '100644', // Regular file
            type: 'blob',
            content: content.code as string,
        }));

        // Create a new tree
        const { data: newTree } = await octokit.git.createTree({
            owner,
            repo,
            base_tree: treeSha,
            tree: files,
        });

        // Create a commit
        const { data: newCommit } = await octokit.git.createCommit({
            owner,
            repo,
            message: 'Use tech stack Vite + React + Typescript',
            tree: newTree.sha,
            parents: [mainBranchSha],
        });

        // Update the reference
        await octokit.git.updateRef({
            owner,
            repo,
            ref: 'heads/main',
            sha: newCommit.sha,
        });

        return true;
    } catch (error) {
        console.error('Error pushing initial code to repository:', error);
        throw error;
    }
}
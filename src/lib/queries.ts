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

export const createWorkspace = async (messages: { role: string, content: string }, user: any) => {
    try {
        const workspace = await db.workspace.create({
            data: {
                userId: user.id,
                fileData: ReactBasePrompt,
                Messages: {
                    create: {
                        role: messages.role,
                        content: messages.content
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
            },
        });
        return workspace;
    }
    catch (error: any) {
        console.log(error)
        return null;
    }
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
            fileData: files
        }
    })
    console.log(files)
}

export async function onMessagesUpdate(id: string | null, role: string, content: string, workspaceId: string) {
    if (id == null) {
        await db.message.create({
            data: {
                role: role,
                content: content,
                workspaceId: workspaceId
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
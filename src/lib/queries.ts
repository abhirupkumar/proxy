"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

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

export const createWorkspace = async (messages: any, user: any) => {
    try {
        const workspace = await db.workspace.create({
            data: {
                message: [messages],
                userId: user.id,
            },
        });
        return workspace;
    }
    catch (error: any) {
        return null;
    }
}

export const getWorkspace = async (id: any) => {
    try {
        const workspace = await db.workspace.findUnique({
            where: {
                id: id,
            },
        });
        console.log(id)
        return workspace;
    }
    catch (error: any) {
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
        });
        return workspaces;
    }
    catch (error: any) {
        return null;
    }
}

export const updateWorkspace = async (id: any, messages: any) => {
    console.log(messages)
    try {
        const workspace = await db.workspace.update({
            where: {
                id: id,
            },
            data: {
                message: messages,
            },
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
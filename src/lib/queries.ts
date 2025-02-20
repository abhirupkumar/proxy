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
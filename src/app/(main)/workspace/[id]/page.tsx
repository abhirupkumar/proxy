import WorkspacePage from '@/components/custom/workspace';
import { getWorkspace, onCurrentUser } from '@/lib/queries';
import { auth, clerkClient, currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import React from 'react'

const Workspace = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const { sessionId } = await auth();
    const workspace = await getWorkspace(id);
    const dbUser = await onCurrentUser();
    if (!sessionId || !workspace || !dbUser) {
        return notFound();
    }
    return (
        <>
            <WorkspacePage dbUser={dbUser} workspace={workspace} sessionId={sessionId} />
        </>
    )
}

export default Workspace;
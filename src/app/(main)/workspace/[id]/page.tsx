import ChatView from '@/components/custom/chatview';
import CodeView from '@/components/custom/codeview';
import WorkspacePage from '@/components/custom/workspace';
import { getWorkspace } from '@/lib/queries';
import { currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';
import React from 'react'

const Workspace = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const workspace = await getWorkspace(id);
    if (!workspace) {
        return notFound();
    }
    return (
        <>
            <WorkspacePage workspace={workspace} />
        </>
    )
}

export default Workspace;
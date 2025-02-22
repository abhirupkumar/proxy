import ChatView from '@/components/custom/chatview';
import CodeView from '@/components/custom/codeview';
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
        <div className='md:p-10 p-5'>
            <div className='grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-10'>
                <ChatView workspace={workspace} />
                <div className='md:col-span-1 lg:col-span-2'>
                    <CodeView />
                </div>
            </div>
        </div>
    )
}

export default Workspace;
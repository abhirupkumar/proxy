import WorkspacePage from '@/components/custom/workspace';
import { getWorkspace } from '@/lib/queries';
import { auth, currentUser } from '@clerk/nextjs/server';
import { notFound } from 'next/navigation';

const Workspace = async ({ params }: { params: Promise<{ id: string }> }) => {
    const { id } = await params;
    const user = await currentUser();
    const workspace = await getWorkspace(id);
    if (!workspace || !workspace.User) {
        return notFound();
    }
    if (workspace.isPrivate) {
        if (!user) return notFound();
        else if (user.id !== workspace.User.clerkId) return notFound();
    }
    else {
    }

    return (
        <>
            <WorkspacePage dbUser={workspace.User} workspace={workspace} />
        </>
    )
}

export default Workspace;
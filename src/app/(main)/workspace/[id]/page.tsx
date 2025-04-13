import WorkspacePage from '@/components/custom/workspace';
import { getWorkspace } from '@/lib/queries';
import { constructMetadata } from '@/lib/utils';
import { auth, currentUser } from '@clerk/nextjs/server';
import { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';

type Props = {
    params: Promise<{ id: string }>
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const { id } = await params

    const workspace = await getWorkspace(id);

    return {
        title: (workspace?.title ?? "") + " - Proxy",
    }
}

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

    return (
        <>
            <WorkspacePage dbUser={workspace.User} workspace={workspace} />
        </>
    )
}

export default Workspace;
import { Button } from '@/components/ui/button';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';
import { db } from '@/lib/db';
import { changePrivateWorkspace } from '@/lib/queries';
import { LockKeyhole, LockKeyholeOpen } from 'lucide-react';
import React, { useState } from 'react'

const PrivateButton = ({ workspaceId }: { workspaceId: string }) => {
    const [loading, setLoading] = useState(false);
    const { isPrivate, setIsPrivate } = useWorkspaceData();
    const handleClick = async () => {
        setLoading(true);
        const data = await changePrivateWorkspace(workspaceId, !isPrivate);
        if (data != null)
            setIsPrivate(!isPrivate);
        setLoading(false);
    };

    return (
        <Button title={isPrivate ? "Private" : "Public"} variant='link' size='icon' onClick={handleClick} disabled={loading}>
            {isPrivate ? <LockKeyhole /> : <LockKeyholeOpen />}
        </Button>
    )
}

export default PrivateButton;
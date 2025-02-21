"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/context/MessagesContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { useUser } from '@clerk/nextjs';
import { Workspace } from '@prisma/client';
import { ArrowRight, Link } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect } from 'react'

const ChatView = ({ workspace }: { workspace: Workspace }) => {
    const { messages, setMessages } = useMessages();
    const [userInput, setUserInput] = React.useState<string>('');
    const { isSignedIn, user, isLoaded } = useUser();

    useEffect(() => {
        setMessages(workspace.message);
    }, [workspace.message]);

    const onGenerate = (content: string) => {

    }

    return (
        <div className='relative h-[85vh] flex flex-col'>
            <div className='flex-1 overflow-y-scroll no-scrollbar'>
                {messages?.map((message: any, index: number) => (
                    <div key={index} className='flex gap-2 items-start rounded-lg p-3 mb-2' style={{
                        backgroundColor: Colors.CHAT_BACKGROUND,
                    }}>
                        {!isLoaded && <Skeleton className="h-[35px] w-[35px] rounded-full" />}
                        {isLoaded && message?.role == 'user' && <Image src={user?.imageUrl!} width={35} height={35} alt="avatar" className='rounded-full' />}
                        <h2>{message.content}</h2>
                    </div>))}
            </div>
            <div className='p-5 border rounded-xl max-w-2xl w-full mt-3'
                style={{
                    backgroundColor: Colors.BACKGROUND
                }}>
                <div className='flex gap-2'>
                    <textarea placeholder={Lookup.INPUT_PLACEHOLDER} onChange={(event) => setUserInput(event.target.value)} className='outline-none border-none bg-transparent w-full !h-32 !max-h-56 resize-none' />
                    {userInput && <ArrowRight
                        onClick={() => onGenerate(userInput)}
                        className='w-10 h-10 p-2 rounded-md text-secondary-foreground bg-gradient-to-tr from-teal-500 via-cyan-500 to-sky-500 cursor-pointer' />}
                </div>
                <div>
                    <Link className='h-5 w-5' />
                </div>
            </div>
        </div>
    )
}

export default ChatView;
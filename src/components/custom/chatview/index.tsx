"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/context/MessagesContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import Prompt from '@/data/Prompt';
import { useUser } from '@clerk/nextjs';
import { Workspace } from '@prisma/client';
import { ArrowRight, Bot, Link, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import axios from 'axios';
import { Message } from 'postcss';
import { updateWorkspace } from '@/lib/queries';
import ReactMarkdown from "react-markdown";

const ChatView = ({ workspace }: { workspace: Workspace }) => {
    const { messages, setMessages } = useMessages();
    const [userInput, setUserInput] = useState<string>('');
    const { isSignedIn, user, isLoaded } = useUser();
    const [loading, setLoading] = useState<boolean>(false)

    useEffect(() => {
        setMessages(workspace.message);
    }, [workspace.message]);

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role == 'user')
                getAiResponse();
        }
    }, [messages]);

    const onGenerate = async (content: string) => {
        setMessages((prev: Message[]) => [...prev, {
            role: 'user',
            content: content
        }])
        setUserInput('');
        await updateWorkspace(workspace.id, messages);
    }

    const getAiResponse = async () => {
        setLoading(true);
        const response: any = await fetch('/api/ai-chat', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt: messages,
                systemPrompt: Prompt.CHAT_PROMPT
            }),
        });
        if (!response.body) return;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botMessage = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            setLoading(false);

            botMessage += decoder.decode(value, { stream: true });

            setMessages((prev: any) => [
                ...(prev[prev.length - 1]?.role == 'system' ? prev.slice(0, prev.length - 1) : prev),
                { role: "system", content: botMessage },
            ]);
        }
        await updateWorkspace(workspace.id, [...messages, { role: "system", content: botMessage }]);
    }

    return (
        <div className='relative h-[85vh] flex flex-col'>
            <div className='flex-1 overflow-y-scroll no-scrollbar'>
                {messages?.map((message: any, index: number) => (
                    <div key={index} className='flex gap-2 items-start rounded-lg p-3 mb-2 leading-7' style={{
                        backgroundColor: Colors.CHAT_BACKGROUND,
                    }}>
                        {!isLoaded && <Skeleton className="h-[35px] w-[35px] rounded-full" />}
                        {isLoaded && message?.role == 'user' && <Image src={user?.imageUrl!} width={35} height={35} alt="avatar" className='rounded-full' />}
                        {loading == true && message?.role == 'ai' && <Loader2 className='h-4 w-4 animate-spin' />}
                        <div className="whitespace-pre-wrap">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    </div>))}
                {loading && <div className='flex gap-2 items-start rounded-lg p-3 mb-2' style={{
                    backgroundColor: Colors.CHAT_BACKGROUND,
                }}>
                    <Loader2 className='h-4 w-4 animate-spin' />
                </div>}
            </div>
            <div className='p-5 border rounded-xl max-w-2xl w-full mt-3'
                style={{
                    backgroundColor: Colors.BACKGROUND
                }}>
                <div className='flex gap-2'>
                    <textarea placeholder={Lookup.INPUT_PLACEHOLDER} onChange={(event) => setUserInput(event.target.value)} value={userInput} className='outline-none border-none bg-transparent w-full !h-32 !max-h-56 resize-none' />
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
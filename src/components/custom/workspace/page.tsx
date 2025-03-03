"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/context/MessagesContext';
import { ReactBasePrompt } from '@/data/BasePrompts';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { parseXml } from '@/lib/parse';
import { updateWorkspace } from '@/lib/queries';
import { FileItem, Step } from '@/lib/types';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { ArrowRight, Loader, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { Message } from 'postcss';
import React, { useEffect, useState } from 'react'
import ReactMarkdown from "react-markdown";

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

const WorkspacePage2 = ({ workspace }: { workspace: any }) => {
    const prompt = workspace.message[0].content;
    const { messages, setMessages } = useMessages();
    const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const { isSignedIn, user, isLoaded } = useUser();
    const [loading, setLoading] = useState<boolean>(false);
    const [steps, setSteps] = useState<Step[]>([]);

    useEffect(() => {
        setMessages(workspace.message);
    }, [workspace.message]);

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role == 'user')
                check();
            //     getAiResponse();
        }
    }, [messages]);

    const check = async () => {
        setLoading(true);
        const res = await axios.post(`/api/template`, {
            prompt: prompt
        });

        const { prompts, uiPrompts } = res.data;

        setSteps((await parseXml(uiPrompts[0])).map((x: Step) => ({
            ...x,
            status: "pending"
        })));

        const response = await axios.post('/api/chat', {
            messages: [...prompts, prompt].map(content => ({
                role: "user",
                parts: [{ text: content }]
            }))
        });
        const parsedXml = await parseXml(response.data.response);
        setSteps(s => [...s, ...parsedXml.map(x => ({
            ...x,
            status: "pending" as "pending"
        }))]);
        setLlmMessages([...prompts, prompt].map(content => ({
            role: "user",
            content
        })));
        setLlmMessages(x => [...x, { role: "assistant", content: response.data.response }])
        const aiResponses = steps.filter(x => x.type == 0).sort((a, b) => a.id - b.id);
        const stepsWithoutResponses = steps.filter(x => x.type != 0)
        const stepsMarkdown = stepsWithoutResponses.length > 0
            ? `\n## Steps:\n\`\`\`js\n${stepsWithoutResponses.map((step: Step) => step.title).join("\n")}\n\`\`\`\n`
            : '';
        const newMessage = `${aiResponses.length > 0 ? aiResponses[0].description : ''}${stepsMarkdown}${aiResponses.length > 1 ? aiResponses[1].description : ''}`;
        setMessages((prev: Message[]) => [...prev, {
            role: 'assistant',
            content: newMessage
        }])
        setLoading(false);
    }


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
        // await updateWorkspace(workspace.id, [...messages, { role: "system", content: botMessage }]);
    }
    return (
        <div className='md:p-10 p-5'>
            <div className='grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-10'>
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
                    <div className='p-5 border rounded-xl max-w-2xl md:min-w-[28rem] w-full mt-3'
                        style={{
                            backgroundColor: Colors.BACKGROUND
                        }}>
                        <div className='flex gap-2'>
                            <textarea placeholder={Lookup.INPUT_PLACEHOLDER} className='outline-none border-none bg-transparent w-full !h-32 !max-h-56 resize-none' />
                            {/* {userInput && <ArrowRight
                        onClick={() => onGenerate(userInput)}
                        className='w-10 h-10 p-2 rounded-md text-secondary-foreground bg-gradient-to-tr from-teal-500 via-cyan-500 to-sky-500 cursor-pointer' />} */}
                        </div>
                    </div>
                </div>
                <div className='md:col-span-1 lg:col-span-2'>
                    {/* <CodeView /> */}
                </div>
            </div>
        </div>
    );
}

export default WorkspacePage2;
"use client";

import { Skeleton } from '@/components/ui/skeleton';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { parseXml } from '@/lib/parse';
import { FileItem, Step } from '@/lib/types';
import axios from 'axios';
import { ArrowRight, Loader, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

const WorkspacePage = ({ workspace }: { workspace: any }) => {

    const prompt = workspace.message[0].content;

    const [userPrompt, setPrompt] = useState("");
    const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
    const [loading, setLoading] = useState(false);
    const [templateSet, setTemplateSet] = useState(false);

    const [currentStep, setCurrentStep] = useState(1);
    const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
    const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

    const [steps, setSteps] = useState<Step[]>([]);

    const [files, setFiles] = useState<FileItem[]>([]);

    const init = async () => {
        const response = await axios.post(`/api/template`, {
            prompt: prompt
        });
        setTemplateSet(true);

        const { prompts, uiPrompts } = response.data;

        // setSteps(parseXml(uiPrompts[0]).map((x: Step) => ({
        //     ...x,
        //     status: "pending"
        // })));

        setLoading(true);
        const stepsResponse = await axios.post(`/api/chat`, {
            messages: [...prompts, prompt].map(content => ({
                role: "user",
                parts: [{ text: content }]
            }))
        })

        setLoading(false);
        console.log(stepsResponse.data.response)

        // setSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
        //     ...x,
        //     status: "pending" as "pending"
        // }))]);
        // console.log(parseXml(stepsResponse.data.response).map(x => ({
        //     ...x,
        //     status: "pending" as "pending"
        // })))

        // setLlmMessages([...prompts, prompt].map(content => ({
        //     role: "user",
        //     content
        // })));

        // setLlmMessages(x => [...x, { role: "assistant", content: stepsResponse.data.response }])
    }

    useEffect(() => {
        init();
    }, [])

    return (
        <div className='md:p-10 p-5'>
            <div className='grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-10'>
                <div className='relative h-[85vh] flex flex-col'>
                    <div className='flex-1 overflow-y-scroll no-scrollbar'>
                        {/* {messages?.map((message: any, index: number) => (
                    <div key={index} className='flex gap-2 items-start rounded-lg p-3 mb-2 leading-7' style={{
                        backgroundColor: Colors.CHAT_BACKGROUND,
                    }}>
                        {!isLoaded && <Skeleton className="h-[35px] w-[35px] rounded-full" />}
                        {isLoaded && message?.role == 'user' && <Image src={user?.imageUrl!} width={35} height={35} alt="avatar" className='rounded-full' />}
                        {loading == true && message?.role == 'ai' && <Loader2 className='h-4 w-4 animate-spin' />}
                        <div className="whitespace-pre-wrap">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                        </div>
                    </div>))} */}
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

export default WorkspacePage;
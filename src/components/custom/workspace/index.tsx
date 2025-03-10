"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/context/MessagesContext';
import { NextBasePrompt, NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { BASE_PROMPT } from '@/data/Prompt';
import { parseXml } from '@/lib/parse';
import { updateWorkspace } from '@/lib/queries';
import { FileItem, Step } from '@/lib/types';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { ArrowRight, Loader, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useState } from 'react'
import ReactMarkdown from "react-markdown";
import ButtonLoader from '../button-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileExplorer } from '../file-explorer';
import { CodeEditor } from '../code-editor';
import { Preview } from '../preview';
import { useWebContainer } from '@/hooks/use-web-container';

const MOCK_FILE_CONTENT = `// This is a sample file content
import React from 'react';

function Component() {
  return <div>Hello World</div>;
}

export default Component;`;

interface Message {
    role: 'user' | "assistant",
    content: string
}

interface FileSystem {
    [key: string]: { code: string }
}

const WorkspacePage = ({ workspace }: { workspace: any }) => {
    const prompt = workspace.message[0].content;
    const [messages, setMessages] = useState<Message[]>([]);
    const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
    const [files, setFiles] = useState<FileSystem | null>(null);
    const [userInput, setUserInput] = useState<string>('');
    const { isSignedIn, user, isLoaded } = useUser();
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const webcontainer = useWebContainer();

    useEffect(() => {
        setMessages(workspace.message);
        setLlmMessages(workspace.llmmessage);
        setFiles(workspace.fileData);
    }, [workspace]);

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role == 'user') {
                if (messages?.length == 1) init();
                else getAiResponse();
            }
        }
    }, [messages]);

    const onGenerate = async (content: string) => {
        setMessages((prev: Message[]) => [...prev, {
            role: 'user',
            content: content
        }]);
        setLlmMessages(x => [...x, { role: "user", content: content }])
        setUserInput('');
    }

    const getBasePrompt = (template: string) => {
        if (template == 'react') return ReactBasePrompt;
        else if (template == 'node') return NodeBasePrompt;
        else if (template == 'nextjs') return NextBasePrompt;
        else return "Template Not Found!";
    }

    const init = async () => {
        setLoading(true);
        const res = await axios.post(`/api/template`, {
            prompt: prompt
        });

        const { template } = res.data;
        const prompts = [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${JSON.stringify(getBasePrompt(template))}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`]
        const uiPrompts = JSON.stringify(getBasePrompt(template));
        const PromptFiles = JSON.parse(uiPrompts);

        const response = await axios.post('/api/chat', {
            messages: [...prompts, prompt].map(content => ({
                role: "user",
                parts: [{ text: content }]
            }))
        });
        const result = JSON.parse(response.data.response);
        const newFiles = result.files.map((file: { filepath: string; code: string }) => ({
            [file.filepath]: {
                code: file.code
            }
        }));
        const formattedFiles = newFiles.reduce((acc: any, obj: any) => {
            const key = Object.keys(obj)[0];
            acc[key] = obj[key];
            return acc;
        }, {});

        const mergedFiles = { ...PromptFiles, ...formattedFiles };
        let createdFiles = Object.keys(mergedFiles);

        const newMessages: Message[] = [
            ...messages,
            {
                role: "assistant",
                content: result.explanation + (createdFiles.length > 0 ? "\nFiles Created:\n" + createdFiles.join("\n") : "")
            },
        ]

        setFiles(mergedFiles);
        let newllmMessages: any = [...prompts, prompt].map(content => ({
            role: "user",
            content
        }))
        newllmMessages = [...newllmMessages, { role: "assistant", content: result }]
        await updateWorkspace(workspace.id, newMessages, newllmMessages, mergedFiles);
        setLlmMessages(newllmMessages)
        setMessages(newMessages);
        setLoading(false);
    }

    const getAiResponse = async () => {
        setLoading(true);
        const response = await axios.post('/api/chat', {
            messages: llmMessages.map(message => ({
                role: message.role == "user" ? message.role : "model",
                parts: [{ text: message.role == 'user' ? message.content : JSON.stringify(message.content) }]
            }))
        });
        const result = JSON.parse(response.data.response);
        const newFiles = result.files.map((file: { filepath: string; code: string }) => ({
            [file.filepath]: {
                code: file.code
            }
        }));
        const formattedFiles = newFiles.reduce((acc: any, obj: any) => {
            const key = Object.keys(obj)[0];
            acc[key] = obj[key];
            return acc;
        }, {});

        const modifiedFiles = Object.keys(formattedFiles).filter(key => Object.keys(files!).includes(key));
        const newCreatedFiles = Object.keys(formattedFiles).filter(key =>
            !Object.keys(files!).includes(key));

        const newMessages: Message[] = [
            ...messages,
            {
                role: "assistant",
                content: result.explanation + (newCreatedFiles.length > 0 ? "\nFiles Created:\n" + newCreatedFiles.join("\n") : "") + (modifiedFiles.length > 0 ? "\nFiles Modified:\n" + modifiedFiles.join("\n") : "") + (result?.deletedFiles.length > 0 ? "\nFiles Deleted:\n" + result?.deletedFiles.join("\n") : "")
            },
        ]
        let mergedFiles = { ...files, ...formattedFiles };
        if (result.deletedFiles.length > 0) {
            mergedFiles = Object.fromEntries(Object.entries(mergedFiles).filter(([key]) => !result.deletedFiles.includes(key)));
        }
        setFiles(mergedFiles)
        setLlmMessages(x => [...x, { role: "assistant", content: result }])
        let newllmMessages: any = [...llmMessages, { role: "assistant", content: result }]
        await updateWorkspace(workspace.id, newMessages, newllmMessages, mergedFiles);
        setLlmMessages(newllmMessages)
        setMessages(newMessages);
        setLoading(false);
    }

    return (
        <div className='md:p-10 p-5'>
            <div className='grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2 gap-10'>
                <div className='relative h-[85vh] flex flex-col'>
                    <div className='flex-1 overflow-y-scroll no-scrollbar'>
                        {messages?.map((message: any, index: number) => (
                            <div key={index} className='flex gap-2 items-start rounded-lg p-3 mb-2 leading-7 bg-secondary'>
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
                    <div className='p-5 border rounded-xl max-w-2xl md:min-w-[28rem] w-full mt-3 bg-secondary'>
                        <div className='flex gap-2'>
                            <textarea
                                onKeyDown={(e) => {
                                    if (e.key == 'Enter' && userInput != null && userInput != "") onGenerate(userInput);
                                }}
                                placeholder={Lookup.INPUT_PLACEHOLDER}
                                onChange={(e) => setUserInput(e.target.value)}
                                value={userInput}
                                className='outline-none border-none bg-transparent w-full !h-32 !max-h-56 resize-none' />
                            {!loading && userInput && <ArrowRight
                                onClick={() => onGenerate(userInput)}
                                className='w-10 h-10 p-2 rounded-md text-secondary bg-primary cursor-pointer' />}
                            {loading && <ButtonLoader />}
                        </div>
                    </div>
                </div>
                <div className='md:col-span-1 lg:col-span-2'>
                    <Tabs defaultValue="code" className="h-screen border-2 rounded-lg">
                        <div className="border-b">
                            <div className="container mx-auto px-4">
                                <TabsList className="m-1">
                                    <TabsTrigger value="code" className="text-sm">Code</TabsTrigger>
                                    <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
                                </TabsList>
                            </div>
                        </div>

                        <TabsContent value="code" className="m-0 h-[calc(80vh-4rem)]">
                            {loading ? <div className='w-full h-full flex gap-1 items-center justify-center text-lg'><Loader2 className='w-5 h-5 animate-spin' />{" Generating Response"}</div> :
                                <div className="grid grid-cols-[220px_1fr] h-full">
                                    {files && <FileExplorer onFileSelect={setSelectedFile} fileSystem={files} />}
                                    {files && <CodeEditor filePath={selectedFile} fileSystem={files} />}
                                </div>}
                        </TabsContent>

                        <TabsContent value="preview" className="m-0 h-[calc(100vh-4rem)]">
                            <Preview files={files} webcontainer={webcontainer!} />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}

export default WorkspacePage;
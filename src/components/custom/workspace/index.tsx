"use client";

import { Skeleton } from '@/components/ui/skeleton';
import { useMessages } from '@/context/MessagesContext';
import { NextBasePrompt, NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { BASE_PROMPT } from '@/data/Prompt';
import { getClerkClient, updateWorkspace } from '@/lib/queries';
import { FileItem, Step } from '@/lib/types';
import { useUser } from '@clerk/nextjs';
import axios from 'axios';
import { ArrowRight, Loader, Loader2 } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from "react-markdown";
import ButtonLoader from '../button-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileExplorer } from '../file-explorer';
import { CodeEditor } from '../code-editor';
import { Preview } from '../preview';
import { useWebContainer } from '@/hooks/use-web-container';
import rehypeRaw from 'rehype-raw'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import crypto from "crypto";
import { toolInvocation } from '@/lib/gemini';
import { StreamingMessageParser } from '@/lib/stream-parser';

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

const WorkspacePage = ({ workspace, sessionId }: { workspace: any, sessionId: string }) => {
    const prompt = workspace.message[0].content;
    const [messages, setMessages] = useState<Message[]>([]);
    const [newAiMessage, setNewAiMessage] = useState<string>("");
    const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
    const [files, setFiles] = useState<FileSystem | null>(null);
    const [userInput, setUserInput] = useState<string>('');
    const { isSignedIn, user, isLoaded } = useUser();
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
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
                // setFiles(NextBasePrompt);
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

    function transformJson(inputJson: Object) {
        const transformedArray = Object.entries(inputJson).map(([filepath, { code }]) => ({
            filepath,
            code
        }));
        return transformedArray;
    }

    const init = async () => {
        setLoading(true);
        // const res = await axios.post(`/api/template`, {
        //     prompt: prompt
        // });

        // const { template } = res.data;
        const template = "nextjs";
        const nextjsExtraFiles = `-  hooks/use-toast.ts - components/ui/accordion.tsx - components/ui/alert-dialog.tsx - components/ui/alert.tsx - components/ui/aspect-ratio.tsx - components/ui/avatar.tsx - components/ui/badge.tsx - components/ui/breadcrumb.tsx - components/ui/button.tsx - components/ui/calendar.tsx - components/ui/card.tsx - components/ui/carousel.tsx - components/ui/chart.tsx - components/ui/checkbox.tsx - components/ui/collapsible.tsx - components/ui/command.tsx - components/ui/context-menu.tsx - components/ui/dialog.tsx - components/ui/drawer.tsx - components/ui/dropdown-menu.tsx - components/ui/form.tsx - components/ui/hover-card.tsx - components/ui/input-otp.tsx - components/ui/input.tsx - components/ui/label.tsx - components/ui/menubar.tsx - components/ui/pagination.tsx - components/ui/navigation-menu.tsx - components/ui/popover.tsx - components/ui/progress.tsx - components/ui/radio-group.tsx - components/ui/resizable.tsx - components/ui/scroll-area.tsx - components/ui/select.tsx - components/ui/separator.tsx - components/ui/sheet.tsx - components/ui/skeleton.tsx - components/ui/slider.tsx - components/ui/sonner.tsx - components/ui/switch.tsx - components/ui/table.tsx - components/ui/tabs.tsx - components/ui/textarea.tsx - components/ui/toast.tsx - components/ui/toaster.tsx - components/ui/toggle-group.tsx - components/ui/toggle.tsx - components/ui/tooltip.tsx`
        const prompts = [BASE_PROMPT, `You are required to write the code in ${template}. Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${JSON.stringify(transformJson(getBasePrompt(template)))}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore  - package-lock.json  ${template == 'nextjs' ? nextjsExtraFiles : ""}`]
        const uiPrompts = JSON.stringify(getBasePrompt(template));
        const PromptFiles = JSON.parse(uiPrompts);

        const messageParser = new StreamingMessageParser({
            callbacks: {
                onArtifactOpen: (data) => { },
                onArtifactClose: (data) => { },
                onActionOpen: (data) => {
                    if (data.action.type == "file") {
                        const filePath = data.action.filePath
                        setSelectedFile(filePath);
                        setFiles((prev) => ({
                            ...prev, [filePath]: {
                                code: data.action.content
                            }
                        }))
                    }
                },
                onActionClose: (data) => {
                    if (data.action.type == "file") {
                        const filePath = data.action.filePath
                        setSelectedFile(filePath);
                        setFiles((prev) => ({
                            ...prev, [filePath]: {
                                code: data.action.content
                            }
                        }))
                    }
                },
            },
        });

        setFiles(PromptFiles);
        setSelectedFile('package.json');
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [...prompts, prompt].map(content => ({
                    role: "user",
                    parts: [{ text: content }]
                    // content: content
                }))
            }),
            // signal: controller.signal
        });

        if (!response.body) {
            console.error("No response body received.");
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let msg = "";
        let buffer = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            buffer += text;
            const parsedText = messageParser.parse("msg-id", buffer);
            msg += parsedText.trim();
            setNewAiMessage(msg)
        }
        setMessages([...messages, {
            role: "assistant",
            content: msg
        }])
        setNewAiMessage("");
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

    const handleAbort = () => {
        abortControllerRef.current?.abort();
        setLoading(false);
    };

    return (
        <div className='w-full text-sm'>
            <ResizablePanelGroup
                direction="horizontal"
                className="max-w-full border-t md:min-w-[450px]"
            >
                <ResizablePanel defaultSize={35} minSize={25}>
                    <div className='relative h-[calc(100vh-3rem)] flex flex-col p-5'>
                        <div className='flex-1 overflow-y-scroll no-scrollbar'>
                            {messages?.map((message: any, index: number) => (
                                <div key={index} className={`flex gap-2 items-start rounded-full p-2 mb-2 leading-7 ${message.role == "user" ? "border justify-end w-fit ml-auto" : ""}`}>
                                    {!isLoaded && <Skeleton className="h-[35px] w-[35px] rounded-full" />}
                                    {isLoaded && message?.role == 'user' && <Image src={user?.imageUrl!} width={30} height={30} alt="avatar" className='rounded-full' />}
                                    {loading == true && message?.role == 'ai' && <Loader2 className='h-4 w-4 animate-spin' />}
                                    <div className="whitespace-pre-wrap">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                </div>))}
                            {newAiMessage != "" && <div className='flex gap-2 items-start rounded-lg p-3 mb-2'>
                                <div className="whitespace-pre-wrap">
                                    <ReactMarkdown>{newAiMessage}</ReactMarkdown>
                                </div>
                            </div>}
                            {loading && <div className='w-full flex items-center justify-center'>
                                <div className='ai-loader'></div>
                            </div>}
                        </div>
                        <div className='p-5 border rounded-xl max-w-2xl w-full mt-3 bg-secondary'>
                            <div className='flex gap-2'>
                                <textarea
                                    onKeyDown={(e) => {
                                        if (e.key == 'Enter' && userInput != null && userInput != "") onGenerate(userInput);
                                    }}
                                    placeholder={Lookup.INPUT_PLACEHOLDER}
                                    onChange={(e) => setUserInput(e.target.value)}
                                    value={userInput}
                                    className='outline-none border-none bg-transparent w-full !h-24 !max-h-56 resize-none' />
                                {!loading && userInput && <ArrowRight
                                    onClick={() => onGenerate(userInput)}
                                    className='w-10 h-10 p-2 rounded-md text-secondary bg-primary cursor-pointer' />}
                                {loading && <ButtonLoader onClick={handleAbort} />}
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={65} minSize={25}>
                    <div className=''>
                        <Tabs defaultValue="code" className="h-full">
                            <div className="border-b">
                                <div className="container mx-auto px-4">
                                    <TabsList className="m-1">
                                        <TabsTrigger value="code" className="text-sm">Code</TabsTrigger>
                                        <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>

                            <TabsContent value="code" className="m-0 h-full">
                                {files == null ? <div className='w-full h-full flex gap-1 items-center justify-center text-lg'><Loader2 className='w-5 h-5 animate-spin' />{" Generating"}</div> :
                                    <div className="grid grid-cols-[220px_1fr] h-full">
                                        {files && <FileExplorer onFileSelect={setSelectedFile} fileSystem={files} />}
                                        {files && <CodeEditor filePath={selectedFile} fileSystem={files} />}
                                    </div>}
                            </TabsContent>

                            <TabsContent value="preview" className="m-0 h-full">
                                <Preview files={files} webcontainer={webcontainer!} />
                            </TabsContent>
                        </Tabs>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

export default WorkspacePage;
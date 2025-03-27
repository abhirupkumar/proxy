"use client";

import { NextBasePrompt, NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import Lookup from '@/data/Lookup';
import { BASE_PROMPT } from '@/data/Prompt';
import { onFilesUpdate, onIdAndTitleUpdate, onMessagesUpdate, updateWorkspace } from '@/lib/queries';
import axios from 'axios';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from "react-markdown";
import ButtonLoader from '../button-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileExplorer } from '../file-explorer';
import { CodeEditor } from '../code-editor';
import { Preview } from '../preview';
import { useWebContainer } from '@/hooks/use-web-container';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { StreamingMessageParser } from '@/lib/stream-parser';
import { allowedHTMLElements, rehypePlugins, remarkPlugins } from '@/lib/utils';
import styles from './_components/Markdown.module.scss';
import JSZip from 'jszip';

interface Message {
    role: 'user' | "assistant",
    content: string
}

interface FileSystem {
    [key: string]: { code: string }
}

const WorkspacePage = ({ workspace, sessionId }: { workspace: any, sessionId: string }) => {
    const prompt = workspace.message[0].content;
    const [artifactId, setArtifactId] = useState<string>(workspace.artifactId ?? "proxy-web-app")
    const [messages, setMessages] = useState<Message[]>([]);
    const [newAiMessage, setNewAiMessage] = useState<string>("");
    const [llmMessages, setLlmMessages] = useState<{ role: "user" | "assistant", content: string; }[]>([]);
    const [action, setAction] = useState<string>("");
    const [files, setFiles] = useState<FileSystem | null>(workspace.fileData ?? null);
    const [userInput, setUserInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const webcontainer = useWebContainer();

    const handleDownload = async () => {
        const zip = new JSZip();

        const projectFolder = zip.folder('vite-react-typescript-starter');

        Object.entries(files!).forEach(([filename, { code }]) => {
            projectFolder?.file(filename, code);
        });

        const content = await zip.generateAsync({ type: 'blob' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = 'vite-react-typescript-starter.zip';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const messageParser = new StreamingMessageParser({
        callbacks: {
            onRegexOpen: (data) => {
                setAction("Generating Response");
            },
            onRegexClose: (data) => {
                if (artifactId == "proxy-web-app") {
                    setArtifactId(data.id);
                    console.log(data.id);
                    onIdAndTitleUpdate(workspace.id, data.title, data.id);
                }
                setAction("");
            },
            onActionOpen: (data) => {
                if (data.action.type == "file") {
                    const filePath = data.action.filePath
                    setAction(`Editing ${filePath}`)
                }
            },
            onActionClose: (data) => {
                if (data.action.type == "file") {
                    const filePath = data.action.filePath
                    console.log(files);
                    const oldFiles = files;
                    const newFiles = {
                        ...oldFiles,
                        [filePath]: {
                            code: data.action.content
                        }
                    }
                    setFiles(newFiles)
                    setSelectedFile(filePath);
                    onFilesUpdate(workspace.id, newFiles);
                }
            },
        },
    });

    useEffect(() => {
        setMessages(workspace.message);
        setLlmMessages(workspace.llmmessage);
        setFiles(workspace.fileData);
        setArtifactId(workspace.artifactId ?? "proxy-web-app");
        setLoading(false);
    }, [workspace]);

    useEffect(() => {
        if (!loading && messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role == 'user') {
                if (messages?.length == 1) init();
                else getAiResponse();
            }
        }
    }, [messages, loading]);

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
        // const res = await axios.post(`/api/template`, {
        //     prompt: prompt
        // });

        // const { template } = res.data;
        const template = "nextjs";
        const uiPrompts = JSON.stringify(getBasePrompt(template));
        const PromptFiles: FileSystem = JSON.parse(uiPrompts);
        setFiles(PromptFiles);
        setSelectedFile('app/page.tsx');
        const nextjsExtraFiles = Object.entries(PromptFiles).map(([filepath, { code }]) => `  -  ${filepath}`);
        const prompts = [BASE_PROMPT, `You are required to write the code in ${template}. Consider the contents of ALL files in the project.\n\n${JSON.stringify(files)}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  ${template == 'nextjs' ? nextjsExtraFiles : ""}`]

        setMessages([...messages, { role: "assistant", content: "" }]);

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [...prompts, prompt].map(content => ({
                    role: "user",
                    parts: [{ text: content }]
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
            const cleanedText = parsedText.replace(/```[\w]*\n?|```/g, '');
            if (cleanedText.length > 0 && cleanedText.slice(-1) === " ") {
                msg += cleanedText.trim() + " ";
            } else {
                msg += cleanedText.trim();
            }
            const newMessages: Message[] = [
                ...messages.slice(-1),
                {
                    role: "assistant",
                    content: msg
                }
            ]
            // console.log(newMessages)
            setMessages(newMessages);
            onMessagesUpdate(workspace.id, newMessages);
        }
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
                                    {loading == true && message?.role == 'ai' && <Loader2 className='h-4 w-4 animate-spin' />}
                                    <div className="whitespace-pre-wrap">
                                        <ReactMarkdown
                                            allowedElements={allowedHTMLElements}
                                            className={styles.MarkdownContent}
                                            remarkPlugins={remarkPlugins(false)}
                                            rehypePlugins={rehypePlugins(true)}
                                        >{message.content}</ReactMarkdown>
                                    </div>
                                </div>))}
                            {newAiMessage != "" && <div className='flex gap-2 items-start rounded-lg p-3 mb-2'>
                                <div className="whitespace-pre-wrap">
                                    <ReactMarkdown
                                        allowedElements={allowedHTMLElements}
                                        className={styles.MarkdownContent}
                                        remarkPlugins={remarkPlugins(false)}
                                        rehypePlugins={rehypePlugins(true)}
                                    >{newAiMessage}</ReactMarkdown>
                                </div>
                            </div>}
                            {action != "" && <button className='flex items-center gap-2 rounded-full p-3 mb-2 bg-secondary'>
                                {action}<Loader2 className='h-4 w-4 animate-spin' />
                            </button>}
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
"use client";

import { NextBasePrompt, NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import Lookup from '@/data/Lookup';
import { BASE_PROMPT } from '@/data/Prompt';
import { onFilesUpdate, onIdAndTitleUpdate, onTemplateUpdate, onMessagesUpdate, updateWorkspace } from '@/lib/queries';
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
    const [template, setTemplate] = useState<string | null>(workspace.template ?? null);
    const [newAiMessage, setNewAiMessage] = useState<string>("");
    const [action, setAction] = useState<string>("");
    const [files, setFiles] = useState<FileSystem | null>(workspace.fileData ?? null);
    const [userInput, setUserInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);
    const webcontainer = useWebContainer();

    const handleDownload = async () => {
        const zip = new JSZip();

        const projectFolder = zip.folder(artifactId);

        Object.entries(files!).forEach(([filename, { code }]) => {
            projectFolder?.file(filename, code);
        });

        const content = await zip.generateAsync({ type: 'blob' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = artifactId + ".zip";

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
                    const oldFiles = files;
                    console.log(oldFiles)
                    const newFiles = {
                        ...oldFiles,
                        [filePath]: { code: data.action.content }
                    }
                    setFiles(newFiles)
                    setSelectedFile(filePath);
                    onFilesUpdate(workspace.id, newFiles);
                }
            },
        },
    });

    useEffect(() => {
        setTemplate(workspace.template ?? null)
        setMessages(workspace.message);
        setFiles(workspace.fileData ?? null);
        setArtifactId(workspace.artifactId ?? "proxy-web-app");
        setLoading(false);
    }, [workspace]);

    useEffect(() => {
        if (!loading && messages?.length > 0) {
            if (messages[messages?.length - 1].role == "assistant") {
                const msg = messages[messages?.length - 1].content;
                if (msg.trim().length < 6) {
                    let nmsg = messages;
                    nmsg.pop();
                    setMessages(nmsg);
                }
            }
            const role = messages[messages?.length - 1].role;
            if (role == 'user') {
                init();
            }
        }
    }, [messages, loading]);

    const onGenerate = async (content: string) => {
        setMessages((prev: Message[]) => [...prev, {
            role: 'user',
            content: content
        }]);
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
        let ntemplate = template ?? null;
        if (template == null) {
            setAction("Fetching Template");
            const res = await axios.post(`/api/template`, {
                prompt: prompt
            });
            const { template: template2 } = res.data;
            ntemplate = template2
            setTemplate(template2);
            onTemplateUpdate(workspace.id, template2);
        }
        const uiPrompts = JSON.stringify(getBasePrompt(ntemplate!));
        const PromptFiles: FileSystem = JSON.parse(uiPrompts);
        setAction("");
        if (!files)
            setFiles(PromptFiles);
        const newFiles = files ?? PromptFiles;
        const extraFiles = Object.entries(newFiles).map(([filepath, { code }]) => `  -  ${filepath}`);
        const prompts = [BASE_PROMPT, `You are required to write the code in ${template}. Consider the contents of ALL files in the project.\n\n${JSON.stringify(files)}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  ${extraFiles}`]
        const llmPrompt: Message[] = prompts.map(content => ({
            role: "user",
            content: content
        }))
        getAiResponse(llmPrompt);
    }

    const getAiResponse = async (llmPrompt: Message[]) => {
        setLoading(true);

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [...llmPrompt, ...messages].map(msg => ({
                    role: msg.role,
                    parts: [{ text: msg.content }]
                }))
            }),
            // signal: controller.signal
        });

        let newMessages = messages;
        newMessages.push({ role: 'assistant', content: "" });

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
            let cleanedText = parsedText.replace(/```[\w]*\n?|```/g, '');
            if (cleanedText.startsWith('html'))
                cleanedText = cleanedText.slice(5)
            if (cleanedText.length > 0 && cleanedText.slice(-1) === " ") {
                msg += cleanedText.trim() + " ";
            } else {
                msg += cleanedText.trim();
            }
            newMessages.pop();
            newMessages.push({ role: 'assistant', content: msg });
            setMessages(newMessages);
            onMessagesUpdate(workspace.id, newMessages);
        }
        setNewAiMessage("");
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
                            {messages.length > 0 && messages?.map((message: any, index: number) => (
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
"use client";

import { NextBasePrompt, NodeBasePrompt, ReactBasePrompt } from '@/data/BasePrompts';
import Lookup from '@/data/Lookup';
import { BASE_PROMPT } from '@/data/Prompt';
import { onFilesUpdate, onIdAndTitleUpdate, onMessagesUpdate } from '@/lib/queries';
import { ArrowRight, Download, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from "react-markdown";
import ButtonLoader from '../button-loader';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { StreamingMessageParser } from '@/lib/stream-parser';
import { allowedHTMLElements, rehypePlugins, remarkPlugins } from '@/lib/utils';
import styles from './_components/Markdown.module.scss';
import JSZip from 'jszip';
import SandpackViewer from '../sandpack-viewer';
import { v4 as uuidv4 } from 'uuid'
import { useRouter } from 'next/navigation';
import { Message, useFileMessage } from '@/context/FileMessageContext';

const WorkspacePage = ({ workspace, sessionId }: { workspace: any, sessionId: string }) => {
    const [artifactId, setArtifactId] = useState<string>(workspace.artifactId ?? "proxy-web-app")
    const [newAiMessage, setNewAiMessage] = useState<string>("");
    const [action, setAction] = useState<string>("");
    const [isFilesUpdated, setIsFilesUpdated] = useState<Boolean>(false);
    const [userInput, setUserInput] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const router = useRouter();

    const { messages, setMessages, files, setFiles, handleFileSelect } = useFileMessage();

    useEffect(() => {
        setMessages(workspace.Messages.sort((a: any, b: any) => a.createdAt - b.createdAt).map((msg: any) => ({
            role: msg.role,
            content: msg.content
        })) ?? []);
        setFiles(workspace.fileData);
        setArtifactId(workspace.artifactId ?? "proxy-web-app");
        setLoading(false);
    }, [workspace]);


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
                    const filePath = data.action.filePath;
                    let newFileContent = data.action.content;
                    if (newFileContent.endsWith("```")) {
                        newFileContent = newFileContent.slice(0, -3);
                    }
                    newFileContent = newFileContent.replace(/^```[a-zA-Z0-9]+\n?/, '');

                    setFiles((prevFiles) => {
                        const updatedFiles = { ...prevFiles, [filePath]: { code: newFileContent } };

                        return updatedFiles;
                    });
                    handleFileSelect(filePath);
                    setIsFilesUpdated(true);
                }
            }

        },
    });

    useEffect(() => {
        if (isFilesUpdated) {
            onFilesUpdate(workspace.id, files)
            setIsFilesUpdated(false);
        }
    }, [isFilesUpdated])

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
        setUserInput('');
        setLoading(true);
        await onMessagesUpdate(null, 'user', content, workspace.id);
        setMessages((prev: Message[]) => [...prev, {
            role: 'user',
            content: content
        }]);
        setLoading(false);
    }

    const init = async () => {
        setLoading(true);

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                workspaceId: workspace.id
            }),
            // signal: controller.signal
        });
        messageParser.reset();

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
        const messageId = uuidv4();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            buffer += text;
            const parsedText = messageParser.parse(messageId, buffer);
            let cleanedText = parsedText.replace(/```[\w]*\n?|```/g, '');
            if (cleanedText.startsWith('html'))
                cleanedText = cleanedText.slice(5)
            if (cleanedText.length > 0 && cleanedText.slice(-1) === " ") {
                msg += cleanedText.trim() + " ";
            } else {
                msg += cleanedText.trim();
            }
            onMessagesUpdate(messageId, 'assistant', msg, workspace.id);
            newMessages.pop();
            newMessages.push({ role: 'assistant', content: msg });
            setMessages(newMessages);
        }
        // router.refresh();
        setNewAiMessage("");
        setLoading(false);
    }

    const handleAbort = () => {
        abortControllerRef.current?.abort();
        setLoading(false);
    };

    return (
        <div className='w-full text-sm' suppressHydrationWarning>
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
                    <div className='flex flex-col h-full w-auto'>
                        <Tabs defaultValue="code" className="h-full flex flex-col">
                            <div className="flex border-b">
                                <TabsList className="my-1 mx-4">
                                    <TabsTrigger value="code" className="text-sm">Code</TabsTrigger>
                                    <TabsTrigger value="preview" className="text-sm">Preview</TabsTrigger>
                                </TabsList>

                                <button className='ml-auto mr-4' onClick={handleDownload}><Download className='h-4 w-4 text-primary' /></button>
                            </div>

                            {files != null && <SandpackViewer files={files} />}
                        </Tabs>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}

export default WorkspacePage;
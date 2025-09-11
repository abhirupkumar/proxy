"use client";

import { GithubConnectButton } from '@/components/custom/github-connect-button';
import { GlowingEffect } from '@/components/ui/glowing-effect';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Message, useWorkspaceData } from '@/context/WorkspaceDataContext';
import Lookup from '@/data/Lookup';
import { forkWorkspace, onFilesUpdate, onIdAndTitleUpdate, onMessagesUpdate } from '@/lib/queries';
import { StreamingMessageParser } from '@/lib/stream-parser';
import { allowedHTMLElements, rehypePlugins, remarkPlugins, stripIndents } from '@/lib/utils';
import JSZip from 'jszip';
import { ArrowRight, ChevronDown, ChevronRight, ChevronsLeft, ChevronsRight, Download, GitFork, Globe, Loader2, MessageCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from 'uuid';
import ButtonLoader from '../button-loader';
import SandpackViewer from '../sandpack-viewer';
import UserInput from '../user-input';
import { scrapeFromUrl } from '@/lib/actions';
import PrivateButton from '../private-button';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { DialogTitle } from '@radix-ui/react-dialog';
import { getIndexedDB } from '@/lib/indexed-db';
import VercelDeployButton from '../vercel-deploy-button';
import { SupabaseButton } from '../supabase-button';
import { useSupabase } from '@/context/SupabaseContext';
import { env } from 'env';
import { UIMessage, useChat } from "@ai-sdk/react"
import { DataUIPart, DefaultChatTransport, lastAssistantMessageIsCompleteWithToolCalls, ModelMessage } from 'ai';
import { convertToUIMessages } from '@/lib/actions/ai';
import { useIsMobile } from '@/hooks/use-mobile';
import WorkspaceDropdown from '../workspace-dropdown';
import { Markdown } from '@/components/ui/markdown';

type ImageItem = {
    id: string;
    file?: File;
    url?: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
};

let saveTimeout: NodeJS.Timeout | null = null;

type initialSupabaseDataProp = {
    supabaseToken: string | null;
}

const WorkspacePage = ({ dbUser, workspace, initialSupabaseData }: { dbUser: any, workspace: any, initialSupabaseData: initialSupabaseDataProp }) => {
    const { userId, isLoaded, isSignedIn } = useAuth();
    const [isChangesPushed, setIsChangesPushed] = useState<boolean>(true)
    const [newAiMessage, setNewAiMessage] = useState<string>("");
    const [action, setAction] = useState<string>("");
    const [isFilesUpdated, setIsFilesUpdated] = useState<Boolean>(false);
    const [userInput, setUserInput] = useState<string | null | undefined>('');
    const [scrapeUrl, setScrapeUrl] = useState<string>('');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [initialMessages, setInitialMessages] = useState<UIMessage[]>([])
    const [latestUrl, setLatestUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [iconLoading, setIconLoading] = useState(false);
    const isMobile = useIsMobile();
    const { setTemplate, messages, setMessages, files, setFiles, handleFileSelect, setIsPrivate, workspaceData, setWorkspaceData } = useWorkspaceData();
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast()
    const [panels, setPanels] = useState<{ chat: boolean, code: boolean }>({ chat: true, code: true });

    const controller = new AbortController();

    const { setConnection, setIsConnecting } = useSupabase();

    // const {
    //     messages: chatMessages, sendMessage, regenerate, stop, status
    // } = useChat<UIMessage>({
    //     transport: new DefaultChatTransport({
    //         api: '/api/chat',
    //         prepareSendMessagesRequest: () => {
    //             return {
    //                 body: {
    //                     workspaceId: workspace.id,
    //                 },
    //             };
    //         }
    //     }),
    //     sendAutomaticallyWhen: () => false,
    //     onError: (error: Error) => {
    //         console.log("Error: ", error);
    //         stop();
    //         setLoading(false);
    //     },
    //     onData: (data: any) => {
    //         console.log("onData")
    //     },
    //     onFinish: (message: any) => {
    //         console.log("done")
    //     },
    //     messages: initialMessages
    // });

    useEffect(() => {
        if (isMobile) {
            setPanels({ chat: true, code: false });
        }
    }, [isMobile]);

    useEffect(() => {
        setConnection({
            token: initialSupabaseData?.supabaseToken || null,
            isConnected: !!(initialSupabaseData?.supabaseToken)
        })
        setIsConnecting(false)
    }, [initialSupabaseData]);

    useEffect(() => {
        fillInitialMessages();
        if (scrollContainerRef.current) {
            const scrollContainer = scrollContainerRef.current;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        setWorkspaceData(workspace);
        setTemplate(workspace.template);
        const sortedMessages = workspace.Messages.sort((a: any, b: any) => a.createdAt - b.createdAt)
        setMessages(sortedMessages.map((msg: Message) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            url: msg.url,
            photoUrls: msg.photoUrls ?? [],
        })) ?? []);
        if (sortedMessages.length > 0 && sortedMessages[sortedMessages.length - 1].url && sortedMessages[sortedMessages.length - 1].url != "") {
            setLatestUrl(sortedMessages[sortedMessages.length - 1].url);
        }
        setIsPrivate(workspace.isPrivate);
        setIsChangesPushed(workspace.isChangesPushed)
        setFiles(workspace.fileData);
        setLoading(false);
    }, [workspace]);

    const fillInitialMessages = async () => {
        const modelMessage = await convertToUIMessages(workspace);
        setInitialMessages(modelMessage)
    }

    const handleDownload = async () => {
        const zip = new JSZip();
        const projectFolder = zip.folder(workspaceData.artifactId);
        Object.entries(files!).forEach(([filename, { code }]) => {
            projectFolder?.file(filename, code);
        });
        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = workspaceData.artifactId + ".zip";
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
                if (workspaceData.artifactId == "proxy-web-app") {
                    onIdAndTitleUpdate(workspace.id, data.title, data.id);
                    setWorkspaceData({
                        ...workspaceData,
                        title: data.title,
                        artifactId: data.id
                    })
                }
                setAction("");
            },
            onActionOpen: (data) => {

            },
            onActionStream: (data) => {
                if (data.action.type == "file") {
                    const filePath = data.action.filePath
                    let newFileContent = data.action.content;
                    setAction(`Editing ${filePath}`)
                    setFiles((prevFiles) => {
                        const updatedFiles = { ...prevFiles, [filePath]: { code: newFileContent } };
                        return updatedFiles;
                    });
                }
                if (data.action.type == "shell") {
                    setAction(`Running shell command: ${data.action.content}`);
                }
                if (data.action.type == "start") {
                    setAction(`Starting development server`);
                }
                if (data.action.type == "rename") {
                    setAction(`Renaming file from ${data.action.filePath} to ${data.action.newFilePath}`);
                }
                if (data.action.type == "delete") {
                    setAction(`Deleting file ${data.action.filePath}`);
                }
                if (data.action.type == "supabase") {
                    setAction(`Running Supabase action: ${data.action.operation}`);
                }
            },
            onActionClose: (data) => {
                if (data.action.type == "file") {
                    const filePath = data.action.filePath;
                    let newFileContent = data.action.content;
                    setFiles((prevFiles) => {
                        const updatedFiles = { ...prevFiles, [filePath]: { code: newFileContent } };

                        return updatedFiles;
                    });
                    handleFileSelect(filePath);
                    setIsFilesUpdated(true);
                    setAction("");
                }
                if (data.action.type == "shell") {
                    setAction(`Running shell command: ${data.action.content}`);
                }
                if (data.action.type == "start") {
                    setAction(`Starting development server`);
                }
                if (data.action.type == "rename") {
                    const oldFilePath = data.action.filePath;
                    const newFilePath = data.action.newFilePath;
                    setFiles((prevFiles) => {
                        const updatedFiles = { ...prevFiles };
                        if (updatedFiles[oldFilePath]) {
                            updatedFiles[newFilePath] = updatedFiles[oldFilePath];
                            delete updatedFiles[oldFilePath];
                        }
                        return updatedFiles;
                    });
                    setIsFilesUpdated(true);
                    setAction(`Renamed file from ${data.action.filePath} to ${data.action.newFilePath}`);
                }
                if (data.action.type == "delete") {
                    const filePath = data.action.filePath;
                    setFiles((prevFiles) => {
                        const updatedFiles = { ...prevFiles };
                        delete updatedFiles[filePath];
                        return updatedFiles;
                    });
                    setIsFilesUpdated(true);
                    setAction(`Deleted file: ${data.action.filePath}`);
                }
                if (data.action.type == "supabase") {
                    if (data.action.operation == "migration") {
                        const filePath = data.action.filePath as string;
                        setFiles((prevFiles) => {
                            const updatedFiles = { ...prevFiles, [filePath]: { code: data.action.content } };
                            return updatedFiles;
                        });
                        setIsFilesUpdated(true);
                        setAction(`Created Supabase Migration File: ${data.action.operation}`);
                    }
                    if (data.action.operation == "query") {
                        setAction(`Ran Supabase action: ${data.action.operation}`);
                    }
                }
            }

        },
    });

    useEffect(() => {
        if (isFilesUpdated) {
            setIsChangesPushed(false);
            onFilesUpdate(workspace.id, files)
            setIsFilesUpdated(false);
        }
    }, [isFilesUpdated]);

    useEffect(() => {
        if (!loading && messages?.length > 0) {
            if (messages[messages?.length - 1].role == "model") {
                const msg = messages[messages?.length - 1].content;
                if (msg.trim().length < 6) {
                    let nmsg = messages;
                    nmsg.pop();
                    setMessages(nmsg);
                }
            }
            const role = messages[messages?.length - 1].role;
            if (role == 'user') {
                // sendMessage({
                //     text: messages[messages?.length - 1].content
                // })
                // setLoading(true);
                init();
            }
        }
    }, [messages, loading]);

    const onGenerate = async (content: string) => {
        setUserInput('');
        setLoading(true);
        setLatestUrl(scrapeUrl);
        const imageUrls = images.map((image) => image.url).filter((url) => url !== undefined) as string[];
        await onMessagesUpdate(null, 'user', content, workspace.id, scrapeUrl, imageUrls);
        // if (imageUrls && imageUrls.length > 0) {
        //     sendMessage({
        //         text: content,
        //         files: imageUrls.map((image) => ({
        //             type: 'file',
        //             mediaType: 'image/jpeg',
        //             url: image,
        //         }))
        //     })
        // }
        // else
        //     sendMessage({
        //         text: content,
        // })
        setMessages((prev: Message[]) => [...prev, {
            id: uuidv4(),
            role: 'user',
            content: content
        }]);
        setImages([]);
        setScrapeUrl("");
        // setLoading(false);
    }

    function debouncedSaveToIndexedDB(messageId: string, workspaceId: string, content: string) {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            const db = await getIndexedDB();
            await db.put('messages', {
                id: messageId,
                role: 'model',
                content: content,
                workspaceId,
                createdAt: Date.now(),
            });
        }, 3000);
    }

    function debouncedSaveToServer(messageId: string, workspaceId: string, content: string) {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(async () => {
            try {
                await onMessagesUpdate(messageId, 'model', content, workspace.id, "");
            } catch (err) {
                console.error('Failed saving to server:', err);
            }
        }, 3000);
    }

    const init = async () => {
        setLoading(true);
        let msg = "";

        // if (latestUrl != "") {
        //     setAction("Scraping the Url");
        //     const scrapedData = await scrapeFromUrl(latestUrl, messages[messages.length - 1].content, workspace.id);
        //     if (scrapedData.error) {
        //         msg += 'Couldn\'t scrape the provided url.\n';
        //     }
        //     else {
        //         setAction("Data scraped successfully");
        //         msg += `Url (${latestUrl}) scraped successfully.\n`;
        //     }
        //     setLatestUrl("");
        //     setAction("");
        // }

        let newMessages = messages;
        newMessages.push({ id: uuidv4(), role: 'model', content: msg });

        setMessages(newMessages);

        const messageId = uuidv4();
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                workspaceId: workspace.id,
                newMessageId: messageId
            }),
            signal: controller.signal
        });
        messageParser.reset();

        if (!response.body) {
            console.error("No response body received.");
            return;
        }

        const indexedDB = await getIndexedDB();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            try {
                const text = decoder.decode(value, { stream: true });
                console.log(text);
                buffer += text;
                const parsedText = messageParser.parse(messageId, buffer);
                msg += stripIndents(parsedText.trim());
                newMessages.pop();
                newMessages.push({ id: messageId, role: 'assistant', content: msg });
                setMessages(newMessages);
                debouncedSaveToIndexedDB(messageId, workspace.id, msg);
                debouncedSaveToServer(messageId, workspace.id, msg);
            }
            catch (error) {
                console.error("Error parsing message: ", error);
            }
        }
        await indexedDB.put('messages', {
            id: messageId,
            role: 'model',
            content: msg,
            workspaceId: workspace.id,
            createdAt: Date.now(),
        });
        await onMessagesUpdate(messageId, 'model', msg, workspace.id, "");
        await indexedDB.delete('messages', messageId);
        setNewAiMessage("");
        setLoading(false);
    }

    const handleFork = async () => {
        setIconLoading(true);
        const fork = await forkWorkspace(workspace.id);
        if (fork)
            router.push(env.NEXT_PUBLIC_HOST! + '/workspace/' + fork.id);
        else toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
        })
        setIconLoading(false);
    }

    const truncate = (str: string) => {
        if (str.length > 30) {
            return str.substring(0, 30) + "...";
        }
        return str;
    }

    const changePanel = (panel: string) => {
        if (panels.chat && panels.code) {
            if (panel == "chat") {
                setPanels({ chat: false, code: true });
            } else if (panel == "code") {
                setPanels({ chat: true, code: false });
            }
        }
        else {
            if (isMobile) setPanels({ chat: !panels.chat, code: !panels.code });
            else setPanels({ chat: true, code: true });
        }
    }

    return (
        <div className='w-full text-sm' suppressHydrationWarning>
            <ResizablePanelGroup
                direction="horizontal"
                className="max-w-full border-t md:min-w-[450px]"
            >
                {panels.chat && <ResizablePanel defaultSize={37} minSize={25}>
                    <div className='relative h-[100vh] flex flex-col p-2 items-center'>
                        <div className='w-full mr-auto ml-1.5 mb-2 flex justify-between items-center'>
                            <WorkspaceDropdown />
                            <span className='flex' suppressHydrationWarning>
                                <Link title='New Chat' href='/' className={buttonVariants({ size: 'icon', variant: 'link' })}><MessageCircle /></Link>
                                {iconLoading ? <Loader2 className='h-4 w-9 animate-spin' /> : <Button title='Fork' onClick={handleFork} size='icon' variant={'link'}><GitFork /></Button>}
                                <Button title='slide' onClick={() => changePanel("chat")} size='icon' variant={'link'} className=''><ChevronsLeft /></Button>
                            </span>
                        </div>
                        <div ref={scrollContainerRef} className='flex-1 overflow-y-scroll no-scrollbar max-w-[720px]'>
                            {messages.length > 0 && messages?.map((message: Message, index: number) => (
                                <div key={index} className='w-full flex flex-col'>
                                    {message.url && message.url != "" && <Link href={message.url} target="_blank" rel='noopener noreferrer' className="text-sm text-right text-blue-400">@{message.url}</Link>}
                                    {message.photoUrls && message.photoUrls.length > 0 &&
                                        <div className='flex gap-1 items-start rounded-lg ml-auto mb-1'>
                                            {message.photoUrls.map((photoUrl: string, index: number) => (
                                                <Dialog key={index}>
                                                    <DialogTrigger asChild>
                                                        <Image className='rounded-lg max-h-24 max-w-24 w-full h-full cursor-pointer object-contain ' src={photoUrl} alt="image" height={100} width={100} />
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-[80vw] max-h-[80vh] h-fit w-full">
                                                        <DialogTitle></DialogTitle>
                                                        <img className='rounded-lg w-full h-full object-contain' src={photoUrl} alt="image" height={1000} width={1000} />
                                                    </DialogContent>
                                                </Dialog>
                                            ))}
                                        </div>}
                                    {message.role != 'user' && (resolvedTheme == 'dark' ? <Image className='ml-2' src="/logo-dark.svg" alt="logo" height={80} width={80} /> : <Image className='ml-2' src="/logo-white.svg" alt="logo" height={80} width={80} />)}
                                    <div className={`flex gap-2 items-start rounded-lg p-2 mb-2 leading-7 ${message.role == "user" ? "border justify-end w-fit ml-auto bg-secondary" : ""}`}>
                                        {loading == true && message?.role == 'model' && <Loader2 className='h-4 w-4 animate-spin' />}
                                        <div className="">
                                            <Markdown className="prose prose-sm dark:prose-invert max-w-none">
                                                {message.content}
                                            </Markdown>
                                        </div>
                                    </div>
                                </div>))}
                            {action != "" && <button className='flex items-center gap-2 rounded-full p-3 mb-2 bg-secondary'>
                                {action}<Loader2 className='h-4 w-4 animate-spin' />
                            </button>}
                            {loading && <div className='w-full flex items-center justify-center'>
                                <div className='ai-loader'></div>
                            </div>}
                        </div>
                        <UserInput stop={stop} disabled={!isLoaded ? true : !isSignedIn ? true : dbUser.clerkId != userId} onGenerate={onGenerate} loading={loading} setLoading={setLoading} userInput={userInput} setUserInput={setUserInput} scrapeUrl={scrapeUrl} setScrapeUrl={setScrapeUrl} images={images} setImages={setImages} />
                    </div>
                </ResizablePanel>}
                {panels.code && panels.chat && <ResizableHandle withHandle />}
                {isLoaded && isSignedIn && panels.code && <>
                    <ResizablePanel defaultSize={63} minSize={25}>
                        <div className='flex flex-col h-full w-auto'>
                            <Tabs defaultValue="code" className="h-full flex flex-col">
                                <div className="flex border-b items-center">
                                    <Button title='slide' size='icon' variant={'link'} className='' onClick={() => changePanel("code")}><ChevronsRight /></Button>
                                    <TabsList className="my-2 mx-4 rounded-full">
                                        <TabsTrigger value="code" className="text-sm rounded-full">Code</TabsTrigger>
                                        <TabsTrigger value="preview" className="text-sm rounded-full">Preview</TabsTrigger>
                                    </TabsList>
                                    <div className='flex ml-auto' suppressHydrationWarning>
                                        {userId == dbUser.clerkId && <PrivateButton workspaceId={workspace.id} />}
                                        {userId == dbUser.clerkId && <SupabaseButton workspaceId={workspace.id} />}
                                        {userId == dbUser.clerkId && <VercelDeployButton workspaceId={workspace.id} />}
                                        {userId == dbUser.clerkId && (!loading ? <GithubConnectButton
                                            workspaceId={workspace.id}
                                            isConnected={!!dbUser.githubToken && dbUser.githubToken != ""}
                                            repoUrl={workspace.githubRepo?.repoUrl ?? ""}
                                            hasUnpushedChanges={!isChangesPushed}
                                            workspaceTitle={workspaceData.title ?? ""}
                                        /> : <Skeleton className='w-6 h-6 rounded-full' />)}

                                        <Button title='Export' variant="link" size='icon' className='mr-4' onClick={handleDownload}>
                                            <Download className='h-4 w-4 text-primary' />
                                        </Button>
                                    </div>
                                </div>

                                {files != null && <SandpackViewer />}
                            </Tabs>
                        </div>
                    </ResizablePanel>
                </>}
            </ResizablePanelGroup>
        </div>
    );
}

export default WorkspacePage;

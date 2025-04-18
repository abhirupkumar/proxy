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
import { allowedHTMLElements, rehypePlugins, remarkPlugins } from '@/lib/utils';
import JSZip from 'jszip';
import { ArrowRight, Download, GitFork, Loader2, MessageCircle } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from "react-markdown";
import { v4 as uuidv4 } from 'uuid';
import ButtonLoader from '../button-loader';
import SandpackViewer from '../sandpack-viewer';
import styles from './_components/Markdown.module.scss';
import UserInput from '../user-input';
import { scrapeFromUrl } from '@/lib/actions';
import PrivateButton from '../private-button';
import { Button, buttonVariants } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';

const WorkspacePage = ({ dbUser, workspace }: { dbUser: any, workspace: any }) => {
    const { userId, isLoaded, isSignedIn } = useAuth();
    const [isChangesPushed, setIsChangesPushed] = useState<boolean>(true)
    const [title, setTitle] = useState<string>("")
    const [artifactId, setArtifactId] = useState<string>(workspace.artifactId ?? "proxy-web-app")
    const [newAiMessage, setNewAiMessage] = useState<string>("");
    const [action, setAction] = useState<string>("");
    const [isFilesUpdated, setIsFilesUpdated] = useState<Boolean>(false);
    const [userInput, setUserInput] = useState<string | null | undefined>('');
    const [scrapeUrl, setScrapeUrl] = useState<string>('');
    const [latestUrl, setLatestUrl] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const abortControllerRef = useRef<AbortController | null>(null);
    const router = useRouter();
    const { resolvedTheme } = useTheme();
    const [iconLoading, setIconLoading] = useState(false);

    const { messages, setMessages, files, setFiles, handleFileSelect, setIsPrivate } = useWorkspaceData();
    const scrollContainerRef = useRef<HTMLDivElement | null>(null);
    const { toast } = useToast()

    useEffect(() => {
        if (scrollContainerRef.current) {
            const scrollContainer = scrollContainerRef.current;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        const sortedMessages = workspace.Messages.sort((a: any, b: any) => a.createdAt - b.createdAt)
        setMessages(sortedMessages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            url: msg.url,
        })) ?? []);
        if (sortedMessages.length > 0 && sortedMessages[sortedMessages.length - 1].url && sortedMessages[sortedMessages.length - 1].url != "") {
            setLatestUrl(sortedMessages[sortedMessages.length - 1].url);
        }
        setIsPrivate(workspace.isPrivate);
        setIsChangesPushed(workspace.isChangesPushed)
        setFiles(workspace.fileData);
        setTitle(workspace.title);
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
                    setTitle(data.title)
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
            setIsChangesPushed(false);
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
        setLatestUrl(scrapeUrl);
        await onMessagesUpdate(null, 'user', content, workspace.id, scrapeUrl);
        setMessages((prev: Message[]) => [...prev, {
            role: 'user',
            content: content
        }]);
        setScrapeUrl("");
        setLoading(false);
    }

    const init = async () => {
        setLoading(true);
        let msg = "";

        if (latestUrl != "") {
            setAction("Scraping the Url");
            const scrapedData = await scrapeFromUrl(latestUrl, messages[messages.length - 1].content, workspace.id);
            if (scrapedData.error) {
                msg += 'Couldn\'t scrape the provided url.\n';
            }
            else {
                setAction("Data scraped successfully");
                msg += `Url (${latestUrl}) scraped successfully.\n`;
            }
            setLatestUrl("");
            setAction("");
        }

        let newMessages = messages;
        newMessages.push({ role: 'assistant', content: msg });

        setMessages(newMessages);

        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                workspaceId: workspace.id
            }),
            // signal: controller.signal
        });
        messageParser.reset();

        if (!response.body) {
            console.error("No response body received.");
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
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
            onMessagesUpdate(messageId, 'assistant', msg, workspace.id, "");
            newMessages.pop();
            newMessages.push({ role: 'assistant', content: msg });
            setMessages(newMessages);
        }
        // router.refresh();
        setNewAiMessage("");
        setLoading(false);
    }

    const handleFork = async () => {
        setIconLoading(true);
        const fork = await forkWorkspace(workspace.id);
        if (fork)
            router.push(process.env.NEXT_PUBLIC_APP_URL! + '/workspace/' + fork.id);
        else toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem with your request.",
        })
        setIconLoading(false);
    }

    const handleAbort = () => {
        abortControllerRef.current?.abort();
        setLoading(false);
    };

    const truncate = (str: string) => {
        if (str.length > 30) {
            return str.substring(0, 30) + "...";
        }
        return str;
    }

    return (
        <div className='w-full text-sm' suppressHydrationWarning>
            <ResizablePanelGroup
                direction="horizontal"
                className="max-w-full border-t md:min-w-[450px]"
            >
                <ResizablePanel defaultSize={37} minSize={25}>
                    <div className='relative h-[100vh] flex flex-col p-3 items-center'>
                        <div className='w-full mr-auto ml-3 mb-2 flex justify-between items-center'>
                            <h2>{title != "" ? title : "New Chat"}</h2>
                            <span className='flex' suppressHydrationWarning>
                                <Link title='New Chat' href='/' className={buttonVariants({ size: 'icon', variant: 'link' })}><MessageCircle /></Link>
                                {iconLoading ? <Loader2 className='h-4 w-9 animate-spin' /> : <Button title='Fork' onClick={handleFork} size='icon' variant={'link'}><GitFork /></Button>}
                            </span>
                        </div>
                        <div ref={scrollContainerRef} className='flex-1 overflow-y-scroll no-scrollbar max-w-[720px]'>
                            {messages.length > 0 && messages?.map((message: any, index: number) => (
                                <div key={index} className='w-full flex flex-col'>
                                    {message.url && message.url != "" && <Link href={message.url} target="_blank" rel='noopener noreferrer' className="text-sm text-right text-blue-400">@{message.url}</Link>}
                                    {message.role != 'user' && (resolvedTheme == 'dark' ? <Image className='ml-2' src="/logo-dark.svg" alt="logo" height={80} width={80} /> : <Image className='ml-2' src="/logo-white.svg" alt="logo" height={80} width={80} />)}
                                    <div className={`flex gap-2 items-start rounded-full p-2 mb-2 leading-7 ${message.role == "user" ? "border justify-end w-fit ml-auto" : ""}`}>
                                        {loading == true && message?.role == 'ai' && <Loader2 className='h-4 w-4 animate-spin' />}
                                        <div className="whitespace-pre-wrap">
                                            <ReactMarkdown
                                                allowedElements={allowedHTMLElements}
                                                className={styles.MarkdownContent}
                                            >{message.content}</ReactMarkdown>
                                        </div>
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
                        <UserInput disabled={!isLoaded ? true : !isSignedIn ? true : dbUser.clerkId != userId} onGenerate={onGenerate} loading={loading} setLoading={setLoading} userInput={userInput} setUserInput={setUserInput} scrapeUrl={scrapeUrl} setScrapeUrl={setScrapeUrl} />
                    </div>
                </ResizablePanel>
                {isLoaded && isSignedIn && <>
                    <ResizableHandle />
                    <ResizablePanel defaultSize={63} minSize={25}>
                        <div className='flex flex-col h-full w-auto'>
                            <Tabs defaultValue="code" className="h-full flex flex-col">
                                <div className="flex border-b items-center justify-between">
                                    <TabsList className="my-2 mx-4 rounded-full">
                                        <TabsTrigger value="code" className="text-sm rounded-full">Code</TabsTrigger>
                                        <TabsTrigger value="preview" className="text-sm rounded-full">Preview</TabsTrigger>
                                    </TabsList>
                                    <div className='flex' suppressHydrationWarning>
                                        {userId == dbUser.clerkId && <PrivateButton workspaceId={workspace.id} />}
                                        {userId == dbUser.clerkId && (!loading ? <GithubConnectButton
                                            workspaceId={workspace.id}
                                            isConnected={!!dbUser.githubToken && dbUser.githubToken != ""}
                                            repoUrl={workspace.githubRepo?.repoUrl ?? ""}
                                            hasUnpushedChanges={!isChangesPushed}
                                            workspaceTitle={title}
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
"use client";

import React, { useEffect, useImperativeHandle, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { loadSandpackClient, SandboxSetup, SandpackMessage } from "@codesandbox/sandpack-client";
import { Nodebox } from "@codesandbox/nodebox";
import { SandpackLayout, SandpackPreview, SandpackProvider, useSandpackClient, useSandpackNavigation, useSandpackShell } from "@codesandbox/sandpack-react";
import { useTheme } from "next-themes";

interface PreviewFrameProps {
    // files: { [key: string]: { code: string } } | null;
    files: any;
}

export function Preview({ files }: PreviewFrameProps) {
    const [url, setUrl] = useState<string | null>(null);
    const sandpackRef = useRef<HTMLIFrameElement | null>(null);
    const [path, setPath] = useState("/");
    const [newPath, setNewPath] = useState("/");
    const [state, setState] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const { theme } = useTheme();

    const iframeRef = useRef<HTMLIFrameElement | null>(null);
    const { sandpack, iframe, getClient, clientId, listen } = useSandpackClient();
    const { status, runSandpack } = sandpack;
    const { refresh } = useSandpackNavigation(clientId);
    const { restart } = useSandpackShell(clientId);

    useEffect(() => {
        if (iframe.current?.src == "") {
            runSandpack();
        }
    }, [iframe.current?.src]);

    useEffect(() => {
        const unsubscribe = listen((message: any) => {
            if (message.type == 'start') {
                setState("Starting Development Server...")
            }
            if (message.type == 'dependencies') {
                setState("Installing Dependencies...")
            }
            if (message.type == 'status' && message.status == 'transpiling') {
                setState("Transpiling...")
            }
            if (message.type == 'status' && message.status == 'evaluating') {
                setState("Evaluating...")
            }
            if (message.type == 'done') {
                setLoading(false);
                setState("")
            }
            if (message?.type == 'action') {
                setError(message.message);
            }
        });

        return unsubscribe;
    }, []);

    return (
        <div className="h-full text-gray-400 bg-background">
            <div className="h-full flex flex-col">
                <div className="border-b p-4 flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => refresh()}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Input
                        value={newPath}
                        onChange={(e) => setNewPath(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key == 'Enter') setPath(newPath);
                        }}
                        className="font-mono text-sm"
                    />
                </div>
                <div className="flex-1 w-full h-[100vh] bg-white">
                    <iframe
                        ref={iframe}
                        title="Custom Preview"
                        sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
                        className={`w-full opacity-100 h-[100vh] ${loading ? 'hidden' : ""}`}
                    />
                    {loading && (
                        <div className="h-[100vh] flex items-center justify-center bg-white/80 backdrop-blur-sm text-black">
                            <RefreshCw className="h-5 w-5 animate-spin" />
                            <span className="ml-2 text-lg italic">{state}</span>
                        </div>
                    )}
                </div>
            </div>
            {/* <SandpackProvider
                files={files}
                template="react-ts"
                options={{
                    externalResources: [
                        "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
                    ]
                }}
                className="min-h-full"
                theme={theme == 'dark' ? "dark" : undefined}
            >
                <SandpackLayout className="h-full">
                    <SandpackPreview
                        showOpenNewtab={true}
                        showNavigator={true}
                        showRefreshButton={true}
                        showRestartButton={true}
                        showOpenInCodeSandbox={false}
                        showSandpackErrorOverlay={true}
                        className='h-[100vh]' />
                </SandpackLayout>
            </SandpackProvider> */}
        </div>
    );
}
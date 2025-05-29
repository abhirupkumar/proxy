"use client";

import { TabsContent } from '@/components/ui/tabs';
import { FileSystem, useWorkspaceData } from '@/context/WorkspaceDataContext';
import { SandpackProvider } from '@codesandbox/sandpack-react';
import { useTheme } from 'next-themes';
import { CodeEditor } from '../code-editor';
import { FileExplorer } from '../file-explorer';
// import { Preview } from '../preview';
import { Terminal } from '../terminal';
import { useState } from 'react';
import { Preview } from '../preview/preview';

const SandpackViewer = () => {
    const { resolvedTheme } = useTheme();
    const [serverUrl, setServerUrl] = useState<string | null>(null);
    const { selectedFile, setSelectedFile, selectedFiles, setSelectedFiles, files, setFiles, template } = useWorkspaceData();
    const handleServerReady = (url: string) => {
        setServerUrl(url);
        // Auto-switch to preview when server is ready
        // setActiveTab("preview");
    };
    return (
        <SandpackProvider
            theme={resolvedTheme == 'dark' ? "dark" : undefined}
            options={{
                externalResources: [
                    "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
                ],
                activeFile: "/src/App.tsx",
                autorun: true,
                autoReload: true,
            }}
            template="react-ts"
            className='h-full flex-1 flex-grow !text-sm'
            files={files!}
            style={{
                height: "100%",
            }}
            suppressHydrationWarning={true}
        >
            {/* <SandpackLayout className='flex flex-col'> */}
            <div className='flex flex-col'>
                <TabsContent value="code" className="m-0 h-full w-full flex bg-background">
                    {files && <FileExplorer />}
                    {files && <CodeEditor />}
                </TabsContent>

                <TabsContent value="terminal" className="m-0 h-full">
                    <Terminal
                        fileData={files!}
                        onServerReady={handleServerReady}
                        template={template!}
                    />
                </TabsContent>

                <TabsContent value="preview" className="m-0 h-full">
                    {/* <Preview files={files} /> */}
                    <Preview
                        fileData={files!}
                        serverUrl={serverUrl || undefined}
                        template={template!}
                    />
                    {/* {<ErrorMessage />} */}
                </TabsContent>
            </div>
            {/* </SandpackLayout> */}
        </SandpackProvider>
    )
}

export default SandpackViewer;
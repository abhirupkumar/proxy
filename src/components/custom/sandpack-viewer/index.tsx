"use client";

import { TabsContent } from '@/components/ui/tabs';
import { FileSystem, useWorkspaceData } from '@/context/WorkspaceDataContext';
import { SandpackProvider } from '@codesandbox/sandpack-react';
import { useTheme } from 'next-themes';
import { CodeEditor } from '../code-editor';
import { FileExplorer } from '../file-explorer';
import { Preview } from '../preview';
import { useState } from 'react';

const SandpackViewer = () => {
    const { resolvedTheme } = useTheme();
    const { selectedFile, setSelectedFile, selectedFiles, setSelectedFiles, files, setFiles, template } = useWorkspaceData();

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

                <TabsContent value="preview" className="m-0 h-full">
                    <Preview files={files} />
                    {/* {<ErrorMessage />} */}
                </TabsContent>
            </div>
            {/* </SandpackLayout> */}
        </SandpackProvider>
    )
}

export default SandpackViewer;
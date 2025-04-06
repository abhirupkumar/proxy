"use client";

import { TabsContent } from '@/components/ui/tabs';
import { SandpackCodeEditor, SandpackFileExplorer, SandpackLayout, SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';
import { useTheme } from 'next-themes';
import React, { useState } from 'react'
import ErrorMessage from '../error-message';
import { amethyst } from '@codesandbox/sandpack-themes';
import { CodeEditor } from '../code-editor';
import { FileExplorer } from '../file-explorer';

interface FileSystem {
    [key: string]: { code: string }
}

const SandpackViewer = ({ files }: { files: FileSystem }) => {
    const { resolvedTheme } = useTheme();
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    return (
        <SandpackProvider
            theme={resolvedTheme == 'dark' ? "dark" : undefined}
            options={{
                externalResources: [
                    "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
                ],
                activeFile: "/src/App.tsx",
                autorun: true
            }}
            template="react-ts"
            className='h-full flex-1 flex-grow !text-sm'
            files={files}
            style={{
                height: "100%",
            }}
            suppressHydrationWarning={false}
        >
            <SandpackLayout className='flex flex-col'>
                <TabsContent value="code" className="m-0 h-full">
                    <div className="grid grid-cols-[220px_1fr] h-full bg-background">
                        {files && <FileExplorer selectedFile={selectedFile} setSelectedFile={setSelectedFile} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} fileSystem={files} />}
                        {files && <CodeEditor selectedFile={selectedFile} setSelectedFile={setSelectedFile} fileSystem={files} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />}
                        {/* <SandpackFileExplorer
                            className='overflow-y-scroll'
                            autoHiddenFiles={true}
                            initialCollapsedFolder={undefined} />
                        <SandpackCodeEditor
                            style={{
                                minHeight: '100%',
                                maxHeight: '100%',
                                overflow: 'scroll',
                            }}
                            showLineNumbers={true}
                            showTabs
                            showInlineErrors
                            wrapContent
                            closableTabs
                            readOnly
                            className='h-[calc(100vh-7rem)] !border-l !text-sm' /> */}

                    </div>
                </TabsContent>

                <TabsContent value="preview" className="m-0 h-full">
                    {/* <Preview files={files} /> */}
                    <SandpackPreview
                        showOpenNewtab={true}
                        showNavigator={true}
                        showRefreshButton={true}
                        showRestartButton={true}
                        showOpenInCodeSandbox={false}
                        showSandpackErrorOverlay={true}
                        className='h-[calc(100vh-7rem)]' />
                    {<ErrorMessage />}
                </TabsContent>

            </SandpackLayout>
        </SandpackProvider>
    )
}

export default SandpackViewer;
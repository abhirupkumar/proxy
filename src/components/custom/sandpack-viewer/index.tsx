"use client";

import { TabsContent } from '@/components/ui/tabs';
import { SandpackProvider } from '@codesandbox/sandpack-react';
import { useTheme } from 'next-themes';
import React, { useState } from 'react'
import { CodeEditor } from '../code-editor';
import { FileExplorer } from '../file-explorer';
import { Preview } from '../preview';
import { FileSystem, useFileMessage } from '@/context/FileMessageContext';

const SandpackViewer = ({ files }: { files: FileSystem }) => {
    const { resolvedTheme } = useTheme();
    const { selectedFile, setSelectedFile, selectedFiles, setSelectedFiles } = useFileMessage();
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
            files={files}
            style={{
                height: "100%",
            }}
            suppressHydrationWarning={false}
        >
            {/* <SandpackLayout className='flex flex-col'> */}
            <div className='flex flex-col'>
                <TabsContent value="code" className="m-0 h-full w-full flex bg-background">
                    {files && <FileExplorer selectedFile={selectedFile} setSelectedFile={setSelectedFile} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} fileSystem={files} />}
                    {files && <CodeEditor selectedFile={selectedFile} setSelectedFile={setSelectedFile} fileSystem={files} selectedFiles={selectedFiles} setSelectedFiles={setSelectedFiles} />}
                    {/* <ScrollArea>
                        <SandpackFileExplorer
                            className='overflow-y-scroll h-[calc(100vh-7rem)]'
                            autoHiddenFiles={true}
                            initialCollapsedFolder={undefined} />
                    </ScrollArea>
                    <SandpackCodeEditor
                        style={{
                            minHeight: '100%',
                            maxHeight: '100%',
                            overflow: 'scroll',
                        }}
                        showLineNumbers={true}
                        showTabs={true}
                        showInlineErrors={true}
                        wrapContent={true}
                        closableTabs={true}
                        readOnly={true}
                        showReadOnly={true}
                        className='h-[calc(100vh-7rem)] !border-l !text-sm' /> */}
                </TabsContent>

                <TabsContent value="preview" className="m-0 h-full">
                    <Preview files={files} />
                    {/* {files && <SandpackPreview
                        showOpenNewtab={true}
                        showNavigator={true}
                        showRefreshButton={true}
                        showRestartButton={true}
                        showOpenInCodeSandbox={false}
                        showSandpackErrorOverlay={true}
                        className='h-[calc(100vh-7rem)] opacity-100' />}
                    {<ErrorMessage />} */}
                </TabsContent>
            </div>
            {/* </SandpackLayout> */}
        </SandpackProvider>
    )
}

export default SandpackViewer;
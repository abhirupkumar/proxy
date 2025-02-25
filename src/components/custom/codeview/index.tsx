"use client";

import React, { useEffect, useState } from 'react'
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackFileExplorer,
    SandpackConsole,
} from "@codesandbox/sandpack-react";
import Lookup from '@/data/Lookup';
import axios from 'axios';
import { useMessages } from '@/context/MessagesContext';
import Prompt from '@/data/Prompt';

const CodeView = () => {

    const [activeTab, setActiveTab] = useState('code');
    const [files, setFiles] = useState<Record<string, { code: string }>>(Lookup.DEFAULT_FILE)
    const { messages, setMessages } = useMessages();

    useEffect(() => {
        if (messages?.length > 0) {
            const role = messages[messages?.length - 1].role;
            if (role == 'user')
                generateAiCode();
        }
    }, [messages])

    const generateAiCode = async () => {
        const result = await axios.post('/api/gen-ai-code', {
            prompt: messages,
            systemPrompt: Prompt.CODE_GEN_PROMPT
        })
        const response = result.data.data
        const mergedFiles = { ...Lookup.DEFAULT_FILE, ...response?.files }
        setFiles(mergedFiles);
        console.log(mergedFiles)
    }

    return (
        <div>
            <div className='bg-[#181818] w-full p-2 border'>
                <div className='flex items-center flex-wrap shrink-0 bg-black p-1 w-[140px] gap-3 justify-center rounded-full'>
                    <button onClick={() => setActiveTab('code')} className={`text-sm py-1 px-2 ${activeTab == 'code' && 'text-blue-500 bg-blue-500 bg-opacity-25 rounded-full'}`}>Code</button>
                    <button onClick={() => setActiveTab('preview')} className={`text-sm py-1 px-2 ${activeTab == 'preview' && 'text-blue-500 bg-blue-500 bg-opacity-25 rounded-full'}`}>Preview</button>
                </div>
            </div>
            <SandpackProvider
                files={files}
                template='vite-react'
                theme={'dark'}>
                <SandpackLayout>
                    {activeTab == 'code' ? <>
                        <SandpackFileExplorer style={{ height: '80vh' }} />
                        <SandpackCodeEditor
                            showTabs
                            showLineNumbers={false}
                            showInlineErrors
                            wrapContent
                            closableTabs
                            style={{ height: '80vh' }} />
                    </>
                        :
                        <>
                            <SandpackPreview style={{ height: '80vh' }} showNavigator={true} showRefreshButton={true} showSandpackErrorOverlay={true}
                                showOpenNewtab={true} />
                        </>}
                    {/* <SandpackConsole /> */}
                </SandpackLayout>
            </SandpackProvider>
        </div>
    )
}

export default CodeView;
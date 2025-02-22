"use client";

import React, { useState } from 'react'
import {
    SandpackProvider,
    SandpackLayout,
    SandpackCodeEditor,
    SandpackPreview,
    SandpackFileExplorer,
    SandpackConsole,
} from "@codesandbox/sandpack-react";
import Lookup from '@/data/Lookup';

const CodeView = () => {
    const [activeTab, setActiveTab] = useState('code');
    return (
        <div>
            <div className='bg-[#181818] w-full p-2 border'>
                <div className='flex items-center flex-wrap shrink-0 bg-black p-1 w-[140px] gap-3 justify-center rounded-full'>
                    <button onClick={() => setActiveTab('code')} className={`text-sm py-1 px-2 ${activeTab == 'code' && 'text-blue-500 bg-blue-500 bg-opacity-25 rounded-full'}`}>Code</button>
                    <button onClick={() => setActiveTab('preview')} className={`text-sm py-1 px-2 ${activeTab == 'preview' && 'text-blue-500 bg-blue-500 bg-opacity-25 rounded-full'}`}>Preview</button>
                </div>
            </div>
            <SandpackProvider template='react' theme={'dark'}>
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
                            <SandpackPreview style={{ height: '80vh' }} showNavigator={true} showRefreshButton={true} showSandpackErrorOverlay={true} showOpenInCodeSandbox={false} showOpenNewtab={true} />
                        </>}
                    {/* <SandpackConsole /> */}
                </SandpackLayout>
            </SandpackProvider>
        </div>
    )
}

export default CodeView;
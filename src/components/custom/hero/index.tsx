"use client";

import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Spotlight } from '@/components/ui/spotlight-new';
import Lookup from '@/data/Lookup';
import { createWorkspace } from '@/lib/queries';
import { ArrowRight, Link, SidebarIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ButtonLoader from '../button-loader';
import UserInput from '../user-input';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';
import { env } from 'env';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';

type ImageItem = {
    id: string;
    file?: File;
    url?: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
};

const Hero = ({ user }: { user: any }) => {
    const [userInput, setUserInput] = useState<string | null>();
    const [scrapeUrl, setScrapeUrl] = useState<string>('');
    const [images, setImages] = useState<ImageItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const { template } = useWorkspaceData();
    const { toggleSidebar, state } = useSidebar();
    const isCollapsed = state === 'collapsed';

    const onGenerate = async (input: string) => {
        setUserInput(input);
        if (!user) {
            router.push('/sign-in');
            return;
        }
        setLoading(true);
        const messages = { role: "user", content: input };
        if (messages) {
            const imageUrls = images.map((image) => image.url).filter((url) => url !== undefined) as string[];
            try {
                const workspace = await createWorkspace(messages, user, scrapeUrl, imageUrls, template);
                if (workspace) {
                    router.push(`/workspace/${workspace.id}`);
                }
            } catch (error) {
                console.error("Failed to create workspace:", error);
                setLoading(false);
            }
        }
    };

    return (
        <>
            <div className='flex flex-col flex-1 items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 text-center' suppressHydrationWarning>
                {/* <Spotlight xOffset={-40} translateY={-40} /> */}
                <div className="max-w-4xl mx-auto">
                    <h1 className='text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 dark:text-white leading-tight'>
                        {Lookup.HERO_HEADING}
                    </h1>
                    <p className='mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto'>
                        {Lookup.HERO_DESC}
                    </p>
                    <div className="mt-10 w-full">
                        <UserInput
                            onGenerate={onGenerate}
                            loading={loading}
                            setLoading={setLoading}
                            userInput={userInput}
                            setUserInput={setUserInput}
                            scrapeUrl={scrapeUrl}
                            setScrapeUrl={setScrapeUrl}
                            images={images}
                            setImages={setImages}
                        />
                    </div>
                    <div className='mt-8 flex flex-wrap items-center justify-center gap-3 text-gray-600 dark:text-gray-400'>
                        <span className="text-sm font-medium">Try:</span>
                        {Lookup?.SUGGSTIONS.map((suggestion, index) => (
                            <Button
                                key={index}
                                variant="ghost"
                                size="sm"
                                onClick={() => setUserInput(suggestion)}
                                className='rounded-full text-sm transition-colors duration-200'
                            >
                                {suggestion}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>
            <div className={`bottom-0 cursor-pointer mx-2 my-3 absolute`}>
                <Button
                    onClick={toggleSidebar}
                    variant="ghost"
                    size="icon"
                    className="transition-transform duration-300 ease-in-out"
                    aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <SidebarIcon className={`w-5 h-5 transform ${isCollapsed ? 'rotate-180' : ''}`} />
                </Button>
            </div>
        </>
    )
}

export default Hero;

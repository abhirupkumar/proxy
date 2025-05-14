"use client";

import { GlowingEffect } from '@/components/ui/glowing-effect';
import { Spotlight } from '@/components/ui/spotlight-new';
import Lookup from '@/data/Lookup';
import { createWorkspace } from '@/lib/queries';
import { ArrowRight, Link } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ButtonLoader from '../button-loader';
import UserInput from '../user-input';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';
import { env } from 'env';

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
    const onGenerate = async (input: string) => {
        setUserInput(input)
        if (!user) {
            router.push('/sign-in');
            return;
        }
        setLoading(true);
        const messages = { role: "user", content: input }
        if (messages) {
            const imageUrls = images.map((image) => image.url).filter((url) => url !== undefined) as string[];
            const workspace = await createWorkspace(messages, user, scrapeUrl, imageUrls, template);
            if (workspace)
                window.location.href = `${env.NEXT_PUBLIC_HOST}/workspace/${workspace.id}`;
        }
    }

    return (
        <div className='flex flex-col flex-1 items-center mt-36 xl:mt-52 gap-2 overflow-hidden px-6' suppressHydrationWarning>
            <Spotlight />
            <h2 className='font-bold text-4xl'>{Lookup.HERO_HEADING}</h2>
            <p className='text-muted-foreground font-medium'>{Lookup.HERO_DESC}</p>
            <UserInput onGenerate={onGenerate} loading={loading} setLoading={setLoading} userInput={userInput} setUserInput={setUserInput} scrapeUrl={scrapeUrl} setScrapeUrl={setScrapeUrl} images={images} setImages={setImages} />
            <div className='flex mt-8 flex-wrap max-w2xl items-center justify-center gap-3 text-muted-foreground'>
                {Lookup?.SUGGSTIONS.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => setUserInput(suggestion)}
                        className='p-1 px-2 border rounded-full text-sm'>{suggestion}</button>
                ))}
            </div>
        </div>
    )
}

export default Hero;
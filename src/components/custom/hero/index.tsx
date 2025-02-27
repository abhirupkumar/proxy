"use client";

import { useMessages } from '@/context/MessagesContext';
import Colors from '@/data/Colors';
import Lookup from '@/data/Lookup';
import { createWorkspace } from '@/lib/queries';
import { ArrowRight, Circle, Link, Loader2, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react'
import ButtonLoader from '../button-loader';

const Hero = ({ user }: { user: any }) => {
    const [userInput, setUserInput] = useState<string | null>();
    const [loading, setLoading] = useState<boolean>(false);
    const router = useRouter();
    const onGenerate = async (input: string) => {
        setUserInput(input)
        if (!user) {
            router.push('/sign-in');
            return;
        }
        setLoading(true);
        const messages = { role: "user", content: userInput }
        if (messages) {
            const workspace = await createWorkspace(messages, user);
            if (workspace)
                router.replace(`/workspace/${workspace.id}`);
        }
    }

    return (
        <div className='flex flex-col flex-1 items-center mt-36 xl:mt-52 gap-2 overflow-hidden px-6' suppressHydrationWarning>
            <h2 className='font-bold text-4xl'>{Lookup.HERO_HEADING}</h2>
            <p className='text-muted-foreground font-medium'>{Lookup.HERO_DESC}</p>
            <div className='p-5 border rounded-xl max-w-2xl w-full mt-3 bg-secondary'>
                <div className='flex gap-2'>
                    <textarea placeholder={Lookup.INPUT_PLACEHOLDER} onChange={(event) => setUserInput(event.target.value)} value={userInput || ""} className='outline-none border-none bg-transparent w-full !h-32 !max-h-56 resize-none' />
                    {!loading && userInput && <ArrowRight
                        onClick={() => onGenerate(userInput)}
                        className='w-10 h-10 p-2 rounded-md text-secondary-foreground bg-gradient-to-tr from-teal-500 via-cyan-500 to-sky-500 cursor-pointer' />}
                    {loading && <ButtonLoader />}
                </div>
                <div>
                    <Link className='h-5 w-5' />
                </div>
            </div>
            <div className='flex mt-8 flex-wrap max-w2xl items-center justify-center gap-3 text-muted-foreground'>
                {Lookup?.SUGGSTIONS.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onGenerate(suggestion)}
                        className='p-1 px-2 border rounded-full text-sm'>{suggestion}</button>
                ))}
            </div>
        </div>
    )
}

export default Hero;
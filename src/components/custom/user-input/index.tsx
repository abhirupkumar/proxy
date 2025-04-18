import { GlowingEffect } from '@/components/ui/glowing-effect';
import Lookup from '@/data/Lookup';
import { ArrowRight, Link } from 'lucide-react';
import React, { Dispatch, SetStateAction, useState } from 'react'
import ButtonLoader from '../button-loader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { SignInButton, useAuth } from '@clerk/nextjs';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

const UserInput = ({ disabled, onGenerate, loading, setLoading, userInput, setUserInput, scrapeUrl, setScrapeUrl }: { disabled?: boolean, onGenerate: (input: string) => void, loading: boolean, setLoading: Dispatch<SetStateAction<boolean>>, userInput: string | null | undefined, setUserInput: Dispatch<SetStateAction<string | null | undefined>>, scrapeUrl: string, setScrapeUrl: Dispatch<SetStateAction<string>> }) => {

    const [open, setOpen] = useState<boolean>(false);
    const { isLoaded, isSignedIn } = useAuth();
    const pathname = usePathname();

    return (
        <div className='px-5 py-3 border items-center rounded-xl max-w-3xl w-full mt-3 bg-secondary relative'>
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
            />
            <div className='flex gap-2'>
                <textarea
                    disabled={disabled ?? false}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (e.ctrlKey) {
                                // Insert new line
                                setUserInput(userInput + '\n');
                                e.preventDefault();
                            } else if (userInput != null && userInput.trim() !== "") {
                                e.preventDefault();
                                setUserInput(userInput.trim());
                                onGenerate(userInput);
                            }
                        }
                    }}
                    placeholder={!disabled ? Lookup.INPUT_PLACEHOLDER : "Log in to use/fork the workspace."}
                    value={userInput || ""}
                    onChange={(event) => setUserInput(event.target.value)}
                    className="outline-none border-none bg-transparent w-full !min-h-6 !max-h-56 resize-none"
                />

                {!loading && userInput && <ArrowRight
                    onClick={() => onGenerate(userInput)}
                    className='w-10 h-10 p-2 rounded-md text-secondary bg-primary cursor-pointer' />}
                {loading && <ButtonLoader />}
                {isLoaded && !isSignedIn && pathname != '/' && <SignInButton forceRedirectUrl={window.location.href}>
                    <Button >
                        Log In
                    </Button>
                </SignInButton>}
            </div>
            {!disabled && <>
                <button title='Add Link' onClick={() => setOpen(!open)}>
                    <Link className='h-4 w-4' />
                </button>
                {open && <Input className='text-sm w-fit' type="url" placeholder="https://example.com" value={scrapeUrl} onKeyDown={(e) => {
                    if (e.key == 'Enter' && scrapeUrl != null && scrapeUrl != "")
                        setOpen(false);
                }} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapeUrl(e.target.value)} />}
                {!open && <p className='text-sm w-fit'>{scrapeUrl}</p>}
            </>}
        </div>
    )
}

export default UserInput;
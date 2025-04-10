import { GlowingEffect } from '@/components/ui/glowing-effect';
import Lookup from '@/data/Lookup';
import { ArrowRight, Link } from 'lucide-react';
import React, { Dispatch, SetStateAction, useState } from 'react'
import ButtonLoader from '../button-loader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';

const UserInput = ({ onGenerate, loading, setLoading, userInput, setUserInput, scrapeUrl, setScrapeUrl }: { onGenerate: (input: string) => void, loading: boolean, setLoading: Dispatch<SetStateAction<boolean>>, userInput: string | null | undefined, setUserInput: Dispatch<SetStateAction<string | null | undefined>>, scrapeUrl: string, setScrapeUrl: Dispatch<SetStateAction<string>> }) => {

    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className='p-5 border min-h-[6rem] rounded-xl max-w-2xl w-full mt-3 bg-secondary relative'>
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
            />
            <div className='flex gap-2'>
                <textarea
                    onKeyDown={(e) => {
                        if (e.key == 'Enter' && userInput != null && userInput != "") onGenerate(userInput);
                    }}
                    placeholder={Lookup.INPUT_PLACEHOLDER}
                    value={userInput || ""}
                    onChange={(event) => setUserInput(event.target.value)}
                    className='outline-none border-none bg-transparent w-full !min-h-24 !max-h-56 resize-none' />
                {!loading && userInput && <ArrowRight
                    onClick={() => onGenerate(userInput)}
                    className='w-10 h-10 p-2 rounded-md text-secondary bg-primary cursor-pointer' />}
                {loading && <ButtonLoader />}
            </div>
            <Tooltip>
                <TooltipTrigger><span className={``} onClick={() => setOpen(!open)}>
                    <Link className='h-5 w-5' />
                </span></TooltipTrigger>
                <TooltipContent>
                    <p>Add Link</p>
                </TooltipContent>
            </Tooltip>
            {open && <Input className='text-sm w-fit' type="url" placeholder="https://example.com" value={scrapeUrl} onKeyDown={(e) => {
                if (e.key == 'Enter' && scrapeUrl != null && scrapeUrl != "")
                    setOpen(false);
            }} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapeUrl(e.target.value)} />}
            {!open && <p className='text-sm w-fit'>{scrapeUrl}</p>}
        </div>
    )
}

export default UserInput;
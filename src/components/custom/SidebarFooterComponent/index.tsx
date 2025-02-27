import { Button } from '@/components/ui/button';
import { HelpCircle, LogOut, Settings, ToggleLeft, Wallet } from 'lucide-react';
import React from 'react'
import { ModeToggle } from '../mode-toggle';

const SidebarFooterComponent = () => {
    const options = [
        {
            name: 'Settings',
            icon: Settings,
        },
        {
            name: 'Help Center',
            icon: HelpCircle,
        },
        {
            name: 'My Subscription',
            icon: Wallet,
        },
        {
            name: 'Sign Out',
            icon: LogOut,
        },
    ]
    return (
        <div className='p-2 mb-10 gap-y-1.5 flex flex-col items-start'>
            {
                options.map((option: any, index: number) => {
                    return (
                        <Button key={index} variant={'ghost'} className='w-full flex justify-start'>
                            <option.icon className='text-left' />
                            <span>{option.name}</span>
                        </Button>
                    )
                })
            }
            <ModeToggle />
        </div>
    )
}

export default SidebarFooterComponent;
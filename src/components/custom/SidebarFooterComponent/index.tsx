import { Button } from '@/components/ui/button';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { HelpCircle, LogOut, Settings, Wallet } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';

const SidebarFooterComponent = () => {
    const { user, isLoaded, isSignedIn } = useUser();
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
            <div className='items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 w-full flex justify-start'>
                <LogOut className='text-left' />
                <span><SignOutButton /></span>
            </div>
            {isLoaded && isSignedIn && <Button variant={'ghost'} className='w-full flex justify-start'>
                <img src={(user as any).imageUrl} alt="user-image" className='h-6 w-6 rounded-full' />
                <span>{(user as any).firstName}</span>
            </Button>}
        </div>
    )
}

export default SidebarFooterComponent;
import { Button } from '@/components/ui/button';
import { SignOutButton, useUser } from '@clerk/nextjs';
import { HelpCircle, LogOut, Settings, Wallet } from 'lucide-react';
import { ModeToggle } from '../mode-toggle';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SidebarFooterComponent = () => {
    const { user, isLoaded, isSignedIn } = useUser();

    const userOptions = [
        { name: 'Settings', icon: Settings, href: '/settings' },
        { name: 'Help Center', icon: HelpCircle, href: '/help' },
        { name: 'My Subscription', icon: Wallet, href: '/billing' },
    ];

    if (!isLoaded) {
        return (
            <div className="p-2 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
        );
    }

    return (
        <div className='p-2 flex flex-col gap-y-2'>
            <ModeToggle />
            {isSignedIn && user ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full flex justify-start items-center gap-x-2">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                                <AvatarFallback>{user.fullName}</AvatarFallback>
                            </Avatar>
                            <span className="truncate font-medium">{user.firstName}</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" side="top" align="start">
                        <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {userOptions.map((option) => (
                            <DropdownMenuItem key={option.name} asChild>
                                <a href={option.href} className="flex items-center gap-x-2">
                                    <option.icon className="h-4 w-4" />
                                    <span>{option.name}</span>
                                </a>
                            </DropdownMenuItem>
                        ))}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <SignOutButton>
                                <Button variant="ghost" className="w-full flex justify-start items-center gap-x-2">
                                    <LogOut className="h-4 w-4" />
                                    <span>Sign Out</span>
                                </Button>
                            </SignOutButton>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <Button variant="outline" className="w-full" asChild>
                    <a href="/sign-in">Sign In</a>
                </Button>
            )}
        </div>
    );
}

export default SidebarFooterComponent;

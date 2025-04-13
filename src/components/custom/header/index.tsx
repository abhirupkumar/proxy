import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

const Header = () => {
    const { resolvedTheme } = useTheme();
    const pathname = usePathname();
    if (pathname != '/') return <></>;
    return (
        <div className='p-4 flex justify-between items-center'>
            <Link href="/">
                {resolvedTheme == 'dark' ? <Image src="/logo-dark.svg" alt="Logo" width={100} height={100} /> :
                    <Image src="/logo-white.svg" alt="Logo" width={100} height={100} />}
            </Link>
            <div className='flex gap-3'>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <SignInButton forceRedirectUrl={window.location.href}>
                        <Button>
                            Sign In
                        </Button>
                    </SignInButton>
                    <SignUpButton>
                        <Button>
                            Get Started
                        </Button>
                    </SignUpButton>
                </SignedOut>
            </div>
        </div>
    )
}

export default Header;
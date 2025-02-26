import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

const Header = () => {
    return (
        <div className='p-4 flex justify-between items-center'>
            <Link href="/">
                <Image src="/logo-dark.svg" alt="Logo" width={100} height={100} />
            </Link>
            <div className='flex gap-3'>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <SignedOut>
                    <SignInButton>
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
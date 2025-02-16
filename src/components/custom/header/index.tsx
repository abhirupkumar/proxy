import { Button } from '@/components/ui/button';
import Colors from '@/data/Colors';
import Image from 'next/image';
import React from 'react';

const Header = () => {
    return (
        <div className='p-4 flex justify-between items-center'>
            <Image src="/logo-dark.svg" alt="Logo" width={100} height={100} />
            <div className='flex gap-3'>
                <Button>
                    Sign In
                </Button>
                <Button>
                    Get Started
                </Button>
            </div>
        </div>
    )
}

export default Header;
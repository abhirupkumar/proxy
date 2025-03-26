import { Loader2, Square } from 'lucide-react'
import React from 'react'

const ButtonLoader = ({ onClick }: { onClick?: () => void }) => {
    return (
        <button
            onClick={onClick}
            className="w-10 h-10 flex p-2 rounded-md text-secondary bg-primary items-center"
            disabled={true}
        >
            <Loader2 className='animate-spin h-5 w-5 cursor-pointer' />
        </button>
    )
}

export default ButtonLoader

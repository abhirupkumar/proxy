import { Loader2, Square } from 'lucide-react'
import React from 'react'

const ButtonLoader = () => {
    return (
        <button
            className="w-10 h-10 flex p-2 rounded-md text-secondary bg-primary items-center"
            disabled={true}
        >
            <Loader2 className='animate-spin h-5 w-5' />
        </button>
    )
}

export default ButtonLoader

import { Square } from 'lucide-react'
import React from 'react'

const ButtonLoader = () => {
    return (
        <button
            className="w-10 h-10 flex p-2 rounded-md text-secondary-foreground bg-gradient-to-tr from-teal-500 via-cyan-500 to-sky-500 justify-center items-center"
            disabled={true}
        >
            <Square className='bg-white rounded h-4 w-4' />
        </button>
    )
}

export default ButtonLoader

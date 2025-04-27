import { Loader2, Square } from 'lucide-react'
import React from 'react'

const ButtonLoader = ({ onClick }: { onClick?: () => void }) => {
    return (
        <button
            onClick={onClick}
            className="flex p-2.5 rounded-full text-secondary bg-primary justify-center items-center"
            disabled={true}
        >
            <span
                onClick={onClick}
                className="bg-background h-[0.7rem] w-[0.7rem] cursor-pointer rounded-sm"></span>
        </button>
    )
}

export default ButtonLoader

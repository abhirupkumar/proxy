import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2 } from 'lucide-react';
import { DialogClose } from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';

const DeleteButton = ({ className, onClick }: { className?: string, onClick: any }) => {
    return (
        <Dialog>
            <DialogTrigger className={className ?? ""} asChild><Trash2 /></DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Are you sure?</DialogTitle>
                    <DialogDescription>
                        You cannot recover a deleted workspace.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">
                            No
                        </Button>
                    </DialogClose>
                    <DialogClose asChild>
                        <Button onClick={onClick} type="button" variant="destructive">
                            Yes
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default DeleteButton;
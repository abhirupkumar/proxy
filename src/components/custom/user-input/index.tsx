import { GlowingEffect } from '@/components/ui/glowing-effect';
import Lookup from '@/data/Lookup';
import { ArrowRight, ArrowUp, CrossIcon, Image, ImageIcon, ImagePlusIcon, Link, Link2, XIcon } from 'lucide-react';
import React, { Dispatch, SetStateAction, useRef, useState, useEffect } from 'react'
import ButtonLoader from '../button-loader';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { SignInButton, useAuth } from '@clerk/nextjs';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteImage, uploadImage } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import NextImage from 'next/image';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from 'next-themes';
import { useWorkspaceData } from '@/context/WorkspaceDataContext';

const MAXIMUM_IMAGES = 4;

type ImageItem = {
    id: string;
    file?: File;
    fileId?: string;
    url?: string;
    status: 'uploading' | 'success' | 'error';
    error?: string;
};

const UserInput = ({ disabled, stop, controller, onGenerate, loading, setLoading, userInput, setUserInput, scrapeUrl, setScrapeUrl, images, setImages }: { disabled?: boolean, stop?: () => void, controller?: AbortController, onGenerate: (input: string) => void, loading: boolean, setLoading: Dispatch<SetStateAction<boolean>>, userInput: string | null | undefined, setUserInput: Dispatch<SetStateAction<string | null | undefined>>, scrapeUrl: string, setScrapeUrl: Dispatch<SetStateAction<string>>, images: ImageItem[], setImages: Dispatch<SetStateAction<ImageItem[]>> }) => {

    const { resolvedTheme } = useTheme();
    const { isLoaded, isSignedIn } = useAuth();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { toast } = useToast();
    const { template, setTemplate } = useWorkspaceData();

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;

        const newFiles = Array.from(e.target.files);

        if (newFiles.length > MAXIMUM_IMAGES) {
            toast({
                title: "Image Limit Exceeded",
                description: `You can only upload up to ${MAXIMUM_IMAGES} images at a time.`,
                variant: "destructive",
            });
            return;
        }

        const newImageItems: ImageItem[] = newFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'uploading'
        }));

        setImages(prev => [...prev, ...newImageItems]);

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        const uploadPromises = newImageItems.map(async (item) => {
            if (!item.file) return;

            const formData = new FormData();
            formData.append('image', item.file);

            try {
                const result = await uploadImage(formData);

                if (result.success && result.url) {
                    setImages(current =>
                        current.map(img =>
                            img.id === item.id
                                ? {
                                    ...img,
                                    url: result.url,
                                    fileId: result.fileId,
                                    status: 'success' as const
                                }
                                : img
                        )
                    );
                } else {
                    setImages(current => current.filter(img => img.id !== item.id));
                    toast({
                        title: "Upload failed",
                        description: result.error || "Failed to upload image",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                setImages(current => current.filter(img => img.id !== item.id));
                toast({
                    title: "Upload failed",
                    description: "Couldn't upload the image.",
                    variant: "destructive",
                });
            }
        });

        await Promise.all(uploadPromises);
    };

    const removeImage = (id: string) => {
        const imageToRemove = images.find(img => img.id === id);
        setImages(current => current.filter(img => img.id !== id));

        if (imageToRemove?.fileId) {
            deleteImage(imageToRemove.fileId)
                .catch(error => {
                    console.error('Failed to delete image from ImageKit:', error);
                    toast({
                        title: "Delete failed",
                        description: "The image was removed from your list but could not be deleted from storage",
                        variant: "destructive",
                    });
                });
        }
    };

    const handleAbort = () => {
        if (!!stop) {
            stop();
            setLoading(false);
        }
        // if (controller) {
        //     controller.abort();
        //     setLoading(false);
        // }
    }

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [userInput]);

    return (
        <div className='p-2 border rounded-2xl max-w-4xl w-full mt-4 bg-secondary shadow-lg relative transition-all duration-300 ease-in-out'>
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
            />
            <div className="flex flex-col gap-y-4">
                {images.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {images.map((image) => (
                            <div key={image.id} className="relative group aspect-square border rounded-lg overflow-hidden">
                                {image.status === 'uploading' && (
                                    <div className="animate-pulse flex items-center justify-center bg-gray-200 dark:bg-gray-700 h-full w-full">
                                        <svg className="animate-spin h-6 w-6 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </div>
                                )}
                                {image.status === 'success' && image.url && (
                                    <NextImage src={image.url} alt="Uploaded image" layout="fill" className="object-cover" />
                                )}
                                <button
                                    onClick={() => removeImage(image.id)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 focus:outline-none"
                                >
                                    <XIcon className='h-3 w-3' />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                <div className='flex items-start gap-2'>
                    <textarea
                        ref={textareaRef}
                        disabled={disabled}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey && userInput?.trim()) {
                                e.preventDefault();
                                onGenerate(userInput.trim());
                            }
                        }}
                        placeholder={!disabled ? Lookup.INPUT_PLACEHOLDER : "Log in to use/fork the workspace."}
                        value={userInput || ""}
                        onChange={(e) => setUserInput(e.target.value)}
                        className="flex-grow outline-none border-none bg-transparent text-base resize-none max-h-56 h-auto p-2 overflow-y-auto"
                        rows={2}
                    />
                    {isLoaded && !isSignedIn && pathname !== '/' && (
                        <SignInButton mode="modal" forceRedirectUrl={window.location.href}>
                            <Button>Log In</Button>
                        </SignInButton>
                    )}
                </div>
            </div>
            {!disabled && (
                <div className='flex items-center justify-between'>
                    <div className="flex items-center gap-x-4 ml-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <label htmlFor="dropzone-file" className="flex items-center gap-1 cursor-pointer transition-colors">
                                    <ImagePlusIcon className='h-4 w-4' />
                                    <span className="text-sm font-medium sr-only">Attach</span>
                                </label>
                            </TooltipTrigger>
                            <TooltipContent>Upload Image</TooltipContent>
                        </Tooltip>
                        <Input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            multiple={images.length < MAXIMUM_IMAGES}
                            accept="image/*"
                            disabled={images.length >= MAXIMUM_IMAGES}
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                        />
                        {pathname === "/" && (
                            <Select value={template} onValueChange={setTemplate}>
                                <SelectTrigger className="w-auto p-0 h-auto text-sm">
                                    <SelectValue placeholder="Select a Template" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Templates</SelectLabel>
                                        <SelectItem value="react">
                                            <span className='flex items-center gap-x-2'>
                                                <img className='w-4 h-4' src="/react.svg" alt="react" />
                                                <span>React.js</span>
                                            </span>
                                        </SelectItem>
                                        <SelectItem value="nextjs">
                                            <span className='flex items-center gap-x-2'>
                                                <img className='w-4 h-4' src={resolvedTheme === "dark" ? "/next-dark.svg" : "/next-white.svg"} alt="next" />
                                                <span>Next.js</span>
                                            </span>
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className='flex items-center'>
                        {!loading ? (
                            <Button
                                onClick={() => userInput && onGenerate(userInput)}
                                disabled={!userInput?.trim()}
                                size="sm"
                                className="rounded-full w-8"
                            >
                                <ArrowUp className="h-5 w-5" />
                            </Button>
                        ) : (
                            <ButtonLoader onClick={handleAbort} />
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default UserInput;

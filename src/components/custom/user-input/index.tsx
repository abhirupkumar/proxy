import { GlowingEffect } from '@/components/ui/glowing-effect';
import Lookup from '@/data/Lookup';
import { ArrowRight, CrossIcon, Image, ImageIcon, ImagePlusIcon, Link, Link2, XIcon } from 'lucide-react';
import React, { Dispatch, SetStateAction, useRef, useState } from 'react'
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

const UserInput = ({ disabled, controller, onGenerate, loading, setLoading, userInput, setUserInput, scrapeUrl, setScrapeUrl, images, setImages }: { disabled?: boolean, controller?: AbortController, onGenerate: (input: string) => void, loading: boolean, setLoading: Dispatch<SetStateAction<boolean>>, userInput: string | null | undefined, setUserInput: Dispatch<SetStateAction<string | null | undefined>>, scrapeUrl: string, setScrapeUrl: Dispatch<SetStateAction<string>>, images: ImageItem[], setImages: Dispatch<SetStateAction<ImageItem[]>> }) => {

    const { resolvedTheme } = useTheme();
    const [open, setOpen] = useState<boolean>(false);
    const { isLoaded, isSignedIn } = useAuth();
    const pathname = usePathname();
    const fileInputRef = useRef<HTMLInputElement>(null);
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

        // Create pending upload items
        const newImageItems: ImageItem[] = newFiles.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'uploading'
        }));

        // Add the new items to our state
        setImages(prev => [...prev, ...newImageItems]);

        // Reset the file input for future selections
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }

        // Upload each file concurrently
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
                    // Remove the failed image from the array
                    setImages(current => current.filter(img => img.id !== item.id));

                    // Show error toast
                    toast({
                        title: "Upload failed",
                        description: result.error || "Failed to upload image",
                        variant: "destructive",
                    });
                }
            } catch (error) {
                // Remove the failed image from the array
                setImages(current => current.filter(img => img.id !== item.id));

                // Show error toast
                toast({
                    title: "Upload failed",
                    description: "Couldn't upload the image.",
                    variant: "destructive",
                });
            }
        });

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);
    };

    const removeImage = (id: string) => {
        // Find the image by ID
        const imageToRemove = images.find(img => img.id === id);

        // Remove it from state regardless of remote deletion success
        setImages(current => current.filter(img => img.id !== id));

        // If it was successfully uploaded (and has a fileId), delete it from ImageKit
        // We don't await this since we want the UI to respond immediately
        if (imageToRemove?.fileId) {
            deleteImage(imageToRemove.fileId)
                .catch(error => {
                    console.error('Failed to delete image from ImageKit:', error);
                    // Optionally show a toast on error
                    toast({
                        title: "Delete failed",
                        description: "The image was removed from your list but could not be deleted from storage",
                        variant: "destructive",
                    });
                });
        }
    };

    const handleAbort = () => {
        if (controller) {
            controller.abort();
            setLoading(false);
        }
    }

    return (
        <div className='px-5 py-3 border items-center rounded-xl max-w-3xl w-full mt-3 bg-secondary relative'>
            <GlowingEffect
                spread={40}
                glow={true}
                disabled={false}
                proximity={64}
                inactiveZone={0.01}
            />
            <div className="flex gap-x-3">
                {images.map((image) => (
                    <div
                        key={image.id}
                        className="relative border rounded-md overflow-hidden h-24 w-24"
                    >
                        {/* Skeleton loader */}
                        {image.status === 'uploading' && (
                            <div className="animate-pulse flex flex-col h-full w-full">
                                <div className="bg-primary h-full w-full"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            </div>
                        )}

                        {/* Successfully uploaded image */}
                        {image.status === 'success' && image.url && (
                            <div className="h-full">
                                <NextImage
                                    src={image.url ?? ""}
                                    alt="Uploaded image"
                                    width={200}
                                    height={200}
                                    className="object-contain h-full w-full"
                                />
                            </div>
                        )}

                        <button
                            onClick={() => removeImage(image.id)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 focus:outline-none"
                        >
                            <XIcon className='!h-3 !w-3' />
                        </button>
                    </div>
                ))}
                {open && <Input className='text-sm w-fit' type="url" placeholder="https://example.com" value={scrapeUrl} onKeyDown={(e) => {
                    if (e.key == 'Enter' && scrapeUrl != null && scrapeUrl != "")
                        setOpen(false);
                }} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setScrapeUrl(e.target.value)} />}
                {!open && <p className='text-sm w-fit'>{scrapeUrl}</p>}
            </div>
            <div className='flex gap-2'>
                <textarea
                    disabled={disabled ?? false}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            if (e.ctrlKey) {
                                // Insert new line
                                setUserInput(userInput + '\n');
                                e.preventDefault();
                            } else if (userInput != null && userInput.trim() !== "") {
                                e.preventDefault();
                                setUserInput(userInput.trim());
                                onGenerate(userInput);
                            }
                        }
                    }}
                    placeholder={!disabled ? Lookup.INPUT_PLACEHOLDER : "Log in to use/fork the workspace."}
                    value={userInput || ""}
                    onChange={(event) => setUserInput(event.target.value)}
                    className="outline-none border-none bg-transparent w-full !min-h-6 !max-h-56 resize-none"
                />

                {isLoaded && !isSignedIn && pathname != '/' && <SignInButton forceRedirectUrl={window.location.href}>
                    <Button >
                        Log In
                    </Button>
                </SignInButton>}
            </div>
            {!disabled && <div className='flex gap-x-2 items-center'>
                <label
                    htmlFor="dropzone-file"
                    className="flex items-center justify-center cursor-pointer"
                >
                    <div title='Upload Image' className="flex items-center justify-center">
                        <ImagePlusIcon className='!h-4 mr-0' />
                    </div>
                    <Input
                        id="dropzone-file"
                        type="file"
                        className="hidden"
                        multiple={images.length <= MAXIMUM_IMAGES}
                        accept="image/*"
                        disabled={images.length >= MAXIMUM_IMAGES}
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                    />
                    <p className='text-sm'>Attach</p>
                </label>

                <button className='flex items-center justify-center' title='Add Link' onClick={() => setOpen(!open)}>
                    <Link2 className='!h-4' />
                    <p className='text-sm'>Clone</p>
                </button>

                {pathname == "/" && <Select value={template} onValueChange={(text) => setTemplate(text)}>
                    <SelectTrigger className="w-fit px-1">
                        <SelectValue placeholder="Select a Template" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Templates</SelectLabel>
                            <SelectItem value="react">
                                <span className='flex gap-x-1'>
                                    <img className='w-[16px]' src="/react.svg" alt="react" />
                                    <p>React.js</p>
                                </span>
                            </SelectItem>
                            <SelectItem value="nextjs">
                                <span className='flex gap-x-1'>
                                    {resolvedTheme == "dark" ? <img className='w-[16px]' src="/next-dark.svg" alt="next" /> : <img className='w-[16px]' src="/next-white.svg" alt="next" />}
                                    <p>Next.js</p>
                                </span>
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>}

                <span className='ml-auto flex'>
                    {!loading ? <ArrowRight
                        onClick={() => userInput && onGenerate(userInput)}
                        className={`h-8 w-8 p-2 rounded-full text-secondary ${userInput ? "bg-primary cursor-pointer" : "bg-primary/60"} -rotate-90`} /> : <ButtonLoader onClick={handleAbort} />}
                </span>
            </div>}
        </div>
    )
}

export default UserInput;
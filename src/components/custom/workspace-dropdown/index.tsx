import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { UserButton, useUser } from '@clerk/nextjs'
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronLeft, Globe, Settings, SquarePen, ToggleLeft } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { ModeToggle } from '../mode-toggle'
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { db } from '@/lib/db'
import { usePathname } from 'next/navigation'
import { useWorkspaceData } from '@/context/WorkspaceDataContext'
import { onIdAndTitleUpdate } from '@/lib/queries'
import Modal from 'react-modal';
import { Input } from '@/components/ui/input'
import { toast } from '@/hooks/use-toast'

const WorkspaceDropdown = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { setTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const { workspaceData, setWorkspaceData } = useWorkspaceData();
  const [isOpen, setIsOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState(workspaceData?.title ?? "New Chat");

  useEffect(() => {
    setProjectTitle(workspaceData?.title ?? "New Chat");
  }, [workspaceData]);

  const handleProjectSave = async () => {
    setLoading(true);
    onIdAndTitleUpdate(workspaceData.id, projectTitle, workspaceData.artifactId)
    setWorkspaceData({ ...workspaceData, title: projectTitle })
    setLoading(false);
    setIsOpen(false);
    toast({
      title: "Project name updated",
      description: "Your project name has been updated successfully.",
    })
  }


  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={"hover"} size='lg' className='px-1 gap-0 items-center justify-center'>
            <h2>{projectTitle ? projectTitle : "New Chat"}</h2>
            <Globe className='ml-1' />
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-auto" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Link href={"/"} className='flex items-center gap-x-1 w-full'>
                <ChevronLeft className='h-4 w-4' />
                Go to Dashboard
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className='h-[1px] bg-accent' />
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              {isLoaded && isSignedIn && <div className='w-full flex justify-start items-center'>
                <img src={user.imageUrl} alt="user-image" className='h-8 w-8 rounded-full' />
                <div className='flex flex-col ml-2 text-sm'>
                  <span className='font-semibold'>{user.fullName}</span>
                  <span className='font-extralight'>{user.emailAddresses[0].emailAddress}</span>
                </div>
              </div>}
            </DropdownMenuLabel>
            <DropdownMenuItem>
              <div className='flex flex-col w-full gap-y-2 mb-2'>
                <div className='text-sm text-muted-foreground flex justify-between'>
                  <span>Credits</span>
                  <span>4 left</span>
                </div>
                <Progress value={80} className='w-full' />
                <div className='flex items-center gap-x-2'>
                  <span className='bg-primary h-2 w-2 rounded'></span>
                  Daily Credits Used
                </div>
              </div>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className='h-[1px] bg-accent' />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <Settings />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsOpen(true)}>
              <SquarePen />
              Rename Project
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator className='h-[1px] bg-accent' />
          <DropdownMenuGroup>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <ToggleLeft />
                Appearance
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <Modal
        isOpen={isOpen}
        onRequestClose={() => setIsOpen(false)}
        contentLabel="Rename Project Modal"
        className="bg-background p-6 rounded-lg shadow-lg max-w-md mx-auto mt-20 border"
        overlayClassName="fixed inset-0 bg-black bg-opacity-50 z-50"
      >
        <h2 className="text-lg font-semibold">Rename Project</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Enter a new name for your project.
        </p>
        <div className="grid gap-4 py-4">
          <Input
            id="name"
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={handleProjectSave} type="submit">Save changes</Button>
        </div>
      </Modal>
    </>
  )
}

export default WorkspaceDropdown;

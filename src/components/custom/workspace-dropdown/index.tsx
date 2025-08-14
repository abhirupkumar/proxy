import { Avatar, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { UserButton, useUser } from '@clerk/nextjs'
import { DropdownMenuSeparator } from '@radix-ui/react-dropdown-menu'
import { ChevronDown, ChevronLeft, Globe, Settings, SquarePen, ToggleLeft } from 'lucide-react'
import React from 'react'
import { ModeToggle } from '../mode-toggle'
import { useTheme } from 'next-themes'

const WorkspaceDropdown = ({ title }: { title: string }) => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { setTheme } = useTheme()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={"hover"} size='lg' className='px-1 gap-0 items-center justify-center'>
          <h2>{title != "" ? title : "New Chat"}</h2>
          <Globe className='ml-1' />
          <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <ChevronLeft className='h-4 w-4' />
            Go to Dashboard
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className='h-[1px] bg-accent' />
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {isLoaded && isSignedIn && <div className='w-full flex justify-start items-center'>
              <img src={user.imageUrl} alt="user-image" className='h-6 w-6 rounded-full' />
              <span className='ml-2'>{user.firstName}</span>
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
          <DropdownMenuItem>
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
  )
}

export default WorkspaceDropdown

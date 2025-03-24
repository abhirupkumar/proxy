import { useSidebar } from '@/components/ui/sidebar';
import { PanelsLeftBottom } from 'lucide-react';
import React from 'react'

const ToggleSidebar = () => {
  return (
    <div className='mt-auto relative cursor-pointer m-2'>
      <PanelsLeftBottom className='w-6' />
    </div>
  )
}

export default ToggleSidebar;
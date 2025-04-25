import { SidebarIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ToggleSidebar = () => {
  const pathname = usePathname();
  return (
    <div className={`${pathname == "/" ? "mt-auto" : "mb-auto"} relative cursor-pointer m-2`}>
      <SidebarIcon className='w-4 ml-1 mt-1.5' />
    </div>
  )
}

export default ToggleSidebar;
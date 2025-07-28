import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { SidebarIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ToggleSidebar = () => {
  const pathname = usePathname();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <div className={`${pathname == "/" ? "mt-auto" : "mb-auto"} relative cursor-pointer m-2`}>
      <Button
        onClick={toggleSidebar}
        variant="ghost"
        size="icon"
        className="transition-transform duration-300 ease-in-out"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <SidebarIcon className={`w-5 h-5 transform ${isCollapsed ? 'rotate-180' : ''}`} />
      </Button>
    </div>
  )
}

export default ToggleSidebar;

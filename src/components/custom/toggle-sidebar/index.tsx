import { ChevronsRight } from 'lucide-react';
import { usePathname } from 'next/navigation';

const ToggleSidebar = () => {
  const pathname = usePathname();
  return (
    <div className={`${pathname == "/" ? "mt-auto" : "mb-auto"} relative cursor-pointer m-2`}>
      <ChevronsRight className='w-5' />
    </div>
  )
}

export default ToggleSidebar;
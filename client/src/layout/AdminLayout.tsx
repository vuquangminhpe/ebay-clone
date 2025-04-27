import { useState, useContext, useEffect } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { AppContext } from '@/Contexts/app.context'
import path from '@/constants/path'
import { useLogout } from '@/hooks/useUser'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Users,
  Package,
  Tag,
  ShoppingCart,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Home,
  LayoutDashboard,
  ShieldAlert
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

export default function AdminLayout() {
  const { profile } = useContext(AppContext)
  const navigate = useNavigate()
  const location = useLocation()
  const { mutate: logoutMutate } = useLogout()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Check if user is admin, if not redirect to home
  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      toast.error('You do not have access to this area')
      navigate(path.home)
    }
  }, [profile, navigate])

  const handleLogout = () => {
    logoutMutate('', {
      onSuccess: () => {
        toast.success('Logged out successfully')
        navigate(path.login)
      }
    })
  }

  const navigation = [
    { name: 'Dashboard', href: path.adminDashboard, icon: LayoutDashboard },
    {
      name: 'Statistics',
      icon: BarChart3,
      children: [
        { name: 'Users', href: `${path.admin}/${path.statistics_user}` },
        { name: 'Content', href: `${path.admin}/${path.statistics_content}` },
        { name: 'Interactions', href: `${path.admin}/${path.statistics_interaction}` },
        { name: 'Revenue', href: `${path.admin}/${path.statistics_revenue}` }
      ]
    },
    { name: 'Users', href: `${path.admin}/${path.users}`, icon: Users },
    { name: 'Products', href: `${path.admin}/products`, icon: Package },
    { name: 'Categories', href: `${path.admin}/categories`, icon: Tag },
    { name: 'Orders', href: `${path.admin}/orders`, icon: ShoppingCart },
    {
      name: 'Moderation',
      icon: ShieldAlert,
      children: [
        { name: 'Reported Content', href: `${path.admin}/${path.moderation_reported}` },
        { name: 'Report Generation', href: `${path.admin}/${path.moderation_generate}` }
      ]
    },
    { name: 'Settings', href: `${path.admin}/settings`, icon: Settings }
  ]

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className='min-h-screen bg-gray-100'>
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-gray-800/60 lg:hidden transition-opacity',
          sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className='fixed inset-y-0 left-0 w-64 bg-white p-6 transition-transform shadow-xl h-full overflow-y-auto'>
          <div className='flex items-center justify-between mb-8'>
            <Link to={path.adminDashboard} className='text-xl font-bold text-indigo-600'>
              Bay Market Admin
            </Link>
            <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(false)}>
              <X size={20} />
            </Button>
          </div>

          <nav className='space-y-6'>
            {navigation.map((item) => (
              <div key={item.name}>
                {!item.children ? (
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm rounded-md w-full font-medium',
                      location.pathname === item.href
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {item.icon && <item.icon size={18} />}
                    {item.name}
                  </Link>
                ) : (
                  <div className='space-y-1'>
                    <div className='flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700'>
                      {item.icon && <item.icon size={18} />}
                      {item.name}
                    </div>
                    <div className='pl-8 space-y-1'>
                      {item.children.map((child) => (
                        <Link
                          key={child.name}
                          to={child.href}
                          className={cn(
                            'flex items-center px-3 py-2 text-sm rounded-md w-full',
                            location.pathname === child.href
                              ? 'bg-indigo-50 text-indigo-600 font-medium'
                              : 'text-gray-600 hover:bg-gray-100'
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className='hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col'>
        <div className='flex-1 flex flex-col min-h-0 bg-white shadow-sm overflow-y-auto'>
          <div className='flex-1 flex flex-col pt-5 pb-4'>
            <div className='flex items-center justify-center px-4'>
              <Link to={path.adminDashboard} className='text-xl font-bold text-indigo-600'>
                Bay Market Admin
              </Link>
            </div>
            <nav className='mt-8 flex-1 px-4 space-y-6'>
              {navigation.map((item) => (
                <div key={item.name}>
                  {!item.children ? (
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 text-sm rounded-md w-full font-medium',
                        location.pathname === item.href
                          ? 'bg-indigo-50 text-indigo-600'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {item.icon && <item.icon size={18} />}
                      {item.name}
                    </Link>
                  ) : (
                    <div className='space-y-1'>
                      <div className='flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-700'>
                        {item.icon && <item.icon size={18} />}
                        {item.name}
                      </div>
                      <div className='pl-8 space-y-1'>
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            to={child.href}
                            className={cn(
                              'flex items-center px-3 py-2 text-sm rounded-md w-full',
                              location.pathname === child.href
                                ? 'bg-indigo-50 text-indigo-600 font-medium'
                                : 'text-gray-600 hover:bg-gray-100'
                            )}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <Button variant='outline' className='flex items-center gap-2 w-full justify-start' onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </Button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='lg:pl-64 flex flex-col'>
        <header className='bg-white shadow'>
          <div className='flex h-16 items-center justify-between px-4 sm:px-6'>
            <div className='flex items-center'>
              <Button variant='ghost' size='icon' className='lg:hidden' onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </Button>
              <div className='flex items-center ml-4 lg:ml-0'>
                <div className='flex items-center gap-2'>
                  <Link to={path.home} className='flex items-center gap-1 text-gray-700 hover:text-indigo-600'>
                    <Home size={16} />
                    <span className='text-sm'>Main Site</span>
                  </Link>
                  <span className='text-gray-300'>/</span>
                  <span className='text-sm font-medium text-gray-700'>Admin</span>
                </div>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='relative'>
                <DropdownMenu>
                  <DropdownMenuTrigger className='focus:outline-none'>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-8 w-8'>
                        <AvatarImage src={profile?.avatar} alt={profile?.name} />
                        <AvatarFallback>{profile?.name ? getInitials(profile.name) : 'A'}</AvatarFallback>
                      </Avatar>
                      <span className='hidden md:inline-block text-sm font-medium'>{profile?.name}</span>
                      <ChevronDown size={16} />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem asChild>
                      <Link to={path.profile} className='cursor-pointer'>
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={path.changePassword} className='cursor-pointer'>
                        Change Password
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                      <LogOut className='mr-2 h-4 w-4' />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className='flex-1'>
          <div className='py-6 px-4 sm:px-6 lg:px-8'>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

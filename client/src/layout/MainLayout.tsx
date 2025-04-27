import { ReactNode, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppContext } from '@/Contexts/app.context'
import path from '@/constants/path'
import { useLogout } from '@/hooks/useUser'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { ShoppingCart, Search, Bell, MessageSquare, Package, Heart, User, LogOut, Settings, Store } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useCart } from '@/hooks/useCart'
import { useUnreadMessageCount } from '@/hooks/useMessage'
import { Button } from '@/components/ui/button'

interface MainLayoutProps {
  children: ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { isAuthenticated, profile } = useContext(AppContext)
  const navigate = useNavigate()
  const { mutate: logoutMutate } = useLogout()
  const { data: cartData } = useCart()
  const { data: unreadMessageCount } = useUnreadMessageCount()

  const cartItemCount = cartData?.result.items?.filter((item) => item.selected).length || 0

  const handleLogout = () => {
    logoutMutate('', {
      onSuccess: () => {
        toast.success('Logged out successfully')
        navigate(path.login)
      }
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Header */}
      <header className='border-b sticky top-0 z-50 bg-white'>
        <div className='container mx-auto px-4 py-3'>
          <div className='flex items-center justify-between'>
            {/* Logo */}
            <Link to={path.home} className='text-2xl font-bold text-indigo-600'>
              Bay Market
            </Link>

            {/* Search */}
            <div className='hidden md:flex items-center flex-1 max-w-md mx-8'>
              <div className='relative w-full'>
                <input
                  type='text'
                  placeholder='Search products...'
                  className='w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent'
                />
                <div className='absolute left-3 top-1/2 transform -translate-y-1/2'>
                  <Search size={18} className='text-gray-400' />
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className='flex items-center gap-1 md:gap-3'>
              {isAuthenticated && (
                <>
                  <Link to='/search' className='md:hidden p-2 text-gray-700 hover:text-indigo-600'>
                    <Search size={24} />
                  </Link>

                  <Link to='/cart' className='p-2 text-gray-700 hover:text-indigo-600 relative'>
                    <ShoppingCart size={24} />
                    {cartItemCount > 0 && (
                      <Badge variant='destructive' className='absolute -top-1 -right-1 px-1.5 py-0.5 text-xs'>
                        {cartItemCount}
                      </Badge>
                    )}
                  </Link>

                  <Link to='/notifications' className='p-2 text-gray-700 hover:text-indigo-600'>
                    <Bell size={24} />
                  </Link>

                  <Link to='/messages' className='p-2 text-gray-700 hover:text-indigo-600 relative'>
                    <MessageSquare size={24} />
                    {unreadMessageCount && Number(unreadMessageCount) > 0 && (
                      <Badge variant='destructive' className='absolute -top-1 -right-1 px-1.5 py-0.5 text-xs'>
                        {Number(unreadMessageCount) > 99 ? '99+' : Number(unreadMessageCount)}
                      </Badge>
                    )}
                  </Link>

                  <DropdownMenu>
                    <DropdownMenuTrigger className='ml-2 focus:outline-none'>
                      <Avatar className='h-9 w-9'>
                        <AvatarImage src={profile?.avatar} alt={profile?.name} />
                        <AvatarFallback>{profile?.name ? getInitials(profile.name) : 'U'}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <div className='flex items-center justify-start p-2'>
                        <div className='flex flex-col space-y-1 leading-none'>
                          <p className='font-medium'>{profile?.name}</p>
                          <p className='text-sm text-muted-foreground'>{profile?.email}</p>
                        </div>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to={path.profile} className='cursor-pointer flex w-full'>
                          <User className='mr-2 h-4 w-4' />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to='/orders' className='cursor-pointer flex w-full'>
                          <Package className='mr-2 h-4 w-4' />
                          <span>Orders</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to='/watching' className='cursor-pointer flex w-full'>
                          <Heart className='mr-2 h-4 w-4' />
                          <span>Watching</span>
                        </Link>
                      </DropdownMenuItem>
                      {profile?.role === 'seller' ? (
                        <DropdownMenuItem asChild>
                          <Link to='/seller/dashboard' className='cursor-pointer flex w-full'>
                            <Store className='mr-2 h-4 w-4' />
                            <span>Seller Dashboard</span>
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem asChild>
                          <Link to='/become-seller' className='cursor-pointer flex w-full'>
                            <Store className='mr-2 h-4 w-4' />
                            <span>Become a Seller</span>
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link to={path.changePassword} className='cursor-pointer flex w-full'>
                          <Settings className='mr-2 h-4 w-4' />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className='cursor-pointer'>
                        <LogOut className='mr-2 h-4 w-4' />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {!isAuthenticated && (
                <div className='flex gap-2'>
                  <Button variant='outline' onClick={() => navigate(path.login)}>
                    Login
                  </Button>
                  <Button onClick={() => navigate(path.register)}>Register</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='flex-1'>
        <div className='container mx-auto px-4 py-6'>{children}</div>
      </main>

      {/* Footer */}
      <footer className='bg-gray-800 text-white py-8'>
        <div className='container mx-auto px-4'>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-8'>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Bay Market</h3>
              <p className='text-gray-400'>Your trusted online marketplace for buying and selling products.</p>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Company</h3>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    About Us
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Careers
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Press
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Support</h3>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Help Center
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Safety Center
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Community Guidelines
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className='text-lg font-semibold mb-4'>Legal</h3>
              <ul className='space-y-2'>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href='#' className='text-gray-400 hover:text-white'>
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className='mt-8 pt-8 border-t border-gray-700 text-center text-gray-400'>
            <p>© {new Date().getFullYear()} Bay Market. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

import { useContext } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AppContext } from '@/Contexts/app.context'
import { cn } from '@/lib/utils'
import path from '@/constants/path'
import {
  User,
  Settings,
  CreditCard,
  MapPin,
  ShoppingBag,
  MessageSquare,
  Heart,
  Star,
  Store,
  BarChart2
} from 'lucide-react'
import { Outlet } from 'react-router-dom'

export default function UserLayout() {
  const { profile } = useContext(AppContext)
  const location = useLocation()

  const menuItems = [
    {
      title: 'Account',
      items: [
        { label: 'Profile', href: path.profile, icon: <User size={18} /> },
        { label: 'Change Password', href: path.changePassword, icon: <Settings size={18} /> },
        { label: 'Payment Methods', href: '/user/payment-methods', icon: <CreditCard size={18} /> },
        { label: 'Addresses', href: '/user/addresses', icon: <MapPin size={18} /> }
      ]
    },
    {
      title: 'Shopping',
      items: [
        { label: 'My Orders', href: '/user/orders', icon: <ShoppingBag size={18} /> },
        { label: 'My Bids', href: '/user/bids', icon: <BarChart2 size={18} /> },
        { label: 'Messages', href: path.chat, icon: <MessageSquare size={18} /> },
        { label: 'Watching', href: '/user/watching', icon: <Heart size={18} /> },
        { label: 'Reviews', href: '/user/reviews', icon: <Star size={18} /> }
      ]
    }
  ]

  // Add seller menu items if user is a seller
  if (profile?.role === 'seller') {
    menuItems.push({
      title: 'Seller',
      items: [
        { label: 'My Store', href: '/seller/store', icon: <Store size={18} /> },
        { label: 'Products', href: '/seller/products', icon: <ShoppingBag size={18} /> },
        { label: 'Orders', href: '/seller/orders', icon: <ShoppingBag size={18} /> },
        { label: 'Sales', href: '/seller/sales', icon: <BarChart2 size={18} /> }
      ]
    })
  }

  return (
    <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
      <div className='md:col-span-1'>
        <div className='bg-white rounded-lg shadow p-6 sticky top-24'>
          {menuItems.map((section, index) => (
            <div key={index} className={cn(index > 0 && 'mt-6')}>
              <h3 className='font-medium text-gray-900 mb-2'>{section.title}</h3>
              <nav>
                <ul className='space-y-1'>
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <Link
                        to={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2 text-sm rounded-md w-full',
                          location.pathname === item.href
                            ? 'bg-indigo-50 text-indigo-600 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}

          {/* Only show "Become a Seller" if user is not already a seller */}
          {profile?.role !== 'seller' && (
            <div className='mt-8 p-4 bg-indigo-50 rounded-md'>
              <h3 className='font-medium text-indigo-700 mb-2'>Become a Seller</h3>
              <p className='text-sm text-indigo-600 mb-3'>
                Start selling your products on Bay Market and reach millions of customers.
              </p>
              <Link
                to='/become-seller'
                className='text-sm font-medium text-white bg-indigo-600 px-3 py-2 rounded-md inline-block hover:bg-indigo-700'
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className='md:col-span-3'>
        <Outlet />
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import path from '@/constants/path'
import { ReactNode } from 'react'

interface RegisterLayoutProps {
  children: ReactNode
}

export default function RegisterLayout({ children }: RegisterLayoutProps) {
  return (
    <div className='min-h-screen grid grid-cols-1 lg:grid-cols-2'>
      <div className='hidden lg:block bg-indigo-600 p-10'>
        <div className='h-full flex items-center justify-center'>
          <div className='max-w-xl'>
            <h1 className='text-4xl font-bold text-white mb-6'>Bay Market</h1>
            <p className='text-xl text-white/90'>
              Your one-stop marketplace for buying and selling products. Join our community today and discover amazing
              deals or start selling your products to millions of users.
            </p>
          </div>
        </div>
      </div>
      <div className='flex items-center justify-center p-6 sm:p-12'>
        <div className='w-full max-w-md'>
          <div className='flex justify-center mb-8'>
            <Link to={path.home} className='text-2xl font-bold text-indigo-600 lg:hidden'>
              Bay Market
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

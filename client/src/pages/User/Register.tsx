/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useRegister } from '@/hooks/useUser'
import path from '@/constants/path'
import { RegisterRequest } from '@/types/Auth.type'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/Components/ui/button'

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  email: yup.string().required('Email is required').email('Invalid email format'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirm_password: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
  date_of_birth: yup
    .string()
    .required('Date of birth is required')
    .test('is-adult', 'You must be at least 18 years old', function (value) {
      if (!value) return false
      const dob = new Date(value)
      const today = new Date()
      const minAge = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate())
      return dob <= minAge
    })
})

export default function Register() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registerError, setRegisterError] = useState<string | null>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<RegisterRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirm_password: '',
      date_of_birth: ''
    }
  })

  const { mutate: registerMutate } = useRegister()

  const onSubmit = (data: RegisterRequest) => {
    setRegisterError(null)

    return new Promise<void>((resolve) => {
      registerMutate(data, {
        onSuccess: () => {
          resolve()
          // Redirect to login page after successful registration
          navigate(path.login)
        },
        onError: (error: any) => {
          setRegisterError(error.data?.message || 'Registration failed. Please try again.')
          resolve()
        }
      })
    })
  }

  return (
    <div>
      <div className='flex justify-center'>
        <div className='w-full max-w-md'>
          <h1 className='text-2xl font-bold text-center mb-6'>Create an account</h1>

          {registerError && (
            <Alert variant='destructive' className='mb-4'>
              <AlertDescription>{registerError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input
                id='name'
                placeholder='Enter your full name'
                {...register('name')}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                {...register('email')}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <p className='text-sm text-red-500'>{errors.email.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='date_of_birth'>Date of Birth</Label>
              <Input
                id='date_of_birth'
                type='date'
                {...register('date_of_birth')}
                className={errors.date_of_birth ? 'border-red-500' : ''}
              />
              {errors.date_of_birth && <p className='text-sm text-red-500'>{errors.date_of_birth.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Create a password'
                  {...register('password')}
                  className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className='text-sm text-red-500'>{errors.password.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm_password'>Confirm Password</Label>
              <div className='relative'>
                <Input
                  id='confirm_password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder='Confirm your password'
                  {...register('confirm_password')}
                  className={errors.confirm_password ? 'border-red-500 pr-10' : 'pr-10'}
                />
                <button
                  type='button'
                  className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirm_password && <p className='text-sm text-red-500'>{errors.confirm_password.message}</p>}
            </div>

            <div className='text-sm text-gray-600'>
              By creating an account, you agree to our{' '}
              <a href='#' className='font-medium text-indigo-600 hover:text-indigo-500'>
                Terms of Service
              </a>{' '}
              and{' '}
              <a href='#' className='font-medium text-indigo-600 hover:text-indigo-500'>
                Privacy Policy
              </a>
            </div>

            <Button type='submit' className='w-full' disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>

          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300' />
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>Or continue with</span>
              </div>
            </div>

            <div className='mt-6 grid grid-cols-1 gap-3'>
              <Button variant='outline' className='w-full'>
                <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24'>
                  <path
                    d='M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z'
                    fill='#4285F4'
                  />
                  <path
                    d='M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z'
                    fill='#34A853'
                  />
                  <path
                    d='M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z'
                    fill='#FBBC05'
                  />
                  <path
                    d='M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z'
                    fill='#EA4335'
                  />
                </svg>
                Google
              </Button>
            </div>
          </div>

          <div className='mt-6 text-center'>
            <p className='text-sm text-gray-600'>
              Already have an account?{' '}
              <Link to={path.login} className='font-medium text-indigo-600 hover:text-indigo-500'>
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useForgotPassword } from '@/hooks/useUser'
import { ForgotPasswordRequest } from '@/types/Auth.type'
import path from '@/constants/path'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/Components/ui/button'

const schema = yup.object().shape({
  email: yup.string().required('Email is required').email('Invalid email format')
})

export default function ForgotPassword() {
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ForgotPasswordRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      email: ''
    }
  })

  const { mutate: forgotPasswordMutate } = useForgotPassword()

  const onSubmit = (data: ForgotPasswordRequest) => {
    setError(null)

    return new Promise<void>((resolve) => {
      forgotPasswordMutate(data, {
        onSuccess: () => {
          setIsSuccess(true)
          resolve()
        },
        onError: (error: any) => {
          setError(error.data?.message || 'Failed to send password reset email. Please try again.')
          resolve()
        }
      })
    })
  }

  return (
    <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <Link to={path.login} className='flex items-center text-indigo-600 mb-4'>
          <ArrowLeft size={16} className='mr-1' />
          Back to login
        </Link>

        <h2 className='text-center text-3xl font-extrabold text-gray-900'>Forgot your password?</h2>
        <p className='mt-2 text-center text-sm text-gray-600'>
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {isSuccess ? (
            <div className='flex flex-col items-center justify-center space-y-4'>
              <div className='rounded-full bg-green-100 p-3'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900'>Check your email</h3>
              <p className='text-sm text-gray-600 text-center'>
                We've sent a password reset link to your email address. Please check your inbox and follow the
                instructions.
              </p>
              <p className='text-xs text-gray-500 mt-4'>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type='button'
                  className='text-indigo-600 hover:text-indigo-500'
                  onClick={() => setIsSuccess(false)}
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant='destructive' className='mb-4'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
                <div>
                  <Label htmlFor='email'>Email address</Label>
                  <div className='mt-1'>
                    <Input
                      id='email'
                      type='email'
                      autoComplete='email'
                      placeholder='Enter your email'
                      {...register('email')}
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className='mt-1 text-sm text-red-500'>{errors.email.message}</p>}
                  </div>
                </div>

                <div>
                  <Button type='submit' className='w-full' disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Sending...
                      </>
                    ) : (
                      'Send reset link'
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

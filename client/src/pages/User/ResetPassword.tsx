/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useResetPassword } from '@/hooks/useUser'
import { ResetPasswordRequest } from '@/types/Auth.type'
import path from '@/constants/path'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/Components/ui/button'

const schema = yup.object().shape({
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
    .oneOf([yup.ref('password')], 'Passwords do not match')
})

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<Omit<ResetPasswordRequest, 'token'>>({
    resolver: yupResolver(schema),
    defaultValues: {
      password: '',
      confirm_password: ''
    }
  })

  const { mutate: resetPasswordMutate } = useResetPassword()

  const onSubmit = (data: Omit<ResetPasswordRequest, 'token'>) => {
    if (!token) {
      setError('No reset token provided')
      return Promise.resolve()
    }

    setError(null)

    const resetData: ResetPasswordRequest = {
      ...data,
      token
    }

    return new Promise<void>((resolve) => {
      resetPasswordMutate(resetData, {
        onSuccess: () => {
          setIsSuccess(true)
          resolve()

          // Redirect to login page after a success message
          setTimeout(() => {
            navigate(path.login)
          }, 3000)
        },
        onError: (error: any) => {
          setError(error.data?.message || 'Failed to reset password. Please try again.')
          resolve()
        }
      })
    })
  }

  if (!token) {
    return (
      <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50'>
        <div className='sm:mx-auto sm:w-full sm:max-w-md'>
          <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <div className='flex flex-col items-center justify-center space-y-4'>
              <Alert variant='destructive'>
                <AlertDescription>No reset token provided. Please request a new password reset link.</AlertDescription>
              </Alert>
              <Button onClick={() => navigate(path.forgotPassword)} className='mt-4'>
                Request password reset
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='text-center text-3xl font-extrabold text-gray-900'>Reset your password</h2>
        <p className='mt-2 text-center text-sm text-gray-600'>Please enter your new password below</p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          {isSuccess ? (
            <div className='flex flex-col items-center justify-center space-y-4'>
              <div className='rounded-full bg-green-100 p-3'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
              <h3 className='text-lg font-medium text-gray-900'>Password reset successful</h3>
              <p className='text-sm text-gray-600 text-center'>
                Your password has been reset successfully. You will be redirected to the login page.
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
                  <Label htmlFor='password'>New Password</Label>
                  <div className='mt-1 relative'>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
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
                  {errors.password && <p className='mt-1 text-sm text-red-500'>{errors.password.message}</p>}
                </div>

                <div>
                  <Label htmlFor='confirm_password'>Confirm New Password</Label>
                  <div className='mt-1 relative'>
                    <Input
                      id='confirm_password'
                      type={showConfirmPassword ? 'text' : 'password'}
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
                  {errors.confirm_password && (
                    <p className='mt-1 text-sm text-red-500'>{errors.confirm_password.message}</p>
                  )}
                </div>

                <div>
                  <Button type='submit' className='w-full' disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Resetting password...
                      </>
                    ) : (
                      'Reset password'
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

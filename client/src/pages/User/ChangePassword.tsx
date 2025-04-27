/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useChangePassword } from '@/hooks/useUser'
import { ChangePasswordRequest } from '@/types/Auth.type'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/Components/ui/button'

const schema = yup.object().shape({
  old_password: yup.string().required('Current password is required'),
  new_password: yup
    .string()
    .required('New password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    )
    .notOneOf([yup.ref('old_password')], 'New password must be different from the current password'),
  confirm_password: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('new_password')], 'Passwords do not match')
})

export default function ChangePassword() {
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ChangePasswordRequest>({
    resolver: yupResolver(schema),
    defaultValues: {
      old_password: '',
      new_password: '',
      confirm_password: ''
    }
  })

  const { mutate: changePasswordMutate } = useChangePassword()

  const onSubmit = (data: ChangePasswordRequest) => {
    setSuccess(false)
    setError(null)

    return new Promise<void>((resolve) => {
      changePasswordMutate(data, {
        onSuccess: () => {
          setSuccess(true)
          reset() // Clear form on success
          resolve()

          // Clear success message after a few seconds
          setTimeout(() => {
            setSuccess(false)
          }, 5000)
        },
        onError: (error: any) => {
          setError(
            error.data?.message || 'Failed to change password. Please check your current password and try again.'
          )
          resolve()
        }
      })
    })
  }

  return (
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Change Password</h1>
        <p className='text-gray-600'>Improve your account security by creating a strong, unique password</p>
      </div>

      {success && (
        <Alert className='mb-6 bg-green-50 border-green-200'>
          <AlertDescription className='text-green-700'>Password changed successfully</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant='destructive' className='mb-6'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='bg-white rounded-lg shadow p-6'>
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
          <div className='space-y-2'>
            <Label htmlFor='old_password'>Current Password</Label>
            <div className='relative'>
              <Input
                id='old_password'
                type={showOldPassword ? 'text' : 'password'}
                placeholder='Enter your current password'
                {...register('old_password')}
                className={errors.old_password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                onClick={() => setShowOldPassword(!showOldPassword)}
              >
                {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.old_password && <p className='text-sm text-red-500'>{errors.old_password.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='new_password'>New Password</Label>
            <div className='relative'>
              <Input
                id='new_password'
                type={showNewPassword ? 'text' : 'password'}
                placeholder='Enter your new password'
                {...register('new_password')}
                className={errors.new_password ? 'border-red-500 pr-10' : 'pr-10'}
              />
              <button
                type='button'
                className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.new_password && <p className='text-sm text-red-500'>{errors.new_password.message}</p>}

            <div className='text-xs text-gray-500 mt-1'>
              <p>Your password should:</p>
              <ul className='list-disc pl-5 space-y-1 mt-1'>
                <li>Be at least 8 characters long</li>
                <li>Include at least one uppercase letter</li>
                <li>Include at least one lowercase letter</li>
                <li>Include at least one number</li>
              </ul>
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='confirm_password'>Confirm New Password</Label>
            <div className='relative'>
              <Input
                id='confirm_password'
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder='Confirm your new password'
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

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Changing password...
              </>
            ) : (
              'Change Password'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

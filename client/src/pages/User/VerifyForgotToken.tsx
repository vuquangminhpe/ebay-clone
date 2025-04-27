/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVerifyForgotPassword } from '@/hooks/useUser'
import path from '@/constants/path'
import { Loader2, XCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/Components/ui/button'

export default function VerifyForgotToken() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: verifyTokenMutate } = useVerifyForgotPassword()

  useEffect(() => {
    if (!token) {
      setIsVerifying(false)
      setError('No reset token provided')
      return
    }

    verifyTokenMutate(token, {
      onSuccess: () => {
        setIsVerifying(false)
        setIsValid(true)

        // Redirect to reset password page after a short delay
        setTimeout(() => {
          navigate(`${path.resetPassword}?token=${token}`)
        }, 2000)
      },
      onError: (error: any) => {
        setIsVerifying(false)
        setError(error.data?.message || 'Invalid or expired token')
      }
    })
  }, [token, verifyTokenMutate, navigate])

  return (
    <div className='min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50'>
      <div className='sm:mx-auto sm:w-full sm:max-w-md'>
        <h2 className='text-center text-3xl font-extrabold text-gray-900'>Verifying reset token</h2>
        <p className='mt-2 text-center text-sm text-gray-600'>Please wait while we verify your password reset token.</p>
      </div>

      <div className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'>
        <div className='bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <div className='flex flex-col items-center justify-center space-y-6'>
            {isVerifying ? (
              <>
                <Loader2 className='h-12 w-12 text-indigo-600 animate-spin' />
                <p className='text-gray-700'>Verifying your token...</p>
              </>
            ) : isValid ? (
              <>
                <div className='rounded-full bg-green-100 p-3'>
                  <CheckCircle className='h-12 w-12 text-green-600' />
                </div>
                <div className='text-center'>
                  <h3 className='text-lg font-medium text-gray-900'>Token is valid</h3>
                  <p className='mt-1 text-sm text-gray-600'>Redirecting you to reset your password...</p>
                </div>
              </>
            ) : (
              <>
                <div className='rounded-full bg-red-100 p-3'>
                  <XCircle className='h-12 w-12 text-red-600' />
                </div>
                <div className='text-center'>
                  <h3 className='text-lg font-medium text-gray-900'>Invalid token</h3>
                  <p className='mt-1 text-sm text-gray-600'>
                    {error || 'Your password reset link is invalid or has expired.'}
                  </p>
                </div>
                <Button onClick={() => navigate(path.forgotPassword)} className='mt-4'>
                  Request a new link
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

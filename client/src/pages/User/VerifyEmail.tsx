/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useVerifyEmail, useResendVerifyEmail } from '@/hooks/useUser'
import path from '@/constants/path'
import { Loader2, XCircle, CheckCircle, Mail } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/Components/ui/button'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const [isVerifying, setIsVerifying] = useState(!!token)
  const [isValid, setIsValid] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const { mutate: verifyEmailMutate } = useVerifyEmail()
  const { mutate: resendVerifyEmailMutate } = useResendVerifyEmail()

  useEffect(() => {
    if (!token) return

    verifyEmailMutate(token, {
      onSuccess: () => {
        setIsVerifying(false)
        setIsValid(true)

        // Redirect to home page after a short delay
        setTimeout(() => {
          navigate(path.home)
        }, 3000)
      },
      onError: (error: any) => {
        setIsVerifying(false)
        setError(error.data?.message || 'Invalid or expired verification token')
      }
    })
  }, [token, verifyEmailMutate, navigate])

  const handleResendEmail = () => {
    setResendLoading(true)
    setError(null)

    resendVerifyEmailMutate(undefined, {
      onSuccess: () => {
        setResendSuccess(true)
        setResendLoading(false)
      },
      onError: (error: any) => {
        setError(error.data?.message || 'Failed to resend verification email')
        setResendLoading(false)
      }
    })
  }

  return (
    <div className='max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md'>
      <h1 className='text-2xl font-bold text-center mb-6'>Email Verification</h1>

      {token ? (
        <>
          {isVerifying ? (
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <Loader2 className='h-12 w-12 text-indigo-600 animate-spin' />
              <p className='text-gray-700'>Verifying your email...</p>
            </div>
          ) : isValid ? (
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <div className='rounded-full bg-green-100 p-3'>
                <CheckCircle className='h-12 w-12 text-green-600' />
              </div>
              <div className='text-center'>
                <h3 className='text-lg font-medium text-gray-900'>Email verified successfully!</h3>
                <p className='mt-1 text-sm text-gray-600'>
                  Thank you for verifying your email. You will be redirected to the home page.
                </p>
              </div>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <div className='rounded-full bg-red-100 p-3'>
                <XCircle className='h-12 w-12 text-red-600' />
              </div>
              <div className='text-center'>
                <h3 className='text-lg font-medium text-gray-900'>Verification failed</h3>
                <p className='mt-1 text-sm text-gray-600'>
                  {error || 'Your verification link is invalid or has expired.'}
                </p>
              </div>
              <div className='flex gap-4 mt-4'>
                <Button variant='outline' onClick={() => navigate(path.home)}>
                  Go to Home
                </Button>
                <Button onClick={handleResendEmail} disabled={resendLoading}>
                  {resendLoading ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Sending...
                    </>
                  ) : (
                    'Resend Email'
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className='flex flex-col space-y-6'>
          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {resendSuccess ? (
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <div className='rounded-full bg-green-100 p-3'>
                <Mail className='h-12 w-12 text-green-600' />
              </div>
              <div className='text-center'>
                <h3 className='text-lg font-medium text-gray-900'>Verification email sent!</h3>
                <p className='mt-1 text-sm text-gray-600'>
                  We've sent a verification link to your email address. Please check your inbox and follow the
                  instructions.
                </p>
              </div>
              <p className='text-xs text-gray-500 mt-4'>
                Didn't receive the email? Check your spam folder or{' '}
                <button
                  type='button'
                  className='text-indigo-600 hover:text-indigo-500'
                  onClick={handleResendEmail}
                  disabled={resendLoading}
                >
                  try again
                </button>
              </p>
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-8 space-y-4'>
              <div className='rounded-full bg-indigo-100 p-3'>
                <Mail className='h-12 w-12 text-indigo-600' />
              </div>
              <div className='text-center'>
                <h3 className='text-lg font-medium text-gray-900'>Verify your email address</h3>
                <p className='mt-1 text-sm text-gray-600'>
                  To continue using Bay Market, you need to verify your email address.
                </p>
              </div>
              <Button onClick={handleResendEmail} disabled={resendLoading} className='mt-4'>
                {resendLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending...
                  </>
                ) : (
                  'Send verification email'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useUpdateProfile } from '@/hooks/useUser'
import { UpdateProfileRequest } from '@/types/Auth.type'
import { AppContext } from '@/Contexts/app.context'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Loader2, Camera } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/Components/ui/button'

const schema = yup.object().shape({
  name: yup.string().required('Name is required'),
  username: yup
    .string()
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters'),
  date_of_birth: yup.string().nullable(),
  bio: yup.string().max(160, 'Bio must not exceed 160 characters'),
  location: yup.string().max(100, 'Location must not exceed 100 characters'),
  website: yup.string().url('Website must be a valid URL').max(100, 'Website must not exceed 100 characters').nullable()
})

export default function Profile() {
  const { profile } = useContext(AppContext)
  const { mutate: updateProfileMutate } = useUpdateProfile()

  const [updateSuccess, setUpdateSuccess] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UpdateProfileRequest>({
    resolver: yupResolver(schema as any),
    defaultValues: {
      name: profile?.name || '',
      username: profile?.username || '',
      date_of_birth: profile?.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      website: profile?.website || ''
    }
  })

  // Update form when profile changes
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        username: profile.username || '',
        date_of_birth: profile.date_of_birth ? new Date(profile.date_of_birth).toISOString().split('T')[0] : '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || ''
      })
    }
  }, [profile, reset])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      const imageUrl = URL.createObjectURL(file)
      setAvatarPreview(imageUrl)
    }
  }

  const onSubmit = async (data: UpdateProfileRequest) => {
    setUpdateSuccess(false)
    setUpdateError(null)

    let avatarUrl = profile?.avatar

    // Upload avatar if changed
    if (avatarFile) {
      try {
        // You would implement the file upload logic here
        // For now, we'll just simulate a successful upload
        avatarUrl = URL.createObjectURL(avatarFile) // This is just for demo, in real app you'd get URL from server
      } catch (error: any) {
        setUpdateError('Failed to upload avatar' + error)
        return
      }
    }

    const updateData: UpdateProfileRequest = {
      ...data,
      avatar: avatarUrl
    }

    return new Promise<void>((resolve) => {
      updateProfileMutate(updateData, {
        onSuccess: () => {
          setUpdateSuccess(true)
          resolve()

          // Clear success message after a few seconds
          setTimeout(() => {
            setUpdateSuccess(false)
          }, 3000)
        },
        onError: (error: any) => {
          setUpdateError(error.data?.message || 'Failed to update profile')
          resolve()
        }
      })
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
    <div>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold'>Profile Settings</h1>
        <p className='text-gray-600'>Manage your account information and preferences</p>
      </div>

      {updateSuccess && (
        <Alert className='mb-4 bg-green-50 border-green-200'>
          <AlertDescription className='text-green-700'>Profile updated successfully</AlertDescription>
        </Alert>
      )}

      {updateError && (
        <Alert variant='destructive' className='mb-4'>
          <AlertDescription>{updateError}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-8'>
        <div className='space-y-6'>
          <div>
            <h2 className='text-lg font-medium'>Profile Picture</h2>
            <div className='mt-4 flex items-center space-x-6'>
              <Avatar className='h-24 w-24'>
                <AvatarImage src={avatarPreview || profile?.avatar} alt={profile?.name} />
                <AvatarFallback className='text-2xl'>{profile?.name ? getInitials(profile.name) : 'U'}</AvatarFallback>
              </Avatar>

              <div>
                <label
                  htmlFor='avatar-upload'
                  className='cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors'
                >
                  <Camera size={18} />
                  <span>Change avatar</span>
                  <input
                    id='avatar-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleAvatarChange}
                  />
                </label>
                <p className='mt-1 text-xs text-gray-500'>JPG, PNG or GIF. Maximum size of 1MB.</p>
              </div>
            </div>
          </div>

          <Separator />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Full Name</Label>
              <Input id='name' {...register('name')} className={errors.name ? 'border-red-500' : ''} />
              {errors.name && <p className='text-sm text-red-500'>{errors.name.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='username'>Username</Label>
              <Input id='username' {...register('username')} className={errors.username ? 'border-red-500' : ''} />
              {errors.username && <p className='text-sm text-red-500'>{errors.username.message}</p>}
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
              <Label htmlFor='location'>Location</Label>
              <Input
                id='location'
                placeholder='City, Country'
                {...register('location')}
                className={errors.location ? 'border-red-500' : ''}
              />
              {errors.location && <p className='text-sm text-red-500'>{errors.location.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='website'>Website</Label>
              <Input
                id='website'
                placeholder='https://yourwebsite.com'
                {...register('website')}
                className={errors.website ? 'border-red-500' : ''}
              />
              {errors.website && <p className='text-sm text-red-500'>{errors.website.message}</p>}
            </div>

            <div className='space-y-2 md:col-span-2'>
              <Label htmlFor='bio'>Bio</Label>
              <Textarea
                id='bio'
                placeholder='Tell us about yourself'
                {...register('bio')}
                className={errors.bio ? 'border-red-500' : ''}
                rows={4}
              />
              {errors.bio && <p className='text-sm text-red-500'>{errors.bio.message}</p>}
              <p className='text-xs text-gray-500'>
                {`${((register('bio') as any).value as string)?.length || 0}/160 characters`}
              </p>
            </div>
          </div>
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

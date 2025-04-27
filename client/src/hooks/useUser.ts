import { saveAccessTokenToLS } from '@/utils/auth'
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UsersApi } from '@/apis/UsersApi'
import { toast } from 'sonner'
import {
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest
} from '@/types/Auth.type'
import { useContext } from 'react'
import { AppContext } from '@/Contexts/app.context'
import { clearLocalStorage, setProfileFromLS } from '@/utils/auth'

export const useLogin = () => {
  const { setIsAuthenticated, setProfile } = useContext(AppContext)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: LoginRequest) => UsersApi.login(params),
    onSuccess: (data) => {
      const { access_token, user } = data.data.result
      saveAccessTokenToLS(access_token)
      setProfileFromLS(user as any)
      setIsAuthenticated(true)
      setProfile(user)
      queryClient.invalidateQueries({ queryKey: ['me'] })
      toast.success('Logged in successfully')
    },
    onError: () => {
      clearLocalStorage()
      setIsAuthenticated(false)
      setProfile(null)
      toast.error('Login failed')
    }
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: (params: RegisterRequest) => UsersApi.register(params),
    onSuccess: () => {
      toast.success('Registration successful. Please check your email to verify your account.')
    },
    onError: () => {
      toast.error('Registration failed')
    }
  })
}

export const useVerifyEmail = () => {
  const { setIsAuthenticated } = useContext(AppContext)

  return useMutation({
    mutationFn: (token: string) => UsersApi.verifyEmail(token),
    onSuccess: (data) => {
      const { access_token } = data.data
      saveAccessTokenToLS(access_token as any)
      setIsAuthenticated(true)
      toast.success('Email verified successfully')
    },
    onError: () => {
      toast.error('Email verification failed')
    }
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (params: ForgotPasswordRequest) => UsersApi.forgotPassword(params),
    onSuccess: () => {
      toast.success('Password reset email sent. Please check your inbox.')
    },
    onError: () => {
      toast.error('Failed to send password reset email')
    }
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (params: ResetPasswordRequest) => UsersApi.resetPassword(params),
    onSuccess: () => {
      toast.success('Password reset successfully. You can now login with your new password.')
    },
    onError: () => {
      toast.error('Password reset failed')
    }
  })
}

export const useVerifyForgotPassword = () => {
  return useMutation({
    mutationFn: (token: string) => UsersApi.verifyForgotPassword(token),
    onSuccess: () => {
      toast.success('Reset token is valid. Please enter your new password.')
    },
    onError: () => {
      toast.error('Reset token is invalid or expired')
    }
  })
}

export const useLogout = () => {
  const { reset } = useContext(AppContext)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (refresh_token: string) => UsersApi.logout(refresh_token),
    onSuccess: () => {
      clearLocalStorage()
      reset()
      queryClient.clear() // Clear all query cache on logout
      toast.success('Logged out successfully')
    },
    onError: () => {
      // Even if the API call fails, we still want to clear local data
      clearLocalStorage()
      reset()
      queryClient.clear()
      toast.error('Logout failed on server, but you are logged out locally')
    }
  })
}

export const useRefreshToken = () => {
  return useMutation({
    mutationFn: (refresh_token: string) => UsersApi.refreshToken(refresh_token),
    onSuccess: (data) => {
      const { access_token } = data.data.result
      saveAccessTokenToLS(access_token as any)
    }
  })
}

export const useResendVerifyEmail = () => {
  return useMutation({
    mutationFn: () => UsersApi.resendVerifyEmail(),
    onSuccess: () => {
      toast.success('Verification email resent. Please check your inbox.')
    },
    onError: () => {
      toast.error('Failed to resend verification email')
    }
  })
}

export const useUser = () => {
  const { setProfile } = useContext(AppContext)

  const { data: dataProfile } = useQuery({
    queryKey: ['me'],
    queryFn: () => UsersApi.getMe(),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
  setProfile((dataProfile?.data as any)?.result)
  return dataProfile
}

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  const { setProfile } = useContext(AppContext)

  return useMutation({
    mutationFn: (params: UpdateProfileRequest) => UsersApi.updateMe(params),
    onSuccess: (data) => {
      toast.success('Profile updated successfully')
      queryClient.invalidateQueries({ queryKey: ['me'] })
      setProfileFromLS(data.data.result)
      setProfile(data.data.result)
    },
    onError: () => {
      toast.error('Failed to update profile')
    }
  })
}

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (params: ChangePasswordRequest) => UsersApi.changePassword(params),
    onSuccess: () => {
      toast.success('Password changed successfully')
    },
    onError: () => {
      toast.error('Failed to change password')
    }
  })
}

export const useUserProfile = (username: string) => {
  return useQuery({
    queryKey: ['user-profile', username],
    queryFn: () => UsersApi.getProfileByUsername(username),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!username
  })
}

export const useUserProfileById = (user_id: string) => {
  return useQuery({
    queryKey: ['user-profile-by-id', user_id],
    queryFn: () => UsersApi.getProfileById(user_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!user_id
  })
}

export const useFollowing = () => {
  return useQuery({
    queryKey: ['following'],
    queryFn: () => UsersApi.getFollowing(),
    select: (data) => data.data.message,
    staleTime: 5 * 60 * 1000
  })
}

export const useFollowers = () => {
  return useQuery({
    queryKey: ['followers'],
    queryFn: () => UsersApi.getFollowers(),
    select: (data) => data.data.message,
    staleTime: 5 * 60 * 1000
  })
}

export const useFollow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (followed_user_id: string) => UsersApi.follow(followed_user_id),
    onSuccess: () => {
      toast.success('User followed successfully')
      queryClient.invalidateQueries({ queryKey: ['following'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
    },
    onError: () => {
      toast.error('Failed to follow user')
    }
  })
}

export const useUnfollow = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (followed_user_id: string) => UsersApi.unfollow(followed_user_id),
    onSuccess: () => {
      toast.success('User unfollowed successfully')
      queryClient.invalidateQueries({ queryKey: ['following'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
    },
    onError: () => {
      toast.error('Failed to unfollow user')
    }
  })
}

export const useSearchUsers = (name: string, page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['search-users', name, page, limit],
    queryFn: () => UsersApi.searchUsers(name, page, limit),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!name && name.length > 0
  })
}

// Admin only
export const useAllUsers = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['admin-users', page, limit],
    queryFn: () => UsersApi.getAllUsers(page, limit),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000
  })
}

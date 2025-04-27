import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AddressApi } from '@/apis/AddressApi'
import { toast } from 'sonner'
import { CreateAddressRequest, UpdateAddressRequest, SetDefaultAddressRequest } from '@/types/Address.type'

export const useUserAddresses = (params?: { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: ['addresses', params],
    queryFn: () => AddressApi.getUserAddresses(params),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

export const useAddress = (address_id: string) => {
  return useQuery({
    queryKey: ['address', address_id],
    queryFn: () => AddressApi.getAddress(address_id),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000,
    enabled: !!address_id
  })
}

export const useCreateAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateAddressRequest) => AddressApi.createAddress(data),
    onSuccess: () => {
      toast.success('Address created successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: () => {
      toast.error('Failed to create address')
    }
  })
}

export const useUpdateAddress = (address_id: string) => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: UpdateAddressRequest) => AddressApi.updateAddress(address_id, data),
    onSuccess: () => {
      toast.success('Address updated successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      queryClient.invalidateQueries({ queryKey: ['address', address_id] })
    },
    onError: () => {
      toast.error('Failed to update address')
    }
  })
}

export const useDeleteAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (address_id: string) => AddressApi.deleteAddress(address_id),
    onSuccess: () => {
      toast.success('Address deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: () => {
      toast.error('Failed to delete address')
    }
  })
}

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: SetDefaultAddressRequest) => AddressApi.setDefaultAddress(data),
    onSuccess: () => {
      toast.success('Default address set successfully')
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
    },
    onError: () => {
      toast.error('Failed to set default address')
    }
  })
}

export const useNearbyAddresses = (params: { latitude: number; longitude: number; radius?: number }) => {
  return useQuery({
    queryKey: ['addresses', 'nearby', params],
    queryFn: () => AddressApi.findNearbyAddresses(params),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000,
    enabled: !!params.latitude && !!params.longitude
  })
}

export const useValidateAddress = () => {
  return useMutation({
    mutationFn: (address: {
      address_line1: string
      city: string
      state: string
      postal_code: string
      country: string
    }) => AddressApi.validateAddress(address),
    onSuccess: (data) => {
      if (data.data.valid) {
        toast.success('Address is valid')
      } else {
        toast.warning('Address validation failed')
      }
    },
    onError: () => {
      toast.error('Address validation failed')
    }
  })
}

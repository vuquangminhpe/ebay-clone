import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import ShippingApi, {
  CalculateShippingCostRequest,
  CreateShippingMethodRequest,
  CreateShipmentRequest,
  UpdateShipmentStatusRequest
} from '@/apis/ShippingApi'
import { toast } from 'sonner'

export const useShippingMethods = (international: boolean = false) => {
  return useQuery({
    queryKey: ['shipping-methods', { international }],
    queryFn: () => ShippingApi.getShippingMethods(international),
    select: (data) => data.data,
    staleTime: 30 * 60 * 1000 // 30 minutes as shipping methods don't change often
  })
}

export const useCalculateShippingCost = () => {
  return useMutation({
    mutationFn: (request: CalculateShippingCostRequest) => ShippingApi.calculateShippingCost(request),
    onSuccess: (data) => {
      return data.data // Return the shipping cost calculation for UI
    },
    onError: () => {
      toast.error('Failed to calculate shipping cost')
    }
  })
}

export const useTrackShipment = (tracking_number: string, carrier?: string) => {
  return useQuery({
    queryKey: ['shipment-tracking', tracking_number, carrier],
    queryFn: () => ShippingApi.trackShipment(tracking_number, carrier),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!tracking_number,
    refetchInterval: 30 * 60 * 1000 // Refetch every 30 minutes for updates
  })
}

// Admin only
export const useCreateShippingMethod = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateShippingMethodRequest) => ShippingApi.createShippingMethod(request),
    onSuccess: () => {
      toast.success('Shipping method created successfully')
      queryClient.invalidateQueries({ queryKey: ['shipping-methods'] })
    },
    onError: () => {
      toast.error('Failed to create shipping method')
    }
  })
}

// Seller only
export const useCreateShipment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: CreateShipmentRequest) => ShippingApi.createShipment(request),
    onSuccess: (_, variables) => {
      toast.success('Shipment created successfully')
      queryClient.invalidateQueries({ queryKey: ['shipment-by-order', variables.order_id] })
      // Order status will change
      queryClient.invalidateQueries({ queryKey: ['order', variables.order_id] })
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
    },
    onError: () => {
      toast.error('Failed to create shipment')
    }
  })
}

export const useUpdateShipmentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ shipment_id, request }: { shipment_id: string; request: UpdateShipmentStatusRequest }) =>
      ShippingApi.updateShipmentStatus(shipment_id, request),
    onSuccess: (data) => {
      toast.success('Shipment status updated successfully')
      queryClient.invalidateQueries({ queryKey: ['shipment', data.data._id] })
      // Also update related order
      if (data.data.order_id) {
        queryClient.invalidateQueries({ queryKey: ['order', data.data.order_id] })
        queryClient.invalidateQueries({ queryKey: ['shipment-by-order', data.data.order_id] })
      }
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] })
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] })
    },
    onError: () => {
      toast.error('Failed to update shipment status')
    }
  })
}

export const useShipment = (shipment_id: string) => {
  return useQuery({
    queryKey: ['shipment', shipment_id],
    queryFn: () => ShippingApi.getShipmentById(shipment_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!shipment_id
  })
}

export const useShipmentByOrderId = (order_id: string) => {
  return useQuery({
    queryKey: ['shipment-by-order', order_id],
    queryFn: () => ShippingApi.getShipmentByOrderId(order_id),
    select: (data) => data.data,
    staleTime: 5 * 60 * 1000,
    enabled: !!order_id
  })
}

export const useGenerateShippingLabel = () => {
  return useMutation({
    mutationFn: (shipment_id: string) => ShippingApi.generateShippingLabel(shipment_id),
    onSuccess: (data) => {
      toast.success('Shipping label generated successfully')
      return data.data // Return the label URL for download/display
    },
    onError: () => {
      toast.error('Failed to generate shipping label')
    }
  })
}

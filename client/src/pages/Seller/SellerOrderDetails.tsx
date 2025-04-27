/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useOrder, useShipOrder, useDeliverOrder, useCancelOrder } from '@/hooks/useOrder'
import { useGenerateShippingLabel, useCreateShipment } from '@/hooks/useShipping'
import { OrderStatus } from '@/types/Order.type'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  ShoppingBag,
  ArrowLeft,
  Truck,
  Check,
  X,
  Package,
  FileText,
  Clock,
  CreditCard,
  MapPin,
  User,
  Phone,
  Download,
  FileBarChart,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/Components/ui/button'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

export default function SellerOrderDetails() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('details')

  // Shipping dialog state
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [carrier, setCarrier] = useState('default')
  const [shippingNotes, setShippingNotes] = useState('')
  const [estimatedDeliveryDays, setEstimatedDeliveryDays] = useState('7')

  // Cancellation dialog state
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')

  // Shipping label dialog state
  const [isLabelDialogOpen, setIsLabelDialogOpen] = useState(false)
  const [shippingLabelUrl, setShippingLabelUrl] = useState<string | null>(null)

  // Modal state for displaying shipping label
  const [showLabelPreview, setShowLabelPreview] = useState(false)

  // Shipment creation data
  const [packageWeight, setPackageWeight] = useState('0.5')
  const [packageLength, setPackageLength] = useState('10')
  const [packageWidth, setPackageWidth] = useState('10')
  const [packageHeight, setPackageHeight] = useState('10')
  const [shippingCost, setShippingCost] = useState('0')

  // Fetch order data
  const { data: orderData, isLoading, refetch } = useOrder(orderId || '')

  // Mutations
  const { mutate: shipOrder, isPending: isShipping } = useShipOrder()
  const { mutate: deliverOrder, isPending: isDelivering } = useDeliverOrder()
  const { mutate: cancelOrder, isPending: isCancelling } = useCancelOrder()
  const { mutate: generateLabel, isPending: isGeneratingLabel } = useGenerateShippingLabel()
  const { mutate: createShipment, isPending: isCreatingShipment } = useCreateShipment()

  // Reset modal states when order data changes
  useEffect(() => {
    if (orderData) {
      // If the order has a tracking number, prefill the shipping form
      if (orderData.result.tracking_number) {
        setTrackingNumber(orderData.result.tracking_number)
      }
    }
  }, [orderData])

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Calculate estimated delivery date
  const calculateEstimatedDeliveryDate = (daysToAdd: number) => {
    const date = new Date()
    date.setDate(date.getDate() + daysToAdd)
    return date.toISOString()
  }

  // Get status badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            <Clock className='w-3 h-3 mr-1' />
            Pending
          </Badge>
        )
      case OrderStatus.PAID:
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
            <CreditCard className='w-3 h-3 mr-1' />
            Paid
          </Badge>
        )
      case OrderStatus.SHIPPED:
        return (
          <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200'>
            <Truck className='w-3 h-3 mr-1' />
            Shipped
          </Badge>
        )
      case OrderStatus.DELIVERED:
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            <Check className='w-3 h-3 mr-1' />
            Delivered
          </Badge>
        )
      case OrderStatus.CANCELLED:
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            <X className='w-3 h-3 mr-1' />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  // Handle shipping the order
  const handleShipOrder = () => {
    if (!orderId || !trackingNumber || carrier === 'default') {
      toast.error('Please fill in all required shipping details')
      return
    }

    shipOrder(
      {
        order_id: orderId,
        params: {
          tracking_number: trackingNumber,
          shipping_provider: carrier,
          estimated_delivery_date: calculateEstimatedDeliveryDate(parseInt(estimatedDeliveryDays))
        }
      },
      {
        onSuccess: () => {
          toast.success('Order marked as shipped')
          setIsShippingDialogOpen(false)
          refetch()
        },
        onError: (error) => {
          toast.error(`Failed to update shipping status: ${error.message || 'Unknown error'}`)
        }
      }
    )
  }

  // Handle creating a shipment
  const handleCreateShipment = () => {
    if (!orderId || !trackingNumber || carrier === 'default') {
      toast.error('Please fill in all required shipping details')
      return
    }

    const weight = parseFloat(packageWeight)
    const shipping = parseFloat(shippingCost)

    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid package weight')
      return
    }

    if (isNaN(shipping) || shipping < 0) {
      toast.error('Please enter a valid shipping cost')
      return
    }

    const dimensions = {
      length: parseFloat(packageLength),
      width: parseFloat(packageWidth),
      height: parseFloat(packageHeight),
      unit: 'cm'
    }

    createShipment(
      {
        order_id: orderId,
        shipping_method_id: 'default', // You may want to add a shipping method selector
        tracking_number: trackingNumber,
        carrier: carrier,
        weight_kg: weight,
        dimensions: dimensions,
        shipping_cost: shipping
      },
      {
        onSuccess: () => {
          toast.success('Shipment created successfully')
          // After creating the shipment, mark the order as shipped
          handleShipOrder()
        },
        onError: (error) => {
          toast.error(`Failed to create shipment: ${error.message || 'Unknown error'}`)
        }
      }
    )
  }

  // Handle marking the order as delivered
  const handleDeliverOrder = () => {
    if (!orderId) return

    deliverOrder(
      {
        order_id: orderId,
        params: {}
      },
      {
        onSuccess: () => {
          toast.success('Order marked as delivered')
          refetch()
        },
        onError: (error) => {
          toast.error(`Failed to mark as delivered: ${error.message || 'Unknown error'}`)
        }
      }
    )
  }

  // Handle cancelling the order
  const handleCancelOrder = () => {
    if (!orderId) return

    cancelOrder(
      {
        order_id: orderId,
        params: {
          reason: cancelReason
        }
      },
      {
        onSuccess: () => {
          toast.success('Order cancelled successfully')
          setIsCancelDialogOpen(false)
          refetch()
        },
        onError: (error) => {
          toast.error(`Failed to cancel order: ${error.message || 'Unknown error'}`)
        }
      }
    )
  }

  // Generate shipping label
  const handleGenerateLabel = () => {
    if (!orderId) return

    // In a real app, you might need to first create a shipment record before generating a label
    generateLabel(orderId, {
      onSuccess: (data) => {
        // Assuming the API returns a URL to download the label
        if (data && data.data.result.label_url) {
          setShippingLabelUrl(data.data.result.label_url)
          setShowLabelPreview(true)
        } else {
          toast.error('No shipping label URL received')
        }
      },
      onError: (error) => {
        toast.error(`Failed to generate shipping label: ${error.message || 'Unknown error'}`)
      }
    })
  }

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Button variant='ghost' className='mr-2'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
            <Skeleton className='h-8 w-64' />
          </div>
          <Skeleton className='h-9 w-24' />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-48 mb-2' />
            <Skeleton className='h-4 w-72' />
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
                <Skeleton className='h-32 w-full' />
              </div>
              <Skeleton className='h-96 w-full' />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // If order is not found
  if (!orderData || !orderData.result) {
    return (
      <div className='flex flex-col items-center justify-center h-64'>
        <AlertTriangle className='h-12 w-12 text-yellow-500 mb-4' />
        <h2 className='text-xl font-semibold mb-2'>Order Not Found</h2>
        <p className='text-gray-500 mb-4'>The requested order could not be found.</p>
        <Button onClick={() => navigate('/seller/orders')}>
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Orders
        </Button>
      </div>
    )
  }

  const order = orderData.result

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Button variant='ghost' onClick={() => navigate('/seller/orders')} className='mr-2'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Orders
          </Button>
          <h1 className='text-2xl font-bold mt-2 flex items-center'>
            <ShoppingBag className='mr-2 h-6 w-6' />
            Order #{order.order_number}
          </h1>
          <p className='text-gray-600'>Placed on {formatDate(order.created_at)}</p>
        </div>

        <div className='flex space-x-2'>
          {order.status === OrderStatus.PAID && (
            <Button onClick={() => setIsShippingDialogOpen(true)}>
              <Truck className='h-4 w-4 mr-2' />
              Ship Order
            </Button>
          )}

          {order.status === OrderStatus.SHIPPED && (
            <Button onClick={() => setIsLabelDialogOpen(true)}>
              <FileText className='h-4 w-4 mr-2' />
              Shipping Label
            </Button>
          )}

          {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID) && (
            <Button variant='outline' onClick={() => setIsCancelDialogOpen(true)}>
              <X className='h-4 w-4 mr-2' />
              Cancel Order
            </Button>
          )}
        </div>
      </div>

      <div className='bg-white rounded-lg border p-4 flex items-center justify-between'>
        <div className='flex items-center'>
          <div className='mr-4'>{getStatusBadge(order.status as OrderStatus)}</div>
          <div>
            <h2 className='font-medium'>Current Status</h2>
            <p className='text-sm text-gray-500'>
              {order.status === OrderStatus.PENDING && 'Awaiting payment'}
              {order.status === OrderStatus.PAID && 'Ready to ship'}
              {order.status === OrderStatus.SHIPPED &&
                (order.tracking_number ? `Shipped with tracking: ${order.tracking_number}` : 'Shipped')}
              {order.status === OrderStatus.DELIVERED && 'Order delivered'}
              {order.status === OrderStatus.CANCELLED && 'Order cancelled'}
            </p>
          </div>
        </div>

        <div className='flex space-x-4'>
          <div className='text-right'>
            <p className='text-sm text-gray-500'>Total Amount</p>
            <p className='font-bold text-lg'>{formatPrice(order.total)}</p>
          </div>

          <div className='text-right'>
            <p className='text-sm text-gray-500'>Items</p>
            <p className='font-medium'>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='details'>
            <FileBarChart className='h-4 w-4 mr-2' />
            Order Details
          </TabsTrigger>
          <TabsTrigger value='items'>
            <Package className='h-4 w-4 mr-2' />
            Items
          </TabsTrigger>
          <TabsTrigger value='customer'>
            <User className='h-4 w-4 mr-2' />
            Customer
          </TabsTrigger>
          <TabsTrigger value='shipping'>
            <Truck className='h-4 w-4 mr-2' />
            Shipping
          </TabsTrigger>
        </TabsList>

        <TabsContent value='details' className='pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Complete details about this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-2'>Order Information</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Order Number</span>
                      <span className='font-medium'>{order.order_number}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Date</span>
                      <span>{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Status</span>
                      <span>{getStatusBadge(order.status as OrderStatus)}</span>
                    </div>
                    {order.notes && (
                      <div className='pt-2'>
                        <span className='text-gray-500 block'>Notes</span>
                        <span className='bg-gray-50 p-2 block rounded mt-1 text-sm'>{order.notes}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-2'>Payment Information</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Payment Method</span>
                      <span className='font-medium capitalize'>{order.payment_method.replace('_', ' ')}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Payment Status</span>
                      <Badge variant={order.payment_status ? 'success' : ('destructive' as any)}>
                        {order.payment_status ? 'Paid' : 'Unpaid'}
                      </Badge>
                    </div>
                    {order.coupon_code && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Coupon</span>
                        <Badge variant='outline'>{order.coupon_code}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-2'>Order Totals</h3>
                  <div className='space-y-2'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Subtotal</span>
                      <span>{formatPrice(order.subtotal)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Shipping</span>
                      <span>{formatPrice(order.shipping)}</span>
                    </div>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Tax</span>
                      <span>{formatPrice(order.tax)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Discount</span>
                        <span className='text-green-600'>-{formatPrice(order.discount)}</span>
                      </div>
                    )}
                    <Separator className='my-2' />
                    <div className='flex justify-between font-bold'>
                      <span>Total</span>
                      <span>{formatPrice(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='border rounded-lg p-4'>
                <h3 className='font-medium mb-4'>Order Timeline</h3>
                <ol className='relative border-l border-gray-200 ml-3'>
                  <li className='mb-6 ml-6'>
                    <span className='absolute flex items-center justify-center w-6 h-6 bg-blue-100 rounded-full -left-3 ring-8 ring-white'>
                      <ShoppingBag className='w-3 h-3 text-blue-800' />
                    </span>
                    <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900'>
                      Order Placed
                      <span className='bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3'>
                        Created
                      </span>
                    </h3>
                    <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                      {formatDate(order.created_at)}
                    </time>
                    <p className='text-base font-normal text-gray-500'>
                      Customer placed order #{order.order_number} with {order.items.length} items
                    </p>
                  </li>

                  {order.payment_status && (
                    <li className='mb-6 ml-6'>
                      <span className='absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white'>
                        <CreditCard className='w-3 h-3 text-green-800' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900'>
                        Payment Received
                        <span className='bg-green-100 text-green-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3'>
                          Paid
                        </span>
                      </h3>
                      <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                        {/* Assuming payment timestamp is same as order creation for now */}
                        {formatDate(order.created_at)}
                      </time>
                      <p className='text-base font-normal text-gray-500'>
                        Payment received via {order.payment_method.replace('_', ' ')}
                      </p>
                    </li>
                  )}

                  {order.status === OrderStatus.SHIPPED && (
                    <li className='mb-6 ml-6'>
                      <span className='absolute flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full -left-3 ring-8 ring-white'>
                        <Truck className='w-3 h-3 text-indigo-800' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900'>
                        Order Shipped
                        <span className='bg-indigo-100 text-indigo-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3'>
                          Shipped
                        </span>
                      </h3>
                      <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                        {/* We don't have ship date in the data, using updated_at as proxy */}
                        {formatDate(order.updated_at)}
                      </time>
                      <p className='text-base font-normal text-gray-500'>
                        {order.tracking_number
                          ? `Order shipped with tracking number: ${order.tracking_number}`
                          : 'Order shipped to customer'}
                      </p>
                    </li>
                  )}

                  {order.status === OrderStatus.DELIVERED && (
                    <li className='ml-6'>
                      <span className='absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white'>
                        <CheckCircle2 className='w-3 h-3 text-green-800' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900'>
                        Order Delivered
                        <span className='bg-green-100 text-green-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3'>
                          Completed
                        </span>
                      </h3>
                      <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                        {order.delivered_at ? formatDate(order.delivered_at) : formatDate(order.updated_at)}
                      </time>
                      <p className='text-base font-normal text-gray-500'>Customer received the order</p>
                    </li>
                  )}

                  {order.status === OrderStatus.CANCELLED && (
                    <li className='ml-6'>
                      <span className='absolute flex items-center justify-center w-6 h-6 bg-red-100 rounded-full -left-3 ring-8 ring-white'>
                        <X className='w-3 h-3 text-red-800' />
                      </span>
                      <h3 className='flex items-center mb-1 text-lg font-semibold text-gray-900'>
                        Order Cancelled
                        <span className='bg-red-100 text-red-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded ml-3'>
                          Cancelled
                        </span>
                      </h3>
                      <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                        {formatDate(order.updated_at)}
                      </time>
                      <p className='text-base font-normal text-gray-500'>Order was cancelled</p>
                    </li>
                  )}
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='items' className='pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
              <CardDescription>Products included in this order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {order.items.map((item, index) => (
                  <div key={index} className='border rounded-lg overflow-hidden'>
                    <div className='flex flex-col sm:flex-row p-4'>
                      <div className='w-full sm:w-24 h-24 bg-gray-100 rounded overflow-hidden mb-4 sm:mb-0 sm:mr-4 flex-shrink-0'>
                        <img
                          src={item.product_image || '/placeholder.png'}
                          alt={item.product_name}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <div className='flex-grow'>
                        <h3 className='font-medium'>{item.product_name}</h3>
                        <p className='text-sm text-gray-500'>
                          Qty: {item.quantity} × {formatPrice(item.price)}
                        </p>
                        {item.variant && Object.keys(item.variant).length > 0 && (
                          <div className='mt-1 space-x-2'>
                            {Object.entries(item.variant).map(([key, value]) => (
                              <Badge key={key} variant='outline' className='capitalize'>
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className='mt-4 sm:mt-0 text-right'>
                        <p className='font-semibold'>{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className='border-t pt-4 mt-6'>
                  <Accordion type='single' collapsible>
                    <AccordionItem value='order-totals'>
                      <AccordionTrigger>Order Totals</AccordionTrigger>
                      <AccordionContent>
                        <div className='space-y-2 py-2'>
                          <div className='flex justify-between'>
                            <span className='text-gray-500'>Subtotal</span>
                            <span>{formatPrice(order.subtotal)}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-500'>Shipping</span>
                            <span>{formatPrice(order.shipping)}</span>
                          </div>
                          <div className='flex justify-between'>
                            <span className='text-gray-500'>Tax</span>
                            <span>{formatPrice(order.tax)}</span>
                          </div>
                          {order.discount > 0 && (
                            <div className='flex justify-between'>
                              <span className='text-gray-500'>Discount</span>
                              <span className='text-green-600'>-{formatPrice(order.discount)}</span>
                            </div>
                          )}
                          <Separator className='my-2' />
                          <div className='flex justify-between font-bold'>
                            <span>Total</span>
                            <span>{formatPrice(order.total)}</span>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='customer' className='pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
              <CardDescription>Details about the buyer</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-4'>Shipping Address</h3>
                  <div className='flex items-start'>
                    <MapPin className='h-4 w-4 mt-0.5 mr-2 text-gray-400' />
                    <div>
                      <p className='font-medium'>John Doe</p>
                      <p>123 Main Street</p>
                      <p>Apt 4B</p>
                      <p>New York, NY 10001</p>
                      <p>United States</p>
                      <p className='mt-2 text-gray-500'>(123) 456-7890</p>
                    </div>
                  </div>
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-4'>Customer Details</h3>
                  <div className='space-y-3'>
                    <div className='flex'>
                      <User className='h-4 w-4 mt-0.5 mr-2 text-gray-400' />
                      <div>
                        <p className='text-sm text-gray-500'>Name</p>
                        <p>John Doe</p>
                      </div>
                    </div>
                    <div className='flex'>
                      <Phone className='h-4 w-4 mt-0.5 mr-2 text-gray-400' />
                      <div>
                        <p className='text-sm text-gray-500'>Phone</p>
                        <p>(123) 456-7890</p>
                      </div>
                    </div>
                    <Button variant='outline' size='sm' className='mt-2'>
                      Contact Customer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='shipping' className='pt-4'>
          <Card>
            <CardHeader>
              <CardTitle>Shipping Information</CardTitle>
              <CardDescription>Delivery details and tracking</CardDescription>
            </CardHeader>
            <CardContent>
              {order.status === OrderStatus.PENDING && (
                <Alert className='mb-4'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertTitle>Payment Not Received</AlertTitle>
                  <AlertDescription>This order is awaiting payment and cannot be shipped yet.</AlertDescription>
                </Alert>
              )}

              {order.status === OrderStatus.PAID && (
                <Alert className='mb-4'>
                  <Package className='h-4 w-4' />
                  <AlertTitle>Ready to Ship</AlertTitle>
                  <AlertDescription>
                    This order has been paid and is ready to be shipped. Click "Ship Order" to update the status.
                  </AlertDescription>
                </Alert>
              )}

              {order.status === OrderStatus.SHIPPED && (
                <Alert className='mb-4 bg-indigo-50 border-indigo-200'>
                  <Truck className='h-4 w-4 text-indigo-900' />
                  <AlertTitle className='text-indigo-900'>Order Shipped</AlertTitle>
                  <AlertDescription className='text-indigo-800'>
                    This order has been shipped to the customer.
                    {order.tracking_number && (
                      <p className='mt-2'>
                        Tracking Number: <span className='font-medium'>{order.tracking_number}</span>
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {order.status === OrderStatus.DELIVERED && (
                <Alert className='mb-4 bg-green-50 border-green-200'>
                  <CheckCircle2 className='h-4 w-4 text-green-900' />
                  <AlertTitle className='text-green-900'>Order Delivered</AlertTitle>
                  <AlertDescription className='text-green-800'>
                    This order has been delivered to the customer.
                    {order.delivered_at && (
                      <p className='mt-2'>
                        Delivered on: <span className='font-medium'>{formatDate(order.delivered_at)}</span>
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {order.status === OrderStatus.CANCELLED && (
                <Alert className='mb-4 bg-red-50 border-red-200'>
                  <X className='h-4 w-4 text-red-900' />
                  <AlertTitle className='text-red-900'>Order Cancelled</AlertTitle>
                  <AlertDescription className='text-red-800'>
                    This order has been cancelled and will not be shipped.
                  </AlertDescription>
                </Alert>
              )}

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-4'>Shipping Details</h3>
                  <div className='space-y-3'>
                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Status</span>
                      <span>{getStatusBadge(order.status as OrderStatus)}</span>
                    </div>

                    {order.tracking_number && (
                      <div className='flex justify-between'>
                        <span className='text-gray-500'>Tracking Number</span>
                        <span className='font-medium'>{order.tracking_number}</span>
                      </div>
                    )}

                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Shipping Method</span>
                      <span>Standard Shipping</span>
                    </div>

                    <div className='flex justify-between'>
                      <span className='text-gray-500'>Shipping Cost</span>
                      <span>{formatPrice(order.shipping)}</span>
                    </div>
                  </div>

                  {order.status === OrderStatus.PAID && (
                    <Button className='w-full mt-4' onClick={() => setIsShippingDialogOpen(true)}>
                      <Truck className='h-4 w-4 mr-2' />
                      Ship Order
                    </Button>
                  )}

                  {order.status === OrderStatus.SHIPPED && (
                    <Button className='w-full mt-4' onClick={handleDeliverOrder} disabled={isDelivering}>
                      {isDelivering && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
                      <Check className='h-4 w-4 mr-2' />
                      Mark as Delivered
                    </Button>
                  )}
                </div>

                <div className='border rounded-lg p-4'>
                  <h3 className='font-medium text-gray-500 text-sm mb-4'>Shipping Address</h3>
                  <div className='flex items-start'>
                    <MapPin className='h-4 w-4 mt-0.5 mr-2 text-gray-400' />
                    <div>
                      <p className='font-medium'>John Doe</p>
                      <p>123 Main Street</p>
                      <p>Apt 4B</p>
                      <p>New York, NY 10001</p>
                      <p>United States</p>
                      <p className='mt-2 text-gray-500'>(123) 456-7890</p>
                    </div>
                  </div>

                  {order.status === OrderStatus.SHIPPED && (
                    <Button className='w-full mt-4' variant='outline' onClick={() => setIsLabelDialogOpen(true)}>
                      <FileText className='h-4 w-4 mr-2' />
                      Shipping Label
                    </Button>
                  )}
                </div>
              </div>

              {/* For shipped orders, show a tracking timeline */}
              {(order.status === OrderStatus.SHIPPED || order.status === OrderStatus.DELIVERED) && (
                <div className='mt-6 border rounded-lg p-4'>
                  <h3 className='font-medium mb-4'>Tracking Timeline</h3>
                  <ol className='relative border-l border-gray-200 ml-3'>
                    <li className='mb-6 ml-6'>
                      <span className='absolute flex items-center justify-center w-6 h-6 bg-indigo-100 rounded-full -left-3 ring-8 ring-white'>
                        <Package className='w-3 h-3 text-indigo-800' />
                      </span>
                      <h3 className='font-semibold'>Order Shipped</h3>
                      <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                        {formatDate(order.updated_at)}
                      </time>
                      <p className='text-sm text-gray-500'>Your order has been shipped via Standard Shipping</p>
                    </li>

                    {order.status === OrderStatus.DELIVERED && (
                      <li className='ml-6'>
                        <span className='absolute flex items-center justify-center w-6 h-6 bg-green-100 rounded-full -left-3 ring-8 ring-white'>
                          <CheckCircle2 className='w-3 h-3 text-green-800' />
                        </span>
                        <h3 className='font-semibold'>Order Delivered</h3>
                        <time className='block mb-2 text-sm font-normal leading-none text-gray-400'>
                          {order.delivered_at ? formatDate(order.delivered_at) : formatDate(order.updated_at)}
                        </time>
                        <p className='text-sm text-gray-500'>Order has been delivered to the customer</p>
                      </li>
                    )}
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ship Order Dialog */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent className='sm:max-w-[600px]'>
          <DialogHeader>
            <DialogTitle>Ship Order</DialogTitle>
            <DialogDescription>
              Enter shipping information to mark this order as shipped and notify the customer.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-6 py-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='col-span-2'>
                <Label htmlFor='tracking'>Tracking Number</Label>
                <Input
                  id='tracking'
                  placeholder='Enter tracking number'
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor='carrier'>Shipping Carrier</Label>
                <Select value={carrier} onValueChange={setCarrier}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select carrier' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='default'>Select a carrier</SelectItem>
                    <SelectItem value='usps'>USPS</SelectItem>
                    <SelectItem value='ups'>UPS</SelectItem>
                    <SelectItem value='fedex'>FedEx</SelectItem>
                    <SelectItem value='dhl'>DHL</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='estimated_delivery'>Estimated Delivery (Days)</Label>
                <Select value={estimatedDeliveryDays} onValueChange={setEstimatedDeliveryDays}>
                  <SelectTrigger>
                    <SelectValue placeholder='Select days' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='3'>3 days</SelectItem>
                    <SelectItem value='5'>5 days</SelectItem>
                    <SelectItem value='7'>7 days</SelectItem>
                    <SelectItem value='10'>10 days</SelectItem>
                    <SelectItem value='14'>14 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor='create-shipment' className='flex items-center justify-between'>
                Package Information
                <span className='text-sm text-gray-500'>Required for creating shipments</span>
              </Label>
              <div className='grid grid-cols-2 gap-4 mt-2'>
                <div>
                  <Label htmlFor='package-weight' className='text-sm'>
                    Weight (kg)
                  </Label>
                  <Input
                    id='package-weight'
                    placeholder='0.5'
                    type='number'
                    step='0.1'
                    min='0.1'
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='shipping-cost' className='text-sm'>
                    Shipping Cost ($)
                  </Label>
                  <Input
                    id='shipping-cost'
                    placeholder='10.00'
                    type='number'
                    step='0.01'
                    min='0'
                    value={shippingCost}
                    onChange={(e) => setShippingCost(e.target.value)}
                  />
                </div>
              </div>

              <div className='grid grid-cols-3 gap-4 mt-2'>
                <div>
                  <Label htmlFor='package-length' className='text-sm'>
                    Length (cm)
                  </Label>
                  <Input
                    id='package-length'
                    placeholder='20'
                    type='number'
                    step='0.1'
                    min='1'
                    value={packageLength}
                    onChange={(e) => setPackageLength(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='package-width' className='text-sm'>
                    Width (cm)
                  </Label>
                  <Input
                    id='package-width'
                    placeholder='15'
                    type='number'
                    step='0.1'
                    min='1'
                    value={packageWidth}
                    onChange={(e) => setPackageWidth(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor='package-height' className='text-sm'>
                    Height (cm)
                  </Label>
                  <Input
                    id='package-height'
                    placeholder='10'
                    type='number'
                    step='0.1'
                    min='1'
                    value={packageHeight}
                    onChange={(e) => setPackageHeight(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor='notes'>Notes (Optional)</Label>
              <Textarea
                id='notes'
                placeholder='Any additional shipping information'
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsShippingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateShipment} disabled={isShipping || isCreatingShipment}>
              {(isShipping || isCreatingShipment) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {isCreatingShipment ? 'Creating Shipment...' : 'Ship Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Order Dialog */}
      <Dialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <Label htmlFor='cancel-reason'>Cancellation Reason</Label>
            <Textarea
              id='cancel-reason'
              placeholder='Please provide a reason for cancellation'
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className='mt-2'
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCancelDialogOpen(false)}>
              No, Keep Order
            </Button>
            <Button variant='destructive' onClick={handleCancelOrder} disabled={isCancelling}>
              {isCancelling && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Label Dialog */}
      <Dialog open={isLabelDialogOpen} onOpenChange={setIsLabelDialogOpen}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Shipping Label</DialogTitle>
            <DialogDescription>Generate or download the shipping label for this order.</DialogDescription>
          </DialogHeader>

          <div className='py-4 space-y-4'>
            {!shippingLabelUrl ? (
              <>
                <Alert>
                  <FileText className='h-4 w-4' />
                  <AlertTitle>Create Shipping Label</AlertTitle>
                  <AlertDescription>
                    Generate a shipping label for this order to print out and attach to your package.
                  </AlertDescription>
                </Alert>

                <Button className='w-full' onClick={handleGenerateLabel} disabled={isGeneratingLabel}>
                  {isGeneratingLabel ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className='mr-2 h-4 w-4' />
                      Generate Shipping Label
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className='border p-4 rounded-md'>
                  <div className='bg-gray-100 p-4 rounded mb-4 text-center'>
                    <p className='text-sm text-gray-500 mb-2'>Shipping Label Preview</p>
                    <div className='aspect-w-8 aspect-h-11 bg-white border'>
                      {/* This would be replaced with the actual shipping label preview */}
                      <div className='flex items-center justify-center h-full'>
                        <FileText className='h-16 w-16 text-gray-400' />
                      </div>
                    </div>
                  </div>

                  <div className='flex flex-col space-y-2'>
                    <Button onClick={() => window.open(shippingLabelUrl, '_blank')}>
                      <Download className='mr-2 h-4 w-4' />
                      Download Label
                    </Button>

                    <Button variant='outline' onClick={() => window.print()}>
                      <FileText className='mr-2 h-4 w-4' />
                      Print Label
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsLabelDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Label Preview Modal */}
      <Dialog open={showLabelPreview} onOpenChange={setShowLabelPreview}>
        <DialogContent className='sm:max-w-[700px] max-h-[90vh] overflow-auto'>
          <DialogHeader>
            <DialogTitle>Shipping Label</DialogTitle>
          </DialogHeader>

          <div className='py-4'>
            {shippingLabelUrl ? (
              <div className='bg-white border rounded p-4'>
                <img src={shippingLabelUrl} alt='Shipping Label' className='max-w-full' />
              </div>
            ) : (
              <div className='text-center p-8 bg-gray-50 rounded'>
                <FileText className='h-16 w-16 text-gray-400 mx-auto mb-4' />
                <p>No shipping label available</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowLabelPreview(false)}>
              Close
            </Button>
            {shippingLabelUrl && (
              <Button onClick={() => window.open(shippingLabelUrl, '_blank')}>
                <Download className='mr-2 h-4 w-4' />
                Download
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

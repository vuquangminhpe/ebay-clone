/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useOrder, useCancelOrder } from '@/hooks/useOrder'
import { useShipmentByOrderId } from '@/hooks/useShipping'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  ShoppingBag,
  Clock,
  Truck,
  Package,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  MessageSquare,
  FileText,
  Download
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { OrderStatus } from '@/types/Order.type'
import { Button } from '@/Components/ui/button'

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const [cancelReason, setCancelReason] = useState('')
  const [isCancelling, setIsCancelling] = useState(false)

  const { data: order, isLoading, error } = useOrder(orderId || '')
  const { data: shipment } = useShipmentByOrderId(orderId || '')
  const { mutate: cancelOrderMutate, isPending: cancelling } = useCancelOrder()

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Get order status icon and text
  const getStatusInfo = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return {
          icon: <Clock className='h-5 w-5 text-yellow-500' />,
          text: 'Pending',
          description: 'Your order has been received and is awaiting payment.',
          badge: (
            <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
              Pending
            </Badge>
          ),
          color: 'text-yellow-700'
        }
      case OrderStatus.PAID:
        return {
          icon: <ShoppingBag className='h-5 w-5 text-blue-500' />,
          text: 'Paid',
          description: 'Your order has been confirmed and is being processed.',
          badge: (
            <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
              Paid
            </Badge>
          ),
          color: 'text-blue-700'
        }
      case OrderStatus.SHIPPED:
        return {
          icon: <Truck className='h-5 w-5 text-indigo-500' />,
          text: 'Shipped',
          description: 'Your order has been shipped and is on its way.',
          badge: (
            <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200'>
              Shipped
            </Badge>
          ),
          color: 'text-indigo-700'
        }
      case OrderStatus.DELIVERED:
        return {
          icon: <CheckCircle2 className='h-5 w-5 text-green-500' />,
          text: 'Delivered',
          description: 'Your order has been delivered.',
          badge: (
            <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
              Delivered
            </Badge>
          ),
          color: 'text-green-700'
        }
      case OrderStatus.CANCELLED:
        return {
          icon: <XCircle className='h-5 w-5 text-red-500' />,
          text: 'Cancelled',
          description: 'Your order has been cancelled.',
          badge: (
            <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
              Cancelled
            </Badge>
          ),
          color: 'text-red-700'
        }
      default:
        return {
          icon: <Package className='h-5 w-5 text-gray-500' />,
          text: 'Unknown',
          description: 'The status of your order is unknown.',
          badge: <Badge variant='outline'>Unknown</Badge>,
          color: 'text-gray-700'
        }
    }
  }

  // Handle cancel order
  const handleCancelOrder = () => {
    if (!orderId) return

    cancelOrderMutate(
      {
        order_id: orderId,
        params: { reason: cancelReason }
      },
      {
        onSuccess: () => {
          toast.success('Order cancelled successfully')
          setIsCancelling(false)
        },
        onError: (error: any) => {
          toast.error(error.data?.message || 'Failed to cancel order')
        }
      }
    )
  }

  // Check if order is cancellable
  const isCancellable =
    order && (order.result.status === OrderStatus.PENDING || order.result.status === OrderStatus.PAID)

  // Loading state
  if (isLoading) {
    return (
      <div className='flex justify-center py-12'>
        <Loader2 className='h-8 w-8 text-indigo-600 animate-spin' />
      </div>
    )
  }

  // Error state
  if (error || !order) {
    return (
      <div className='max-w-4xl mx-auto py-12 text-center'>
        <AlertTriangle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
        <h1 className='text-2xl font-bold mb-2'>Order Not Found</h1>
        <p className='text-gray-600 mb-6'>We couldn't find the order you're looking for.</p>
        <Button onClick={() => navigate('/orders')}>View Your Orders</Button>
      </div>
    )
  }

  // Get status info
  const statusInfo = getStatusInfo(order.result.status)

  return (
    <div className='max-w-4xl mx-auto py-8'>
      <div className='flex items-center mb-6'>
        <Button variant='ghost' size='sm' className='mr-4' onClick={() => navigate('/orders')}>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Orders
        </Button>
        <h1 className='text-2xl font-bold'>Order Details</h1>
      </div>

      <Card className='mb-6'>
        <CardHeader className='pb-3'>
          <div className='flex justify-between items-start'>
            <div>
              <CardTitle>Order #{order.result.order_number}</CardTitle>
              <CardDescription>Placed on {formatDate(order.result.created_at)}</CardDescription>
            </div>
            {statusInfo.badge}
          </div>
        </CardHeader>

        <CardContent>
          <div className='bg-gray-50 p-4 rounded-lg mb-6'>
            <div className='flex items-center'>
              {statusInfo.icon}
              <div className='ml-3'>
                <p className={`font-medium ${statusInfo.color}`}>{statusInfo.text}</p>
                <p className='text-sm text-gray-600'>{statusInfo.description}</p>
              </div>
            </div>
          </div>

          {/* Order timeline */}
          <div className='mb-6'>
            <h3 className='font-medium mb-4'>Order Timeline</h3>
            <div className='relative border-l border-gray-200 pl-8 pb-2 ml-2.5'>
              <div className='absolute w-5 h-5 bg-indigo-600 rounded-full -left-2.5 top-0 flex items-center justify-center'>
                <div className='w-3 h-3 bg-white rounded-full'></div>
              </div>
              <div className='mb-6'>
                <p className='font-medium'>Order Placed</p>
                <p className='text-sm text-gray-500'>{formatDate(order.result.created_at)}</p>
              </div>

              {order.result.status !== OrderStatus.PENDING && (
                <div className='relative border-l border-gray-200 ml-2.5 -left-8 pl-8 pb-2'>
                  <div className='absolute w-5 h-5 bg-blue-600 rounded-full -left-2.5 top-0 flex items-center justify-center'>
                    <div className='w-3 h-3 bg-white rounded-full'></div>
                  </div>
                  <div className='mb-6'>
                    <p className='font-medium'>Payment Confirmed</p>
                    <p className='text-sm text-gray-500'>
                      {order.result.payment_status ? formatDate(order.result.created_at) : 'Pending'}
                    </p>
                  </div>
                </div>
              )}

              {order.result.status === OrderStatus.SHIPPED ||
                (order.result.status === OrderStatus.DELIVERED && (
                  <div className='relative border-l border-gray-200 ml-2.5 -left-8 pl-8 pb-2'>
                    <div className='absolute w-5 h-5 bg-indigo-600 rounded-full -left-2.5 top-0 flex items-center justify-center'>
                      <div className='w-3 h-3 bg-white rounded-full'></div>
                    </div>
                    <div className='mb-6'>
                      <p className='font-medium'>Order Shipped</p>
                      <p className='text-sm text-gray-500'>{formatDate(shipment?.result?.shipped_at)}</p>
                      {order.result.tracking_number && (
                        <p className='text-sm'>
                          Tracking #: <span className='font-medium'>{order.result.tracking_number}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ))}

              {order.result.status === OrderStatus.DELIVERED && (
                <div className='relative ml-2.5 -left-8 pl-8'>
                  <div className='absolute w-5 h-5 bg-green-600 rounded-full -left-2.5 top-0 flex items-center justify-center'>
                    <div className='w-3 h-3 bg-white rounded-full'></div>
                  </div>
                  <div>
                    <p className='font-medium'>Order Delivered</p>
                    <p className='text-sm text-gray-500'>{formatDate(order.result.delivered_at)}</p>
                  </div>
                </div>
              )}

              {order.result.status === OrderStatus.CANCELLED && (
                <div className='relative ml-2.5 -left-8 pl-8'>
                  <div className='absolute w-5 h-5 bg-red-600 rounded-full -left-2.5 top-0 flex items-center justify-center'>
                    <div className='w-3 h-3 bg-white rounded-full'></div>
                  </div>
                  <div>
                    <p className='font-medium'>Order Cancelled</p>
                    <p className='text-sm text-gray-500'>{formatDate(order.result.updated_at)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className='mb-6'>
            <h3 className='font-medium mb-4'>Items in Your Order</h3>
            <div className='border rounded-lg overflow-hidden'>
              <div className='space-y-4 divide-y'>
                {order.result.items.map((item, index) => (
                  <div key={index} className='p-4'>
                    <div className='flex items-center'>
                      <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4'>
                        <img src={item.product_image} alt={item.product_name} className='w-full h-full object-cover' />
                      </div>
                      <div className='flex-1'>
                        <Link to={`/products/${item.product_id}`} className='font-medium text-blue-600 hover:underline'>
                          {item.product_name}
                        </Link>
                        <p className='text-sm text-gray-500'>Quantity: {item.quantity}</p>
                        {item.variant && (
                          <p className='text-xs text-gray-500'>
                            Variant:{' '}
                            {Object.entries(item.variant)
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                      <div className='text-right'>
                        <p className='font-semibold'>{formatPrice(item.price)}</p>
                        <p className='text-sm text-gray-500'>{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>

                    {/* Item actions */}
                    {order.result.status === OrderStatus.DELIVERED && (
                      <div className='mt-3 flex justify-end'>
                        <Button variant='outline' size='sm'>
                          Write a Review
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            {/* Shipping info */}
            <div>
              <h3 className='font-medium mb-3'>Shipping Information</h3>
              {/* <div className='border rounded-lg p-4'>
                <p className='font-medium'>{order.result.shipping_address?.name}</p>
                <p>{order.result.shipping_address?.phone}</p>
                <p>
                  {order.result.shipping_address?.address_line1}
                  {order.result.shipping_address?.address_line2 && `, ${order.result.shipping_address.address_line2}`}
                </p>
                <p>
                  {order.result.shipping_address?.city}, {order.result.shipping_address?.state}{' '}
                  {order.result.shipping_address?.postal_code}
                </p>
                <p>{order.result.shipping_address?.country}</p>

                {shipment && (
                  <div className='mt-4 pt-4 border-t'>
                    <p className='font-medium'>Shipping Details</p>
                    <p className='text-sm'>Carrier: {shipment.result.carrier || 'Standard Shipping'}</p>
                    {shipment.tracking_number && (
                      <div className='flex items-center mt-2'>
                        <p className='text-sm'>Tracking #: {shipment.result.tracking_number}</p>
                        <Button variant='ghost' size='sm' className='ml-2 h-7 text-indigo-600' asChild>
                          <Link to={`/track/${shipment.tracking_number}`}>Track</Link>
                        </Button>
                      </div>
                    )}
                    {shipment.estimated_delivery_date && (
                      <p className='text-sm mt-1'>Estimated Delivery: {formatDate(shipment.result.estimated_delivery_date)}</p>
                    )}
                  </div>
                )}
              </div> */}
            </div>

            {/* Payment info */}
            <div>
              <h3 className='font-medium mb-3'>Payment Information</h3>
              <div className='border rounded-lg p-4'>
                <p className='font-medium capitalize'>{order.result.payment_method.replace('_', ' ')}</p>
                <p className='text-sm text-gray-500 mb-2'>
                  Payment Status: {order.result.payment_status ? 'Paid' : 'Pending'}
                </p>

                <div className='mt-4 pt-4 border-t'>
                  <div className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Subtotal:</span>
                      <span>{formatPrice(order.result.subtotal)}</span>
                    </div>
                    {order.result.discount > 0 && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-green-600'>Discount:</span>
                        <span className='text-green-600'>-{formatPrice(order.result.discount)}</span>
                      </div>
                    )}
                    {order.result.coupon_code && (
                      <div className='flex justify-between text-sm'>
                        <span className='text-gray-600'>Coupon:</span>
                        <span>{order.result.coupon_code}</span>
                      </div>
                    )}
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Shipping:</span>
                      <span>
                        {order.result.shipping === 0 ? (
                          <span className='text-green-600'>Free</span>
                        ) : (
                          formatPrice(order.result.shipping)
                        )}
                      </span>
                    </div>
                    <div className='flex justify-between text-sm'>
                      <span className='text-gray-600'>Tax:</span>
                      <span>{formatPrice(order.result.tax)}</span>
                    </div>
                    <Separator className='my-2' />
                    <div className='flex justify-between font-semibold'>
                      <span>Total:</span>
                      <span>{formatPrice(order.result.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional order info */}
          <div className='mt-6'>
            <Accordion type='single' collapsible className='w-full'>
              {order.result.notes && (
                <AccordionItem value='notes'>
                  <AccordionTrigger className='text-sm font-medium'>Order Notes</AccordionTrigger>
                  <AccordionContent>
                    <p className='text-gray-600'>{order.result.notes}</p>
                  </AccordionContent>
                </AccordionItem>
              )}

              <AccordionItem value='help'>
                <AccordionTrigger className='text-sm font-medium'>Need Help?</AccordionTrigger>
                <AccordionContent>
                  <div className='space-y-4'>
                    <p className='text-gray-600'>
                      If you have any questions or issues with your order, please contact our customer support.
                    </p>

                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                      <Button variant='outline' className='flex items-center justify-center'>
                        <MessageSquare className='mr-2 h-4 w-4' />
                        Contact Support
                      </Button>
                      <Button variant='outline' className='flex items-center justify-center'>
                        <FileText className='mr-2 h-4 w-4' />
                        Report an Issue
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {order.result.status === OrderStatus.DELIVERED && (
                <AccordionItem value='invoice'>
                  <AccordionTrigger className='text-sm font-medium'>Invoice</AccordionTrigger>
                  <AccordionContent>
                    <div className='flex items-center justify-between'>
                      <p className='text-gray-600'>You can download the invoice for your records.</p>
                      <Button variant='outline' size='sm' className='flex items-center'>
                        <Download className='mr-2 h-4 w-4' />
                        Download Invoice
                      </Button>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        </CardContent>

        <CardFooter className='flex justify-between border-t pt-6'>
          <Button variant='outline' onClick={() => navigate('/orders')}>
            Back to Orders
          </Button>

          <div className='flex gap-2'>
            {/* Order actions based on status */}
            {isCancellable && (
              <Dialog open={isCancelling} onOpenChange={setIsCancelling}>
                <DialogTrigger asChild>
                  <Button variant='outline' className='text-red-600 hover:bg-red-50'>
                    Cancel Order
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Order</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to cancel this order? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>

                  <div className='py-4'>
                    <label htmlFor='cancel-reason' className='block text-sm font-medium mb-2'>
                      Reason for Cancellation (Optional)
                    </label>
                    <Textarea
                      id='cancel-reason'
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      placeholder='Please provide a reason for cancelling this order'
                      className='resize-none'
                    />
                  </div>

                  <DialogFooter>
                    <Button variant='outline' onClick={() => setIsCancelling(false)}>
                      Keep Order
                    </Button>
                    <Button variant='destructive' onClick={handleCancelOrder} disabled={cancelling}>
                      {cancelling ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          Cancelling...
                        </>
                      ) : (
                        'Cancel Order'
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {order.result.status === OrderStatus.SHIPPED && <Button>Track Package</Button>}

            {order.result.status === OrderStatus.DELIVERED && <Button>Buy Again</Button>}

            <Button variant='outline'>
              <MessageSquare className='mr-2 h-4 w-4' />
              Contact Seller
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

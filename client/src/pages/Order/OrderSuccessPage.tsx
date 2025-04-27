import { useEffect } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useOrder } from '@/hooks/useOrder'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, ShoppingBag, ExternalLink, ChevronRight, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/Components/ui/button'

export default function OrderSuccessPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()

  const { data: order, isLoading, error } = useOrder(orderId || '')

  // Redirect if no orderId provided
  useEffect(() => {
    if (!orderId) {
      navigate('/orders')
    }
  }, [orderId, navigate])

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
      day: 'numeric'
    })
  }

  if (isLoading) {
    return (
      <div className='container max-w-3xl mx-auto py-12 flex justify-center'>
        <Loader2 className='h-8 w-8 text-indigo-600 animate-spin' />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className='container max-w-3xl mx-auto py-12 text-center'>
        <AlertTriangle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
        <h1 className='text-2xl font-bold mb-2'>Order Not Found</h1>
        <p className='text-gray-600 mb-6'>We couldn't find the order you're looking for.</p>
        <Button onClick={() => navigate('/orders')}>View Your Orders</Button>
      </div>
    )
  }

  return (
    <div className='container max-w-3xl mx-auto py-12'>
      <Card className='border-none shadow-none'>
        <CardContent className='p-0'>
          <div className='text-center mb-8'>
            <div className='rounded-full bg-green-100 w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <CheckCircle2 className='h-8 w-8 text-green-600' />
            </div>
            <h1 className='text-2xl font-bold mb-2'>Order Placed Successfully!</h1>
            <p className='text-gray-600'>Thank you for your purchase. Your order has been confirmed.</p>
          </div>

          <div className='bg-gray-50 p-6 rounded-lg mb-8'>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Order Number</p>
                <p className='font-semibold'>{order?.result?.order_number}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Date Placed</p>
                <p className='font-semibold'>{formatDate(order?.result?.created_at)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Order Status</p>
                <p className='font-semibold capitalize'>{order?.result?.status}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Total Amount</p>
                <p className='font-semibold'>{formatPrice(order?.result?.total)}</p>
              </div>
            </div>
          </div>

          <h2 className='text-lg font-semibold mb-4'>Order Items</h2>

          <div className='space-y-4 mb-8'>
            {order?.result?.items.map((item, index) => (
              <div key={index} className='flex items-center py-3 border-b last:border-0'>
                <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4'>
                  <img src={item.product_image} alt={item.product_name} className='w-full h-full object-cover' />
                </div>
                <div className='flex-1'>
                  <Link to={`/products/${item.product_id}`} className='font-medium text-blue-600 hover:underline'>
                    {item.product_name}
                  </Link>
                  <p className='text-sm text-gray-500'>Quantity: {item.quantity}</p>
                </div>
                <div className='text-right'>
                  <p className='font-semibold'>{formatPrice(item.price)}</p>
                  <p className='text-sm text-gray-500'>{formatPrice(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <Separator className='my-6' />

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
            <div>
              <h3 className='font-medium mb-2'>Shipping Address</h3>
              <div className='bg-gray-50 p-4 rounded'>
                <p className='font-medium'>{order?.result?.shipping_address?.name}</p>
                <p>{order?.result?.shipping_address?.phone}</p>
                <p>
                  {order?.result?.shipping_address?.address_line1}
                  {order?.result?.shipping_address?.address_line2 &&
                    `, ${order?.result?.shipping_address.address_line2}`}
                </p>
                <p>
                  {order?.result?.shipping_address?.city}, {order?.result?.shipping_address?.state}{' '}
                  {order?.result?.shipping_address?.postal_code}
                </p>
                <p>{order?.result?.shipping_address?.country}</p>
              </div>
            </div>

            <div>
              <h3 className='font-medium mb-2'>Payment Information</h3>
              <div className='bg-gray-50 p-4 rounded'>
                <p className='font-medium capitalize'>{order?.result?.payment_method.replace('_', ' ')}</p>
                <p className='text-sm text-gray-500'>
                  Payment Status: {order?.result?.payment_status ? 'Paid' : 'Pending'}
                </p>
                {order?.result?.payment_details && (
                  <p className='text-sm text-gray-500'>
                    Transaction ID: {order?.result?.payment_details.transaction_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className='bg-gray-50 p-4 rounded mb-8'>
            <h3 className='font-medium mb-2'>Order Summary</h3>
            <div className='space-y-2'>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Subtotal:</span>
                <span>{formatPrice(order?.result?.subtotal)}</span>
              </div>
              {order?.result?.discount > 0 && (
                <div className='flex justify-between text-green-600'>
                  <span>Discount:</span>
                  <span>-{formatPrice(order?.result?.discount)}</span>
                </div>
              )}
              <div className='flex justify-between'>
                <span className='text-gray-600'>Shipping:</span>
                <span>
                  {order?.result?.shipping === 0 ? (
                    <span className='text-green-600'>Free</span>
                  ) : (
                    formatPrice(order?.result?.shipping)
                  )}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-600'>Tax:</span>
                <span>{formatPrice(order?.result?.tax)}</span>
              </div>
              <Separator className='my-2' />
              <div className='flex justify-between font-semibold'>
                <span>Total:</span>
                <span>{formatPrice(order?.result?.total)}</span>
              </div>
            </div>
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button asChild variant='outline' className='flex items-center'>
              <Link to='/orders'>
                <ShoppingBag className='mr-2 h-4 w-4' />
                View All Orders
              </Link>
            </Button>
            <Button asChild className='flex items-center'>
              <Link to={`/orders/${order?.result?._id}`}>
                <ExternalLink className='mr-2 h-4 w-4' />
                Order Details
                <ChevronRight className='ml-2 h-4 w-4' />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

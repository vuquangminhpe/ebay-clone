/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useBuyerOrders } from '@/hooks/useOrder'
import { OrderStatus } from '@/types/Order.type'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Package, ShoppingBag, Clock, Truck, CheckCircle2, XCircle, Search, ChevronRight, FilterX } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/Components/ui/button'

export default function Orders() {
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [dateRange, setDateRange] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState('created_at-desc')

  // Get orders based on filters
  const { data: ordersData, isLoading } = useBuyerOrders({
    page,
    limit: 10,
    status,
    date_from: dateRange === 'last-30' ? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
    date_to: dateRange === 'last-30' ? new Date().toISOString() : undefined,
    sort: sortBy.split('-')[0],
    order: sortBy.split('-')[1] as 'asc' | 'desc'
  })

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

  // Get order status badge
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            Pending
          </Badge>
        )
      case OrderStatus.PAID:
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
            Paid
          </Badge>
        )
      case OrderStatus.SHIPPED:
        return (
          <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200'>
            Shipped
          </Badge>
        )
      case OrderStatus.DELIVERED:
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            Delivered
          </Badge>
        )
      case OrderStatus.CANCELLED:
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  // Get order status icon
  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return <Clock className='h-5 w-5 text-yellow-500' />
      case OrderStatus.PAID:
        return <ShoppingBag className='h-5 w-5 text-blue-500' />
      case OrderStatus.SHIPPED:
        return <Truck className='h-5 w-5 text-indigo-500' />
      case OrderStatus.DELIVERED:
        return <CheckCircle2 className='h-5 w-5 text-green-500' />
      case OrderStatus.CANCELLED:
        return <XCircle className='h-5 w-5 text-red-500' />
      default:
        return <Package className='h-5 w-5 text-gray-500' />
    }
  }

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Scroll to top
    window.scrollTo(0, 0)
  }

  // Calculate pagination
  const renderPagination = () => {
    if (!ordersData?.result?.pagination) return null

    const { page, totalPages } = ordersData.result.pagination
    const items = []

    // Previous button
    items.push(
      <PaginationItem key='prev'>
        <PaginationPrevious
          onClick={() => page > 1 && handlePageChange(page - 1)}
          className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    )

    // Page numbers
    const displayPages = []

    // Always show first page
    displayPages.push(1)

    // Add ellipsis if needed
    if (page > 3) {
      displayPages.push('ellipsis1')
    }

    // Add pages around current page
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (!displayPages.includes(i)) {
        displayPages.push(i)
      }
    }

    // Add ellipsis if needed
    if (page < totalPages - 2) {
      displayPages.push('ellipsis2')
    }

    // Always show last page if not already included
    if (totalPages > 1 && !displayPages.includes(totalPages)) {
      displayPages.push(totalPages)
    }

    // Render pages
    displayPages.forEach((p) => {
      if (p === 'ellipsis1' || p === 'ellipsis2') {
        items.push(
          <PaginationItem key={p}>
            <span className='px-4 py-2'>...</span>
          </PaginationItem>
        )
      } else {
        items.push(
          <PaginationItem key={p}>
            <PaginationLink onClick={() => handlePageChange(p as number)} isActive={page === p}>
              {p}
            </PaginationLink>
          </PaginationItem>
        )
      }
    })

    // Next button
    items.push(
      <PaginationItem key='next'>
        <PaginationNext
          onClick={() => page < totalPages && handlePageChange(page + 1)}
          className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    )

    return items
  }

  // Reset filters
  const resetFilters = () => {
    setStatus(undefined)
    setDateRange(undefined)
    setSortBy('created_at-desc')
    setPage(1)
  }

  // Loading state
  if (isLoading) {
    return (
      <div>
        <div className='flex justify-between items-center mb-6'>
          <h1 className='text-2xl font-bold'>Your Orders</h1>
          <Skeleton className='h-10 w-32' />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className='h-8 w-48 mb-2' />
            <Skeleton className='h-4 w-64' />
          </CardHeader>
          <CardContent>
            <div className='space-y-6'>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className='border rounded-lg p-4'>
                    <div className='flex justify-between mb-4'>
                      <Skeleton className='h-6 w-36' />
                      <Skeleton className='h-6 w-24' />
                    </div>
                    <div className='space-y-4'>
                      {Array(2)
                        .fill(0)
                        .map((_, j) => (
                          <div key={j} className='flex items-center'>
                            <Skeleton className='h-16 w-16 rounded mr-4' />
                            <div className='flex-1'>
                              <Skeleton className='h-4 w-48 mb-2' />
                              <Skeleton className='h-4 w-24' />
                            </div>
                            <Skeleton className='h-6 w-20' />
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold flex items-center'>
          <ShoppingBag className='mr-2 h-6 w-6' />
          Your Orders
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
          <CardDescription>View and manage your orders</CardDescription>
        </CardHeader>

        <CardContent>
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <div className='flex-1 relative'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
              <Input placeholder='Search orders...' className='pl-10' />
            </div>
            <div className='flex flex-col sm:flex-row gap-2'>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='All Statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={''}>All Statuses</SelectItem>
                  <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={OrderStatus.PAID}>Paid</SelectItem>
                  <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                  <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                  <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='Any Time' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={''}>Any Time</SelectItem>
                  <SelectItem value='last-30'>Last 30 Days</SelectItem>
                  <SelectItem value='last-90'>Last 90 Days</SelectItem>
                  <SelectItem value='last-180'>Last 6 Months</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className='w-full sm:w-[180px]'>
                  <SelectValue placeholder='Sort By' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='created_at-desc'>Newest First</SelectItem>
                  <SelectItem value='created_at-asc'>Oldest First</SelectItem>
                  <SelectItem value='total-desc'>Highest Amount</SelectItem>
                  <SelectItem value='total-asc'>Lowest Amount</SelectItem>
                </SelectContent>
              </Select>

              {(status || dateRange || sortBy !== 'created_at-desc') && (
                <Button variant='outline' onClick={resetFilters} className='flex items-center'>
                  <FilterX className='mr-2 h-4 w-4' />
                  Reset
                </Button>
              )}
            </div>
          </div>

          <Tabs defaultValue='all' className='w-full'>
            <TabsList className='mb-4'>
              <TabsTrigger value='all'>All Orders</TabsTrigger>
              <TabsTrigger value='pending'>Pending</TabsTrigger>
              <TabsTrigger value='processing'>Processing</TabsTrigger>
              <TabsTrigger value='completed'>Completed</TabsTrigger>
            </TabsList>

            <TabsContent value='all'>
              {ordersData?.result?.orders?.length === 0 ? (
                <div className='text-center py-12'>
                  <ShoppingBag className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-1'>No orders found</h3>
                  <p className='text-gray-500 mb-4'>
                    {status || dateRange
                      ? 'No orders match your current filters.'
                      : "You haven't placed any orders yet."}
                  </p>
                  {status || dateRange ? (
                    <Button variant='outline' onClick={resetFilters}>
                      Reset Filters
                    </Button>
                  ) : (
                    <Button asChild>
                      <Link to='/products'>Start Shopping</Link>
                    </Button>
                  )}
                </div>
              ) : (
                <div className='space-y-6'>
                  {ordersData?.result?.orders?.map((order) => (
                    <div key={order._id} className='border rounded-lg overflow-hidden'>
                      <div className='bg-gray-50 p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-2'>
                        <div>
                          <p className='text-sm text-gray-500'>Order Placed: {formatDate(order.created_at)}</p>
                          <p className='font-medium'>{order.order_number}</p>
                        </div>
                        <div className='flex items-center'>
                          {getStatusBadge(order.status)}
                          <Button asChild variant='ghost' size='sm' className='ml-2'>
                            <Link to={`/orders/${order._id}`}>
                              View Details
                              <ChevronRight className='ml-1 h-4 w-4' />
                            </Link>
                          </Button>
                        </div>
                      </div>

                      <div className='p-4'>
                        <div className='mb-4 flex items-center'>
                          {getStatusIcon(order.status)}
                          <div className='ml-3'>
                            <p className='font-medium'>
                              {order.status === OrderStatus.PENDING && 'Awaiting Payment'}
                              {order.status === OrderStatus.PAID && 'Processing Order'}
                              {order.status === OrderStatus.SHIPPED && 'Order Shipped'}
                              {order.status === OrderStatus.DELIVERED && 'Order Delivered'}
                              {order.status === OrderStatus.CANCELLED && 'Order Cancelled'}
                            </p>
                            <p className='text-sm text-gray-500'>
                              {order.status === OrderStatus.SHIPPED && order.tracking_number && (
                                <>Tracking #: {order.tracking_number}</>
                              )}
                              {order.status === OrderStatus.DELIVERED && (
                                <>Delivered on {formatDate(order.delivered_at || '')}</>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className='space-y-4'>
                          {order.items.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className='flex items-center'>
                              <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4'>
                                <img
                                  src={item.product_image}
                                  alt={item.product_name}
                                  className='w-full h-full object-cover'
                                />
                              </div>
                              <div className='flex-1'>
                                <Link
                                  to={`/products/${item.product_id}`}
                                  className='font-medium text-blue-600 hover:underline'
                                >
                                  {item.product_name}
                                </Link>
                                <p className='text-sm text-gray-500'>Quantity: {item.quantity}</p>
                              </div>
                              <div className='text-right'>
                                <p className='font-semibold'>{formatPrice(item.price)}</p>
                              </div>
                            </div>
                          ))}

                          {order.items.length > 3 && (
                            <p className='text-sm text-gray-500 italic'>+ {order.items.length - 3} more items</p>
                          )}
                        </div>
                      </div>

                      <div className='bg-gray-50 p-4 flex flex-col sm:flex-row justify-between sm:items-center border-t'>
                        <div>
                          <p className='text-sm text-gray-500'>Total</p>
                          <p className='font-semibold'>{formatPrice(order.total)}</p>
                        </div>

                        {/* Action buttons based on order status */}
                        <div className='flex gap-2 mt-2 sm:mt-0'>
                          {order.status === OrderStatus.DELIVERED && (
                            <Button variant='outline' size='sm'>
                              Write a Review
                            </Button>
                          )}

                          {order.status === OrderStatus.SHIPPED && (
                            <Button variant='outline' size='sm'>
                              Track Package
                            </Button>
                          )}

                          {(order.status === OrderStatus.PENDING || order.status === OrderStatus.PAID) && (
                            <Button variant='outline' size='sm' className='text-red-600 hover:bg-red-50'>
                              Cancel Order
                            </Button>
                          )}

                          <Button size='sm'>Buy Again</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {ordersData && Number(ordersData.result.pagination.totalPages) > 1 && (
                <div className='mt-8'>
                  <Pagination>
                    <PaginationContent>{renderPagination()}</PaginationContent>
                  </Pagination>
                </div>
              )}
            </TabsContent>

            <TabsContent value='pending'>
              {/* Similar content as "all" but filtered for pending/paid orders */}
              <div className='text-center py-12'>
                <Clock className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-1'>No pending orders</h3>
                <p className='text-gray-500 mb-4'>You don't have any pending orders at the moment.</p>
                <Button asChild>
                  <Link to='/products'>Start Shopping</Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value='processing'>
              {/* Similar content as "all" but filtered for shipped orders */}
              <div className='text-center py-12'>
                <Truck className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-1'>No processing orders</h3>
                <p className='text-gray-500 mb-4'>You don't have any orders being processed at the moment.</p>
                <Button asChild>
                  <Link to='/products'>Start Shopping</Link>
                </Button>
              </div>
            </TabsContent>

            <TabsContent value='completed'>
              {/* Similar content as "all" but filtered for delivered orders */}
              <div className='text-center py-12'>
                <CheckCircle2 className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                <h3 className='text-lg font-medium text-gray-900 mb-1'>No completed orders</h3>
                <p className='text-gray-500 mb-4'>You don't have any completed orders yet.</p>
                <Button asChild>
                  <Link to='/products'>Start Shopping</Link>
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

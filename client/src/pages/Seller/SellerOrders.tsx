import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSellerOrders } from '@/hooks/useOrder'
import { useShipOrder } from '@/hooks/useOrder'
import { OrderStatus } from '@/types/Order.type'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  ShoppingBag,
  MoreHorizontal,
  Eye,
  Truck,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  Calendar,
  Clock,
  Package,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/Components/ui/button'

export default function SellerOrders() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Shipping dialog
  const [isShippingDialogOpen, setIsShippingDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingNotes, setShippingNotes] = useState('')
  const [carrier, setCarrier] = useState('default')

  const {
    data: ordersData,
    isLoading,
    refetch
  } = useSellerOrders({
    page,
    limit,
    sort,
    order,
    status,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined
  })

  const { mutate: shipOrder, isPending: isShipping } = useShipOrder()

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
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
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
            <Package className='w-3 h-3 mr-1' />
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
            <CheckCircle2 className='w-3 h-3 mr-1' />
            Delivered
          </Badge>
        )
      case OrderStatus.CANCELLED:
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            <XCircle className='w-3 h-3 mr-1' />
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handleLimitChange = (newLimit: string) => {
    setLimit(Number(newLimit))
    setPage(1) // Reset to first page when changing limit
  }

  const handleSortChange = (column: string) => {
    if (sort === column) {
      // If already sorting by this column, toggle order
      setOrder(order === 'asc' ? 'desc' : 'asc')
    } else {
      // If sorting by a new column, default to ascending
      setSort(column)
      setOrder('asc')
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus === 'all' ? undefined : newStatus)
    setPage(1) // Reset to first page when changing status
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality here
    // This would typically involve an API call with the search parameter
    console.log(`Searching for: ${searchQuery}`)
  }

  const handleShipClick = (orderId: string) => {
    setSelectedOrderId(orderId)
    setTrackingNumber('')
    setShippingNotes('')
    setCarrier('default')
    setIsShippingDialogOpen(true)
  }

  const handleShipConfirm = () => {
    if (selectedOrderId) {
      shipOrder(
        {
          order_id: selectedOrderId,
          params: {
            tracking_number: trackingNumber,
            shipping_provider: carrier !== 'default' ? carrier : undefined,
            estimated_delivery_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
          }
        },
        {
          onSuccess: () => {
            toast.success('Order marked as shipped')
            refetch()
            setIsShippingDialogOpen(false)
          },
          onError: () => {
            toast.error('Failed to update shipping status')
          }
        }
      )
    }
  }

  const filteredOrders = ordersData?.result?.orders.filter((order) => {
    // Apply client-side filtering for search
    if (searchQuery && !order.order_number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <ShoppingBag className='mr-2 h-6 w-6' />
            Orders
          </h1>
          <p className='text-gray-600'>Manage your customer orders</p>
        </div>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Your Orders</CardTitle>
          <CardDescription>
            {!isLoading && ordersData?.result?.pagination && (
              <span>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, ordersData.result.pagination.total)} of{' '}
                {ordersData.result.pagination.total} orders
              </span>
            )}
          </CardDescription>

          <div className='flex flex-col sm:flex-row gap-4 mt-2'>
            <form className='flex gap-2 w-full sm:w-auto' onSubmit={handleSearch}>
              <div className='relative flex-1'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                <Input
                  type='text'
                  placeholder='Search by order number...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type='submit'>Search</Button>
            </form>

            <div className='flex gap-2 ml-auto'>
              <div className='flex items-center gap-2'>
                <Filter className='h-4 w-4' />
                <Select value={status || 'all'} onValueChange={handleStatusChange}>
                  <SelectTrigger className='w-[140px]'>
                    <SelectValue placeholder='All Statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value={OrderStatus.PENDING}>Pending</SelectItem>
                    <SelectItem value={OrderStatus.PAID}>Paid</SelectItem>
                    <SelectItem value={OrderStatus.SHIPPED}>Shipped</SelectItem>
                    <SelectItem value={OrderStatus.DELIVERED}>Delivered</SelectItem>
                    <SelectItem value={OrderStatus.CANCELLED}>Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-2'>
                <Calendar className='h-4 w-4' />
                <div className='flex gap-2 items-center'>
                  <Input
                    type='date'
                    className='w-[130px]'
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                  <span>-</span>
                  <Input type='date' className='w-[130px]' value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Loading skeleton
            <div className='space-y-4'>
              <div className='flex justify-between items-center px-4 py-2 bg-gray-50 rounded-md'>
                <Skeleton className='h-5 w-1/4' />
                <div className='flex space-x-2'>
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-5 w-16' />
                  <Skeleton className='h-5 w-8' />
                </div>
              </div>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className='border rounded-lg p-4'>
                    <div className='flex'>
                      <div className='flex-1'>
                        <Skeleton className='h-5 w-40 mb-2' />
                        <Skeleton className='h-4 w-60 mb-2' />
                        <Skeleton className='h-4 w-20' />
                      </div>
                      <Skeleton className='h-8 w-24' />
                    </div>
                  </div>
                ))}
            </div>
          ) : ordersData?.result?.orders.length === 0 ? (
            <div className='text-center py-12'>
              <ShoppingBag className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-1'>No orders yet</h3>
              <p className='text-gray-500 mb-4'>When customers place orders, they will appear here.</p>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('order_number')}>
                        <div className='flex items-center'>
                          Order #
                          {sort === 'order_number' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('total')}>
                        <div className='flex items-center'>
                          Total
                          {sort === 'total' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('created_at')}>
                        <div className='flex items-center'>
                          Date
                          {sort === 'created_at' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className='text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders?.map((order) => (
                      <TableRow key={order._id}>
                        <TableCell className='font-medium'>{order.order_number}</TableCell>
                        <TableCell>
                          {/* Note: In a real implementation, this would display buyer information */}
                          <div className='text-sm'>Customer ID: {order.buyer_id.substring(0, 8)}...</div>
                        </TableCell>
                        <TableCell>
                          <div className='flex items-center'>
                            <span>{order.items.length} item(s)</span>
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                        <TableCell>{getStatusBadge(order.status as OrderStatus)}</TableCell>
                        <TableCell>
                          <div className='text-sm'>{formatDate(order.created_at)}</div>
                          <div className='text-xs text-gray-500'>{formatTime(order.created_at)}</div>
                        </TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <span className='sr-only'>Open menu</span>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => navigate(`/seller/orders/${order._id}`)}>
                                <Eye className='mr-2 h-4 w-4' />
                                View Details
                              </DropdownMenuItem>

                              {order.status === OrderStatus.PAID && (
                                <DropdownMenuItem onClick={() => handleShipClick(order._id)}>
                                  <Truck className='mr-2 h-4 w-4' />
                                  Mark as Shipped
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className='flex items-center justify-between mt-4'>
                <div className='flex items-center gap-2'>
                  <p className='text-sm text-gray-500'>Items per page</p>
                  <Select value={limit.toString()} onValueChange={handleLimitChange}>
                    <SelectTrigger className='w-[70px]'>
                      <SelectValue placeholder={limit.toString()} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='5'>5</SelectItem>
                      <SelectItem value='10'>10</SelectItem>
                      <SelectItem value='20'>20</SelectItem>
                      <SelectItem value='50'>50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => handlePageChange(Math.max(1, page - 1))}
                        disabled={page <= 1}
                      />
                    </PaginationItem>

                    {/* Generate pagination links */}
                    {ordersData?.result?.pagination &&
                      Array.from({ length: Math.min(5, ordersData.result.pagination.totalPages) }, (_, i) => {
                        // Simple pagination logic for 5 pages max visibility
                        let pageNum = i + 1
                        if (ordersData.result.pagination.totalPages > 5) {
                          if (page > 3) {
                            pageNum = page - 3 + i
                          }
                          if (pageNum > ordersData.result.pagination.totalPages) {
                            pageNum = ordersData.result.pagination.totalPages - (4 - i)
                          }
                        }

                        return (
                          <PaginationItem key={i}>
                            <PaginationLink onClick={() => handlePageChange(pageNum)} isActive={page === pageNum}>
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          handlePageChange(Math.min(ordersData?.result?.pagination?.totalPages || 1, page + 1))
                        }
                        disabled={!ordersData?.result?.pagination || page >= ordersData.result.pagination.totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ship Order Dialog */}
      <Dialog open={isShippingDialogOpen} onOpenChange={setIsShippingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Order as Shipped</DialogTitle>
            <DialogDescription>
              Enter shipping details for this order. This will notify the customer that their order has been shipped.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='tracking' className='text-right'>
                Tracking Number
              </Label>
              <Input
                id='tracking'
                placeholder='Enter tracking number'
                className='col-span-3'
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
              />
            </div>

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='carrier' className='text-right'>
                Carrier
              </Label>
              <Select value={carrier} onValueChange={setCarrier}>
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select a carrier' />
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

            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='notes' className='text-right'>
                Notes
              </Label>
              <Textarea
                id='notes'
                placeholder='Optional shipping notes'
                className='col-span-3'
                value={shippingNotes}
                onChange={(e) => setShippingNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsShippingDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShipConfirm} disabled={isShipping || !trackingNumber || carrier === 'default'}>
              {isShipping ? 'Updating...' : 'Mark as Shipped'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

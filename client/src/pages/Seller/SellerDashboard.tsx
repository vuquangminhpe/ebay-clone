/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMyStore } from '@/hooks/useStore'
import { useSellerProducts } from '@/hooks/useProduct'
import { useSellerOrders } from '@/hooks/useOrder'
import { useSellerTransactions } from '@/hooks/usePayment'
import { useLowStockProducts } from '@/hooks/useInventory'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Store,
  Package,
  ShoppingBag,
  CreditCard,
  BarChart2,
  AlertTriangle,
  Plus,
  ChevronRight,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
  Users,
  Star,
  Bell,
  MessageSquare,
  Percent
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { OrderStatus } from '@/types/Order.type'
import { Button } from '@/Components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export default function SellerDashboard() {
  const [productsPage, setProductsPage] = useState(1)
  const [ordersPage, setOrdersPage] = useState(1)

  const { data: storeData, isLoading: storeLoading } = useMyStore()
  const { data: productsData, isLoading: productsLoading } = useSellerProducts({
    page: productsPage,
    limit: 5
  })
  const { data: ordersData, isLoading: ordersLoading } = useSellerOrders({
    page: ordersPage,
    limit: 5
  })
  const { data: transactionsData, isLoading: transactionsLoading } = useSellerTransactions({
    limit: 5
  })
  const { data: inventoryAlerts, isLoading: inventoryLoading } = useLowStockProducts()

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

  // Calculate sales and metrics
  const calculateMetrics = () => {
    if (!ordersData || !ordersData.result.orders) return { total: 0, pending: 0, processing: 0, completed: 0 }

    const total = ordersData.result.orders.length
    const pending = ordersData.result.orders.filter((o) => o.status === OrderStatus.PENDING).length
    const processing = ordersData.result.orders.filter(
      (o) => o.status === OrderStatus.PAID || o.status === OrderStatus.SHIPPED
    ).length
    const completed = ordersData.result.orders.filter((o) => o.status === OrderStatus.DELIVERED).length

    return { total, pending, processing, completed }
  }

  const metrics = calculateMetrics()

  // Calculate total sales
  const calculateTotalSales = () => {
    if (!ordersData || !ordersData.result.orders) return 0

    return ordersData.result.orders
      .filter((o) => o.status !== OrderStatus.CANCELLED)
      .reduce((sum, order) => sum + order.total, 0)
  }

  const totalSales = calculateTotalSales()

  // Calculate monthly sales
  const calculateMonthlySales = () => {
    if (!ordersData || !ordersData.result.orders) return 0

    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    return ordersData.result.orders
      .filter((o) => o.status !== OrderStatus.CANCELLED && new Date(o.created_at) >= firstDayOfMonth)
      .reduce((sum, order) => sum + order.total, 0)
  }

  const monthlySales = calculateMonthlySales()

  return (
    <div>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <Store className='mr-2 h-6 w-6' />
            Seller Dashboard
          </h1>
          <p className='text-gray-600'>Manage your store, products and orders</p>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' asChild>
            <Link to='/seller/settings'>Store Settings</Link>
          </Button>
          <Button asChild>
            <Link to='/seller/products/new'>
              <Plus className='mr-2 h-4 w-4' />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      {/* Store overview */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-8'>
        <Card className='col-span-full md:col-span-1'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-lg'>Store Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {storeLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-6 w-full' />
                <Skeleton className='h-4 w-3/4' />
                <Skeleton className='h-4 w-1/2 mt-2' />
              </div>
            ) : storeData?.store ? (
              <div>
                <div className='flex items-center gap-3 mb-3'>
                  <div className='h-12 w-12 rounded-full bg-gray-100 overflow-hidden'>
                    <img
                      src={storeData.store.store.logo || '/placeholder-store.png'}
                      alt={storeData.store.store.name}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <div>
                    <h3 className='font-medium'>{storeData.store.store.name}</h3>
                    <div className='flex items-center text-sm text-gray-500'>
                      <Star className='h-3 w-3 fill-yellow-500 text-yellow-500 mr-1' />
                      <span>Rating: {storeData.store.store.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-2 text-sm'>
                  <div className='bg-gray-50 p-2 rounded'>
                    <p className='text-gray-600'>Products</p>
                    <p className='font-medium'>{storeData.store.store.total_products}</p>
                  </div>
                  <div className='bg-gray-50 p-2 rounded'>
                    <p className='text-gray-600'>Sales</p>
                    <p className='font-medium'>{storeData.store.store.total_sales}</p>
                  </div>
                  <div className='bg-gray-50 p-2 rounded'>
                    <p className='text-gray-600'>Status</p>
                    <p className='font-medium capitalize'>{storeData.store.store.status}</p>
                  </div>
                  <div className='bg-gray-50 p-2 rounded'>
                    <p className='text-gray-600'>Since</p>
                    <p className='font-medium'>{formatDate(storeData.store.store.created_at).split(',')[0]}</p>
                  </div>
                </div>

                <Button variant='outline' asChild className='w-full mt-4'>
                  <Link to={`/store/${storeData.store.store._id}`}>View Store</Link>
                </Button>
              </div>
            ) : (
              <div className='text-center py-4'>
                <Store className='h-10 w-10 text-gray-300 mx-auto mb-2' />
                <p className='text-gray-600 mb-3'>You don't have a store yet</p>
                <Button asChild>
                  <Link to='/become-seller'>Create Store</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Total Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <DollarSign className='h-5 w-5 text-green-500 mr-1' />
              <p className='text-2xl font-bold'>{formatPrice(totalSales)}</p>
            </div>
            <p className='text-sm text-gray-500 mt-1'>Lifetime earnings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <TrendingUp className='h-5 w-5 text-blue-500 mr-1' />
              <p className='text-2xl font-bold'>{formatPrice(monthlySales)}</p>
            </div>
            <p className='text-sm text-gray-500 mt-1'>This month's revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-500'>Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center'>
              <ShoppingBag className='h-5 w-5 text-indigo-500 mr-1' />
              <p className='text-2xl font-bold'>{metrics.total}</p>
            </div>
            <div className='flex justify-between text-sm text-gray-500 mt-1'>
              <span>{metrics.pending} pending</span>
              <span>{metrics.completed} completed</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {!inventoryLoading && inventoryAlerts && Number(inventoryAlerts.length) > 0 && (
        <Card className='mb-8 border-yellow-200 bg-yellow-50'>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center text-yellow-800'>
              <AlertTriangle className='h-5 w-5 text-yellow-600 mr-2' />
              Low Stock Alerts
            </CardTitle>
            <CardDescription className='text-yellow-700'>
              The following products are running low on inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {(inventoryAlerts as any).slice(0, 3).map((item: any) => (
                <div key={item._id} className='flex items-center p-2 bg-white rounded border border-yellow-200'>
                  <div className='w-10 h-10 rounded bg-gray-100 overflow-hidden mr-3'>
                    <img src={item.product.image} alt={item.product.name} className='w-full h-full object-cover' />
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-medium truncate'>{item.product.name}</p>
                    <p className='text-sm text-red-600'>Only {item.quantity - item.reserved_quantity} left in stock</p>
                  </div>
                  <Button variant='outline' size='sm' asChild>
                    <Link to={`/seller/inventory/${item.product_id}`}>Update</Link>
                  </Button>
                </div>
              ))}

              {Number(inventoryAlerts.length) > 3 && (
                <Button variant='link' className='w-full' asChild>
                  <Link to='/seller/inventory'>View all {Number(inventoryAlerts.length)} low stock alerts</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue='orders' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='orders' className='flex items-center'>
            <ShoppingBag className='h-4 w-4 mr-2' />
            Recent Orders
          </TabsTrigger>
          <TabsTrigger value='products' className='flex items-center'>
            <Package className='h-4 w-4 mr-2' />
            Your Products
          </TabsTrigger>
          <TabsTrigger value='transactions' className='flex items-center'>
            <CreditCard className='h-4 w-4 mr-2' />
            Transactions
          </TabsTrigger>
          <TabsTrigger value='analytics' className='flex items-center'>
            <BarChart2 className='h-4 w-4 mr-2' />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Recent Orders Tab */}
        <TabsContent value='orders'>
          <Card>
            <CardHeader className='pb-2'>
              <div className='flex justify-between items-center'>
                <CardTitle>Recent Orders</CardTitle>
                <Button variant='ghost' size='sm' asChild>
                  <Link to='/seller/orders'>
                    View All
                    <ChevronRight className='ml-1 h-4 w-4' />
                  </Link>
                </Button>
              </div>
              <CardDescription>Manage orders from your customers</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <div className='space-y-4'>
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className='border rounded-lg p-4'>
                        <div className='flex justify-between mb-2'>
                          <Skeleton className='h-5 w-40' />
                          <Skeleton className='h-5 w-24' />
                        </div>
                        <Skeleton className='h-4 w-60 mb-3' />
                        <div className='flex justify-between items-center'>
                          <Skeleton className='h-4 w-20' />
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
                <div className='space-y-4'>
                  {ordersData?.result?.orders?.map((order: any) => (
                    <div key={order._id} className='border rounded-lg p-4'>
                      <div className='flex justify-between items-start mb-2'>
                        <div>
                          <p className='font-medium'>Order #{order.order_number}</p>
                          <p className='text-sm text-gray-500'>
                            {formatDate(order.created_at)} • {order.items.length} item(s)
                          </p>
                        </div>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className='flex justify-between items-center mt-4'>
                        <p className='font-semibold'>{formatPrice(order.total)}</p>
                        <Button size='sm' asChild>
                          <Link to={`/seller/orders/${order._id}`}>Manage</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className='flex justify-between border-t pt-4'>
              <div className='text-sm text-gray-500'>
                Showing {ordersData?.result?.orders?.length || 0} of {ordersData?.result.pagination.total || 0} orders
              </div>

              <div className='flex gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  disabled={ordersPage <= 1}
                  onClick={() => setOrdersPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  disabled={!ordersData || ordersPage >= ordersData.result.pagination.totalPages}
                  onClick={() => setOrdersPage((p) => p + 1)}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value='products'>
          <Card>
            <CardHeader className='pb-2'>
              <div className='flex justify-between items-center'>
                <CardTitle>Your Products</CardTitle>
                <div className='flex gap-2'>
                  <Button variant='ghost' size='sm' asChild>
                    <Link to='/seller/products'>
                      Manage All
                      <ChevronRight className='ml-1 h-4 w-4' />
                    </Link>
                  </Button>
                  <Button size='sm' asChild>
                    <Link to='/seller/products/new'>
                      <Plus className='mr-1 h-4 w-4' />
                      Add Product
                    </Link>
                  </Button>
                </div>
              </div>
              <CardDescription>Manage your product listings</CardDescription>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className='space-y-4'>
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className='border rounded-lg p-4'>
                        <div className='flex'>
                          <Skeleton className='h-16 w-16 rounded mr-4' />
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
              ) : productsData?.products.length === 0 ? (
                <div className='text-center py-12'>
                  <Package className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-1'>No products yet</h3>
                  <p className='text-gray-500 mb-4'>Start by adding your first product to your store.</p>
                  <Button asChild>
                    <Link to='/seller/products/new'>
                      <Plus className='mr-2 h-4 w-4' />
                      Add Product
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className='space-y-4'>
                  {productsData?.products.map((product) => (
                    <div key={product._id} className='border rounded-lg p-4'>
                      <div className='flex items-center'>
                        <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden mr-4'>
                          <img
                            src={product.medias.find((m) => m.is_primary)?.url || product.medias[0]?.url}
                            alt={product.name}
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium truncate'>{product.name}</p>
                          <p className='text-sm text-gray-500 truncate'>{product.description}</p>
                          <p className='font-semibold'>{formatPrice(product.price)}</p>
                        </div>
                        <Button variant='outline' size='sm' asChild>
                          <Link to={`/seller/products/${product._id}`}>Edit</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className='flex justify-between border-t pt-4'>
              <div className='text-sm text-gray-500'>
                Showing {productsData?.products.length || 0} of {productsData?.pagination.total || 0} products
              </div>

              <div className='flex gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  disabled={productsPage <= 1}
                  onClick={() => setProductsPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className='h-4 w-4' />
                </Button>
                <Button
                  variant='outline'
                  size='icon'
                  disabled={!productsData || productsPage >= productsData.pagination.totalPages}
                  onClick={() => setProductsPage((p) => p + 1)}
                >
                  <ChevronRight className='h-4 w-4' />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value='transactions'>
          <Card>
            <CardHeader className='pb-2'>
              <div className='flex justify-between items-center'>
                <CardTitle>Recent Transactions</CardTitle>
                <Button variant='ghost' size='sm' asChild>
                  <Link to='/seller/transactions'>
                    View All
                    <ChevronRight className='ml-1 h-4 w-4' />
                  </Link>
                </Button>
              </div>
              <CardDescription>Track your earnings and payouts</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className='space-y-4'>
                  {Array(5)
                    .fill(0)
                    .map((_, i) => (
                      <div key={i} className='border rounded-lg p-4'>
                        <div className='flex justify-between mb-2'>
                          <Skeleton className='h-5 w-40' />
                          <Skeleton className='h-5 w-24' />
                        </div>
                        <Skeleton className='h-4 w-60' />
                      </div>
                    ))}
                </div>
              ) : !transactionsData || transactionsData.transactions.transactions.length === 0 ? (
                <div className='text-center py-12'>
                  <CreditCard className='h-12 w-12 text-gray-300 mx-auto mb-4' />
                  <h3 className='text-lg font-medium text-gray-900 mb-1'>No transactions yet</h3>
                  <p className='text-gray-500'>When you receive payments, they will appear here.</p>
                </div>
              ) : (
                <div className='space-y-4'>
                  {transactionsData?.transactions?.transactions?.map((transaction: any) => (
                    <div key={transaction._id} className='border rounded-lg p-4'>
                      <div className='flex justify-between items-start mb-2'>
                        <div>
                          <p className='font-medium capitalize'>
                            {transaction.type} - {transaction.status}
                          </p>
                          <p className='text-sm text-gray-500'>{formatDate(transaction.created_at)}</p>
                          {transaction.order && <p className='text-sm'>Order: {transaction.order.order_number}</p>}
                        </div>
                        <p
                          className={`font-semibold ${transaction.type === 'payment' ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {transaction.type === 'payment' ? '+' : '-'}
                          {formatPrice(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics'>
          <Card>
            <CardHeader className='pb-2'>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Track your performance and sales trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-gray-500 text-sm'>Sales</p>
                    <Percent className='h-4 w-4 text-green-500' />
                  </div>
                  <p className='text-2xl font-bold'>{formatPrice(totalSales)}</p>
                  <p className='text-sm text-green-600'>+12% from last month</p>
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-gray-500 text-sm'>Visitors</p>
                    <Users className='h-4 w-4 text-blue-500' />
                  </div>
                  <p className='text-2xl font-bold'>1,245</p>
                  <p className='text-sm text-blue-600'>+5% from last month</p>
                </div>

                <div className='bg-gray-50 rounded-lg p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-gray-500 text-sm'>Conversion Rate</p>
                    <TrendingUp className='h-4 w-4 text-indigo-500' />
                  </div>
                  <p className='text-2xl font-bold'>3.2%</p>
                  <p className='text-sm text-indigo-600'>+0.5% from last month</p>
                </div>
              </div>

              <div className='h-64 flex items-center justify-center border rounded-lg'>
                <div className='text-center'>
                  <p className='text-gray-500 mb-2'>Sales Chart Placeholder</p>
                  <p className='text-sm text-gray-400'>View detailed analytics in the full Analytics dashboard</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className='border-t pt-4'>
              <Button className='w-full' asChild>
                <Link to='/seller/analytics'>
                  <BarChart2 className='mr-2 h-4 w-4' />
                  View Detailed Analytics
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Notifications and Alerts */}
      <div className='mt-8 grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader className='pb-2'>
            <div className='flex justify-between items-center'>
              <CardTitle className='flex items-center'>
                <Bell className='mr-2 h-5 w-5 text-indigo-500' />
                Notifications
              </CardTitle>
              <Button variant='ghost' size='sm'>
                Mark All as Read
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='border-l-4 border-blue-500 pl-4 py-1'>
                <p className='font-medium'>New Order Received</p>
                <p className='text-sm text-gray-500'>Order #ORD-123456 was placed</p>
                <p className='text-xs text-gray-400'>2 hours ago</p>
              </div>

              <div className='border-l-4 border-yellow-500 pl-4 py-1'>
                <p className='font-medium'>Product Running Low</p>
                <p className='text-sm text-gray-500'>Blue T-Shirt is low on stock (2 remaining)</p>
                <p className='text-xs text-gray-400'>Yesterday</p>
              </div>

              <div className='border-l-4 border-green-500 pl-4 py-1'>
                <p className='font-medium'>Payment Received</p>
                <p className='text-sm text-gray-500'>Payment of $49.99 received for Order #ORD-123455</p>
                <p className='text-xs text-gray-400'>2 days ago</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className='border-t pt-4'>
            <Button variant='outline' className='w-full' asChild>
              <Link to='/seller/notifications'>View All Notifications</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='flex items-center'>
              <MessageSquare className='mr-2 h-5 w-5 text-indigo-500' />
              Customer Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='border rounded-lg p-3'>
                <div className='flex items-center mb-2'>
                  <div className='w-8 h-8 rounded-full bg-gray-100 overflow-hidden mr-2'>
                    <img src='/placeholder-avatar.png' alt='Customer' className='w-full h-full object-cover' />
                  </div>
                  <div>
                    <p className='font-medium'>John Doe</p>
                    <p className='text-xs text-gray-500'>Re: Order #ORD-123456</p>
                  </div>
                  <Badge className='ml-auto'>New</Badge>
                </div>
                <p className='text-sm truncate'>Hi, I was wondering when my order will be shipped...</p>
                <p className='text-xs text-gray-400 mt-1'>1 hour ago</p>
              </div>

              <div className='border rounded-lg p-3'>
                <div className='flex items-center mb-2'>
                  <div className='w-8 h-8 rounded-full bg-gray-100 overflow-hidden mr-2'>
                    <img src='/placeholder-avatar.png' alt='Customer' className='w-full h-full object-cover' />
                  </div>
                  <div>
                    <p className='font-medium'>Jane Smith</p>
                    <p className='text-xs text-gray-500'>Re: Product Question</p>
                  </div>
                </div>
                <p className='text-sm truncate'>Hello, does this product come in blue color?</p>
                <p className='text-xs text-gray-400 mt-1'>5 hours ago</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className='border-t pt-4'>
            <Button variant='outline' className='w-full' asChild>
              <Link to='/seller/messages'>View All Messages</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// Missing ChevronLeft icon
function ChevronLeft({ className = '', size = 24 }) {
  return (
    <svg
      xmlns='http://www.w3.org/2000/svg'
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={className}
    >
      <path d='m15 18-6-6 6-6' />
    </svg>
  )
}

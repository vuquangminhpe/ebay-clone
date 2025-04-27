import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/Components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart2,
  Building,
  CreditCard,
  DollarSign,
  Download,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Package,
  PieChart as PieChartIcon,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Tag,
  Users,
  Wallet
} from 'lucide-react'

// Sample data for the charts
const revenueData = [
  { name: 'Jan', revenue: 4500, target: 5000 },
  { name: 'Feb', revenue: 5200, target: 5000 },
  { name: 'Mar', revenue: 6000, target: 5500 },
  { name: 'Apr', revenue: 7000, target: 5500 },
  { name: 'May', revenue: 6500, target: 6000 },
  { name: 'Jun', revenue: 7800, target: 6000 },
  { name: 'Jul', revenue: 8200, target: 6500 },
  { name: 'Aug', revenue: 8500, target: 6500 },
  { name: 'Sep', revenue: 9000, target: 7000 },
  { name: 'Oct', revenue: 9500, target: 7000 },
  { name: 'Nov', revenue: 9800, target: 7500 },
  { name: 'Dec', revenue: 10500, target: 7500 }
]

const salesData = [
  { name: 'Mon', value: 32 },
  { name: 'Tue', value: 40 },
  { name: 'Wed', value: 45 },
  { name: 'Thu', value: 30 },
  { name: 'Fri', value: 55 },
  { name: 'Sat', value: 70 },
  { name: 'Sun', value: 60 }
]

const categoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 25 },
  { name: 'Home & Kitchen', value: 20 },
  { name: 'Beauty', value: 15 },
  { name: 'Other', value: 5 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

// Top selling products data
const topProducts = [
  {
    id: '1',
    name: 'Wireless Bluetooth Headphones',
    price: 89.99,
    sales: 152,
    revenue: 13678.48,
    category: 'Electronics'
  },
  {
    id: '2',
    name: 'Smart Watch Series 5',
    price: 299.99,
    sales: 98,
    revenue: 29399.02,
    category: 'Electronics'
  },
  {
    id: '3',
    name: 'Organic Cotton T-Shirt',
    price: 24.99,
    sales: 245,
    revenue: 6122.55,
    category: 'Clothing'
  },
  {
    id: '4',
    name: 'Stainless Steel Water Bottle',
    price: 19.99,
    sales: 187,
    revenue: 3738.13,
    category: 'Home & Kitchen'
  },
  {
    id: '5',
    name: 'Vitamin C Serum',
    price: 34.99,
    sales: 132,
    revenue: 4618.68,
    category: 'Beauty'
  }
]

// Recent orders data
const recentOrders = [
  {
    id: 'ORD-7652',
    customer: 'John Doe',
    amount: 189.99,
    status: 'completed',
    date: '2 hours ago'
  },
  {
    id: 'ORD-7651',
    customer: 'Sara Smith',
    amount: 259.99,
    status: 'processing',
    date: '3 hours ago'
  },
  {
    id: 'ORD-7650',
    customer: 'Michael Johnson',
    amount: 99.99,
    status: 'completed',
    date: '5 hours ago'
  },
  {
    id: 'ORD-7649',
    customer: 'Emily Davis',
    amount: 129.99,
    status: 'completed',
    date: '6 hours ago'
  },
  {
    id: 'ORD-7648',
    customer: 'Robert Wilson',
    amount: 349.99,
    status: 'cancelled',
    date: '8 hours ago'
  }
]

// Recent users data
const recentUsers = [
  {
    id: '1',
    name: 'Alex Morgan',
    email: 'alex.morgan@example.com',
    role: 'buyer',
    joinDate: '2 days ago',
    avatar: '/avatar-1.jpg' // placeholder
  },
  {
    id: '2',
    name: 'Jessica Chen',
    email: 'jessica.chen@example.com',
    role: 'seller',
    joinDate: '3 days ago',
    avatar: '/avatar-2.jpg' // placeholder
  },
  {
    id: '3',
    name: 'David Kim',
    email: 'david.kim@example.com',
    role: 'buyer',
    joinDate: '5 days ago',
    avatar: '/avatar-3.jpg' // placeholder
  },
  {
    id: '4',
    name: 'Lisa Wong',
    email: 'lisa.wong@example.com',
    role: 'seller',
    joinDate: '1 week ago',
    avatar: '/avatar-4.jpg' // placeholder
  },
  {
    id: '5',
    name: 'Mark Johnson',
    email: 'mark.johnson@example.com',
    role: 'buyer',
    joinDate: '1 week ago',
    avatar: '/avatar-5.jpg' // placeholder
  }
]

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview')

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            Completed
          </Badge>
        )
      case 'processing':
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
            Processing
          </Badge>
        )
      case 'pending':
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            Pending
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant='outline'>{status}</Badge>
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <LayoutDashboard className='mr-2 h-6 w-6' />
            Admin Dashboard
          </h1>
          <p className='text-gray-600'>Welcome to the admin panel. Manage your store and view analytics.</p>
        </div>

        <div className='flex gap-2'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500' />
            <Input placeholder='Search...' className='pl-9 w-64' />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='icon'>
                <Menu className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className='mr-2 h-4 w-4' />
                Download Reports
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className='mr-2 h-4 w-4' />
                Add New Product
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Users className='mr-2 h-4 w-4' />
                Manage Users
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-6'>
          <TabsTrigger value='overview' className='flex items-center'>
            <LayoutDashboard className='mr-2 h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='analytics' className='flex items-center'>
            <BarChart2 className='mr-2 h-4 w-4' />
            Analytics
          </TabsTrigger>
          <TabsTrigger value='products' className='flex items-center'>
            <Package className='mr-2 h-4 w-4' />
            Products
          </TabsTrigger>
          <TabsTrigger value='orders' className='flex items-center'>
            <ShoppingBag className='mr-2 h-4 w-4' />
            Orders
          </TabsTrigger>
          <TabsTrigger value='customers' className='flex items-center'>
            <Users className='mr-2 h-4 w-4' />
            Customers
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview'>
          {/* Stats Cards */}
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <DollarSign className='h-5 w-5 text-green-500 mr-1' />
                  <p className='text-2xl font-bold'>$125,429.00</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUp className='h-3 w-3 mr-1' />
                  <span className='text-sm'>12.5% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <ShoppingCart className='h-5 w-5 text-blue-500 mr-1' />
                  <p className='text-2xl font-bold'>1,243</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUp className='h-3 w-3 mr-1' />
                  <span className='text-sm'>8.2% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Users className='h-5 w-5 text-purple-500 mr-1' />
                  <p className='text-2xl font-bold'>3,587</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUp className='h-3 w-3 mr-1' />
                  <span className='text-sm'>5.7% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Active Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Building className='h-5 w-5 text-orange-500 mr-1' />
                  <p className='text-2xl font-bold'>182</p>
                </div>
                <div className='flex items-center mt-1 text-red-600'>
                  <ArrowDown className='h-3 w-3 mr-1' />
                  <span className='text-sm'>1.2% from last month</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts row */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Overview</CardTitle>
                <CardDescription>Monthly revenue vs target</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    <Line
                      type='monotone'
                      dataKey='revenue'
                      stroke='#4f46e5'
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                      name='Revenue'
                    />
                    <Line type='monotone' dataKey='target' stroke='#94a3b8' strokeDasharray='5 5' name='Target' />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Sales by product category</CardDescription>
              </CardHeader>
              <CardContent className='h-80 flex items-center justify-center'>
                <div className='h-64 w-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='value'
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Section */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Recent Orders */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle>Recent Orders</CardTitle>
                  <Button variant='ghost' size='sm' asChild>
                    <Link to='/admin/orders'>
                      View All
                      <ArrowRight className='ml-1 h-4 w-4' />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentOrders.map((order) => (
                    <div key={order.id} className='flex items-center justify-between p-3 border rounded-lg'>
                      <div>
                        <div className='font-medium'>{order.id}</div>
                        <div className='text-sm text-gray-500'>{order.customer}</div>
                        <div className='text-xs text-gray-400'>{order.date}</div>
                      </div>
                      <div className='flex items-center space-x-4'>
                        <div className='text-right'>
                          <div className='font-medium'>{formatPrice(order.amount)}</div>
                          <div>{getStatusBadge(order.status)}</div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem>View Order</DropdownMenuItem>
                            <DropdownMenuItem>Update Status</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-red-600'>Cancel Order</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* New Users */}
            <Card>
              <CardHeader>
                <div className='flex justify-between items-center'>
                  <CardTitle>New Users</CardTitle>
                  <Button variant='ghost' size='sm' asChild>
                    <Link to='/admin/users'>
                      View All
                      <ArrowRight className='ml-1 h-4 w-4' />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentUsers.slice(0, 4).map((user) => (
                    <div key={user.id} className='flex items-center space-x-3'>
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <p className='font-medium truncate'>{user.name}</p>
                        <p className='text-sm text-gray-500 truncate'>{user.email}</p>
                      </div>
                      <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                        {user.role === 'seller' ? 'Seller' : 'Buyer'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics'>
          <Card className='mb-6'>
            <CardHeader>
              <CardTitle>Sales Analytics</CardTitle>
              <CardDescription>Weekly sales performance</CardDescription>
            </CardHeader>
            <CardContent className='h-96'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='name' />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} orders`, 'Sales']} />
                  <Bar dataKey='value' fill='#4f46e5' />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribution of sales across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-64'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx='50%'
                        cy='50%'
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='value'
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>KPI Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <div className='flex justify-between items-center mb-1'>
                    <div className='text-sm font-medium'>Revenue</div>
                    <div className='text-sm font-medium'>$125,429 / $150,000</div>
                  </div>
                  <Progress value={83} className='h-2' />
                </div>
                <div>
                  <div className='flex justify-between items-center mb-1'>
                    <div className='text-sm font-medium'>New Customers</div>
                    <div className='text-sm font-medium'>547 / 1,000</div>
                  </div>
                  <Progress value={55} className='h-2' />
                </div>
                <div>
                  <div className='flex justify-between items-center mb-1'>
                    <div className='text-sm font-medium'>Order Completion Rate</div>
                    <div className='text-sm font-medium'>91%</div>
                  </div>
                  <Progress value={91} className='h-2' />
                </div>
                <div>
                  <div className='flex justify-between items-center mb-1'>
                    <div className='text-sm font-medium'>Average Order Value</div>
                    <div className='text-sm font-medium'>$89.45 / $100</div>
                  </div>
                  <Progress value={89} className='h-2' />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value='products'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold'>Product Management</h2>
            <Button asChild>
              <Link to='/admin/products/new'>
                <Plus className='mr-2 h-4 w-4' />
                Add New Product
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Top Selling Products</CardTitle>
                <Button variant='ghost' size='sm' asChild>
                  <Link to='/admin/products'>
                    View All Products
                    <ArrowRight className='ml-1 h-4 w-4' />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <div className='grid grid-cols-5 p-3 bg-muted/50 font-medium'>
                  <div>Product</div>
                  <div>Category</div>
                  <div className='text-right'>Price</div>
                  <div className='text-right'>Sales</div>
                  <div className='text-right'>Revenue</div>
                </div>
                <Separator />
                {topProducts.map((product, index) => (
                  <div key={product.id} className='grid grid-cols-5 p-3 hover:bg-muted/20'>
                    <div className='font-medium'>{product.name}</div>
                    <div>{product.category}</div>
                    <div className='text-right'>{formatPrice(product.price)}</div>
                    <div className='text-right'>{product.sales} units</div>
                    <div className='text-right'>{formatPrice(product.revenue)}</div>
                    {index < topProducts.length - 1 && <Separator className='col-span-5 my-1' />}
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className='flex justify-end'>
              <Button variant='outline' asChild>
                <Link to='/admin/products/reports'>
                  <BarChart2 className='mr-2 h-4 w-4' />
                  Generate Report
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>Inventory Status</CardTitle>
                <CardDescription>Product inventory overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <div className='font-medium'>Total Products</div>
                    <div>1,245</div>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='font-medium'>In Stock</div>
                    <div>1,145</div>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='font-medium'>Low Stock</div>
                    <div className='text-yellow-600'>72</div>
                  </div>
                  <div className='flex justify-between items-center'>
                    <div className='font-medium'>Out of Stock</div>
                    <div className='text-red-600'>28</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant='outline' className='w-full' asChild>
                  <Link to='/admin/inventory'>Manage Inventory</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Overview</CardTitle>
                <CardDescription>Products by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {categoryData.map((category) => (
                    <div key={category.name} className='space-y-1'>
                      <div className='flex justify-between items-center'>
                        <div className='font-medium'>{category.name}</div>
                        <div>{category.value}%</div>
                      </div>
                      <Progress value={category.value} className='h-2' />
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant='outline' className='w-full' asChild>
                  <Link to='/admin/categories'>Manage Categories</Link>
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Actions</CardTitle>
                <CardDescription>Quick actions for product management</CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                <Button variant='outline' className='w-full justify-start' asChild>
                  <Link to='/admin/products/new'>
                    <Plus className='mr-2 h-4 w-4' />
                    Add New Product
                  </Link>
                </Button>
                <Button variant='outline' className='w-full justify-start' asChild>
                  <Link to='/admin/categories'>
                    <Tag className='mr-2 h-4 w-4' />
                    Manage Categories
                  </Link>
                </Button>
                <Button variant='outline' className='w-full justify-start' asChild>
                  <Link to='/admin/inventory'>
                    <Package className='mr-2 h-4 w-4' />
                    Update Inventory
                  </Link>
                </Button>
                <Button variant='outline' className='w-full justify-start' asChild>
                  <Link to='/admin/products/discounts'>
                    <Tag className='mr-2 h-4 w-4' />
                    Create Discount
                  </Link>
                </Button>
                <Button variant='outline' className='w-full justify-start' asChild>
                  <Link to='/admin/products/reports'>
                    <BarChart2 className='mr-2 h-4 w-4' />
                    View Reports
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value='orders'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold'>Order Management</h2>
            <Button asChild variant='outline'>
              <Link to='/admin/orders/export'>
                <Download className='mr-2 h-4 w-4' />
                Export Orders
              </Link>
            </Button>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-4 gap-6 mb-6'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <ShoppingBag className='h-5 w-5 text-blue-500 mr-1' />
                  <p className='text-2xl font-bold'>1,243</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <CreditCard className='h-5 w-5 text-yellow-500 mr-1' />
                  <p className='text-2xl font-bold'>42</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Package className='h-5 w-5 text-indigo-500 mr-1' />
                  <p className='text-2xl font-bold'>65</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Wallet className='h-5 w-5 text-green-500 mr-1' />
                  <p className='text-2xl font-bold'>1,136</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Recent Orders</CardTitle>
                <Button variant='ghost' size='sm' asChild>
                  <Link to='/admin/orders'>
                    View All
                    <ArrowRight className='ml-1 h-4 w-4' />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <div className='grid grid-cols-5 p-3 bg-muted/50 font-medium'>
                  <div>Order ID</div>
                  <div>Customer</div>
                  <div className='text-right'>Amount</div>
                  <div className='text-right'>Date</div>
                  <div className='text-right'>Status</div>
                </div>
                <Separator />
                {recentOrders.map((order, index) => (
                  <div key={order.id} className='grid grid-cols-5 p-3 hover:bg-muted/20'>
                    <div className='font-medium'>{order.id}</div>
                    <div>{order.customer}</div>
                    <div className='text-right'>{formatPrice(order.amount)}</div>
                    <div className='text-right'>{order.date}</div>
                    <div className='text-right'>{getStatusBadge(order.status)}</div>
                    {index < recentOrders.length - 1 && <Separator className='col-span-5 my-1' />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value='customers'>
          <div className='flex justify-between items-center mb-6'>
            <h2 className='text-xl font-bold'>Customer Management</h2>
            <div className='flex gap-2'>
              <Button asChild variant='outline'>
                <Link to='/admin/customers/export'>
                  <Download className='mr-2 h-4 w-4' />
                  Export
                </Link>
              </Button>
              <Button asChild>
                <Link to='/admin/customers/new'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Customer
                </Link>
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Total Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Users className='h-5 w-5 text-purple-500 mr-1' />
                  <p className='text-2xl font-bold'>3,587</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Active Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Building className='h-5 w-5 text-orange-500 mr-1' />
                  <p className='text-2xl font-bold'>182</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>New This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <PieChartIcon className='h-5 w-5 text-indigo-500 mr-1' />
                  <p className='text-2xl font-bold'>247</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className='flex justify-between items-center'>
                <CardTitle>Recent Users</CardTitle>
                <Button variant='ghost' size='sm' asChild>
                  <Link to='/admin/customers'>
                    View All
                    <ArrowRight className='ml-1 h-4 w-4' />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <div className='grid grid-cols-5 p-3 bg-muted/50 font-medium'>
                  <div>Name</div>
                  <div>Email</div>
                  <div>Role</div>
                  <div>Join Date</div>
                  <div className='text-right'>Actions</div>
                </div>
                <Separator />
                {recentUsers.map((user, index) => (
                  <div key={user.id} className='grid grid-cols-5 p-3 hover:bg-muted/20'>
                    <div className='font-medium flex items-center'>
                      <Avatar className='h-6 w-6 mr-2'>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      {user.name}
                    </div>
                    <div>{user.email}</div>
                    <div>
                      <Badge variant={user.role === 'seller' ? 'default' : 'secondary'}>
                        {user.role === 'seller' ? 'Seller' : 'Buyer'}
                      </Badge>
                    </div>
                    <div>{user.joinDate}</div>
                    <div className='text-right'>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm' className='h-8 w-8 p-0'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem>View Profile</DropdownMenuItem>
                          <DropdownMenuItem>Edit User</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className='text-red-600'>Deactivate Account</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {index < recentUsers.length - 1 && <Separator className='col-span-5 my-1' />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

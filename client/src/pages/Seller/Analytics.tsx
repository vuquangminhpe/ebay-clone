/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import {
  BarChart2,
  Calendar as CalendarIcon,
  Download,
  FileText,
  PieChart as PieChartIcon,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Calendar
} from 'lucide-react'
import { Button } from '@/Components/ui/button'

// Sample data - in a real app, this would come from API calls
const revenueData = [
  { name: 'Jan', revenue: 1200, orders: 32 },
  { name: 'Feb', revenue: 1900, orders: 45 },
  { name: 'Mar', revenue: 2300, orders: 54 },
  { name: 'Apr', revenue: 2100, orders: 49 },
  { name: 'May', revenue: 2800, orders: 62 },
  { name: 'Jun', revenue: 3100, orders: 68 },
  { name: 'Jul', revenue: 3300, orders: 72 },
  { name: 'Aug', revenue: 3700, orders: 84 },
  { name: 'Sep', revenue: 3400, orders: 77 },
  { name: 'Oct', revenue: 3900, orders: 86 },
  { name: 'Nov', revenue: 4200, orders: 92 },
  { name: 'Dec', revenue: 4800, orders: 104 }
]

const weeklyData = [
  { name: 'Mon', revenue: 450, orders: 12 },
  { name: 'Tue', revenue: 530, orders: 15 },
  { name: 'Wed', revenue: 620, orders: 18 },
  { name: 'Thu', revenue: 590, orders: 16 },
  { name: 'Fri', revenue: 780, orders: 22 },
  { name: 'Sat', revenue: 920, orders: 26 },
  { name: 'Sun', revenue: 810, orders: 24 }
]

const categoryData = [
  { name: 'Electronics', value: 35 },
  { name: 'Clothing', value: 30 },
  { name: 'Home Goods', value: 15 },
  { name: 'Books', value: 10 },
  { name: 'Other', value: 10 }
]

const topProducts = [
  {
    id: '1',
    name: 'Wireless Headphones',
    price: 79.99,
    sales: 32,
    revenue: 2559.68,
    growth: 12.5
  },
  {
    id: '2',
    name: 'Smartphone Case',
    price: 24.99,
    sales: 48,
    revenue: 1199.52,
    growth: 8.2
  },
  {
    id: '3',
    name: 'USB-C Cable Pack',
    price: 14.99,
    sales: 56,
    revenue: 839.44,
    growth: 15.4
  },
  {
    id: '4',
    name: 'Bluetooth Speaker',
    price: 59.99,
    sales: 28,
    revenue: 1679.72,
    growth: -3.1
  },
  {
    id: '5',
    name: 'Laptop Sleeve',
    price: 29.99,
    sales: 35,
    revenue: 1049.65,
    growth: 5.8
  }
]

const customerSegments = [
  { name: 'New Customers', value: 30 },
  { name: 'Returning', value: 45 },
  { name: 'Loyal', value: 25 }
]

const salesByRegion = [
  { name: 'North America', value: 45 },
  { name: 'Europe', value: 25 },
  { name: 'Asia', value: 20 },
  { name: 'Australia', value: 5 },
  { name: 'Other', value: 5 }
]

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#4CAF50', '#9C27B0']

export default function SellerAnalytics() {
  const [activeTab, setActiveTab] = useState('overview')
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), 0, 1),
    to: new Date()
  })
  const [timeFrame, setTimeFrame] = useState('yearly')

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value)
  }

  // Calculate metrics
  const calculateTotalRevenue = () => {
    return revenueData.reduce((sum, item) => sum + item.revenue, 0)
  }

  const calculateTotalOrders = () => {
    return revenueData.reduce((sum, item) => sum + item.orders, 0)
  }

  const calculateAverageOrderValue = () => {
    const totalRevenue = calculateTotalRevenue()
    const totalOrders = calculateTotalOrders()
    return totalOrders > 0 ? totalRevenue / totalOrders : 0
  }

  // Determine which data to use based on timeFrame
  const getChartData = () => {
    switch (timeFrame) {
      case 'weekly':
        return weeklyData
      case 'yearly':
      default:
        return revenueData
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <BarChart2 className='mr-2 h-6 w-6' />
            Analytics Dashboard
          </h1>
          <p className='text-gray-600'>Track your store performance and sales metrics</p>
        </div>

        <div className='flex gap-2'>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant='outline' className='flex items-center gap-2'>
                <CalendarIcon className='h-4 w-4' />
                {dateRange?.from ? format(dateRange.from, 'LLL dd, y') : <span>Start date</span>}
                {' - '}
                {dateRange?.to ? format(dateRange.to, 'LLL dd, y') : <span>End date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='end'>
              <Calendar
                mode='range'
                onSelect={(range: any) => {
                  if (range?.from && range?.to) {
                    setDateRange(range)
                  }
                }}
              />
            </PopoverContent>
          </Popover>

          <Select value={timeFrame} onValueChange={setTimeFrame}>
            <SelectTrigger className='w-[120px]'>
              <SelectValue placeholder='Time Frame' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='weekly'>Weekly</SelectItem>
              <SelectItem value='monthly'>Monthly</SelectItem>
              <SelectItem value='yearly'>Yearly</SelectItem>
            </SelectContent>
          </Select>

          <Button variant='outline'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='mb-6'>
          <TabsTrigger value='overview' className='flex items-center'>
            <Activity className='mr-2 h-4 w-4' />
            Overview
          </TabsTrigger>
          <TabsTrigger value='sales' className='flex items-center'>
            <TrendingUp className='mr-2 h-4 w-4' />
            Sales Analysis
          </TabsTrigger>
          <TabsTrigger value='products' className='flex items-center'>
            <Package className='mr-2 h-4 w-4' />
            Product Performance
          </TabsTrigger>
          <TabsTrigger value='customers' className='flex items-center'>
            <Users className='mr-2 h-4 w-4' />
            Customer Insights
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <DollarSign className='h-5 w-5 text-green-500 mr-1' />
                  <p className='text-2xl font-bold'>{formatCurrency(calculateTotalRevenue())}</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>12.5% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <ShoppingBag className='h-5 w-5 text-blue-500 mr-1' />
                  <p className='text-2xl font-bold'>{calculateTotalOrders()}</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>8.3% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Average Order Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <DollarSign className='h-5 w-5 text-purple-500 mr-1' />
                  <p className='text-2xl font-bold'>{formatCurrency(calculateAverageOrderValue())}</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>3.2% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Users className='h-5 w-5 text-orange-500 mr-1' />
                  <p className='text-2xl font-bold'>3.8%</p>
                </div>
                <div className='flex items-center mt-1 text-red-600'>
                  <ArrowDownRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>0.5% from last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle>Revenue Over Time</CardTitle>
                <CardDescription>{timeFrame === 'weekly' ? 'Weekly' : 'Monthly'} revenue trends</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={getChartData()}>
                    <defs>
                      <linearGradient id='colorRevenue' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='#4f46e5' stopOpacity={0.8} />
                        <stop offset='95%' stopColor='#4f46e5' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip formatter={(value, name) => [formatCurrency(value as number), name]} />
                    <Legend />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      name='Revenue'
                      stroke='#4f46e5'
                      fillOpacity={1}
                      fill='url(#colorRevenue)'
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <div className='flex items-center justify-center h-full'>
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
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Selling Products</CardTitle>
              <CardDescription>Your best performing products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className='font-medium'>{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>{formatCurrency(product.revenue)}</TableCell>
                      <TableCell>
                        <span
                          className={`flex items-center ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {product.growth >= 0 ? (
                            <ArrowUpRight className='h-4 w-4 mr-1' />
                          ) : (
                            <ArrowDownRight className='h-4 w-4 mr-1' />
                          )}
                          {Math.abs(product.growth)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales Analysis Tab */}
        <TabsContent value='sales'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend</CardTitle>
                <CardDescription>Revenue and order volume over time</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis yAxisId='left' orientation='left' stroke='#4f46e5' />
                    <YAxis yAxisId='right' orientation='right' stroke='#22c55e' />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Revenue') return [formatCurrency(value as number), name]
                        return [value, name]
                      }}
                    />
                    <Legend />
                    <Line
                      yAxisId='left'
                      type='monotone'
                      dataKey='revenue'
                      name='Revenue'
                      stroke='#4f46e5'
                      activeDot={{ r: 8 }}
                    />
                    <Line
                      yAxisId='right'
                      type='monotone'
                      dataKey='orders'
                      name='Orders'
                      stroke='#22c55e'
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>Revenue breakdown by month</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                    <Bar dataKey='revenue' name='Revenue' fill='#4f46e5' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Sales by Region</CardTitle>
                <CardDescription>Geographical distribution</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <div className='flex items-center justify-center h-full'>
                  <ResponsiveContainer width='100%' height='100%'>
                    <PieChart>
                      <Pie
                        data={salesByRegion}
                        cx='50%'
                        cy='50%'
                        labelLine={false}
                        outerRadius={80}
                        fill='#8884d8'
                        dataKey='value'
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {salesByRegion.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Performance</CardTitle>
                <CardDescription>Orders by day of week</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'Orders']} />
                    <Bar dataKey='orders' name='Orders' fill='#22c55e' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
                <CardDescription>Key metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div>
                    <h3 className='text-sm font-medium text-gray-500'>Total Revenue</h3>
                    <p className='text-2xl font-bold'>{formatCurrency(calculateTotalRevenue())}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-gray-500'>Total Orders</h3>
                    <p className='text-2xl font-bold'>{calculateTotalOrders()}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-gray-500'>Average Order Value</h3>
                    <p className='text-2xl font-bold'>{formatCurrency(calculateAverageOrderValue())}</p>
                  </div>
                  <div>
                    <h3 className='text-sm font-medium text-gray-500'>Best Performing Month</h3>
                    <p className='text-2xl font-bold'>December</p>
                    <p className='text-sm text-gray-500'>{formatCurrency(4800)} in revenue</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Product Performance Tab */}
        <TabsContent value='products'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle>Top Products by Revenue</CardTitle>
                <CardDescription>Highest earning products</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={topProducts} layout='vertical' margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis type='category' dataKey='name' width={150} />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Revenue']} />
                    <Bar dataKey='revenue' fill='#4f46e5' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Products by Units Sold</CardTitle>
                <CardDescription>Best selling products by quantity</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={topProducts} layout='vertical' margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' />
                    <YAxis type='category' dataKey='name' width={150} />
                    <Tooltip formatter={(value) => [value, 'Units Sold']} />
                    <Bar dataKey='sales' fill='#22c55e' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Detailed metrics for all products</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Growth</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className='font-medium'>{product.name}</TableCell>
                      <TableCell>{formatCurrency(product.price)}</TableCell>
                      <TableCell>{product.sales}</TableCell>
                      <TableCell>{formatCurrency(product.revenue)}</TableCell>
                      <TableCell>
                        <span
                          className={`flex items-center ${product.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {product.growth >= 0 ? (
                            <ArrowUpRight className='h-4 w-4 mr-1' />
                          ) : (
                            <ArrowDownRight className='h-4 w-4 mr-1' />
                          )}
                          {Math.abs(product.growth)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={`${
                            product.growth >= 5
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : product.growth >= 0
                                ? 'bg-blue-50 text-blue-700 border-blue-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {product.growth >= 5 ? 'High Performing' : product.growth >= 0 ? 'Stable' : 'Needs Attention'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6'>
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Sales by product category</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
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
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Insights</CardTitle>
                <CardDescription>Summary and recommendations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='p-4 border rounded-lg bg-blue-50 text-blue-800'>
                    <h3 className='font-medium mb-1'>Top Performer</h3>
                    <p>Wireless Headphones is your best selling product by revenue.</p>
                  </div>
                  <div className='p-4 border rounded-lg bg-green-50 text-green-800'>
                    <h3 className='font-medium mb-1'>Growth Opportunity</h3>
                    <p>USB-C Cable Pack shows the highest growth rate at 15.4%.</p>
                  </div>
                  <div className='p-4 border rounded-lg bg-red-50 text-red-800'>
                    <h3 className='font-medium mb-1'>Needs Attention</h3>
                    <p>Bluetooth Speaker is showing a decline of 3.1% in sales.</p>
                  </div>
                  <div className='p-4 border rounded-lg bg-purple-50 text-purple-800'>
                    <h3 className='font-medium mb-1'>Recommendation</h3>
                    <p>Consider running a promotional campaign for Bluetooth Speaker to boost sales.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Insights Tab */}
        <TabsContent value='customers'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
            <Card>
              <CardHeader>
                <CardTitle>Customer Segments</CardTitle>
                <CardDescription>Breakdown by customer type</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={customerSegments}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerSegments.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Acquisition</CardTitle>
                <CardDescription>New customers over time</CardDescription>
              </CardHeader>
              <CardContent className='h-80'>
                <ResponsiveContainer width='100%' height='100%'>
                  <LineChart
                    data={revenueData.map((item) => ({
                      ...item,
                      newCustomers: Math.floor(item.orders * 0.3) // 30% new customers assumption
                    }))}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip formatter={(value) => [value, 'New Customers']} />
                    <Line type='monotone' dataKey='newCustomers' stroke='#8884d8' activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Customer Lifetime Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <DollarSign className='h-5 w-5 text-green-500 mr-1' />
                  <p className='text-2xl font-bold'>{formatCurrency(248.5)}</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>5.2% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Repeat Purchase Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <Users className='h-5 w-5 text-blue-500 mr-1' />
                  <p className='text-2xl font-bold'>42%</p>
                </div>
                <div className='flex items-center mt-1 text-green-600'>
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>3.8% from last period</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-2'>
                <CardTitle className='text-sm text-gray-500'>Avg. Order Frequency</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='flex items-center'>
                  <ShoppingBag className='h-5 w-5 text-purple-500 mr-1' />
                  <p className='text-2xl font-bold'>38 days</p>
                </div>
                <div className='flex items-center mt-1 text-red-600'>
                  <ArrowDownRight className='h-3 w-3 mr-1' />
                  <span className='text-sm'>2.4% from last period</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
              <CardDescription>Key observations and recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='p-4 border rounded-lg'>
                    <h3 className='font-medium mb-1 flex items-center'>
                      <Users className='h-4 w-4 mr-2 text-blue-500' />
                      Customer Segmentation
                    </h3>
                    <p className='text-gray-600'>
                      45% of your revenue comes from returning customers. Focus on loyalty programs to increase repeat
                      purchases.
                    </p>
                  </div>
                  <div className='p-4 border rounded-lg'>
                    <h3 className='font-medium mb-1 flex items-center'>
                      <TrendingUp className='h-4 w-4 mr-2 text-green-500' />
                      Growth Opportunities
                    </h3>
                    <p className='text-gray-600'>
                      New customer acquisition is increasing at 8.3% month-over-month. Email marketing has been your
                      most effective channel.
                    </p>
                  </div>
                </div>
                <div className='space-y-4'>
                  <div className='p-4 border rounded-lg'>
                    <h3 className='font-medium mb-1 flex items-center'>
                      <PieChartIcon className='h-4 w-4 mr-2 text-purple-500' />
                      Regional Analysis
                    </h3>
                    <p className='text-gray-600'>
                      North America represents 45% of your customer base. Consider expanding marketing efforts in Europe
                      and Asia to increase market share.
                    </p>
                  </div>
                  <div className='p-4 border rounded-lg'>
                    <h3 className='font-medium mb-1 flex items-center'>
                      <FileText className='h-4 w-4 mr-2 text-orange-500' />
                      Recommendations
                    </h3>
                    <p className='text-gray-600'>
                      Implement a loyalty program to increase customer retention. Consider offering special promotions
                      to boost repeat purchase frequency.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

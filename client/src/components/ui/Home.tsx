import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '@/hooks/useProduct'
import { useCategoryTree } from '@/hooks/useCategory'
import { useTopStores } from '@/hooks/useStore'
import { ProductCondition } from '@/types/type'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronRight, BarChart2, Star, Clock, HeartIcon, Truck, TrendingUp, Award, MessageSquare } from 'lucide-react'
import { Button } from './button'
import { Skeleton } from './skeleton'

export default function Home() {
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined)

  // Fetch featured products
  const { data: productsData, isLoading: productsLoading } = useProducts({
    limit: 10,
    category_id: categoryFilter,
    sort: 'created_at',
    order: 'desc'
  })

  // Fetch trending products
  const { data: trendingProductsData, isLoading: trendingLoading } = useProducts({
    limit: 8,
    sort: 'views',
    order: 'desc'
  })

  // Fetch auction products
  const { data: auctionProductsData, isLoading: auctionLoading } = useProducts({
    limit: 8,
    sort: 'created_at',
    order: 'desc'
  })

  // Fetch category tree
  const { data: categoryTree, isLoading: categoriesLoading } = useCategoryTree()

  // Fetch top sellers
  const { data: topStores, isLoading: storesLoading } = useTopStores()

  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value)

    if (value === 'all') {
      setCategoryFilter(undefined)
    } else {
      // Assuming value is category_id
      setCategoryFilter(value)
    }
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Get condition badge color
  const getConditionBadge = (condition: ProductCondition) => {
    switch (condition) {
      case 'new':
        return <span className='bg-green-100 text-green-800 text-xs px-2 py-1 rounded'>New</span>
      case 'like_new':
        return <span className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'>Like New</span>
      case 'very_good':
        return <span className='bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded'>Very Good</span>
      case 'good':
        return <span className='bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded'>Good</span>
      case 'acceptable':
        return <span className='bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded'>Acceptable</span>
      case 'for_parts':
        return <span className='bg-red-100 text-red-800 text-xs px-2 py-1 rounded'>For Parts</span>
      default:
        return null
    }
  }

  return (
    <div>
      {/* Hero Section */}
      <section className='bg-indigo-600 text-white py-16 px-4 md:px-8 rounded-xl mb-12 relative overflow-hidden'>
        <div className='absolute inset-0 opacity-10'>
          <svg className='w-full h-full' viewBox='0 0 100 100' preserveAspectRatio='none'>
            <path d='M0,0 L100,0 L100,100 L0,100 Z' fill='url(#grid)' />
          </svg>
          <defs>
            <pattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'>
              <path d='M 10 0 L 0 0 0 10' fill='none' stroke='white' strokeWidth='0.5' />
            </pattern>
          </defs>
        </div>
        <div className='relative z-10 max-w-5xl mx-auto'>
          <h1 className='text-4xl md:text-5xl font-bold mb-4'>Find exactly what you're looking for</h1>
          <p className='text-xl md:text-2xl mb-8 max-w-2xl'>
            Millions of items. Secure payments. Buyer protection on every purchase.
          </p>
          <div className='flex flex-wrap gap-3'>
            <Button size='lg' className='bg-white text-indigo-600 hover:bg-gray-100'>
              Shop Now
            </Button>
            <Button size='lg' variant='outline' className='border-white text-white hover:bg-indigo-700'>
              Start Selling
            </Button>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className='mb-12'>
        <div className='flex justify-between items-center mb-6'>
          <h2 className='text-2xl font-bold'>Browse Categories</h2>
          <Link to='/categories' className='text-indigo-600 flex items-center text-sm'>
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <Tabs defaultValue='all' value={activeTab} onValueChange={handleTabChange}>
          <TabsList className='mb-6 flex flex-wrap h-auto'>
            <TabsTrigger value='all'>All</TabsTrigger>
            {categoriesLoading ? (
              <>
                <Skeleton className='h-9 w-20 rounded-md' />
                <Skeleton className='h-9 w-24 rounded-md' />
                <Skeleton className='h-9 w-20 rounded-md' />
              </>
            ) : (
              categoryTree?.result?.slice(0, 8).map((category) => (
                <TabsTrigger key={category._id} value={category._id}>
                  {category.name}
                </TabsTrigger>
              ))
            )}
          </TabsList>

          <TabsContent value={activeTab} className='mt-0'>
            <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'>
              {productsLoading ? (
                Array(10)
                  .fill(0)
                  .map((_, index) => (
                    <Card key={index} className='overflow-hidden'>
                      <Skeleton className='h-40 w-full' />
                      <CardHeader className='p-3'>
                        <Skeleton className='h-4 w-full mb-2' />
                        <Skeleton className='h-4 w-3/4' />
                      </CardHeader>
                      <CardFooter className='p-3 pt-0'>
                        <Skeleton className='h-5 w-1/2' />
                      </CardFooter>
                    </Card>
                  ))
              ) : productsData?.products.length === 0 ? (
                <div className='col-span-full text-center py-8'>
                  <p className='text-gray-500'>No products found in this category.</p>
                </div>
              ) : (
                productsData?.products.map((product) => (
                  <Link to={`/products/${product._id}`} key={product._id}>
                    <Card className='overflow-hidden h-full hover:shadow-md transition-shadow'>
                      <div className='aspect-square overflow-hidden bg-gray-100'>
                        <img
                          src={product.medias.find((m) => m.is_primary)?.url || product.medias[0]?.url}
                          alt={product.name}
                          className='w-full h-full object-cover'
                        />
                      </div>
                      <CardHeader className='p-3'>
                        <CardTitle className='text-sm truncate'>{product.name}</CardTitle>
                        <CardDescription className='flex items-center gap-1'>
                          {getConditionBadge(product.condition)}
                          {product.free_shipping && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded ml-1'>
                              Free Shipping
                            </span>
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className='p-3 pt-0 flex justify-between items-center'>
                        <span className='font-semibold'>{formatPrice(product.price)}</span>
                        {product.rating && (
                          <span className='flex items-center text-xs text-gray-500'>
                            <Star size={12} className='fill-yellow-500 text-yellow-500 mr-1' />
                            {product.rating.toFixed(1)}
                          </span>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </section>

      {/* Featured Auctions */}
      <section className='mb-12'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-2xl font-bold flex items-center'>
              <BarChart2 size={24} className='mr-2 text-indigo-600' />
              Featured Auctions
            </h2>
            <p className='text-gray-600'>Bid now on these popular items ending soon</p>
          </div>
          <Link to='/auctions' className='text-indigo-600 flex items-center text-sm'>
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <Carousel className='w-full'>
          <CarouselContent>
            {auctionLoading
              ? Array(4)
                  .fill(0)
                  .map((_, index) => (
                    <CarouselItem key={index} className='md:basis-1/2 lg:basis-1/3'>
                      <Card>
                        <Skeleton className='h-48 w-full' />
                        <CardHeader>
                          <Skeleton className='h-4 w-full mb-2' />
                          <Skeleton className='h-4 w-3/4' />
                        </CardHeader>
                        <CardFooter>
                          <Skeleton className='h-6 w-1/2' />
                        </CardFooter>
                      </Card>
                    </CarouselItem>
                  ))
              : auctionProductsData?.products.map((product) => (
                  <CarouselItem key={product._id} className='md:basis-1/2 lg:basis-1/3'>
                    <Link to={`/products/${product._id}`}>
                      <Card className='overflow-hidden hover:shadow-md transition-shadow h-full'>
                        <div className='aspect-video overflow-hidden bg-gray-100'>
                          <img
                            src={product.medias.find((m) => m.is_primary)?.url || product.medias[0]?.url}
                            alt={product.name}
                            className='w-full h-full object-cover'
                          />
                        </div>
                        <CardHeader className='p-4'>
                          <CardTitle className='text-lg truncate'>{product.name}</CardTitle>
                          <CardDescription className='flex items-center'>
                            <Clock size={16} className='mr-1 text-orange-500' />
                            <span>Ends in 2 days</span> {/* Replace with actual countdown */}
                          </CardDescription>
                        </CardHeader>
                        <CardFooter className='p-4 pt-0 flex justify-between items-center'>
                          <div>
                            <p className='text-sm text-gray-500'>Current bid:</p>
                            <p className='font-bold text-xl'>{formatPrice(product.price)}</p>
                          </div>
                          <Button>Place Bid</Button>
                        </CardFooter>
                      </Card>
                    </Link>
                  </CarouselItem>
                ))}
          </CarouselContent>
          <div className='hidden md:block'>
            <CarouselPrevious />
            <CarouselNext />
          </div>
        </Carousel>
      </section>

      {/* Trending Products */}
      <section className='mb-12'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-2xl font-bold flex items-center'>
              <TrendingUp size={24} className='mr-2 text-indigo-600' />
              Trending Products
            </h2>
            <p className='text-gray-600'>The hottest items people are looking at right now</p>
          </div>
          <Link to='/trending' className='text-indigo-600 flex items-center text-sm'>
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
          {trendingLoading
            ? Array(8)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className='overflow-hidden'>
                    <Skeleton className='h-40 w-full' />
                    <CardHeader className='p-3'>
                      <Skeleton className='h-4 w-full mb-2' />
                      <Skeleton className='h-4 w-3/4' />
                    </CardHeader>
                    <CardFooter className='p-3 pt-0'>
                      <Skeleton className='h-5 w-1/2' />
                    </CardFooter>
                  </Card>
                ))
            : trendingProductsData?.products.map((product) => (
                <Link to={`/products/${product._id}`} key={product._id}>
                  <Card className='overflow-hidden h-full hover:shadow-md transition-shadow'>
                    <div className='aspect-square overflow-hidden bg-gray-100 relative'>
                      <img
                        src={product.medias.find((m) => m.is_primary)?.url || product.medias[0]?.url}
                        alt={product.name}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute top-2 right-2 bg-red-500 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center'>
                        <TrendingUp size={14} />
                      </div>
                    </div>
                    <CardHeader className='p-3'>
                      <CardTitle className='text-sm truncate'>{product.name}</CardTitle>
                      <CardDescription className='flex items-center text-xs'>
                        <span>{product.views} views</span>
                        {product.free_shipping && (
                          <span className='flex items-center ml-2'>
                            <Truck size={12} className='mr-1' />
                            Free Shipping
                          </span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className='p-3 pt-0 flex justify-between items-center'>
                      <span className='font-semibold'>{formatPrice(product.price)}</span>
                      <Button variant='ghost' size='icon' className='h-8 w-8'>
                        <HeartIcon size={16} />
                      </Button>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
        </div>
      </section>

      {/* Top Sellers */}
      <section className='mb-12'>
        <div className='flex justify-between items-center mb-6'>
          <div>
            <h2 className='text-2xl font-bold flex items-center'>
              <Award size={24} className='mr-2 text-indigo-600' />
              Top Sellers
            </h2>
            <p className='text-gray-600'>Shop with confidence from our highest-rated sellers</p>
          </div>
          <Link to='/sellers' className='text-indigo-600 flex items-center text-sm'>
            View all <ChevronRight size={16} />
          </Link>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
          {storesLoading
            ? Array(4)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className='overflow-hidden'>
                    <Skeleton className='h-20 w-full' />
                    <div className='flex justify-center -mt-10'>
                      <Skeleton className='h-20 w-20 rounded-full border-4 border-white' />
                    </div>
                    <CardHeader className='p-3 text-center mt-2'>
                      <Skeleton className='h-4 w-full mb-2 mx-auto' />
                      <Skeleton className='h-4 w-3/4 mx-auto' />
                    </CardHeader>
                  </Card>
                ))
            : topStores?.result?.map((store) => (
                <Link to={`/store/${store._id}`} key={store._id}>
                  <Card className='overflow-hidden hover:shadow-md transition-shadow relative'>
                    <div className='h-24 bg-gradient-to-r from-indigo-500 to-purple-600'></div>
                    <div className='flex justify-center -mt-12'>
                      <div className='h-24 w-24 rounded-full border-4 border-white bg-white overflow-hidden'>
                        <img
                          src={store.logo || '/placeholder-store.png'}
                          alt={store.name}
                          className='w-full h-full object-cover'
                        />
                      </div>
                    </div>
                    <CardHeader className='text-center pt-2 pb-4'>
                      <CardTitle>{store.name}</CardTitle>
                      <CardDescription className='flex items-center justify-center gap-1'>
                        <Star size={16} className='fill-yellow-500 text-yellow-500' />
                        <span>{store.rating.toFixed(1)}</span>
                        <span className='mx-1'>•</span>
                        <span>{store.total_products} products</span>
                      </CardDescription>
                      <Button variant='outline' size='sm' className='mt-2'>
                        View Store
                      </Button>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
        </div>
      </section>

      {/* Why Shop With Us */}
      <section className='mb-12 bg-gray-50 rounded-xl p-8'>
        <h2 className='text-2xl font-bold text-center mb-8'>Why Shop With Us</h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
          <div className='text-center'>
            <div className='rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <Truck size={28} className='text-indigo-600' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Fast & Free Shipping</h3>
            <p className='text-gray-600'>On millions of items with free shipping over $25</p>
          </div>

          <div className='text-center'>
            <div className='rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <Shield size={28} className='text-indigo-600' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>Buyer Protection</h3>
            <p className='text-gray-600'>Get your money back if items don't arrive or aren't as described</p>
          </div>

          <div className='text-center'>
            <div className='rounded-full bg-indigo-100 w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <MessageSquare size={28} className='text-indigo-600' />
            </div>
            <h3 className='text-lg font-semibold mb-2'>24/7 Support</h3>
            <p className='text-gray-600'>Questions? Our customer service team is here to help</p>
          </div>
        </div>
      </section>
    </div>
  )
}

// Missing Shield icon
function Shield({ size = 24, className = '' }) {
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
      <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
    </svg>
  )
}

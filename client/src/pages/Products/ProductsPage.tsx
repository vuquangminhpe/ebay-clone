/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, SetStateAction } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProducts } from '@/hooks/useProduct'
import { useCategoryTree } from '@/hooks/useCategory'
import { ProductCondition } from '@/types/type'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination'
import { Link } from 'react-router-dom'
import { Search, Star, Truck, Filter, SlidersHorizontal, XCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/Components/ui/button'

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Extract filter values from URL
  const categoryId = searchParams.get('category') || ''
  const minPrice = searchParams.get('min_price') ? Number(searchParams.get('min_price')) : 0
  const maxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 10000
  const condition = searchParams.get('condition') || ''
  const freeShipping = searchParams.get('free_shipping') === 'true'
  const searchQuery = searchParams.get('search') || ''
  const currentPage = searchParams.get('page') ? Number(searchParams.get('page')) : 1
  const sortBy = searchParams.get('sort') || 'created_at'
  const sortOrder = searchParams.get('order') || 'desc'

  // Local state for filters
  const [priceRange, setPriceRange] = useState<[number, number]>([minPrice, maxPrice])
  const [localSearch, setLocalSearch] = useState(searchQuery)

  // Effect to update local state when URL params change
  useEffect(() => {
    setLocalSearch(searchQuery)
    setPriceRange([minPrice || 0, maxPrice || 10000])
  }, [searchQuery, minPrice, maxPrice])

  // Fetch products with filters
  const { data: productsData, isLoading: productsLoading } = useProducts({
    page: currentPage,
    limit: 12,
    category_id: categoryId || undefined,
    min_price: priceRange[0],
    max_price: priceRange[1],
    condition: (condition as ProductCondition) || undefined,
    free_shipping: freeShipping || undefined,
    search: searchQuery || undefined,
    sort: sortBy,
    order: sortOrder as 'asc' | 'desc'
  })

  // Fetch categories for filter
  const { data: categoryTree, isLoading: categoriesLoading } = useCategoryTree()

  // Apply filters
  const applyFilters = () => {
    const newParams = new URLSearchParams(searchParams)

    // Set price range
    if (priceRange[0] > 0) {
      newParams.set('min_price', priceRange[0].toString())
    } else {
      newParams.delete('min_price')
    }

    if (priceRange[1] < 10000) {
      newParams.set('max_price', priceRange[1].toString())
    } else {
      newParams.delete('max_price')
    }

    // Reset to first page when filters change
    newParams.set('page', '1')

    setSearchParams(newParams)
  }

  // Handle search form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const newParams = new URLSearchParams(searchParams)

    if (localSearch) {
      newParams.set('search', localSearch)
    } else {
      newParams.delete('search')
    }

    // Reset to first page when search changes
    newParams.set('page', '1')

    setSearchParams(newParams)
  }

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean, param: string) => {
    const newParams = new URLSearchParams(searchParams)

    if (checked) {
      newParams.set(param, 'true')
    } else {
      newParams.delete(param)
    }

    // Reset to first page when filters change
    newParams.set('page', '1')

    setSearchParams(newParams)
  }

  // Handle select change
  const handleSelectChange = (value: string, param: string) => {
    const newParams = new URLSearchParams(searchParams)

    if (value) {
      newParams.set(param, value)
    } else {
      newParams.delete(param)
    }

    // Reset to first page when filters change
    newParams.set('page', '1')

    setSearchParams(newParams)
  }

  // Handle sort change
  const handleSortChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)

    // Parse the value (format: "field-order")
    const [field, order] = value.split('-')

    newParams.set('sort', field)
    newParams.set('order', order)

    setSearchParams(newParams)
  }

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('page', page.toString())
    setSearchParams(newParams)

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Reset all filters
  const resetFilters = () => {
    const newParams = new URLSearchParams()

    // Preserve search query if exists
    if (searchQuery) {
      newParams.set('search', searchQuery)
    }

    setSearchParams(newParams)
    setPriceRange([0, 10000])
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Generate pagination items
  const generatePaginationItems = () => {
    if (!productsData?.pagination) return null

    const { page, totalPages } = productsData.pagination
    const items = []

    // Previous button
    items.push(
      <PaginationItem key='prev'>
        <PaginationPrevious
          href='#'
          onClick={(e: { preventDefault: () => void }) => {
            e.preventDefault()
            if (page > 1) handlePageChange(page - 1)
          }}
          className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    )

    // First page
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          href='#'
          onClick={(e: { preventDefault: () => void }) => {
            e.preventDefault()
            handlePageChange(1)
          }}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    )

    // Ellipsis if needed
    if (page > 3) {
      items.push(
        <PaginationItem key='ellipsis1'>
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Pages around current
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      if (i <= 1 || i >= totalPages) continue

      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href='#'
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault()
              handlePageChange(i)
            }}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Ellipsis if needed
    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key='ellipsis2'>
          <PaginationEllipsis />
        </PaginationItem>
      )
    }

    // Last page
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href='#'
            onClick={(e: { preventDefault: () => void }) => {
              e.preventDefault()
              handlePageChange(totalPages)
            }}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      )
    }

    // Next button
    items.push(
      <PaginationItem key='next'>
        <PaginationNext
          href='#'
          onClick={(e: { preventDefault: () => void }) => {
            e.preventDefault()
            if (page < totalPages) handlePageChange(page + 1)
          }}
          className={page >= totalPages ? 'pointer-events-none opacity-50' : ''}
        />
      </PaginationItem>
    )

    return items
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
    <div className='flex flex-col md:flex-row gap-6'>
      {/* Mobile filter button */}
      <div className='md:hidden mb-4'>
        <Button variant='outline' className='w-full' onClick={() => setMobileFiltersOpen(true)}>
          <Filter className='mr-2 h-4 w-4' />
          Filters
        </Button>
      </div>

      {/* Mobile filters sidebar */}
      <div
        className={`fixed inset-0 z-50 bg-background/80 backdrop-blur-sm transition-all duration-100 ${mobileFiltersOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <div
          className={`fixed inset-y-0 left-0 z-50 w-full sm:w-80 bg-background p-6 shadow-lg transition-transform duration-300 ${mobileFiltersOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <div className='flex items-center justify-between mb-6'>
            <h2 className='text-xl font-semibold'>Filters</h2>
            <Button variant='ghost' size='icon' onClick={() => setMobileFiltersOpen(false)}>
              <XCircle className='h-5 w-5' />
            </Button>
          </div>

          {/* Filters content - same as desktop but in mobile sidebar */}
          <div className='space-y-6'>
            {/* Category filter */}
            <div>
              <h3 className='text-sm font-medium mb-3'>Category</h3>
              <Select value={categoryId} onValueChange={(value: string) => handleSelectChange(value, 'category')}>
                <SelectTrigger>
                  <SelectValue placeholder='All Categories' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>All Categories</SelectItem>
                  {categoriesLoading ? (
                    <SelectItem value='' disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    categoryTree?.result?.map((category: { _id: any; name: any }) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Price range filter */}
            <div>
              <div className='flex items-center justify-between mb-3'>
                <h3 className='text-sm font-medium'>Price Range</h3>
                <span className='text-xs text-gray-500'>
                  {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
                </span>
              </div>

              <Slider
                min={0}
                max={10000}
                step={50}
                value={priceRange}
                onValueChange={() => setPriceRange}
                className='mb-6'
              />

              <div className='flex gap-3'>
                <div className='w-1/2'>
                  <Label htmlFor='min-price' className='text-xs'>
                    Min Price
                  </Label>
                  <Input
                    id='min-price'
                    type='number'
                    min={0}
                    max={priceRange[1]}
                    value={priceRange[0]}
                    onChange={(e: { target: { value: any } }) => setPriceRange([Number(e.target.value), priceRange[1]])}
                    className='mt-1'
                  />
                </div>
                <div className='w-1/2'>
                  <Label htmlFor='max-price' className='text-xs'>
                    Max Price
                  </Label>
                  <Input
                    id='max-price'
                    type='number'
                    min={priceRange[0]}
                    max={10000}
                    value={priceRange[1]}
                    onChange={(e: { target: { value: any } }) => setPriceRange([priceRange[0], Number(e.target.value)])}
                    className='mt-1'
                  />
                </div>
              </div>

              <Button variant='outline' size='sm' className='w-full mt-2' onClick={applyFilters}>
                Apply
              </Button>
            </div>

            {/* Condition filter */}
            <div>
              <h3 className='text-sm font-medium mb-3'>Condition</h3>
              <Select value={condition} onValueChange={(value: string) => handleSelectChange(value, 'condition')}>
                <SelectTrigger>
                  <SelectValue placeholder='Any Condition' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Any Condition</SelectItem>
                  <SelectItem value='new'>New</SelectItem>
                  <SelectItem value='like_new'>Like New</SelectItem>
                  <SelectItem value='very_good'>Very Good</SelectItem>
                  <SelectItem value='good'>Good</SelectItem>
                  <SelectItem value='acceptable'>Acceptable</SelectItem>
                  <SelectItem value='for_parts'>For Parts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Shipping options */}
            <div>
              <h3 className='text-sm font-medium mb-3'>Shipping Options</h3>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='free-shipping-mobile'
                  checked={freeShipping}
                  onCheckedChange={(checked: boolean) => handleCheckboxChange(checked as boolean, 'free_shipping')}
                />
                <Label htmlFor='free-shipping-mobile' className='text-sm'>
                  Free Shipping
                </Label>
              </div>
            </div>

            {/* Reset filters button */}
            <Button variant='outline' className='w-full mt-4' onClick={resetFilters}>
              Reset Filters
            </Button>

            {/* Apply button for mobile */}
            <Button
              className='w-full'
              onClick={() => {
                applyFilters()
                setMobileFiltersOpen(false)
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop filters sidebar */}
      <div className='hidden md:block w-64 flex-shrink-0'>
        <div className='sticky top-24 bg-white rounded-lg shadow p-5 space-y-6'>
          <div>
            <h2 className='text-lg font-semibold flex items-center'>
              <SlidersHorizontal className='mr-2 h-5 w-5' />
              Filters
            </h2>
            {(searchQuery || categoryId || minPrice > 0 || maxPrice < 10000 || condition || freeShipping) && (
              <Button variant='link' className='px-0 text-sm h-auto' onClick={resetFilters}>
                Clear all
              </Button>
            )}
          </div>

          <Separator />

          {/* Category filter */}
          <div>
            <h3 className='text-sm font-medium mb-3'>Category</h3>
            <Select value={categoryId} onValueChange={(value: string) => handleSelectChange(value, 'category')}>
              <SelectTrigger>
                <SelectValue placeholder='All Categories' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>All Categories</SelectItem>
                {categoriesLoading ? (
                  <SelectItem value='' disabled>
                    Loading...
                  </SelectItem>
                ) : (
                  categoryTree?.result?.map((category: { _id: any; name: any }) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Price range filter */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-sm font-medium'>Price Range</h3>
              <span className='text-xs text-gray-500'>
                {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
              </span>
            </div>

            <Slider
              min={0}
              max={10000}
              step={50}
              value={priceRange}
              onValueChange={() => setPriceRange}
              className='mb-6'
            />

            <div className='flex gap-3'>
              <div className='w-1/2'>
                <Label htmlFor='min-price' className='text-xs'>
                  Min Price
                </Label>
                <Input
                  id='min-price'
                  type='number'
                  min={0}
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e: { target: { value: any } }) => setPriceRange([Number(e.target.value), priceRange[1]])}
                  className='mt-1'
                />
              </div>
              <div className='w-1/2'>
                <Label htmlFor='max-price' className='text-xs'>
                  Max Price
                </Label>
                <Input
                  id='max-price'
                  type='number'
                  min={priceRange[0]}
                  max={10000}
                  value={priceRange[1]}
                  onChange={(e: { target: { value: any } }) => setPriceRange([priceRange[0], Number(e.target.value)])}
                  className='mt-1'
                />
              </div>
            </div>

            <Button variant='outline' size='sm' className='w-full mt-2' onClick={applyFilters}>
              Apply
            </Button>
          </div>

          {/* Condition filter */}
          <div>
            <h3 className='text-sm font-medium mb-3'>Condition</h3>
            <Select value={condition} onValueChange={(value: string) => handleSelectChange(value, 'condition')}>
              <SelectTrigger>
                <SelectValue placeholder='Any Condition' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value=''>Any Condition</SelectItem>
                <SelectItem value='new'>New</SelectItem>
                <SelectItem value='like_new'>Like New</SelectItem>
                <SelectItem value='very_good'>Very Good</SelectItem>
                <SelectItem value='good'>Good</SelectItem>
                <SelectItem value='acceptable'>Acceptable</SelectItem>
                <SelectItem value='for_parts'>For Parts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Shipping options */}
          <div>
            <h3 className='text-sm font-medium mb-3'>Shipping Options</h3>
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='free-shipping'
                checked={freeShipping}
                onCheckedChange={(checked: boolean) => handleCheckboxChange(checked as boolean, 'free_shipping')}
              />
              <Label htmlFor='free-shipping' className='text-sm'>
                Free Shipping
              </Label>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='flex-1 min-w-0'>
        {/* Search and sort bar */}
        <div className='bg-white rounded-lg shadow p-4 mb-6'>
          <div className='flex flex-col sm:flex-row gap-4'>
            {/* Search input */}
            <form onSubmit={handleSearch} className='flex-1'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400' />
                <Input
                  placeholder='Search products...'
                  value={localSearch}
                  onChange={(e: { target: { value: SetStateAction<string> } }) => setLocalSearch(e.target.value)}
                  className='pl-10'
                />
                <Button type='submit' size='sm' className='absolute right-1 top-1/2 transform -translate-y-1/2'>
                  Search
                </Button>
              </div>
            </form>

            {/* Sort dropdown */}
            <div className='w-full sm:w-56'>
              <Select value={`${sortBy}-${sortOrder}`} onValueChange={handleSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder='Sort by' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='created_at-desc'>Newest First</SelectItem>
                  <SelectItem value='created_at-asc'>Oldest First</SelectItem>
                  <SelectItem value='price-asc'>Price: Low to High</SelectItem>
                  <SelectItem value='price-desc'>Price: High to Low</SelectItem>
                  <SelectItem value='rating-desc'>Top Rated</SelectItem>
                  <SelectItem value='views-desc'>Most Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {(searchQuery || categoryId || minPrice > 0 || maxPrice < 10000 || condition || freeShipping) && (
          <div className='bg-gray-50 rounded-lg p-3 mb-6'>
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-sm font-medium text-gray-700'>Active Filters:</span>

              {searchQuery && (
                <div className='bg-white rounded-full px-3 py-1 text-sm flex items-center gap-1 border'>
                  <span>Search: {searchQuery}</span>
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('search')
                      setSearchParams(newParams)
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              {categoryId && !categoriesLoading && (
                <div className='bg-white rounded-full px-3 py-1 text-sm flex items-center gap-1 border'>
                  <span>
                    Category:{' '}
                    {categoryTree?.result?.find((c: { _id: string }) => c._id === categoryId)?.name ||
                      'Selected Category'}
                  </span>
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('category')
                      setSearchParams(newParams)
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              {(minPrice > 0 || maxPrice < 10000) && (
                <div className='bg-white rounded-full px-3 py-1 text-sm flex items-center gap-1 border'>
                  <span>
                    Price: {formatPrice(minPrice)} - {formatPrice(maxPrice)}
                  </span>
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('min_price')
                      newParams.delete('max_price')
                      setSearchParams(newParams)
                      setPriceRange([0, 10000])
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              {condition && (
                <div className='bg-white rounded-full px-3 py-1 text-sm flex items-center gap-1 border'>
                  <span>Condition: {condition.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</span>
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('condition')
                      setSearchParams(newParams)
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              {freeShipping && (
                <div className='bg-white rounded-full px-3 py-1 text-sm flex items-center gap-1 border'>
                  <span>Free Shipping</span>
                  <button
                    onClick={() => {
                      const newParams = new URLSearchParams(searchParams)
                      newParams.delete('free_shipping')
                      setSearchParams(newParams)
                    }}
                    className='text-gray-400 hover:text-gray-600'
                  >
                    <XCircle size={14} />
                  </button>
                </div>
              )}

              <Button variant='ghost' size='sm' className='ml-auto' onClick={resetFilters}>
                Clear All
              </Button>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className='mb-4 flex justify-between items-center'>
          <p className='text-sm text-gray-500'>
            {productsLoading ? (
              <Skeleton className='h-4 w-32' />
            ) : (
              `Showing ${productsData?.products.length || 0} of ${productsData?.pagination.total || 0} products`
            )}
          </p>
        </div>

        {/* Products grid */}
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {productsLoading ? (
            // Loading skeletons
            Array(9)
              .fill(0)
              .map((_, index) => (
                <Card key={index} className='overflow-hidden'>
                  <Skeleton className='h-48 w-full' />
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
            // No results
            <div className='col-span-full p-8 text-center'>
              <div className='mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4'>
                <Search className='h-8 w-8 text-gray-400' />
              </div>
              <h3 className='text-lg font-medium text-gray-900 mb-1'>No products found</h3>
              <p className='text-gray-500 mb-4'>Try adjusting your search or filter criteria</p>
              <Button onClick={resetFilters}>Reset Filters</Button>
            </div>
          ) : (
            // Product cards
            productsData?.products?.map((product) => (
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
                    <CardDescription className='flex items-center gap-1 flex-wrap'>
                      {getConditionBadge(product.condition)}
                      {product.free_shipping && (
                        <span className='bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded ml-1 flex items-center'>
                          <Truck size={10} className='mr-1' />
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

        {!productsLoading && Number(productsData?.pagination?.totalPages) > 1 && (
          <Pagination className='mt-8'>
            <PaginationContent>{generatePaginationItems()}</PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  )
}

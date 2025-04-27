/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSellerProducts } from '@/hooks/useProduct'
import { useDeleteProduct } from '@/hooks/useProduct'
import { ProductStatus } from '@/types/type'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Package, Plus, MoreHorizontal, Pencil, Eye, Trash2, Search, Filter, ArrowUp, ArrowDown } from 'lucide-react'
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
import { Button } from '@/Components/ui/button'

export default function SellerProducts() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('created_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  const {
    data: productsData,
    isLoading,
    refetch
  } = useSellerProducts({
    page,
    limit,
    sort,
    order,
    status
  })

  const { mutate: deleteProduct } = useDeleteProduct()

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

  // Get status badge
  const getStatusBadge = (status: ProductStatus) => {
    switch (status) {
      case ProductStatus.ACTIVE:
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            Active
          </Badge>
        )
      case ProductStatus.DRAFT:
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            Draft
          </Badge>
        )
      case ProductStatus.HIDDEN:
        return (
          <Badge variant='outline' className='bg-gray-50 text-gray-700 border-gray-200'>
            Hidden
          </Badge>
        )
      case ProductStatus.SOLD_OUT:
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
            Sold Out
          </Badge>
        )
      case ProductStatus.DELETED:
        return (
          <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
            Deleted
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

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProduct(productToDelete, {
        onSuccess: () => {
          toast.success('Product deleted successfully')
          refetch()
        },
        onError: () => {
          toast.error('Failed to delete product')
        }
      })
      setIsDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const filteredProducts = productsData?.products.filter((product) => {
    // Apply client-side filtering for search
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }
    return true
  })

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <Package className='mr-2 h-6 w-6' />
            Products
          </h1>
          <p className='text-gray-600'>Manage your product listings</p>
        </div>

        <Button asChild>
          <Link to='/seller/products/new'>
            <Plus className='mr-2 h-4 w-4' />
            Add Product
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Your Products</CardTitle>
          <CardDescription>
            {!isLoading && productsData?.pagination && (
              <span>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, productsData.pagination.total)} of{' '}
                {productsData.pagination.total} products
              </span>
            )}
          </CardDescription>

          <div className='flex flex-col sm:flex-row gap-4 mt-2'>
            <form className='flex gap-2 w-full sm:w-auto' onSubmit={handleSearch}>
              <div className='relative flex-1'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-gray-500' />
                <Input
                  type='text'
                  placeholder='Search products...'
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
                    <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                    <SelectItem value={ProductStatus.DRAFT}>Draft</SelectItem>
                    <SelectItem value={ProductStatus.HIDDEN}>Hidden</SelectItem>
                    <SelectItem value={ProductStatus.SOLD_OUT}>Sold Out</SelectItem>
                  </SelectContent>
                </Select>
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
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'>Image</TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('name')}>
                        <div className='flex items-center'>
                          Name
                          {sort === 'name' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('price')}>
                        <div className='flex items-center'>
                          Price
                          {sort === 'price' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('created_at')}>
                        <div className='flex items-center'>
                          Created
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
                    {filteredProducts?.map((product) => (
                      <TableRow key={product._id}>
                        <TableCell>
                          <div className='w-16 h-16 rounded-md bg-gray-100 overflow-hidden'>
                            <img
                              src={product.medias.find((m) => m.is_primary)?.url || product.medias[0]?.url}
                              alt={product.name}
                              className='w-full h-full object-cover'
                            />
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          <div className='max-w-[200px] truncate' title={product.name}>
                            {product.name}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>ID: {product._id.substring(0, 8)}...</div>
                        </TableCell>
                        <TableCell>{formatPrice(product.price)}</TableCell>
                        <TableCell>
                          {product.quantity <= 0 ? (
                            <span className='text-red-500'>Out of stock</span>
                          ) : product.quantity < 10 ? (
                            <span className='text-yellow-500'>{product.quantity} left</span>
                          ) : (
                            <span>{product.quantity} in stock</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(product.status as ProductStatus)}</TableCell>
                        <TableCell>{formatDate(product.created_at)}</TableCell>
                        <TableCell className='text-right'>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' className='h-8 w-8 p-0'>
                                <span className='sr-only'>Open menu</span>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align='end'>
                              <DropdownMenuItem onClick={() => navigate(`/seller/products/${product._id}/edit`)}>
                                <Pencil className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/products/${product._id}`)}>
                                <Eye className='mr-2 h-4 w-4' />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteClick(product._id)} className='text-red-600'>
                                <Trash2 className='mr-2 h-4 w-4' />
                                Delete
                              </DropdownMenuItem>
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
                    {productsData?.pagination &&
                      Array.from({ length: Math.min(5, productsData.pagination.totalPages) }, (_, i) => {
                        // Simple pagination logic for 5 pages max visibility
                        let pageNum = i + 1
                        if (productsData.pagination.totalPages > 5) {
                          if (page > 3) {
                            pageNum = page - 3 + i
                          }
                          if (pageNum > productsData.pagination.totalPages) {
                            pageNum = productsData.pagination.totalPages - (4 - i)
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
                        onClick={() => handlePageChange(Math.min(productsData?.pagination?.totalPages || 1, page + 1))}
                        disabled={!productsData?.pagination || ((page >= productsData.pagination.totalPages) as any)}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will delete the product. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className='bg-red-600 hover:bg-red-700'>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

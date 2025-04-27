/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSellerInventory, useUpdateInventory, useLowStockProducts } from '@/hooks/useInventory'
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
  Package,
  MoreHorizontal,
  Edit,
  AlertTriangle,
  Search,
  Filter,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Loader2,
  Boxes
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
import { Button } from '@/Components/ui/button'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { typeParams } from '@/types/typeParams'

export default function SellerInventory() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sort, setSort] = useState('updated_at')
  const [order, setOrder] = useState<'asc' | 'desc'>('desc')
  const [searchQuery, setSearchQuery] = useState('')
  const [lowStockThreshold, setLowStockThreshold] = useState(5)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)

  // Update inventory dialog
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedInventory, setSelectedInventory] = useState<any | null>(null)
  const [newQuantity, setNewQuantity] = useState<number>(0)
  const [newLocation, setNewLocation] = useState<string>('')

  // Query parameters
  const params: typeParams = {
    page,
    limit,
    sort,
    order
  }

  // Fetch inventory data
  const { data: inventoryData, isLoading, refetch } = useSellerInventory(params)

  // Fetch low stock items
  const { data: lowStockData, isLoading: isLoadingLowStock } = useLowStockProducts(lowStockThreshold)

  // Update inventory mutation
  const { mutate: updateInventory, isPending: isUpdating } = useUpdateInventory()

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality - this would be client-side filtering in this implementation
    console.log(`Searching for: ${searchQuery}`)
  }

  const handleUpdateClick = (inventory: any) => {
    setSelectedInventory(inventory)
    setNewQuantity(inventory.quantity)
    setNewLocation(inventory.location || '')
    setIsUpdateDialogOpen(true)
  }

  const handleUpdateConfirm = () => {
    if (selectedInventory) {
      updateInventory(
        {
          product_id: selectedInventory.product_id,
          data: {
            quantity: newQuantity,
            location: newLocation || undefined
          }
        },
        {
          onSuccess: () => {
            toast.success('Inventory updated successfully')
            refetch()
            setIsUpdateDialogOpen(false)
          },
          onError: () => {
            toast.error('Failed to update inventory')
          }
        }
      )
    }
  }

  const getStockStatus = (available: number, reserved: number) => {
    const availableStock = available - reserved

    if (availableStock <= 0) {
      return (
        <Badge variant='outline' className='bg-red-50 text-red-700 border-red-200'>
          Out of Stock
        </Badge>
      )
    } else if (availableStock <= lowStockThreshold) {
      return (
        <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
          Low Stock ({availableStock})
        </Badge>
      )
    } else {
      return (
        <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
          In Stock ({availableStock})
        </Badge>
      )
    }
  }

  // Filter inventory based on search query and low stock filter
  const filteredInventory = inventoryData?.inventories?.inventories?.filter((item: any) => {
    const matchesSearch = !searchQuery || item.product.name.toLowerCase().includes(searchQuery.toLowerCase())

    const isLowStock = item.quantity - item.reserved_quantity <= lowStockThreshold

    if (showLowStockOnly) {
      return matchesSearch && isLowStock
    }

    return matchesSearch
  })

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <Boxes className='mr-2 h-6 w-6' />
            Inventory Management
          </h1>
          <p className='text-gray-600'>Manage your product stock levels and inventory information</p>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => refetch()}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {!isLoadingLowStock && lowStockData && lowStockData.result.length > 0 && (
        <Alert className='mb-6 border-yellow-200 bg-yellow-50'>
          <AlertTriangle className='h-4 w-4 text-yellow-600' />
          <AlertTitle className='text-yellow-800'>Low Stock Alert</AlertTitle>
          <AlertDescription className='text-yellow-700'>
            {lowStockData.result.length} products are running low on inventory. Consider restocking soon.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className='pb-3'>
          <CardTitle>Your Inventory</CardTitle>
          <CardDescription>
            {!isLoading && inventoryData?.pagination && (
              <span>
                Showing {(page - 1) * limit + 1} to {Math.min(page * limit, inventoryData.pagination.pagination.total)}{' '}
                of {inventoryData.pagination.pagination.total} inventory items
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
                <Select
                  value={showLowStockOnly ? 'low' : 'all'}
                  onValueChange={(val) => setShowLowStockOnly(val === 'low')}
                >
                  <SelectTrigger className='w-[140px]'>
                    <SelectValue placeholder='All Stock' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Stock</SelectItem>
                    <SelectItem value='low'>Low Stock Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center gap-2'>
                <div className='flex gap-2 items-center'>
                  <Label className='text-sm whitespace-nowrap'>Low stock threshold:</Label>
                  <Input
                    type='number'
                    className='w-[80px]'
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(Number(e.target.value))}
                    min={1}
                  />
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
          ) : inventoryData?.inventories?.inventories?.length === 0 ? (
            <div className='text-center py-12'>
              <Package className='h-12 w-12 text-gray-300 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-1'>No inventory items</h3>
              <p className='text-gray-500 mb-4'>When you add products to your store, they will appear here.</p>
              <Button asChild>
                <Link to='/seller/products/new'>Add Product</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[100px]'>Image</TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('product.name')}>
                        <div className='flex items-center'>
                          Product
                          {sort === 'product.name' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('product.price')}>
                        <div className='flex items-center'>
                          Price
                          {sort === 'product.price' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('quantity')}>
                        <div className='flex items-center'>
                          Stock
                          {sort === 'quantity' &&
                            (order === 'asc' ? (
                              <ArrowUp className='ml-1 h-4 w-4' />
                            ) : (
                              <ArrowDown className='ml-1 h-4 w-4' />
                            ))}
                        </div>
                      </TableHead>
                      <TableHead>Reserved</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className='cursor-pointer' onClick={() => handleSortChange('last_restock_date')}>
                        <div className='flex items-center'>
                          Last Restock
                          {sort === 'last_restock_date' &&
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
                    {filteredInventory?.map((inventory: any) => (
                      <TableRow key={inventory._id}>
                        <TableCell>
                          <div className='w-12 h-12 rounded-md bg-gray-100 overflow-hidden'>
                            <img
                              src={inventory.product.image}
                              alt={inventory.product.name}
                              className='w-full h-full object-cover'
                            />
                          </div>
                        </TableCell>
                        <TableCell className='font-medium'>
                          <div className='max-w-[200px] truncate' title={inventory.product.name}>
                            {inventory.product.name}
                          </div>
                          <div className='text-xs text-gray-500 mt-1'>SKU: {inventory.sku || 'N/A'}</div>
                        </TableCell>
                        <TableCell>{formatPrice(inventory.product.price)}</TableCell>
                        <TableCell>{inventory.quantity}</TableCell>
                        <TableCell>{inventory.reserved_quantity || 0}</TableCell>
                        <TableCell>{getStockStatus(inventory.quantity, inventory.reserved_quantity)}</TableCell>
                        <TableCell>
                          {inventory.last_restock_date ? formatDate(inventory.last_restock_date) : 'Not recorded'}
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
                              <DropdownMenuItem onClick={() => handleUpdateClick(inventory)}>
                                <Edit className='mr-2 h-4 w-4' />
                                Update Stock
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => navigate(`/seller/products/${inventory.product_id}/edit`)}
                              >
                                <Package className='mr-2 h-4 w-4' />
                                Edit Product
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
                    {inventoryData?.pagination &&
                      Array.from({ length: Math.min(5, inventoryData.pagination.pagination.totalPages) }, (_, i) => {
                        // Simple pagination logic for 5 pages max visibility
                        let pageNum = i + 1
                        if (inventoryData.pagination.pagination.totalPages > 5) {
                          if (page > 3) {
                            pageNum = page - 3 + i
                          }
                          if (pageNum > inventoryData.pagination.pagination.totalPages) {
                            pageNum = inventoryData.pagination.pagination.totalPages - (4 - i)
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
                        onClick={() => handlePageChange(Math.min(inventoryData?.pagination?.totalPages || 1, page + 1))}
                        disabled={!inventoryData?.pagination || page >= inventoryData.pagination.totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Update Inventory Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>Update stock quantity and location for this product.</DialogDescription>
          </DialogHeader>

          {selectedInventory && (
            <div>
              <div className='flex items-center mb-4'>
                <div className='w-16 h-16 rounded-md bg-gray-100 overflow-hidden mr-4'>
                  <img
                    src={selectedInventory.product.image}
                    alt={selectedInventory.product.name}
                    className='w-full h-full object-cover'
                  />
                </div>
                <div>
                  <h3 className='font-medium'>{selectedInventory.product.name}</h3>
                  <p className='text-sm text-gray-500'>
                    Current stock: {selectedInventory.quantity} | Reserved: {selectedInventory.reserved_quantity || 0}
                  </p>
                </div>
              </div>

              <div className='grid gap-4 py-4'>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='quantity' className='text-right'>
                    Quantity
                  </Label>
                  <Input
                    id='quantity'
                    type='number'
                    min={0}
                    className='col-span-3'
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                  />
                </div>
                <div className='grid grid-cols-4 items-center gap-4'>
                  <Label htmlFor='location' className='text-right'>
                    Location
                  </Label>
                  <Input
                    id='location'
                    className='col-span-3'
                    placeholder='Warehouse A, Shelf B3, etc.'
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant='outline' onClick={() => setIsUpdateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateConfirm} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Updating...
                </>
              ) : (
                'Update Inventory'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { SetStateAction, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  useCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearCart,
  useCartTotal,
  useApplyCoupon,
  useRemoveCoupon
} from '@/hooks/useCart'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { ShoppingCart, Loader2, Trash2, ChevronRight, ShieldCheck, ArrowLeft, Check, X, Tag } from 'lucide-react'
import { Button } from '@/Components/ui/button'

export default function CartPage() {
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')

  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: cartTotal } = useCartTotal()
  const { mutate: updateCartItemMutate, isPending: updateLoading } = useUpdateCartItem()
  const { mutate: removeFromCartMutate, isPending: removeLoading } = useRemoveFromCart()
  const { mutate: clearCartMutate, isPending: clearingCart } = useClearCart()
  const { mutate: applyCouponMutate, isPending: applyingCoupon } = useApplyCoupon()
  const { mutate: removeCouponMutate, isPending: removingCoupon } = useRemoveCoupon()

  // Check if cart is empty
  const isCartEmpty = !cart || !cart.result || !cart.result.items || cart.result.items.length === 0

  // Count selected items
  const selectedItemsCount = cart?.result?.items?.filter((item) => item.selected).length || 0

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Handle quantity change
  const handleQuantityChange = (productId: string, quantity: number) => {
    updateCartItemMutate({
      product_id: productId,
      params: { quantity }
    })
  }

  // Handle selection change
  const handleSelectionChange = (productId: string, selected: boolean) => {
    updateCartItemMutate({
      product_id: productId,
      params: { selected }
    })
  }

  // Handle remove item
  const handleRemoveItem = (productId: string) => {
    removeFromCartMutate(productId)
  }

  // Handle clear cart
  const handleClearCart = () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      clearCartMutate()
    }
  }

  // Handle apply coupon
  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code')
      return
    }

    applyCouponMutate(couponCode, {
      onSuccess: (data) => {
        const result = data.data.result
        toast.success(`Coupon applied! You saved ${formatPrice(result.result.discount_amount)}`)
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to apply coupon')
      }
    })
  }

  // Handle remove coupon
  const handleRemoveCoupon = () => {
    removeCouponMutate()
  }

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    if (selectedItemsCount === 0) {
      toast.error('Please select at least one item to checkout')
      return
    }

    navigate('/checkout')
  }

  // Loading state
  if (cartLoading) {
    return (
      <div className='container max-w-6xl mx-auto py-8'>
        <h1 className='text-2xl font-bold mb-6'>Your Cart</h1>
        <div className='bg-white rounded-lg shadow p-6 flex items-center justify-center h-64'>
          <Loader2 className='h-8 w-8 text-indigo-600 animate-spin' />
        </div>
      </div>
    )
  }

  // Empty cart
  if (isCartEmpty) {
    return (
      <div className='container max-w-6xl mx-auto py-8'>
        <h1 className='text-2xl font-bold mb-6'>Your Cart</h1>
        <div className='bg-white rounded-lg shadow p-8 text-center'>
          <div className='mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4'>
            <ShoppingCart className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-1'>Your cart is empty</h3>
          <p className='text-gray-500 mb-4'>Looks like you haven't added anything to your cart yet.</p>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </div>
      </div>
    )
  }

  return (
    <div className='container max-w-6xl mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6 flex items-center'>
        <ShoppingCart className='mr-2 h-6 w-6' />
        Your Cart ({cart.result.items.length} items)
      </h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Cart items */}
        <div className='lg:col-span-2'>
          <Card>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell className='w-12'>
                      <Checkbox
                        checked={cart.result.items.length > 0 && cart.result.items.every((item) => item.selected)}
                        onCheckedChange={(checked: boolean) => {
                          cart.result.items.forEach((item) => {
                            if (item.selected !== checked) {
                              handleSelectionChange(item.product_id, checked as boolean)
                            }
                          })
                        }}
                      />
                    </TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Price</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.result.items.map((item) => (
                    <TableRow key={item.product_id}>
                      <TableCell>
                        <Checkbox
                          checked={item.selected}
                          onCheckedChange={(checked: boolean) =>
                            handleSelectionChange(item.product_id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center'>
                          <div className='w-16 h-16 bg-gray-100 rounded overflow-hidden mr-3'>
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className='w-full h-full object-cover'
                            />
                          </div>
                          <div>
                            <Link
                              to={`/products/${item.product_id}`}
                              className='font-medium text-blue-600 hover:underline'
                            >
                              {item.product_name}
                            </Link>
                            {item.variant_id && <p className='text-xs text-gray-500'>Variant ID: {item.variant_id}</p>}
                            {!item.in_stock && (
                              <span className='inline-block mt-1 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded'>
                                Out of stock
                              </span>
                            )}
                            {item.current_price !== item.price && (
                              <p className='text-xs text-orange-600 mt-1'>
                                Price changed from {formatPrice(item.price)} to {formatPrice(item.current_price || 0)}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formatPrice(item.current_price || item.price)}</TableCell>
                      <TableCell>
                        <Select
                          value={item.quantity.toString()}
                          onValueChange={(value: string) => handleQuantityChange(item.product_id, parseInt(value))}
                          disabled={!item.in_stock || updateLoading}
                        >
                          <SelectTrigger className='w-20'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((quantity) => (
                              <SelectItem
                                key={quantity}
                                value={quantity.toString()}
                                disabled={item.available ? quantity > (item.available as any) : false}
                              >
                                {quantity}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className='font-medium'>
                        {formatPrice((item.current_price || item.price) * item.quantity)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='ghost'
                          size='icon'
                          className='text-gray-500 hover:text-red-600'
                          onClick={() => handleRemoveItem(item.product_id)}
                          disabled={removeLoading}
                        >
                          <Trash2 className='h-4 w-4' />
                          <span className='sr-only'>Remove</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className='flex justify-between p-4 bg-gray-50'>
              <Button variant='outline' onClick={() => navigate('/products')} className='flex items-center'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Continue Shopping
              </Button>
              <Button
                variant='ghost'
                className='text-red-600 hover:text-red-700'
                onClick={handleClearCart}
                disabled={clearingCart}
              >
                {clearingCart ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <Trash2 className='mr-2 h-4 w-4' />}
                Clear Cart
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Order summary */}
        <div className='lg:col-span-1'>
          <Card>
            <CardContent className='p-6'>
              <h2 className='text-xl font-semibold mb-4'>Order Summary</h2>

              {/* Selected items count */}
              <div className='mb-6'>
                <p className='text-sm text-gray-600 mb-1'>
                  Selected Items: <span className='font-medium'>{selectedItemsCount}</span>
                </p>
                {selectedItemsCount === 0 && (
                  <Alert variant='destructive' className='mt-2'>
                    <AlertDescription>Please select at least one item to checkout</AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Coupon code */}
              <div className='mb-6'>
                <h3 className='text-sm font-medium mb-2 flex items-center'>
                  <Tag className='mr-1 h-4 w-4' />
                  Apply Coupon
                </h3>

                {cart.result.coupon_code ? (
                  <div className='flex items-center p-2 border rounded-md bg-green-50 border-green-200'>
                    <div className='flex-1'>
                      <p className='font-medium text-green-700 flex items-center'>
                        <Check className='mr-1 h-4 w-4' />
                        {cart.result.coupon_code}
                      </p>
                      {Number(cartTotal?.result?.discount) > 0 && (
                        <p className='text-xs text-green-600'>
                          You saved {formatPrice(Number(cartTotal?.result?.discount))}
                        </p>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-gray-500'
                      onClick={handleRemoveCoupon}
                      disabled={removingCoupon}
                    >
                      {removingCoupon ? <Loader2 className='h-4 w-4 animate-spin' /> : <X className='h-4 w-4' />}
                    </Button>
                  </div>
                ) : (
                  <div className='flex gap-2'>
                    <Input
                      placeholder='Enter coupon code'
                      value={couponCode}
                      onChange={(e: { target: { value: SetStateAction<string> } }) => setCouponCode(e.target.value)}
                      className='flex-1'
                    />
                    <Button onClick={handleApplyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                      {applyingCoupon ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Apply'}
                    </Button>
                  </div>
                )}
              </div>

              <Separator className='my-4' />

              {/* Price breakdown */}
              {cartTotal ? (
                <div className='space-y-2 mb-6'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Subtotal:</span>
                    <span>{formatPrice(cartTotal.result.subtotal)}</span>
                  </div>
                  {cartTotal.result.discount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Discount:</span>
                      <span>-{formatPrice(cartTotal.result.discount)}</span>
                    </div>
                  )}
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Shipping:</span>
                    <span>
                      {cartTotal.result.shipping === 0 ? (
                        <span className='text-green-600'>Free</span>
                      ) : (
                        formatPrice(cartTotal.result.shipping)
                      )}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Tax:</span>
                    <span>{formatPrice(cartTotal.result.tax)}</span>
                  </div>
                  <Separator className='my-2' />
                  <div className='flex justify-between font-semibold text-lg'>
                    <span>Total:</span>
                    <span>{formatPrice(cartTotal.result.total)}</span>
                  </div>
                </div>
              ) : (
                <div className='space-y-2 mb-6'>
                  <div className='flex justify-between'>
                    <span className='text-gray-600'>Subtotal:</span>
                    <span>{formatPrice(cart.result.subtotal || 0)}</span>
                  </div>
                </div>
              )}

              {/* Checkout button */}
              <Button
                className='w-full'
                size='lg'
                onClick={handleProceedToCheckout}
                disabled={selectedItemsCount === 0}
              >
                Proceed to Checkout
                <ChevronRight className='ml-2 h-4 w-4' />
              </Button>

              {/* Secure checkout */}
              <div className='mt-4 flex items-center justify-center text-sm text-gray-500'>
                <ShieldCheck className='mr-1 h-4 w-4' />
                <span>Secure Checkout</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

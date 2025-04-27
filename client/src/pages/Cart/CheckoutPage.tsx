/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useCart, useCartTotal } from '@/hooks/useCart'
import { useUserAddresses } from '@/hooks/useAddress'
import { usePaymentMethods } from '@/hooks/usePayment'
import { useCreateOrder } from '@/hooks/useOrder'
import { PaymentMethod } from '@/types/Order.type'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  CheckCircle,
  Plus,
  Truck,
  ShieldCheck,
  Package,
  Clock,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Step, Steps } from '@/components/ui/step'
import { Button } from '@/Components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'

interface CheckoutFormValues {
  shipping_address_id: string
  payment_method: PaymentMethod
  notes?: string
}

const schema = yup.object().shape({
  shipping_address_id: yup.string().required('Please select a shipping address'),
  payment_method: yup
    .mixed<PaymentMethod>()
    .oneOf(Object.values(PaymentMethod), 'Invalid payment method')
    .required('Please select a payment method'),
  notes: yup.string().optional()
})

export default function CheckoutPage() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [isAddingPayment, setIsAddingPayment] = useState(false)

  // Fetch data
  const { data: cart, isLoading: cartLoading } = useCart()
  const { data: cartTotal, isLoading: totalLoading } = useCartTotal()
  const { data: addresses, isLoading: addressesLoading } = useUserAddresses()
  const { data: paymentMethods, isLoading: paymentsLoading } = usePaymentMethods()

  // Create order mutation
  const { mutate: createOrderMutate, isPending: creatingOrder } = useCreateOrder()

  // Set up form
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<CheckoutFormValues>({
    resolver: yupResolver(schema),
    defaultValues: {
      shipping_address_id: '',
      payment_method: PaymentMethod.CREDIT_CARD,
      notes: ''
    }
  })

  // Watch form values
  const selectedAddressId = watch('shipping_address_id')
  const selectedPaymentMethod = watch('payment_method')

  // Selected address and payment method
  const selectedAddress = addresses?.result?.addresses.find((a: { _id: string }) => a._id === selectedAddressId)

  // Select default address if available
  useEffect(() => {
    if (addresses?.result?.addresses && addresses?.result?.addresses.length > 0 && !selectedAddressId) {
      // Find default address or use the first one
      const defaultAddress =
        addresses?.result?.addresses.find((a: { is_default: any }) => a.is_default) || addresses.result.addresses[0]
      setValue('shipping_address_id', defaultAddress._id)
    }
  }, [addresses, selectedAddressId, setValue])

  // Navigate away if cart is empty
  useEffect(() => {
    if (
      cart &&
      (!cart.result.items ||
        cart.result.items.length === 0 ||
        !cart.result.items.some((item: { selected: any }) => item.selected))
    ) {
      toast.error('Your cart is empty or no items are selected')
      navigate('/cart')
    }
  }, [cart, navigate])

  // Handle step change
  const goToNextStep = () => {
    if (currentStep === 1 && !selectedAddressId) {
      toast.error('Please select a shipping address')
      return
    }

    if (currentStep === 2 && !selectedPaymentMethod) {
      toast.error('Please select a payment method')
      return
    }

    setCurrentStep((prev) => Math.min(prev + 1, 3))
  }

  const goToPreviousStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  // Handle form submission
  const onSubmit = (data: CheckoutFormValues) => {
    createOrderMutate(data, {
      onSuccess: (response) => {
        const orderId = response?.data?.result?.result?._id
        navigate(`/order/success/${orderId}`)
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to create order')
      }
    })
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  // Loading state
  if (cartLoading || totalLoading) {
    return (
      <div className='container max-w-6xl mx-auto py-8'>
        <div className='flex justify-center items-center h-64'>
          <Loader2 className='h-8 w-8 text-indigo-600 animate-spin' />
        </div>
      </div>
    )
  }

  // Cart items for display
  const cartItems = cart?.result?.items?.filter((item: { selected: any }) => item.selected) || []

  return (
    <div className='container max-w-6xl mx-auto py-8'>
      <h1 className='text-2xl font-bold mb-6'>Checkout</h1>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Checkout steps */}
        <div className='lg:col-span-2'>
          <Card className='mb-6'>
            <CardContent className='p-6'>
              <Steps>
                <Step
                  title='Shipping'
                  description='Select shipping address'
                  active={currentStep === 1}
                  completed={currentStep > 1}
                />
                <Step
                  title='Payment'
                  description='Choose payment method'
                  active={currentStep === 2}
                  completed={currentStep > 2}
                />
                <Step title='Confirm' description='Review your order' active={currentStep === 3} />
              </Steps>

              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Step 1: Shipping */}
                {currentStep === 1 && (
                  <div>
                    <div className='flex justify-between items-center mb-4'>
                      <h2 className='text-xl font-semibold'>Select Shipping Address</h2>
                      <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
                        <DialogTrigger asChild>
                          <Button variant='outline' className='flex gap-2'>
                            <Plus className='h-4 w-4' />
                            Add New Address
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Shipping Address</DialogTitle>
                            <DialogDescription>Enter your shipping address details</DialogDescription>
                          </DialogHeader>
                          {/* Address form would go here */}
                          <div className='grid gap-4 py-4'>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <Label htmlFor='name'>Full Name</Label>
                                <Input id='name' placeholder='John Doe' />
                              </div>
                              <div>
                                <Label htmlFor='phone'>Phone Number</Label>
                                <Input id='phone' placeholder='(123) 456-7890' />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor='address_line1'>Address Line 1</Label>
                              <Input id='address_line1' placeholder='123 Main St' />
                            </div>
                            <div>
                              <Label htmlFor='address_line2'>Address Line 2 (Optional)</Label>
                              <Input id='address_line2' placeholder='Apt 4B' />
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <Label htmlFor='city'>City</Label>
                                <Input id='city' placeholder='New York' />
                              </div>
                              <div>
                                <Label htmlFor='state'>State</Label>
                                <Input id='state' placeholder='NY' />
                              </div>
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <Label htmlFor='postal_code'>Postal Code</Label>
                                <Input id='postal_code' placeholder='10001' />
                              </div>
                              <div>
                                <Label htmlFor='country'>Country</Label>
                                <Input id='country' placeholder='United States' />
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant='outline' onClick={() => setIsAddingAddress(false)}>
                              Cancel
                            </Button>
                            <Button>Save Address</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {addressesLoading ? (
                      <div className='flex justify-center items-center py-8'>
                        <Loader2 className='h-6 w-6 text-indigo-600 animate-spin' />
                      </div>
                    ) : addresses?.result.addresses && addresses.result.addresses.length > 0 ? (
                      <RadioGroup
                        value={selectedAddressId}
                        onValueChange={(value: string) => setValue('shipping_address_id', value)}
                        className='space-y-3'
                      >
                        {addresses?.result?.addresses?.map((address: any) => (
                          <div
                            key={address._id}
                            className={`relative border rounded-lg p-4 ${
                              selectedAddressId === address._id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
                            }`}
                          >
                            <RadioGroupItem
                              value={address._id}
                              id={`address-${address._id}`}
                              className='absolute right-4 top-4'
                            />
                            <div className='flex flex-col'>
                              <div className='flex items-start'>
                                <MapPin className='h-5 w-5 text-indigo-600 mt-0.5 mr-2' />
                                <div>
                                  <p className='font-medium'>{address.name}</p>
                                  <p className='text-gray-600'>{address.phone}</p>
                                </div>
                                {address.is_default && (
                                  <span className='ml-auto text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded'>
                                    Default
                                  </span>
                                )}
                              </div>
                              <div className='mt-2 pl-7'>
                                <p className='text-gray-700'>
                                  {address.address_line1}
                                  {address.address_line2 && `, ${address.address_line2}`}
                                </p>
                                <p className='text-gray-700'>
                                  {address.city}, {address.state} {address.postal_code}
                                </p>
                                <p className='text-gray-700'>{address.country}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    ) : (
                      <div className='text-center py-8 border rounded-lg'>
                        <MapPin className='h-8 w-8 text-gray-400 mx-auto mb-2' />
                        <p className='text-gray-600 mb-4'>You don't have any saved addresses</p>
                        <Button onClick={() => setIsAddingAddress(true)}>Add New Address</Button>
                      </div>
                    )}

                    {errors.shipping_address_id && (
                      <p className='text-red-500 mt-2'>{errors.shipping_address_id.message}</p>
                    )}

                    <div className='mt-6 flex justify-between'>
                      <Button variant='outline' onClick={() => navigate('/cart')} className='flex items-center'>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Back to Cart
                      </Button>
                      <Button onClick={goToNextStep} disabled={!selectedAddressId}>
                        Continue to Payment
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Payment */}
                {currentStep === 2 && (
                  <div>
                    <div className='flex justify-between items-center mb-4'>
                      <h2 className='text-xl font-semibold'>Select Payment Method</h2>
                      <Dialog open={isAddingPayment} onOpenChange={setIsAddingPayment}>
                        <DialogTrigger asChild>
                          <Button variant='outline' className='flex gap-2'>
                            <Plus className='h-4 w-4' />
                            Add Payment Method
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Payment Method</DialogTitle>
                            <DialogDescription>Enter your payment details</DialogDescription>
                          </DialogHeader>
                          {/* Payment form would go here */}
                          <div className='grid gap-4 py-4'>
                            <div>
                              <Label htmlFor='card_number'>Card Number</Label>
                              <Input id='card_number' placeholder='1234 5678 9012 3456' />
                            </div>
                            <div className='grid grid-cols-2 gap-4'>
                              <div>
                                <Label htmlFor='expiry'>Expiry Date</Label>
                                <Input id='expiry' placeholder='MM/YY' />
                              </div>
                              <div>
                                <Label htmlFor='cvc'>CVC</Label>
                                <Input id='cvc' placeholder='123' />
                              </div>
                            </div>
                            <div>
                              <Label htmlFor='name_on_card'>Name on Card</Label>
                              <Input id='name_on_card' placeholder='John Doe' />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant='outline' onClick={() => setIsAddingPayment(false)}>
                              Cancel
                            </Button>
                            <Button>Save Payment Method</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <RadioGroup
                      value={selectedPaymentMethod}
                      onValueChange={(value: PaymentMethod) => setValue('payment_method', value as PaymentMethod)}
                      className='space-y-3'
                    >
                      {/* Credit Card option */}
                      <div
                        className={`relative border rounded-lg p-4 ${
                          selectedPaymentMethod === PaymentMethod.CREDIT_CARD
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem
                          value={PaymentMethod.CREDIT_CARD}
                          id='payment-credit-card'
                          className='absolute right-4 top-4'
                        />
                        <div className='flex items-center'>
                          <CreditCard className='h-5 w-5 text-indigo-600 mr-2' />
                          <div>
                            <p className='font-medium'>Credit/Debit Card</p>
                            <p className='text-sm text-gray-600'>Pay securely with your card</p>
                          </div>
                        </div>

                        {selectedPaymentMethod === PaymentMethod.CREDIT_CARD && (
                          <div className='mt-4 pl-7'>
                            {paymentsLoading ? (
                              <div className='flex items-center justify-center py-4'>
                                <Loader2 className='h-4 w-4 animate-spin' />
                              </div>
                            ) : paymentMethods && paymentMethods?.result?.length > 0 ? (
                              <div className='space-y-2'>
                                {paymentMethods?.result?.map((method: any) => (
                                  <div
                                    key={method._id}
                                    className='flex items-center p-2 border rounded hover:bg-gray-50'
                                  >
                                    <div className='flex-1'>
                                      <p className='font-medium'>
                                        {method.type === 'credit_card' && '•••• •••• •••• ' + method.details.last4}
                                      </p>
                                      <p className='text-xs text-gray-500'>
                                        Expires {method.details.exp_month}/{method.details.exp_year}
                                      </p>
                                    </div>
                                    {method.is_default && (
                                      <span className='text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded'>
                                        Default
                                      </span>
                                    )}
                                  </div>
                                ))}
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='w-full'
                                  onClick={() => setIsAddingPayment(true)}
                                >
                                  <Plus className='h-4 w-4 mr-2' />
                                  Add New Card
                                </Button>
                              </div>
                            ) : (
                              <div className='text-center py-4'>
                                <p className='text-gray-600 mb-2'>No saved cards</p>
                                <Button variant='outline' size='sm' onClick={() => setIsAddingPayment(true)}>
                                  Add New Card
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* PayPal option */}
                      <div
                        className={`relative border rounded-lg p-4 ${
                          selectedPaymentMethod === PaymentMethod.PAYPAL
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem
                          value={PaymentMethod.PAYPAL}
                          id='payment-paypal'
                          className='absolute right-4 top-4'
                        />
                        <div className='flex items-center'>
                          <svg className='h-5 w-5 mr-2' viewBox='0 0 24 24'>
                            <path
                              d='M7.076 21h4.638l0.358-2.284h2.103c3.949 0 7.153-1.299 8.641-5.223 1.235-3.95-0.258-6.036-3.203-7.493h-9.975l-3.641 15h1.079zM12.181 7h5.13c1.187 0.968 1.698 2.194 1.179 3.891-0.923 2.955-2.864 3.824-6.055 3.824h-2.155l0.791-5.058-0.074-0.47 0.077-0.466 1.107-1.721zM3 3l3.667 18h1.333l-3.667-18h-1.333z'
                              fill='#00457C'
                            />
                          </svg>
                          <div>
                            <p className='font-medium'>PayPal</p>
                            <p className='text-sm text-gray-600'>Pay with your PayPal account</p>
                          </div>
                        </div>
                      </div>

                      {/* Cash on Delivery option */}
                      <div
                        className={`relative border rounded-lg p-4 ${
                          selectedPaymentMethod === PaymentMethod.COD
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-200'
                        }`}
                      >
                        <RadioGroupItem value={PaymentMethod.COD} id='payment-cod' className='absolute right-4 top-4' />
                        <div className='flex items-center'>
                          <Package className='h-5 w-5 text-indigo-600 mr-2' />
                          <div>
                            <p className='font-medium'>Cash on Delivery</p>
                            <p className='text-sm text-gray-600'>Pay when you receive your order</p>
                          </div>
                        </div>
                      </div>
                    </RadioGroup>

                    {errors.payment_method && <p className='text-red-500 mt-2'>{errors.payment_method.message}</p>}

                    <div className='mt-6 flex justify-between'>
                      <Button variant='outline' onClick={goToPreviousStep} className='flex items-center'>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Back to Shipping
                      </Button>
                      <Button onClick={goToNextStep} disabled={!selectedPaymentMethod}>
                        Continue to Review
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Review & Place Order */}
                {currentStep === 3 && (
                  <div>
                    <h2 className='text-xl font-semibold mb-4'>Review Your Order</h2>

                    <div className='space-y-6'>
                      {/* Shipping address */}
                      <div className='border rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-2'>
                          <h3 className='font-medium flex items-center'>
                            <MapPin className='h-4 w-4 mr-2 text-indigo-600' />
                            Shipping Address
                          </h3>
                          <Button variant='ghost' size='sm' onClick={() => setCurrentStep(1)}>
                            Change
                          </Button>
                        </div>

                        {selectedAddress ? (
                          <div className='ml-6'>
                            <p className='font-medium'>{selectedAddress.name}</p>
                            <p>{selectedAddress.phone}</p>
                            <p>
                              {selectedAddress.address_line1}
                              {selectedAddress.address_line2 && `, ${selectedAddress.address_line2}`}
                            </p>
                            <p>
                              {selectedAddress.city}, {selectedAddress.state} {selectedAddress.postal_code}
                            </p>
                            <p>{selectedAddress.country}</p>
                          </div>
                        ) : (
                          <div className='ml-6 text-gray-500'>No address selected</div>
                        )}
                      </div>

                      {/* Payment method */}
                      <div className='border rounded-lg p-4'>
                        <div className='flex items-center justify-between mb-2'>
                          <h3 className='font-medium flex items-center'>
                            <CreditCard className='h-4 w-4 mr-2 text-indigo-600' />
                            Payment Method
                          </h3>
                          <Button variant='ghost' size='sm' onClick={() => setCurrentStep(2)}>
                            Change
                          </Button>
                        </div>

                        <div className='ml-6'>
                          {selectedPaymentMethod === PaymentMethod.CREDIT_CARD && <p>Credit/Debit Card</p>}
                          {selectedPaymentMethod === PaymentMethod.PAYPAL && <p>PayPal</p>}
                          {selectedPaymentMethod === PaymentMethod.COD && <p>Cash on Delivery</p>}
                        </div>
                      </div>

                      {/* Order items */}
                      <div className='border rounded-lg p-4'>
                        <h3 className='font-medium flex items-center mb-4'>
                          <Package className='h-4 w-4 mr-2 text-indigo-600' />
                          Order Items ({cartItems.length})
                        </h3>

                        <div className='space-y-4'>
                          {cartItems.map((item: any) => (
                            <div
                              key={item.product_id}
                              className='flex items-center pb-3 border-b last:border-0 last:pb-0'
                            >
                              <div className='w-12 h-12 rounded overflow-hidden bg-gray-100 mr-3'>
                                <img
                                  src={item.product_image}
                                  alt={item.product_name as any}
                                  className='w-full h-full object-cover'
                                />
                              </div>
                              <div className='flex-1 min-w-0'>
                                <p className='font-medium truncate'>{item.product_name}</p>
                                <p className='text-sm text-gray-500'>
                                  Qty: {item.quantity} × {formatPrice(item.current_price || item.price)}
                                </p>
                              </div>
                              <div className='font-medium'>
                                {formatPrice((item.current_price || item.price) * Number(item.quantity))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery estimate */}
                      <div className='border rounded-lg p-4'>
                        <h3 className='font-medium flex items-center mb-2'>
                          <Truck className='h-4 w-4 mr-2 text-indigo-600' />
                          Delivery Information
                        </h3>

                        <div className='ml-6 space-y-2'>
                          <div className='flex items-center text-sm'>
                            <Clock className='h-4 w-4 mr-2 text-gray-500' />
                            <p>
                              Estimated delivery: <span className='font-medium'>3-5 business days</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div className='border rounded-lg p-4'>
                        <h3 className='font-medium mb-2'>Order Notes (Optional)</h3>
                        <Textarea
                          placeholder='Add special instructions for your order...'
                          {...register('notes')}
                          className='resize-none'
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className='mt-6 flex justify-between'>
                      <Button variant='outline' onClick={goToPreviousStep} className='flex items-center'>
                        <ArrowLeft className='mr-2 h-4 w-4' />
                        Back to Payment
                      </Button>
                      <Button type='submit' disabled={!isValid || creatingOrder} className='flex items-center'>
                        {creatingOrder ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle className='mr-2 h-4 w-4' />
                            Place Order
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order summary */}
        <div className='lg:col-span-1'>
          <Card className='sticky top-24'>
            <CardHeader className='pb-3 border-b'>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} selected
              </CardDescription>
            </CardHeader>
            <CardContent className='pt-4'>
              <Accordion type='single' collapsible defaultValue='items'>
                <AccordionItem value='items'>
                  <AccordionTrigger className='text-sm'>View Items ({cartItems.length})</AccordionTrigger>
                  <AccordionContent>
                    <div className='space-y-3 max-h-60 overflow-y-auto'>
                      {cartItems.map((item: any) => (
                        <div key={item.product_id} className='flex items-center'>
                          <div className='w-10 h-10 rounded overflow-hidden bg-gray-100 mr-2'>
                            <img src={item.product_image} className='w-full h-full object-cover' />
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-sm font-medium truncate'>{item.product_name}</p>
                            <p className='text-xs text-gray-500'>Qty: {item.quantity}</p>
                          </div>
                          <div className='text-sm font-medium'>
                            {formatPrice((item.current_price || item.price) * Number(item.quantity))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className='space-y-1.5 mt-4'>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Subtotal:</span>
                  <span>{formatPrice(cartTotal?.result.subtotal || 0)}</span>
                </div>
                {cartTotal?.result.discount && cartTotal?.result?.discount > 0 && (
                  <div className='flex justify-between text-sm'>
                    <span className='text-green-600'>Discount:</span>
                    <span className='text-green-600'>-{formatPrice(cartTotal?.result?.discount)}</span>
                  </div>
                )}
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Shipping:</span>
                  <span>
                    {cartTotal?.result.shipping === 0 ? (
                      <span className='text-green-600'>Free</span>
                    ) : (
                      formatPrice(cartTotal?.result.shipping || 0)
                    )}
                  </span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span className='text-gray-500'>Tax:</span>
                  <span>{formatPrice(cartTotal?.result.tax || 0)}</span>
                </div>
              </div>

              <Separator className='my-4' />

              <div className='flex justify-between font-medium'>
                <span>Total:</span>
                <span>{formatPrice(cartTotal?.result.total || 0)}</span>
              </div>
            </CardContent>
            <CardFooter className='pt-0 flex flex-col text-sm border-t mt-4'>
              <div className='flex items-center justify-center text-gray-500 mb-2 pt-4'>
                <ShieldCheck className='h-4 w-4 mr-1.5' />
                <span>Secure Checkout</span>
              </div>

              <div className='flex items-center justify-center text-gray-500'>
                <div className='flex gap-2'>
                  <svg className='h-8 w-auto' viewBox='0 0 60 40'>
                    <rect width='60' height='40' rx='4' fill='#EEF2FF' />
                    <path
                      fill='#334155'
                      d='M11.5,17h6c0.3,0,0.5,0.2,0.5,0.5v1c0,0.3-0.2,0.5-0.5,0.5h-6C11.2,19,11,18.8,11,18.5v-1C11,17.2,11.2,17,11.5,17z'
                    />
                    <path
                      fill='#334155'
                      d='M11.5,21h3c0.3,0,0.5,0.2,0.5,0.5v1c0,0.3-0.2,0.5-0.5,0.5h-3C11.2,23,11,22.8,11,22.5v-1C11,21.2,11.2,21,11.5,21z'
                    />
                    <path
                      fill='#334155'
                      d='M18.5,21h6c0.3,0,0.5,0.2,0.5,0.5v1c0,0.3-0.2,0.5-0.5,0.5h-6c-0.3,0-0.5-0.2-0.5-0.5v-1C18,21.2,18.2,21,18.5,21z'
                    />
                    <path
                      fill='#334155'
                      d='M33.5,21h6c0.3,0,0.5,0.2,0.5,0.5v1c0,0.3-0.2,0.5-0.5,0.5h-6c-0.3,0-0.5-0.2-0.5-0.5v-1C33,21.2,33.2,21,33.5,21z'
                    />
                    <path
                      fill='#334155'
                      d='M42.5,17h6c0.3,0,0.5,0.2,0.5,0.5v1c0,0.3-0.2,0.5-0.5,0.5h-6c-0.3,0-0.5-0.2-0.5-0.5v-1C42,17.2,42.2,17,42.5,17z'
                    />
                    <path
                      fill='#334155'
                      d='M42.5,21h3c0.3,0,0.5,0.2,0.5,0.5v1c0,0.3-0.2,0.5-0.5,0.5h-3c-0.3,0-0.5-0.2-0.5-0.5v-1C42,21.2,42.2,21,42.5,21z'
                    />
                    <path fill='#6366F1' d='M22 14h16v3a3 3 0 01-3 3H25a3 3 0 01-3-3v-3z' />
                    <path fill='#4F46E5' d='M25 20h10v3a3 3 0 01-3 3h-4a3 3 0 01-3-3v-3z' />
                  </svg>
                  <svg className='h-8 w-auto' viewBox='0 0 60 40'>
                    <rect width='60' height='40' rx='4' fill='#FEF2F2' />
                    <circle cx='18' cy='20' r='8' fill='#EF4444' fillOpacity='0.8' />
                    <circle cx='30' cy='20' r='8' fill='#EF4444' fillOpacity='0.8' />
                    <path d='M30 12v16M18 12v16' stroke='#fff' strokeWidth='1.5' />
                  </svg>
                  <svg className='h-8 w-auto' viewBox='0 0 60 40'>
                    <rect width='60' height='40' rx='4' fill='#FFF7ED' />
                    <path
                      d='M25 15h18a2 2 0 012 2v6a2 2 0 01-2 2H17a2 2 0 01-2-2V17a2 2 0 012-2h8z'
                      fill='#F97316'
                      fillOpacity='0.8'
                    />
                  </svg>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

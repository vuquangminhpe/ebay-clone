/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  usePaymentMethods,
  useAddPaymentMethod,
  useSetDefaultPaymentMethod,
  useDeletePaymentMethod
} from '@/hooks/usePayment'
import { PaymentMethodTypes, PaymentMethodStatus } from '@/apis/PaymentApi'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, Plus, Trash, Loader2, Wallet, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button } from '@/Components/ui/button'

// Form validation schema for credit card
const creditCardSchema = yup.object().shape({
  card_number: yup
    .string()
    .required('Card number is required')
    .matches(/^\d{16}$/, 'Card number must be 16 digits'),
  card_holder_name: yup.string().required('Cardholder name is required'),
  exp_month: yup
    .string()
    .required('Expiration month is required')
    .matches(/^(0?[1-9]|1[0-2])$/, 'Invalid month'),
  exp_year: yup
    .string()
    .required('Expiration year is required')
    .matches(/^\d{4}$/, 'Year must be 4 digits'),
  cvv: yup
    .string()
    .required('CVV is required')
    .matches(/^\d{3,4}$/, 'CVV must be 3 or 4 digits'),
  set_default: yup.boolean().optional()
})

export default function PaymentMethods() {
  const [isAddingPayment, setIsAddingPayment] = useState(false)
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null)
  const [paymentType, setPaymentType] = useState<PaymentMethodTypes>(PaymentMethodTypes.CREDIT_CARD)

  // Fetch user payment methods
  const { data: paymentMethods, isLoading } = usePaymentMethods()

  // Payment method mutations
  const { mutate: addPaymentMethodMutate, isPending: isAdding } = useAddPaymentMethod()
  const { mutate: setDefaultPaymentMethodMutate, isPending: isSettingDefault } = useSetDefaultPaymentMethod()
  const { mutate: deletePaymentMethodMutate, isPending: isDeleting } = useDeletePaymentMethod()

  // Form for adding payment method
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(creditCardSchema),
    defaultValues: {
      card_number: '',
      card_holder_name: '',
      exp_month: '',
      exp_year: '',
      cvv: '',
      set_default: false
    }
  })

  // Close dialog and reset form
  const closeDialog = () => {
    setIsAddingPayment(false)
    setDeletingPaymentId(null)
    reset()
  }

  // Handle add payment method
  const handleAddPaymentMethod = (data: any) => {
    const formattedData = {
      type: paymentType,
      details: {
        card_number: data.card_number,
        card_holder_name: data.card_holder_name,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        cvv: data.cvv
      },
      set_default: data.set_default
    }

    addPaymentMethodMutate(formattedData, {
      onSuccess: () => {
        toast.success('Payment method added successfully')
        closeDialog()
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to add payment method')
      }
    })
  }

  // Handle set default payment method
  const handleSetDefaultPaymentMethod = (paymentMethodId: string) => {
    setDefaultPaymentMethodMutate(paymentMethodId, {
      onSuccess: () => {
        toast.success('Default payment method updated')
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to update default payment method')
      }
    })
  }

  // Handle delete payment method
  const handleDeletePaymentMethod = () => {
    if (!deletingPaymentId) return

    deletePaymentMethodMutate(deletingPaymentId, {
      onSuccess: () => {
        toast.success('Payment method deleted successfully')
        closeDialog()
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to delete payment method')
      }
    })
  }

  // Format card number for display
  const formatCardNumber = (number: string) => {
    return `•••• •••• •••• ${number.slice(-4)}`
  }

  // Get card type icon based on first digit
  const getCardTypeIcon = (cardNumber: string) => {
    const firstDigit = cardNumber.charAt(0)

    if (firstDigit === '4') {
      return (
        <svg className='h-6 w-auto' viewBox='0 0 750 471'>
          <path
            d='M0,471h750V0H0V471z M750,235.5c0,129.79-105.21,235-235,235c-129.79,0-235-105.21-235-235C280,105.71,385.21,0.5,515,0.5C644.79,0.5,750,105.71,750,235.5z'
            fill='#0066B2'
          />
          <path
            d='M470.95,235.5L604.41,97.13c-27.24-33.05-68.6-54.13-114.95-54.13c-82.71,0-149.7,66.99-149.7,149.7c0,82.71,66.99,149.7,149.7,149.7c46.35,0,87.72-21.08,114.95-54.13L470.95,235.5z'
            fill='#FAA61A'
          />
        </svg>
      )
    } else if (firstDigit === '5') {
      return (
        <svg className='h-6 w-auto' viewBox='0 0 750 471'>
          <path d='M0,471h750V0H0V471z' fill='#000' />
          <path
            d='M43.08,235.5c0-97.3,78.7-176,176-176c97.3,0,176,78.7,176,176s-78.7,176-176,176C121.78,411.5,43.08,332.8,43.08,235.5z'
            fill='#FF5F00'
          />
          <path
            d='M239.08,59.5c65.85,0,124.13,32.01,160.32,81.48C364.75,71.29,304.4,27.5,233.67,27.5c-114.88,0-208,93.12-208,208c0,114.88,93.12,208,208,208c70.73,0,131.08-43.79,155.73-113.48C363.21,379.49,304.93,411.5,239.08,411.5c-97.3,0-176-78.7-176-176S141.78,59.5,239.08,59.5z'
            fill='#EB001B'
          />
          <path
            d='M739.08,235.5c0,114.88-93.12,208-208,208c-70.73,0-131.08-43.79-155.73-113.48c36.19,49.47,94.47,81.48,160.32,81.48c97.3,0,176-78.7,176-176s-78.7-176-176-176c-65.85,0-124.13,32.01-160.32,81.48C399.88,71.29,460.23,27.5,531.08,27.5C645.96,27.5,739.08,120.62,739.08,235.5z'
            fill='#F79E1B'
          />
        </svg>
      )
    } else if (firstDigit === '3') {
      return (
        <svg className='h-6 w-auto' viewBox='0 0 750 471'>
          <path d='M0,471h750V0H0V471z' fill='#016FD0' />
          <path
            d='M375,140.57l33.18-78.02h66.37v12.7l-7.93,18.9h26.4c14.13,0,21.82,7.5,21.82,17.82c0,4.38-2.05,10.98-4.29,15.08l-7.55,14.14h-37.99l-6.93,16.57h-41.04L375,140.57z M449.01,95.67l8.75-20.51h-16.56L449.01,95.67z M403.08,347.93h-53.84L322.5,235.5h53.84L403.08,347.93z M477.07,347.93h-53.84l-26.74-112.43h53.84L477.07,347.93z'
            fill='#FFFFFF'
          />
        </svg>
      )
    } else if (firstDigit === '6') {
      return (
        <svg className='h-6 w-auto' viewBox='0 0 750 471'>
          <path d='M0,471h750V0H0V471z' fill='#0C2C84' />
          <path
            d='M239.08,411.5c-97.3,0-176-78.7-176-176s78.7-176,176-176c76.27,0,141.08,48.56,165.21,116.27L577.93,59.5c-24.13-67.71-88.94-116.27-165.21-116.27c-97.3,0-176,78.7-176,176s78.7,176,176,176c76.27,0,141.08-48.56,165.21-116.27L404.29,295.23C380.16,362.94,315.35,411.5,239.08,411.5z'
            fill='#EF9645'
          />
        </svg>
      )
    } else {
      return <CreditCard className='h-6 w-6 text-gray-600' />
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <Wallet className='mr-2 h-6 w-6' />
            Payment Methods
          </h1>
          <p className='text-gray-600'>Manage your payment methods for easy checkout</p>
        </div>
        <Button onClick={() => setIsAddingPayment(true)} className='flex items-center'>
          <Plus className='mr-2 h-4 w-4' />
          Add Payment Method
        </Button>
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className='bg-gray-50 border border-dashed animate-pulse'>
                <CardContent className='p-6 h-36'></CardContent>
              </Card>
            ))}
        </div>
      ) : !paymentMethods || paymentMethods.result.length === 0 ? (
        <Card className='bg-gray-50 border border-dashed'>
          <CardContent className='p-8 flex flex-col items-center justify-center'>
            <CreditCard className='h-12 w-12 text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-1'>No payment methods found</h3>
            <p className='text-gray-500 mb-4 text-center max-w-md'>
              You haven't added any payment methods yet. Add a payment method to make checkout faster.
            </p>
            <Button onClick={() => setIsAddingPayment(true)}>Add Your First Payment Method</Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {paymentMethods &&
            paymentMethods.result.map((method) => (
              <Card key={method._id} className={method.is_default ? 'border-indigo-200 bg-indigo-50/50' : ''}>
                <CardContent className='p-6'>
                  <div className='flex justify-between items-start mb-4'>
                    <div className='flex items-center'>
                      {method.type === PaymentMethodTypes.CREDIT_CARD ||
                      method.type === PaymentMethodTypes.DEBIT_CARD ? (
                        getCardTypeIcon(method.details.card_number || method.details.last4)
                      ) : method.type === PaymentMethodTypes.PAYPAL ? (
                        <svg className='h-6 w-auto' viewBox='0 0 124 33'>
                          <path
                            d='M46.211,6.749h-6.839c-0.468,0-0.866,0.34-0.939,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.564,0.658  h3.265c0.468,0,0.866-0.34,0.939-0.803l0.746-4.73c0.072-0.463,0.471-0.803,0.938-0.803h2.165c4.505,0,7.105-2.18,7.784-6.5  c0.306-1.89,0.013-3.375-0.872-4.415C50.224,7.353,48.5,6.749,46.211,6.749z M47,13.154c-0.374,2.454-2.249,2.454-4.062,2.454  h-1.032l0.724-4.583c0.043-0.277,0.283-0.481,0.563-0.481h0.473c1.235,0,2.4,0,3.002,0.704C47.027,11.668,47.137,12.292,47,13.154z'
                            fill='#253B80'
                          />
                          <path
                            d='M66.654,13.075h-3.275c-0.279,0-0.52,0.204-0.563,0.481l-0.145,0.916l-0.229-0.332  c-0.709-1.029-2.29-1.373-3.868-1.373c-3.619,0-6.71,2.741-7.312,6.586c-0.313,1.918,0.132,3.752,1.22,5.031  c0.998,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.562,0.66h2.95  c0.469,0,0.865-0.34,0.939-0.803l1.77-11.209C67.271,13.388,67.004,13.075,66.654,13.075z M62.089,19.449  c-0.316,1.871-1.801,3.127-3.695,3.127c-0.951,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.668-1.391-0.514-2.301  c0.295-1.855,1.805-3.152,3.67-3.152c0.93,0,1.686,0.309,2.184,0.892C62.034,17.721,62.232,18.543,62.089,19.449z'
                            fill='#253B80'
                          />
                          <path
                            d='M84.096,13.075h-3.291c-0.314,0-0.609,0.156-0.787,0.417l-4.539,6.686l-1.924-6.425  c-0.121-0.402-0.492-0.678-0.912-0.678h-3.234c-0.393,0-0.666,0.384-0.541,0.754l3.625,10.638l-3.408,4.811  c-0.268,0.379,0.002,0.9,0.465,0.9h3.287c0.312,0,0.604-0.152,0.781-0.408L84.564,13.97C84.826,13.592,84.557,13.075,84.096,13.075z'
                            fill='#253B80'
                          />
                          <path
                            d='M94.992,6.749h-6.84c-0.467,0-0.865,0.34-0.938,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.562,0.658  h3.51c0.326,0,0.605-0.238,0.656-0.562l0.785-4.971c0.072-0.463,0.471-0.803,0.938-0.803h2.164c4.506,0,7.105-2.18,7.785-6.5  c0.307-1.89,0.012-3.375-0.873-4.415C99.004,7.353,97.281,6.749,94.992,6.749z M95.781,13.154c-0.373,2.454-2.248,2.454-4.062,2.454  h-1.031l0.725-4.583c0.043-0.277,0.281-0.481,0.562-0.481h0.473c1.234,0,2.4,0,3.002,0.704  C95.809,11.668,95.918,12.292,95.781,13.154z'
                            fill='#179BD7'
                          />
                          <path
                            d='M115.434,13.075h-3.273c-0.281,0-0.52,0.204-0.562,0.481l-0.145,0.916l-0.23-0.332  c-0.709-1.029-2.289-1.373-3.867-1.373c-3.619,0-6.709,2.741-7.311,6.586c-0.312,1.918,0.131,3.752,1.219,5.031  c1,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.564,0.66h2.949  c0.467,0,0.865-0.34,0.938-0.803l1.771-11.209C116.053,13.388,115.785,13.075,115.434,13.075z M110.869,19.449  c-0.314,1.871-1.801,3.127-3.695,3.127c-0.949,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.666-1.391-0.514-2.301  c0.297-1.855,1.805-3.152,3.67-3.152c0.93,0,1.686,0.309,2.184,0.892C110.816,17.721,111.014,18.543,110.869,19.449z'
                            fill='#179BD7'
                          />
                          <path
                            d='M119.295,7.23l-2.807,17.858c-0.055,0.346,0.213,0.658,0.562,0.658h2.822c0.469,0,0.867-0.34,0.939-0.803  l2.768-17.536c0.055-0.346-0.213-0.659-0.562-0.659h-3.16C119.578,6.749,119.338,6.953,119.295,7.23z'
                            fill='#179BD7'
                          />
                          <path
                            d='M7.266,29.154l0.523-3.322l-1.165-0.027H1.061L4.927,1.292C4.939,1.218,4.978,1.149,5.035,1.1  c0.057-0.049,0.13-0.076,0.206-0.076h9.38c3.114,0,5.263,0.648,6.385,1.927c0.526,0.6,0.861,1.227,1.023,1.917  c0.17,0.724,0.173,1.589,0.007,2.644l-0.012,0.077v0.676l0.526,0.298c0.443,0.235,0.795,0.504,1.065,0.812  c0.45,0.513,0.741,1.165,0.864,1.938c0.127,0.795,0.085,1.741-0.123,2.812c-0.24,1.232-0.628,2.305-1.152,3.183  c-0.482,0.809-1.096,1.48-1.825,2c-0.696,0.494-1.523,0.869-2.458,1.109c-0.906,0.236-1.939,0.355-3.072,0.355h-0.73  c-0.522,0-1.029,0.188-1.427,0.525c-0.399,0.344-0.663,0.814-0.744,1.328l-0.055,0.299l-0.924,5.855l-0.042,0.215  c-0.011,0.068-0.03,0.102-0.058,0.125c-0.025,0.021-0.061,0.035-0.096,0.035H7.266z'
                            fill='#253B80'
                          />
                          <path
                            d='M23.048,7.667L23.048,7.667L23.048,7.667c-0.028,0.179-0.06,0.362-0.096,0.55  c-1.237,6.351-5.469,8.545-10.874,8.545H9.326c-0.661,0-1.218,0.48-1.321,1.132l0,0l0,0L6.596,26.83l-0.399,2.533  c-0.067,0.428,0.263,0.814,0.695,0.814h4.881c0.578,0,1.069-0.42,1.16-0.99l0.048-0.248l0.919-5.832l0.059-0.32  c0.09-0.572,0.582-0.992,1.16-0.992h0.73c4.729,0,8.431-1.92,9.513-7.476c0.452-2.321,0.218-4.259-0.978-5.622  C24.022,8.286,23.573,7.945,23.048,7.667z'
                            fill='#179BD7'
                          />
                          <path
                            d='M21.754,7.151c-0.189-0.055-0.384-0.105-0.584-0.15c-0.201-0.044-0.407-0.083-0.619-0.117  c-0.742-0.12-1.555-0.177-2.426-0.177h-7.352c-0.181,0-0.353,0.041-0.507,0.115C9.927,6.985,9.675,7.306,9.614,7.699L8.05,17.605  l-0.045,0.289c0.103-0.652,0.66-1.132,1.321-1.132h2.752c5.405,0,9.637-2.195,10.874-8.545c0.037-0.188,0.068-0.371,0.096-0.55  c-0.313-0.166-0.652-0.308-1.017-0.429C21.941,7.208,21.848,7.179,21.754,7.151z'
                            fill='#222D65'
                          />
                          <path
                            d='M9.614,7.699c0.061-0.393,0.313-0.714,0.652-0.876c0.155-0.074,0.326-0.115,0.507-0.115h7.352  c0.871,0,1.684,0.057,2.426,0.177c0.212,0.034,0.418,0.073,0.619,0.117c0.2,0.045,0.395,0.095,0.584,0.15  c0.094,0.028,0.187,0.057,0.278,0.086c0.365,0.121,0.704,0.263,1.017,0.429c0.368-2.347-0.003-3.945-1.272-5.392  C20.378,0.682,17.853,0,14.622,0h-9.38c-0.66,0-1.223,0.48-1.325,1.133L0.01,25.898c-0.077,0.49,0.301,0.932,0.795,0.932h5.791  l1.454-9.225L9.614,7.699z'
                            fill='#253B80'
                          />
                        </svg>
                      ) : (
                        <CreditCard className='h-6 w-6 text-gray-600' />
                      )}
                      <h3 className='font-medium ml-2 capitalize'>
                        {method.type === PaymentMethodTypes.CREDIT_CARD && 'Credit Card'}
                        {method.type === PaymentMethodTypes.DEBIT_CARD && 'Debit Card'}
                        {method.type === PaymentMethodTypes.PAYPAL && 'PayPal'}
                        {method.type === PaymentMethodTypes.BANK_ACCOUNT && 'Bank Account'}
                      </h3>
                      {method.is_default && (
                        <span className='ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded'>Default</span>
                      )}
                    </div>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-gray-500 hover:text-red-600'
                      onClick={() => setDeletingPaymentId(method._id)}
                      disabled={method.is_default}
                    >
                      <Trash className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </div>

                  <div className='space-y-1'>
                    {(method.type === PaymentMethodTypes.CREDIT_CARD ||
                      method.type === PaymentMethodTypes.DEBIT_CARD) && (
                      <>
                        <p className='font-medium'>
                          {formatCardNumber(method.details.card_number || method.details.last4)}
                        </p>
                        <p className='text-sm'>
                          Expires: {method.details.exp_month}/{method.details.exp_year}
                        </p>
                        {method.details.card_holder_name && (
                          <p className='text-sm text-gray-600'>{method.details.card_holder_name}</p>
                        )}
                      </>
                    )}

                    {method.type === PaymentMethodTypes.PAYPAL && <p className='text-sm'>{method.details.email}</p>}

                    {method.type === PaymentMethodTypes.BANK_ACCOUNT && (
                      <>
                        <p className='font-medium'>{method.details.bank_name}</p>
                        <p className='text-sm'>Account ending in {method.details.account_number.slice(-4)}</p>
                      </>
                    )}

                    {method.status === PaymentMethodStatus.EXPIRED && (
                      <div className='flex items-center text-red-600 text-sm mt-2'>
                        <AlertCircle className='h-4 w-4 mr-1' />
                        <span>Expired</span>
                      </div>
                    )}
                  </div>

                  {!method.is_default && method.status !== PaymentMethodStatus.EXPIRED && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleSetDefaultPaymentMethod(method._id)}
                      disabled={isSettingDefault}
                      className='mt-4'
                    >
                      {isSettingDefault && <Loader2 className='mr-2 h-3 w-3 animate-spin' />}
                      Set as Default
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Add Payment Method Dialog */}
      <Dialog
        open={isAddingPayment}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else setIsAddingPayment(open)
        }}
      >
        <DialogContent className='sm:max-w-[550px]'>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
            <DialogDescription>Add a new payment method to your account for faster checkout</DialogDescription>
          </DialogHeader>

          <Tabs
            defaultValue='credit_card'
            className='w-full'
            onValueChange={(value) => setPaymentType(value as PaymentMethodTypes)}
          >
            <TabsList className='grid grid-cols-2 w-full'>
              <TabsTrigger value={PaymentMethodTypes.CREDIT_CARD}>Credit/Debit Card</TabsTrigger>
              <TabsTrigger value={PaymentMethodTypes.PAYPAL}>PayPal</TabsTrigger>
            </TabsList>

            <TabsContent value={PaymentMethodTypes.CREDIT_CARD}>
              <form onSubmit={handleSubmit(handleAddPaymentMethod)}>
                <div className='grid gap-4 py-4'>
                  <div>
                    <Label htmlFor='card_number'>Card Number</Label>
                    <Input
                      id='card_number'
                      placeholder='1234 5678 9012 3456'
                      {...register('card_number')}
                      className={errors.card_number ? 'border-red-500' : ''}
                    />
                    {errors.card_number && <p className='text-red-500 text-xs mt-1'>{errors.card_number.message}</p>}
                  </div>

                  <div>
                    <Label htmlFor='card_holder_name'>Cardholder Name</Label>
                    <Input
                      id='card_holder_name'
                      placeholder='John Doe'
                      {...register('card_holder_name')}
                      className={errors.card_holder_name ? 'border-red-500' : ''}
                    />
                    {errors.card_holder_name && (
                      <p className='text-red-500 text-xs mt-1'>{errors.card_holder_name.message}</p>
                    )}
                  </div>

                  <div className='grid grid-cols-3 gap-4'>
                    <div>
                      <Label htmlFor='exp_month'>Expiry Month</Label>
                      <Select defaultValue='' {...register('exp_month')}>
                        <SelectTrigger className={errors.exp_month ? 'border-red-500' : ''}>
                          <SelectValue placeholder='MM' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1
                            return (
                              <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                {month.toString().padStart(2, '0')}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      {errors.exp_month && <p className='text-red-500 text-xs mt-1'>{errors.exp_month.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor='exp_year'>Expiry Year</Label>
                      <Select defaultValue='' {...register('exp_year')}>
                        <SelectTrigger className={errors.exp_year ? 'border-red-500' : ''}>
                          <SelectValue placeholder='YYYY' />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 10 }, (_, i) => {
                            const year = new Date().getFullYear() + i
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      {errors.exp_year && <p className='text-red-500 text-xs mt-1'>{errors.exp_year.message}</p>}
                    </div>

                    <div>
                      <Label htmlFor='cvv'>CVV</Label>
                      <Input
                        id='cvv'
                        placeholder='123'
                        {...register('cvv')}
                        className={errors.cvv ? 'border-red-500' : ''}
                      />
                      {errors.cvv && <p className='text-red-500 text-xs mt-1'>{errors.cvv.message}</p>}
                    </div>
                  </div>

                  <div className='flex items-center space-x-2'>
                    <Checkbox id='set_default' {...register('set_default')} />
                    <Label htmlFor='set_default' className='text-sm font-normal'>
                      Set as default payment method
                    </Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button type='button' variant='outline' onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isAdding}>
                    {isAdding && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                    Add Payment Method
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value={PaymentMethodTypes.PAYPAL}>
              <div className='py-8 text-center'>
                <svg className='h-12 w-auto mx-auto mb-4' viewBox='0 0 124 33'>
                  <path
                    d='M46.211,6.749h-6.839c-0.468,0-0.866,0.34-0.939,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.564,0.658  h3.265c0.468,0,0.866-0.34,0.939-0.803l0.746-4.73c0.072-0.463,0.471-0.803,0.938-0.803h2.165c4.505,0,7.105-2.18,7.784-6.5  c0.306-1.89,0.013-3.375-0.872-4.415C50.224,7.353,48.5,6.749,46.211,6.749z M47,13.154c-0.374,2.454-2.249,2.454-4.062,2.454  h-1.032l0.724-4.583c0.043-0.277,0.283-0.481,0.563-0.481h0.473c1.235,0,2.4,0,3.002,0.704C47.027,11.668,47.137,12.292,47,13.154z'
                    fill='#253B80'
                  />
                  <path
                    d='M66.654,13.075h-3.275c-0.279,0-0.52,0.204-0.563,0.481l-0.145,0.916l-0.229-0.332  c-0.709-1.029-2.29-1.373-3.868-1.373c-3.619,0-6.71,2.741-7.312,6.586c-0.313,1.918,0.132,3.752,1.22,5.031  c0.998,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.562,0.66h2.95  c0.469,0,0.865-0.34,0.939-0.803l1.77-11.209C67.271,13.388,67.004,13.075,66.654,13.075z M62.089,19.449  c-0.316,1.871-1.801,3.127-3.695,3.127c-0.951,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.668-1.391-0.514-2.301  c0.295-1.855,1.805-3.152,3.67-3.152c0.93,0,1.686,0.309,2.184,0.892C62.034,17.721,62.232,18.543,62.089,19.449z'
                    fill='#253B80'
                  />
                  <path
                    d='M84.096,13.075h-3.291c-0.314,0-0.609,0.156-0.787,0.417l-4.539,6.686l-1.924-6.425  c-0.121-0.402-0.492-0.678-0.912-0.678h-3.234c-0.393,0-0.666,0.384-0.541,0.754l3.625,10.638l-3.408,4.811  c-0.268,0.379,0.002,0.9,0.465,0.9h3.287c0.312,0,0.604-0.152,0.781-0.408L84.564,13.97C84.826,13.592,84.557,13.075,84.096,13.075z'
                    fill='#253B80'
                  />
                  <path
                    d='M94.992,6.749h-6.84c-0.467,0-0.865,0.34-0.938,0.802l-2.766,17.537c-0.055,0.346,0.213,0.658,0.562,0.658  h3.51c0.326,0,0.605-0.238,0.656-0.562l0.785-4.971c0.072-0.463,0.471-0.803,0.938-0.803h2.164c4.506,0,7.105-2.18,7.785-6.5  c0.307-1.89,0.012-3.375-0.873-4.415C99.004,7.353,97.281,6.749,94.992,6.749z M95.781,13.154c-0.373,2.454-2.248,2.454-4.062,2.454  h-1.031l0.725-4.583c0.043-0.277,0.281-0.481,0.562-0.481h0.473c1.234,0,2.4,0,3.002,0.704  C95.809,11.668,95.918,12.292,95.781,13.154z'
                    fill='#179BD7'
                  />
                  <path
                    d='M115.434,13.075h-3.273c-0.281,0-0.52,0.204-0.562,0.481l-0.145,0.916l-0.23-0.332  c-0.709-1.029-2.289-1.373-3.867-1.373c-3.619,0-6.709,2.741-7.311,6.586c-0.312,1.918,0.131,3.752,1.219,5.031  c1,1.176,2.426,1.666,4.125,1.666c2.916,0,4.533-1.875,4.533-1.875l-0.146,0.91c-0.055,0.348,0.213,0.66,0.564,0.66h2.949  c0.467,0,0.865-0.34,0.938-0.803l1.771-11.209C116.053,13.388,115.785,13.075,115.434,13.075z M110.869,19.449  c-0.314,1.871-1.801,3.127-3.695,3.127c-0.949,0-1.711-0.305-2.199-0.883c-0.484-0.574-0.666-1.391-0.514-2.301  c0.297-1.855,1.805-3.152,3.67-3.152c0.93,0,1.686,0.309,2.184,0.892C110.816,17.721,111.014,18.543,110.869,19.449z'
                    fill='#179BD7'
                  />
                  <path
                    d='M119.295,7.23l-2.807,17.858c-0.055,0.346,0.213,0.658,0.562,0.658h2.822c0.469,0,0.867-0.34,0.939-0.803  l2.768-17.536c0.055-0.346-0.213-0.659-0.562-0.659h-3.16C119.578,6.749,119.338,6.953,119.295,7.23z'
                    fill='#179BD7'
                  />
                  <path
                    d='M7.266,29.154l0.523-3.322l-1.165-0.027H1.061L4.927,1.292C4.939,1.218,4.978,1.149,5.035,1.1  c0.057-0.049,0.13-0.076,0.206-0.076h9.38c3.114,0,5.263,0.648,6.385,1.927c0.526,0.6,0.861,1.227,1.023,1.917  c0.17,0.724,0.173,1.589,0.007,2.644l-0.012,0.077v0.676l0.526,0.298c0.443,0.235,0.795,0.504,1.065,0.812  c0.45,0.513,0.741,1.165,0.864,1.938c0.127,0.795,0.085,1.741-0.123,2.812c-0.24,1.232-0.628,2.305-1.152,3.183  c-0.482,0.809-1.096,1.48-1.825,2c-0.696,0.494-1.523,0.869-2.458,1.109c-0.906,0.236-1.939,0.355-3.072,0.355h-0.73  c-0.522,0-1.029,0.188-1.427,0.525c-0.399,0.344-0.663,0.814-0.744,1.328l-0.055,0.299l-0.924,5.855l-0.042,0.215  c-0.011,0.068-0.03,0.102-0.058,0.125c-0.025,0.021-0.061,0.035-0.096,0.035H7.266z'
                    fill='#253B80'
                  />
                  <path
                    d='M23.048,7.667L23.048,7.667L23.048,7.667c-0.028,0.179-0.06,0.362-0.096,0.55  c-1.237,6.351-5.469,8.545-10.874,8.545H9.326c-0.661,0-1.218,0.48-1.321,1.132l0,0l0,0L6.596,26.83l-0.399,2.533  c-0.067,0.428,0.263,0.814,0.695,0.814h4.881c0.578,0,1.069-0.42,1.16-0.99l0.048-0.248l0.919-5.832l0.059-0.32  c0.09-0.572,0.582-0.992,1.16-0.992h0.73c4.729,0,8.431-1.92,9.513-7.476c0.452-2.321,0.218-4.259-0.978-5.622  C24.022,8.286,23.573,7.945,23.048,7.667z'
                    fill='#179BD7'
                  />
                  <path
                    d='M21.754,7.151c-0.189-0.055-0.384-0.105-0.584-0.15c-0.201-0.044-0.407-0.083-0.619-0.117  c-0.742-0.12-1.555-0.177-2.426-0.177h-7.352c-0.181,0-0.353,0.041-0.507,0.115C9.927,6.985,9.675,7.306,9.614,7.699L8.05,17.605  l-0.045,0.289c0.103-0.652,0.66-1.132,1.321-1.132h2.752c5.405,0,9.637-2.195,10.874-8.545c0.037-0.188,0.068-0.371,0.096-0.55  c-0.313-0.166-0.652-0.308-1.017-0.429C21.941,7.208,21.848,7.179,21.754,7.151z'
                    fill='#222D65'
                  />
                  <path
                    d='M9.614,7.699c0.061-0.393,0.313-0.714,0.652-0.876c0.155-0.074,0.326-0.115,0.507-0.115h7.352  c0.871,0,1.684,0.057,2.426,0.177c0.212,0.034,0.418,0.073,0.619,0.117c0.2,0.045,0.395,0.095,0.584,0.15  c0.094,0.028,0.187,0.057,0.278,0.086c0.365,0.121,0.704,0.263,1.017,0.429c0.368-2.347-0.003-3.945-1.272-5.392  C20.378,0.682,17.853,0,14.622,0h-9.38c-0.66,0-1.223,0.48-1.325,1.133L0.01,25.898c-0.077,0.49,0.301,0.932,0.795,0.932h5.791  l1.454-9.225L9.614,7.699z'
                    fill='#253B80'
                  />
                </svg>
                <p className='text-gray-600 mb-6'>Connect your PayPal account to use it for checkout</p>
                <Button size='lg' className='bg-[#0070BA] hover:bg-[#005ea6]'>
                  Connect with PayPal
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Method Confirmation Dialog */}
      <Dialog
        open={deletingPaymentId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingPaymentId(null)
        }}
      >
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Delete Payment Method</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this payment method? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button type='button' variant='outline' onClick={() => setDeletingPaymentId(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' onClick={handleDeletePaymentMethod} disabled={isDeleting}>
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Delete Payment Method
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

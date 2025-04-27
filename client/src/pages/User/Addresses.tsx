/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext } from 'react'
import {
  useUserAddresses,
  useCreateAddress,
  useUpdateAddress,
  useDeleteAddress,
  useSetDefaultAddress
} from '@/hooks/useAddress'
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
import { MapPin, Plus, Edit, Trash, Loader2, Home, Building, Briefcase, MapPinned, Navigation } from 'lucide-react'
import { CreateAddressRequest, UpdateAddressRequest, Address } from '@/types/Address.type'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { Button } from '@/Components/ui/button'
import MapWithAddress from '@/components/ui/map/mapWithAddress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { AppContext } from '@/Contexts/app.context'

// Form validation schema for address
const addressSchema = yup.object().shape({
  name: yup.string().required('Name is required'),
  phone: yup.string().required('Phone number is required'),
  address_line1: yup.string().required('Address is required'),
  address_line2: yup.string().optional(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  postal_code: yup.string().required('Postal code is required'),
  country: yup.string().required('Country is required'),
  is_default: yup.boolean().optional()
})

export default function Addresses() {
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null)
  const [coordinates, setCoordinates] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null
  })

  // Get user information
  const profile = useContext(AppContext).profile
  const userId = profile?._id

  // Fetch user addresses
  const { data: addressesData, isLoading } = useUserAddresses()

  // Address mutations
  const { mutate: createAddressMutate, isPending: isCreating } = useCreateAddress()
  const { mutate: updateAddressMutate, isPending: isUpdating } = useUpdateAddress(editingAddress?._id || '')
  const { mutate: deleteAddressMutate, isPending: isDeleting } = useDeleteAddress()
  const { mutate: setDefaultAddressMutate, isPending: isSettingDefault } = useSetDefaultAddress()

  // Form for create/edit address
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<CreateAddressRequest | UpdateAddressRequest>({
    resolver: yupResolver(addressSchema),
    defaultValues: {
      name: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: '',
      is_default: false
    }
  })

  // Open edit dialog
  const openEditDialog = (address: Address) => {
    setEditingAddress(address)

    // Populate form with address data
    setValue('name', address.name)
    setValue('phone', address.phone)
    setValue('address_line1', address.address_line1)
    setValue('address_line2', address.address_line2 || '')
    setValue('city', address.city)
    setValue('state', address.state)
    setValue('postal_code', address.postal_code)
    setValue('country', address.country)
    setValue('is_default', address.is_default)

    // Set coordinates if available
    if (address.latitude && address.longitude) {
      setCoordinates({
        latitude: address.latitude,
        longitude: address.longitude
      })
    } else {
      // Set default coordinates based on location data if present
      if (address.location?.coordinates && address.location.coordinates.length === 2) {
        setCoordinates({
          latitude: address.location.coordinates[1],
          longitude: address.location.coordinates[0]
        })
      } else {
        setCoordinates({
          latitude: null,
          longitude: null
        })
      }
    }
  }

  // Close dialog and reset form
  const closeDialog = () => {
    setIsAddingAddress(false)
    setEditingAddress(null)
    setDeletingAddressId(null)
    setCoordinates({ latitude: null, longitude: null })
    reset()
  }

  // Handle create address
  const handleCreateAddress = (data: CreateAddressRequest) => {
    if (!coordinates.latitude || !coordinates.longitude) {
      toast.error('Please select a location on the map')
      return
    }

    const addressData: CreateAddressRequest = {
      ...data,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      user_id: userId
    }

    createAddressMutate(addressData, {
      onSuccess: () => {
        toast.success('Address added successfully')
        closeDialog()
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to add address')
      }
    })
  }

  // Handle update address
  const handleUpdateAddress = (data: UpdateAddressRequest) => {
    if (!editingAddress) return

    if (!coordinates.latitude || !coordinates.longitude) {
      toast.error('Please select a location on the map')
      return
    }

    const addressData: UpdateAddressRequest = {
      ...data,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    }

    updateAddressMutate(addressData, {
      onSuccess: () => {
        toast.success('Address updated successfully')
        closeDialog()
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to update address')
      }
    })
  }

  // Handle delete address
  const handleDeleteAddress = () => {
    if (!deletingAddressId) return

    deleteAddressMutate(deletingAddressId, {
      onSuccess: () => {
        toast.success('Address deleted successfully')
        closeDialog()
      },
      onError: (error: any) => {
        toast.error(error.data?.message || 'Failed to delete address')
      }
    })
  }

  // Handle set default address
  const handleSetDefaultAddress = (addressId: string) => {
    setDefaultAddressMutate(
      { address_id: addressId },
      {
        onSuccess: () => {
          toast.success('Default address updated')
        },
        onError: (error: any) => {
          toast.error(error.data?.message || 'Failed to update default address')
        }
      }
    )
  }

  // Load coordinates when editing address
  useEffect(() => {
    if (editingAddress) {
      if (editingAddress.latitude && editingAddress.longitude) {
        setCoordinates({
          latitude: editingAddress.latitude,
          longitude: editingAddress.longitude
        })
      } else if (editingAddress.location?.coordinates && editingAddress.location.coordinates.length === 2) {
        setCoordinates({
          latitude: editingAddress.location.coordinates[1],
          longitude: editingAddress.location.coordinates[0]
        })
      }
    } else {
      // Set default coordinates for Bangkok, Thailand for new addresses
      setCoordinates({
        latitude: 13.7563,
        longitude: 100.5018
      })
    }
  }, [editingAddress])

  // Get address type icon
  const getAddressTypeIcon = (address: Address) => {
    if (address.name.toLowerCase().includes('work') || address.name.toLowerCase().includes('office')) {
      return <Briefcase className='h-4 w-4 text-blue-500' />
    } else if (address.name.toLowerCase().includes('home')) {
      return <Home className='h-4 w-4 text-green-500' />
    } else if (address.name.toLowerCase().includes('business')) {
      return <Building className='h-4 w-4 text-purple-500' />
    } else {
      return <MapPin className='h-4 w-4 text-indigo-500' />
    }
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold flex items-center'>
            <MapPinned className='mr-2 h-6 w-6' />
            My Addresses
          </h1>
          <p className='text-gray-600'>Manage your shipping and billing addresses</p>
        </div>
        <Button onClick={() => setIsAddingAddress(true)} className='flex items-center'>
          <Plus className='mr-2 h-4 w-4' />
          Add New Address
        </Button>
      </div>

      {isLoading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Card key={i} className='bg-gray-50 border border-dashed'>
                <CardContent className='p-6'>
                  <div className='flex justify-between mb-4'>
                    <Skeleton className='h-6 w-32' />
                    <Skeleton className='h-6 w-16' />
                  </div>
                  <Skeleton className='h-4 w-full mb-2' />
                  <Skeleton className='h-4 w-full mb-2' />
                  <Skeleton className='h-4 w-2/3 mb-4' />
                  <Skeleton className='h-8 w-28' />
                </CardContent>
              </Card>
            ))}
        </div>
      ) : !addressesData?.result?.addresses || addressesData.result.addresses.length === 0 ? (
        <Card className='bg-gray-50 border border-dashed'>
          <CardContent className='p-8 flex flex-col items-center justify-center'>
            <MapPin className='h-12 w-12 text-gray-300 mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-1'>No addresses found</h3>
            <p className='text-gray-500 mb-4 text-center max-w-md'>
              You haven't added any addresses yet. Add an address to make checkout faster.
            </p>
            <Button onClick={() => setIsAddingAddress(true)}>Add Your First Address</Button>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {addressesData?.result?.addresses.map((address) => (
            <Card key={address._id} className={address.is_default ? 'border-indigo-200 bg-indigo-50/50' : ''}>
              <CardContent className='p-6'>
                <div className='flex justify-between items-start mb-4'>
                  <div className='flex items-center'>
                    {getAddressTypeIcon(address)}
                    <h3 className='font-medium ml-2'>{address.name}</h3>
                    {address.is_default && (
                      <span className='ml-2 bg-indigo-100 text-indigo-800 text-xs px-2 py-0.5 rounded'>Default</span>
                    )}
                  </div>
                  <div className='flex space-x-1'>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-gray-500 hover:text-blue-600'
                      onClick={() => openEditDialog(address)}
                    >
                      <Edit className='h-4 w-4' />
                      <span className='sr-only'>Edit</span>
                    </Button>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-gray-500 hover:text-red-600'
                      onClick={() => setDeletingAddressId(address._id)}
                      disabled={address.is_default}
                    >
                      <Trash className='h-4 w-4' />
                      <span className='sr-only'>Delete</span>
                    </Button>
                  </div>
                </div>

                <div className='space-y-1 mb-4'>
                  <p>{address.phone}</p>
                  <p>
                    {address.address_line1}
                    {address.address_line2 && `, ${address.address_line2}`}
                  </p>
                  <p>
                    {address.city}, {address.state} {address.postal_code}
                  </p>
                  <p>{address.country}</p>

                  {(address.latitude ||
                    (address.location?.coordinates && address.location.coordinates.length === 2)) && (
                    <p className='text-xs text-gray-500 flex items-center mt-1'>
                      <Navigation className='h-3 w-3 mr-1' />
                      Location:{' '}
                      {address.latitude
                        ? `${address.latitude.toFixed(6)}, ${address.longitude?.toFixed(6)}`
                        : `${address.location?.coordinates[1].toFixed(6)}, ${address.location?.coordinates[0].toFixed(6)}`}
                    </p>
                  )}
                </div>

                {!address.is_default && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => handleSetDefaultAddress(address._id)}
                    disabled={isSettingDefault}
                    className='mt-2'
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

      {/* Add/Edit Address Dialog */}
      <Dialog
        open={isAddingAddress || editingAddress !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog()
          else if (!editingAddress) setIsAddingAddress(open)
        }}
      >
        <DialogContent className='sm:max-w-[650px] max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress
                ? 'Update your shipping or billing address details'
                : 'Add a new shipping or billing address to your account'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(editingAddress ? handleUpdateAddress : (handleCreateAddress as any))}>
            <div className='grid gap-4 py-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='name'>Address Label</Label>
                  <Input
                    id='name'
                    placeholder='Home, Work, etc.'
                    {...register('name')}
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor='phone'>Phone Number</Label>
                  <Input
                    id='phone'
                    placeholder='(123) 456-7890'
                    {...register('phone')}
                    className={errors.phone ? 'border-red-500' : ''}
                  />
                  {errors.phone && <p className='text-red-500 text-xs mt-1'>{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor='address_line1'>Address Line 1</Label>
                <Input
                  id='address_line1'
                  placeholder='Street address, P.O. box'
                  {...register('address_line1')}
                  className={errors.address_line1 ? 'border-red-500' : ''}
                />
                {errors.address_line1 && <p className='text-red-500 text-xs mt-1'>{errors.address_line1.message}</p>}
              </div>

              <div>
                <Label htmlFor='address_line2'>Address Line 2 (Optional)</Label>
                <Input
                  id='address_line2'
                  placeholder='Apartment, suite, unit, building, floor, etc.'
                  {...register('address_line2')}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    placeholder='City'
                    {...register('city')}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className='text-red-500 text-xs mt-1'>{errors.city.message}</p>}
                </div>
                <div>
                  <Label htmlFor='state'>State / Province</Label>
                  <Input
                    id='state'
                    placeholder='State / Province'
                    {...register('state')}
                    className={errors.state ? 'border-red-500' : ''}
                  />
                  {errors.state && <p className='text-red-500 text-xs mt-1'>{errors.state.message}</p>}
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label htmlFor='postal_code'>Postal Code</Label>
                  <Input
                    id='postal_code'
                    placeholder='Postal code'
                    {...register('postal_code')}
                    className={errors.postal_code ? 'border-red-500' : ''}
                  />
                  {errors.postal_code && <p className='text-red-500 text-xs mt-1'>{errors.postal_code.message}</p>}
                </div>
                <div>
                  <Label htmlFor='country'>Country</Label>
                  <Input
                    id='country'
                    placeholder='Country'
                    {...register('country')}
                    className={errors.country ? 'border-red-500' : ''}
                  />
                  {errors.country && <p className='text-red-500 text-xs mt-1'>{errors.country.message}</p>}
                </div>
              </div>

              <div>
                <Label>Select Location on Map</Label>
                <Alert className='mb-2'>
                  <MapPin className='h-4 w-4' />
                  <AlertTitle>Pick a location</AlertTitle>
                  <AlertDescription>Click on the map to set your precise location for delivery.</AlertDescription>
                </Alert>
                <div className='h-[300px] w-full mt-2 border rounded-md overflow-hidden'>
                  <MapWithAddress setCoordinates={setCoordinates} />
                </div>
                {coordinates.latitude && coordinates.longitude ? (
                  <p className='text-xs text-gray-500 mt-1'>
                    Selected coordinates: {coordinates.latitude.toFixed(6)}, {coordinates.longitude.toFixed(6)}
                  </p>
                ) : (
                  <p className='text-xs text-red-500 mt-1'>Please select a location on the map</p>
                )}
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox id='is_default' {...register('is_default')} />
                <Label htmlFor='is_default' className='text-sm font-normal'>
                  Set as default shipping address
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                type='submit'
                disabled={isCreating || isUpdating || !coordinates.latitude || !coordinates.longitude}
              >
                {(isCreating || isUpdating) && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                {editingAddress ? 'Update Address' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Address Confirmation Dialog */}
      <Dialog
        open={deletingAddressId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingAddressId(null)
        }}
      >
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Delete Address</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this address? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className='gap-2 sm:gap-0'>
            <Button type='button' variant='outline' onClick={() => setDeletingAddressId(null)}>
              Cancel
            </Button>
            <Button type='button' variant='destructive' onClick={handleDeleteAddress} disabled={isDeleting}>
              {isDeleting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Delete Address
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

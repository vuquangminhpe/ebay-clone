/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, JSXElementConstructor, Key, ReactElement, ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useCategoryTree } from '@/hooks/useCategory'
import { useProduct, useCreateProduct, useUpdateProduct } from '@/hooks/useProduct'
import mediasApi from '@/apis/medias.api'
import { toast } from 'sonner'
import { ProductCondition, ProductStatus, MediaType } from '@/types/type'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Tags,
  Image as ImageIcon,
  PlusCircle,
  Trash2,
  ArrowLeft,
  Save,
  Truck,
  ClipboardList,
  Layers,
  DollarSign,
  Loader2
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/Components/ui/button'

// Define the form schema with Zod
const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.coerce.number().positive('Price must be positive'),
  quantity: z.coerce.number().int().nonnegative('Quantity must be 0 or positive'),
  category_id: z.string().min(1, 'Please select a category'),
  condition: z.nativeEnum(ProductCondition),
  tags: z.array(z.string()).optional(),
  medias: z
    .array(
      z.object({
        url: z.string().url('Please enter a valid URL'),
        type: z.nativeEnum(MediaType),
        is_primary: z.boolean().optional()
      })
    )
    .min(1, 'At least one image is required'),
  variants: z
    .array(
      z.object({
        attributes: z.record(z.string()),
        price: z.coerce.number().positive('Price must be positive'),
        stock: z.coerce.number().int().nonnegative('Stock must be 0 or positive'),
        sku: z.string().optional()
      })
    )
    .optional(),
  shipping_price: z.coerce.number().nonnegative('Shipping price must be 0 or positive').optional(),
  free_shipping: z.boolean().optional(),
  status: z.nativeEnum(ProductStatus).optional()
})

type ProductFormValues = z.infer<typeof productSchema>

export default function ProductForm() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const isEditMode = !!productId

  const [activeTab, setActiveTab] = useState('basic')
  const [tagInput, setTagInput] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Fetch categories
  const { data: categories } = useCategoryTree()

  // Fetch product data for edit mode
  const { data: productData, isLoading: productLoading } = useProduct(productId || '')

  // Create and update mutations
  const { mutate: createProduct, isPending: isCreating } = useCreateProduct()
  const { mutate: updateProduct, isPending: isUpdating } = useUpdateProduct()

  // Set up the form
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      quantity: 0,
      category_id: '',
      condition: ProductCondition.NEW,
      tags: [],
      medias: [],
      variants: [],
      shipping_price: 0,
      free_shipping: false,
      status: ProductStatus.DRAFT
    }
  })

  // Set up field array for variants
  const {
    fields: variantFields,
    append: appendVariant,
    remove: removeVariant
  } = useFieldArray({
    control: form.control,
    name: 'variants'
  })

  // Set up field array for media
  const {
    fields: mediaFields,
    append: appendMedia,
    remove: removeMedia
  } = useFieldArray({
    control: form.control,
    name: 'medias'
  })

  // Load product data if in edit mode
  useEffect(() => {
    if (isEditMode && productData) {
      form.reset({
        name: productData.result.name,
        description: productData.result.description,
        price: productData.result.price,
        quantity: productData.result.quantity,
        category_id: productData.result.category_id,
        condition: productData.result.condition as ProductCondition,
        tags: productData.result.tags || [],
        medias: productData.result.medias,
        variants: productData.result.variants || [],
        shipping_price: productData.result.shipping_price || 0,
        free_shipping: productData.result.free_shipping,
        status: productData.result.status as ProductStatus
      })
    }
  }, [isEditMode, productData, form])

  // Handle tag input
  const handleAddTag = () => {
    if (tagInput.trim() && !form.getValues('tags')?.includes(tagInput.trim())) {
      const currentTags = form.getValues('tags') || []
      form.setValue('tags', [...currentTags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    const currentTags = form.getValues('tags') || []
    form.setValue(
      'tags',
      currentTags.filter((t: string) => t !== tag)
    )
  }

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    try {
      setUploadingImages(true)
      setUploadProgress(10)

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        setUploadProgress(Math.round((i / files.length) * 90))

        const response = await mediasApi.uploadImages(file)
        if (response.data && Number(response.data.length) > 0) {
          const media = response.data.result
          appendMedia({
            url: (media as any).url,
            type: MediaType.IMAGE,
            is_primary: mediaFields.length === 0 // First image is primary by default
          })
        }
      }

      setUploadProgress(100)
      toast.success('Images uploaded successfully')
    } catch (error) {
      toast.error('Failed to upload images')
      console.error('Image upload error:', error)
    } finally {
      setUploadingImages(false)
      setUploadProgress(0)
    }
  }

  // Set an image as primary
  const setAsPrimary = (index: number) => {
    const updatedMedias = form.getValues('medias').map((media: any, i: number) => ({
      ...media,
      is_primary: i === index
    }))
    form.setValue('medias', updatedMedias)
  }

  // Add a new variant
  const addVariant = () => {
    appendVariant({
      attributes: {},
      price: form.getValues('price'),
      stock: form.getValues('quantity'),
      sku: ''
    })
  }

  // Submit form
  const onSubmit = (values: ProductFormValues) => {
    // Check if at least one media is marked as primary
    if (!values.medias.some((media: any) => media.is_primary)) {
      if (values.medias.length > 0) {
        values.medias[0].is_primary = true
      } else {
        toast.error('At least one image is required')
        return
      }
    }

    if (isEditMode && productId) {
      updateProduct(
        {
          product_id: productId,
          params: values
        },
        {
          onSuccess: () => {
            toast.success('Product updated successfully')
            navigate('/seller/products')
          },
          onError: () => {
            toast.error('Failed to update product')
          }
        }
      )
    } else {
      createProduct(values, {
        onSuccess: () => {
          toast.success('Product created successfully')
          navigate('/seller/products')
        },
        onError: () => {
          toast.error('Failed to create product')
        }
      })
    }
  }

  // Render category options recursively
  const renderCategoryOptions = (categories: any[], depth = 0) => {
    if (!categories) return null

    return categories.map((category) => (
      <div key={category._id}>
        <SelectItem value={category._id}>
          {Array(depth).fill('—').join('')} {depth > 0 && '› '}
          {category.name}
        </SelectItem>
        {category.children && renderCategoryOptions(category.children, depth + 1)}
      </div>
    ))
  }

  if (productLoading && isEditMode) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <span className='ml-2'>Loading product...</span>
      </div>
    )
  }

  return (
    <div>
      <div className='flex justify-between items-center mb-6'>
        <div className='flex items-center'>
          <Button variant='ghost' onClick={() => navigate('/seller/products')} className='mr-2'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <h1 className='text-2xl font-bold flex items-center'>
            <Package className='mr-2 h-6 w-6' />
            {isEditMode ? 'Edit Product' : 'Create New Product'}
          </h1>
        </div>

        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => form.reset()} disabled={isCreating || isUpdating}>
            Reset
          </Button>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isCreating || isUpdating}>
            <Save className='mr-2 h-4 w-4' />
            {isCreating || isUpdating ? 'Saving...' : isEditMode ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
            {/* Main content - 3 columns */}
            <div className='lg:col-span-3 space-y-6'>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className='grid grid-cols-4 mb-4'>
                  <TabsTrigger value='basic' className='flex items-center'>
                    <Package className='mr-2 h-4 w-4' />
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger value='media' className='flex items-center'>
                    <ImageIcon className='mr-2 h-4 w-4' />
                    Media
                  </TabsTrigger>
                  <TabsTrigger value='variants' className='flex items-center'>
                    <Layers className='mr-2 h-4 w-4' />
                    Variants
                  </TabsTrigger>
                  <TabsTrigger value='shipping' className='flex items-center'>
                    <Truck className='mr-2 h-4 w-4' />
                    Shipping
                  </TabsTrigger>
                </TabsList>

                {/* Basic Info Tab */}
                <TabsContent value='basic'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Basic Information</CardTitle>
                      <CardDescription>Enter the basic details about your product.</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='name'
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Product Name*</FormLabel>
                            <FormControl>
                              <Input placeholder='Enter product name' {...field} />
                            </FormControl>
                            <FormDescription>
                              Choose a descriptive name that will help buyers find your product.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name='description'
                        render={({ field }: any) => (
                          <FormItem>
                            <FormLabel>Description*</FormLabel>
                            <FormControl>
                              <Textarea placeholder='Describe your product in detail' className='min-h-32' {...field} />
                            </FormControl>
                            <FormDescription>
                              Provide a detailed description including features, material, size, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='price'
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel>Price ($)*</FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-gray-500' />
                                  <Input
                                    type='number'
                                    placeholder='0.00'
                                    className='pl-9'
                                    min={0}
                                    step={0.01}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='quantity'
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel>Quantity*</FormLabel>
                              <FormControl>
                                <Input type='number' placeholder='0' min={0} step={1} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <FormField
                          control={form.control}
                          name='category_id'
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel>Category*</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select a category' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {Number(categories?.result?.length) > 0 ? (
                                    renderCategoryOptions(categories?.result as any)
                                  ) : (
                                    <SelectItem value='loading' disabled>
                                      Loading categories...
                                    </SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                              <FormDescription>Choose the most specific category for your product.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name='condition'
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel>Condition*</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select condition' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={ProductCondition.NEW}>New</SelectItem>
                                  <SelectItem value={ProductCondition.LIKE_NEW}>Like New</SelectItem>
                                  <SelectItem value={ProductCondition.VERY_GOOD}>Very Good</SelectItem>
                                  <SelectItem value={ProductCondition.GOOD}>Good</SelectItem>
                                  <SelectItem value={ProductCondition.ACCEPTABLE}>Acceptable</SelectItem>
                                  <SelectItem value={ProductCondition.FOR_PARTS}>For Parts</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name='tags'
                        render={() => (
                          <FormItem>
                            <FormLabel>Tags</FormLabel>
                            <div>
                              <div className='flex gap-2 mb-2'>
                                <Input
                                  placeholder='Add tags (press Enter)'
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleAddTag()
                                    }
                                  }}
                                />
                                <Button type='button' onClick={handleAddTag} variant='outline'>
                                  <PlusCircle className='h-4 w-4 mr-2' />
                                  Add
                                </Button>
                              </div>

                              <div className='flex flex-wrap gap-2 mt-2'>
                                {form
                                  .watch('tags')
                                  ?.map(
                                    (
                                      tag:
                                        | string
                                        | number
                                        | boolean
                                        | ReactElement<any, string | JSXElementConstructor<any>>
                                        | Iterable<ReactNode>
                                        | null
                                        | undefined,
                                      index: Key | null | undefined
                                    ) => (
                                      <Badge key={index} variant='secondary' className='flex items-center gap-1'>
                                        <Tags className='h-3 w-3' />
                                        {tag}
                                        <Button
                                          type='button'
                                          variant='ghost'
                                          size='sm'
                                          className='h-4 w-4 p-0 ml-1 hover:bg-transparent'
                                          onClick={() => handleRemoveTag(tag as any)}
                                        >
                                          <Trash2 className='h-3 w-3' />
                                        </Button>
                                      </Badge>
                                    )
                                  )}
                                {(!form.watch('tags') || form.watch('tags').length === 0) && (
                                  <span className='text-gray-500 text-sm'>No tags added yet</span>
                                )}
                              </div>
                            </div>
                            <FormDescription>
                              Tags help customers find your product. Add up to 10 relevant tags.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {isEditMode && (
                        <FormField
                          control={form.control}
                          name='status'
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel>Product Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder='Select status' />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                                  <SelectItem value={ProductStatus.DRAFT}>Draft</SelectItem>
                                  <SelectItem value={ProductStatus.HIDDEN}>Hidden</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription>Set the visibility status of your product.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Media Tab */}
                <TabsContent value='media'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Media</CardTitle>
                      <CardDescription>
                        Upload images of your product. The first image will be the main image.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='mb-4'>
                        <div className='flex items-center gap-2'>
                          <Button
                            type='button'
                            variant='outline'
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={uploadingImages}
                          >
                            {uploadingImages ? (
                              <>
                                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                Uploading... {uploadProgress}%
                              </>
                            ) : (
                              <>
                                <ImageIcon className='h-4 w-4 mr-2' />
                                Upload Images
                              </>
                            )}
                          </Button>
                          <Input
                            id='image-upload'
                            type='file'
                            accept='image/*'
                            multiple
                            className='hidden'
                            onChange={handleImageUpload}
                            disabled={uploadingImages}
                          />
                          <p className='text-sm text-gray-500'>
                            Upload up to 10 images. First image will be the main product image.
                          </p>
                        </div>

                        {mediaFields.length === 0 && !uploadingImages && (
                          <Alert className='mt-4'>
                            <ImageIcon className='h-4 w-4' />
                            <AlertTitle>No images uploaded</AlertTitle>
                            <AlertDescription>Please upload at least one image of your product.</AlertDescription>
                          </Alert>
                        )}
                      </div>

                      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mt-6'>
                        {mediaFields?.map((media, index) => (
                          <div key={media.id} className='relative group'>
                            <div
                              className={`
                              border rounded-md overflow-hidden aspect-square 
                              ${media.id ? 'ring-2 ring-primary' : ''} 
                              hover:opacity-75 transition-opacity
                            `}
                            >
                              <img
                                src={media.url}
                                alt={`Product image ${index + 1}`}
                                className='w-full h-full object-cover'
                              />

                              {media.is_primary && (
                                <div className='absolute top-2 left-2'>
                                  <Badge>Primary</Badge>
                                </div>
                              )}

                              <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40'>
                                <div className='flex gap-2'>
                                  {!media.is_primary && (
                                    <Button
                                      type='button'
                                      variant='secondary'
                                      size='sm'
                                      onClick={() => setAsPrimary(index)}
                                    >
                                      Set as Primary
                                    </Button>
                                  )}
                                  <Button
                                    type='button'
                                    variant='destructive'
                                    size='icon'
                                    onClick={() => removeMedia(index)}
                                  >
                                    <Trash2 className='h-4 w-4' />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Variants Tab */}
                <TabsContent value='variants'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Product Variants</CardTitle>
                      <CardDescription>
                        Add variants if your product comes in different options (e.g. size, color).
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className='mb-4'>
                        <Button type='button' variant='outline' onClick={addVariant}>
                          <PlusCircle className='h-4 w-4 mr-2' />
                          Add Variant
                        </Button>
                      </div>

                      {variantFields.length === 0 ? (
                        <div className='text-center py-12 bg-gray-50 rounded-md'>
                          <Layers className='h-16 w-16 text-gray-300 mx-auto mb-4' />
                          <h3 className='text-lg font-medium text-gray-900 mb-1'>No variants added</h3>
                          <p className='text-gray-500 mb-4'>
                            If your product comes in different variations like sizes or colors, add them here.
                          </p>
                          <Button type='button' onClick={addVariant}>
                            <PlusCircle className='h-4 w-4 mr-2' />
                            Add Variant
                          </Button>
                        </div>
                      ) : (
                        <div className='space-y-6'>
                          {variantFields.map((variant, index) => (
                            <div key={variant.id} className='border rounded-md p-4'>
                              <div className='flex justify-between items-center mb-4'>
                                <h3 className='font-medium'>Variant {index + 1}</h3>
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => removeVariant(index)}
                                  className='text-red-500 hover:text-red-700'
                                >
                                  <Trash2 className='h-4 w-4 mr-2' />
                                  Remove
                                </Button>
                              </div>

                              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-4'>
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.attributes.color`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel>Color</FormLabel>
                                      <FormControl>
                                        <Input placeholder='e.g. Red, Blue, etc.' {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.attributes.size`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel>Size</FormLabel>
                                      <FormControl>
                                        <Input placeholder='e.g. S, M, L, XL' {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.sku`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel>SKU (Optional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder='Stock Keeping Unit' {...field} />
                                      </FormControl>
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.price`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel>Price ($)</FormLabel>
                                      <FormControl>
                                        <div className='relative'>
                                          <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-gray-500' />
                                          <Input
                                            type='number'
                                            placeholder='0.00'
                                            className='pl-9'
                                            min={0}
                                            step={0.01}
                                            {...field}
                                          />
                                        </div>
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name={`variants.${index}.stock`}
                                  render={({ field }: any) => (
                                    <FormItem>
                                      <FormLabel>Stock</FormLabel>
                                      <FormControl>
                                        <Input type='number' placeholder='0' min={0} step={1} {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Shipping Tab */}
                <TabsContent value='shipping'>
                  <Card>
                    <CardHeader>
                      <CardTitle>Shipping Information</CardTitle>
                      <CardDescription>Set up shipping options for your product.</CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                      <FormField
                        control={form.control}
                        name='free_shipping'
                        render={({ field }: any) => (
                          <FormItem className='flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4'>
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className='space-y-1 leading-none'>
                              <FormLabel>Free Shipping</FormLabel>
                              <FormDescription>Offer free shipping for this product.</FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {!form.watch('free_shipping') && (
                        <FormField
                          control={form.control}
                          name='shipping_price'
                          render={({ field }: any) => (
                            <FormItem>
                              <FormLabel>Shipping Price ($)</FormLabel>
                              <FormControl>
                                <div className='relative'>
                                  <DollarSign className='absolute left-3 top-2.5 h-4 w-4 text-gray-500' />
                                  <Input
                                    type='number'
                                    placeholder='0.00'
                                    className='pl-9'
                                    min={0}
                                    step={0.01}
                                    {...field}
                                  />
                                </div>
                              </FormControl>
                              <FormDescription>Set a fixed shipping price for this product.</FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <div className='mt-4'>
                        <Alert className='bg-blue-50 border-blue-200'>
                          <Truck className='h-4 w-4 text-blue-600' />
                          <AlertTitle className='text-blue-800'>Shipping Policy</AlertTitle>
                          <AlertDescription className='text-blue-700'>
                            Remember to comply with our shipping policies. Estimated delivery times will be calculated
                            based on your location and the buyer's address.
                          </AlertDescription>
                        </Alert>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar - 1 column */}
            <div className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Product Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }: any) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={ProductStatus.ACTIVE}>Active</SelectItem>
                            <SelectItem value={ProductStatus.DRAFT}>Draft</SelectItem>
                            <SelectItem value={ProductStatus.HIDDEN}>Hidden</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {field.value === ProductStatus.ACTIVE
                            ? 'Product will be visible to customers'
                            : field.value === ProductStatus.DRAFT
                              ? 'Save as draft to finish later'
                              : 'Product will not be visible to customers'}
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
                <CardFooter className='flex justify-between'>
                  <Button variant='outline' onClick={() => navigate('/seller/products')}>
                    Cancel
                  </Button>
                  <Button onClick={form.handleSubmit(onSubmit)} disabled={isCreating || isUpdating}>
                    {isCreating || isUpdating ? (
                      <>
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                        Saving...
                      </>
                    ) : isEditMode ? (
                      'Update'
                    ) : (
                      'Create'
                    )}
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Checklist</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex items-center'>
                      <Checkbox
                        id='check-basic'
                        checked={
                          !!form.watch('name') &&
                          !!form.watch('description') &&
                          !!form.watch('price') &&
                          !!form.watch('category_id')
                        }
                        disabled
                      />
                      <label
                        htmlFor='check-basic'
                        className='ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Basic information
                      </label>
                    </div>
                    <div className='flex items-center'>
                      <Checkbox id='check-media' checked={form.watch('medias')?.length > 0} disabled />
                      <label
                        htmlFor='check-media'
                        className='ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Product images
                      </label>
                    </div>
                    <div className='flex items-center'>
                      <Checkbox
                        id='check-shipping'
                        checked={form.watch('free_shipping') || !!form.watch('shipping_price')}
                        disabled
                      />
                      <label
                        htmlFor='check-shipping'
                        className='ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                      >
                        Shipping information
                      </label>
                    </div>
                  </div>

                  <Separator className='my-4' />

                  <div className='space-y-2'>
                    <h4 className='text-sm font-medium'>Tips:</h4>
                    <ul className='text-sm text-gray-500 space-y-1 list-disc pl-4'>
                      <li>Add multiple high-quality images</li>
                      <li>Write detailed product descriptions</li>
                      <li>Include accurate dimensions and specifications</li>
                      <li>Set competitive pricing</li>
                      <li>Add relevant tags to improve discoverability</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <Button className='w-full justify-start' variant='outline' onClick={() => setActiveTab('basic')}>
                      <ClipboardList className='mr-2 h-4 w-4' />
                      Edit Basic Info
                    </Button>
                    <Button className='w-full justify-start' variant='outline' onClick={() => setActiveTab('media')}>
                      <ImageIcon className='mr-2 h-4 w-4' />
                      Manage Images
                    </Button>
                    <Button className='w-full justify-start' variant='outline' onClick={() => setActiveTab('shipping')}>
                      <Truck className='mr-2 h-4 w-4' />
                      Set Shipping
                    </Button>

                    {isEditMode && (
                      <Button
                        className='w-full justify-start text-red-500 hover:text-red-700'
                        variant='outline'
                        onClick={() => {
                          // Prompt or confirmation dialog would go here
                          if (confirm('Are you sure you want to delete this product?')) {
                            // Delete functionality would go here
                            console.log('Delete product:', productId)
                          }
                        }}
                      >
                        <Trash2 className='mr-2 h-4 w-4' />
                        Delete Product
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}

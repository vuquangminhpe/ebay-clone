/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useProduct, useRelatedProducts } from '@/hooks/useProduct'
import { useSellerFeedbackSummary } from '@/hooks/useFeedback'
import { useAddToCart } from '@/hooks/useCart'
import { useProductReviews } from '@/hooks/useReview'
import { usePlaceBid, useProductBids } from '@/hooks/useBid'
import { useInventory } from '@/hooks/useInventory'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Heart,
  Share2,
  Star,
  Truck,
  ShieldCheck,
  MessageSquare,
  Package,
  BarChart2,
  Clock,
  AlertTriangle,
  Info,
  Check,
  Loader2,
  Plus,
  Minus
} from 'lucide-react'
import { ProductCondition } from '@/types/type'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/Components/ui/button'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isBidding, setIsBidding] = useState(false)
  const [bidAmount, setBidAmount] = useState('')

  const { data: product, isLoading: productLoading, error: productError } = useProduct(id || '')
  const { data: inventory } = useInventory(id || '')
  const { data: relatedProducts } = useRelatedProducts(id || '', 4)
  const { data: sellerFeedback } = useSellerFeedbackSummary(product?.result.seller_id || '')
  const { data: reviews } = useProductReviews(id || '', { limit: 5 })
  const { data: bids } = useProductBids(id || '', { limit: 10 })

  const { mutate: addToCartMutate, isPending: addingToCart } = useAddToCart()
  const { mutate: placeBidMutate, isPending: placingBid } = usePlaceBid()

  // Reset quantity when product changes
  useEffect(() => {
    setQuantity(1)
    setSelectedImage(0)
  }, [id])

  if (productLoading) {
    return <ProductDetailSkeleton />
  }

  if (productError || !product) {
    return (
      <div className='max-w-4xl mx-auto py-12 text-center'>
        <AlertTriangle className='h-12 w-12 mx-auto text-yellow-500 mb-4' />
        <h1 className='text-2xl font-bold mb-2'>Product Not Found</h1>
        <p className='text-gray-600 mb-6'>The product you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/products')}>Browse Products</Button>
      </div>
    )
  }

  const primaryImage = product?.result?.medias.find((m: any) => m.is_primary)?.url || product?.result?.medias[0]?.url
  const otherImages = product?.result?.medias.filter((m: any) => !m.is_primary).map((m: { url: any }) => m.url)
  const allImages = primaryImage ? [primaryImage, ...otherImages] : otherImages

  const isAuction = false // In case isAuction is not in the API
  const availableQuantity = inventory?.available_quantity || product?.result?.quantity

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return
    if (Number(newQuantity) > Number(availableQuantity)) {
      toast.error(`Only ${availableQuantity} items available`)
      return
    }
    setQuantity(newQuantity)
  }

  const handleAddToCart = () => {
    if (!id) return

    addToCartMutate(
      {
        product_id: id,
        quantity
      },
      {
        onSuccess: () => {
          toast.success(`${product?.result?.name} added to cart`)
        }
      }
    )
  }

  const handleBuyNow = () => {
    if (!id) return

    addToCartMutate(
      {
        product_id: id,
        quantity
      },
      {
        onSuccess: () => {
          navigate('/cart')
        }
      }
    )
  }

  const handlePlaceBid = () => {
    if (!id || !bidAmount) return

    const amount = parseFloat(bidAmount)

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount')
      return
    }

    if (amount <= product?.result?.price) {
      toast.error(`Bid must be higher than ${formatPrice(product?.result?.price)}`)
      return
    }

    placeBidMutate(
      {
        productId: id,
        params: { amount }
      },
      {
        onSuccess: () => {
          toast.success('Bid placed successfully')
          setBidAmount('')
          setIsBidding(false)
        }
      }
    )
  }

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
      month: 'long',
      day: 'numeric'
    })
  }

  // Get condition text
  const getConditionText = (condition: ProductCondition) => {
    switch (condition) {
      case 'new':
        return 'New'
      case 'like_new':
        return 'Like New'
      case 'very_good':
        return 'Very Good'
      case 'good':
        return 'Good'
      case 'acceptable':
        return 'Acceptable'
      case 'for_parts':
        return 'For Parts'
      default:
        return condition
    }
  }

  // Get condition badge
  const getConditionBadge = (condition: ProductCondition) => {
    switch (condition) {
      case 'new':
        return <Badge className='bg-green-100 text-green-800 hover:bg-green-200'>New</Badge>
      case 'like_new':
        return <Badge className='bg-blue-100 text-blue-800 hover:bg-blue-200'>Like New</Badge>
      case 'very_good':
        return <Badge className='bg-indigo-100 text-indigo-800 hover:bg-indigo-200'>Very Good</Badge>
      case 'good':
        return <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200'>Good</Badge>
      case 'acceptable':
        return <Badge className='bg-orange-100 text-orange-800 hover:bg-orange-200'>Acceptable</Badge>
      case 'for_parts':
        return <Badge className='bg-red-100 text-red-800 hover:bg-red-200'>For Parts</Badge>
      default:
        return null
    }
  }

  return (
    <div className='max-w-7xl mx-auto'>
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
        {/* Product images */}
        <div className='lg:col-span-3'>
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            {allImages.length > 0 ? (
              <>
                {/* Main image */}
                <div className='aspect-square bg-gray-100 relative'>
                  <img
                    src={allImages[selectedImage]}
                    alt={product?.result?.name}
                    className='w-full h-full object-contain'
                  />
                </div>

                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className='p-4 grid grid-cols-5 gap-2'>
                    {allImages.map((image: any, index: number) => (
                      <button
                        key={index}
                        className={`aspect-square rounded border bg-gray-50 overflow-hidden ${
                          selectedImage === index ? 'ring-2 ring-indigo-500' : ''
                        }`}
                        onClick={() => setSelectedImage(index)}
                      >
                        <img
                          src={image}
                          alt={`${product?.result?.name} thumbnail ${index + 1}`}
                          className='w-full h-full object-cover'
                        />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className='aspect-square bg-gray-100 flex items-center justify-center'>
                <Package className='h-24 w-24 text-gray-300' />
              </div>
            )}
          </div>
        </div>

        {/* Product info */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <div className='mb-4'>
              <h1 className='text-2xl font-bold mb-2'>{product?.result?.name}</h1>

              <div className='flex items-center flex-wrap gap-2 mb-4'>
                {getConditionBadge(product?.result?.condition)}

                {product?.result?.rating && (
                  <Badge className='bg-yellow-100 text-yellow-800 hover:bg-yellow-200'>
                    <Star className='h-3 w-3 fill-yellow-500 text-yellow-500 mr-1' />
                    {product?.result?.rating.toFixed(1)}
                  </Badge>
                )}

                {product?.result?.free_shipping && (
                  <Badge className='bg-indigo-100 text-indigo-800 hover:bg-indigo-200'>
                    <Truck className='h-3 w-3 mr-1' />
                    Free Shipping
                  </Badge>
                )}

                {isAuction && (
                  <Badge className='bg-purple-100 text-purple-800 hover:bg-purple-200'>
                    <BarChart2 className='h-3 w-3 mr-1' />
                    Auction
                  </Badge>
                )}
              </div>

              <div className='flex items-center mb-6'>
                <div className='mr-4'>
                  <p className='text-gray-500 text-sm'>Price:</p>
                  <p className='text-3xl font-bold text-indigo-600'>{formatPrice(product?.result?.price)}</p>
                  {isAuction && <p className='text-sm text-gray-500'>Current highest bid</p>}
                </div>

                {product?.result?.shipping_price &&
                  product?.result?.shipping_price > 0 &&
                  !product?.result?.free_shipping && (
                    <div>
                      <p className='text-gray-500 text-sm'>Shipping:</p>
                      <p className='font-medium'>{formatPrice(product?.result?.shipping_price)}</p>
                    </div>
                  )}
              </div>

              {/* Seller info */}
              <div className='mb-6 p-3 bg-gray-50 rounded-lg'>
                <div className='flex items-center'>
                  <Avatar className='h-10 w-10 mr-3'>
                    <AvatarImage src={product?.result?.seller?.avatar} />
                    <AvatarFallback>{product?.result?.seller?.name?.charAt(0) || 'S'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='font-medium'>{product?.result?.seller?.name || 'Unknown Seller'}</p>
                    <div className='flex items-center text-sm'>
                      {sellerFeedback && (
                        <div className='flex items-center mr-2'>
                          <Star className='h-3 w-3 fill-yellow-500 text-yellow-500 mr-1' />
                          <span>{sellerFeedback.result.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                      {product?.result?.seller?.is_seller_verified && (
                        <span className='text-green-600 flex items-center'>
                          <Check className='h-3 w-3 mr-1' />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to={`/seller/${product?.result?.seller_id}`} className='ml-auto'>
                    <Button variant='outline' size='sm'>
                      View Store
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Availability & Quantity */}
              <div className='mb-6'>
                <div className='flex items-center mb-4'>
                  <p className='text-gray-700'>
                    Availability:
                    <span
                      className={`font-medium ml-1 ${Number(availableQuantity) > 0 ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {Number(availableQuantity) > 0 ? `In Stock (${availableQuantity} available)` : 'Out of Stock'}
                    </span>
                  </p>
                </div>

                {/* Regular purchase controls */}
                {!isAuction && (
                  <div className='space-y-4'>
                    <div className='flex items-center'>
                      <span className='mr-3'>Quantity:</span>
                      <div className='flex items-center'>
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1}
                          className='h-9 w-9 rounded-r-none'
                        >
                          <Minus className='h-4 w-4' />
                        </Button>
                        <Input
                          type='number'
                          min={1}
                          max={Number(availableQuantity)}
                          value={quantity}
                          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                          className='w-16 text-center h-9 rounded-none border-x-0'
                        />
                        <Button
                          variant='outline'
                          size='icon'
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={Number(quantity) >= Number(availableQuantity)}
                          className='h-9 w-9 rounded-l-none'
                        >
                          <Plus className='h-4 w-4' />
                        </Button>
                      </div>
                    </div>

                    <div className='flex flex-col sm:flex-row gap-2'>
                      <Button
                        className='flex-1'
                        onClick={handleAddToCart}
                        disabled={availableQuantity === 0 || addingToCart}
                      >
                        {addingToCart ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Adding...
                          </>
                        ) : (
                          'Add to Cart'
                        )}
                      </Button>
                      <Button
                        variant='outline'
                        className='flex-1'
                        onClick={handleBuyNow}
                        disabled={availableQuantity === 0 || addingToCart}
                      >
                        Buy Now
                      </Button>
                    </div>
                  </div>
                )}

                {/* Auction controls */}
                {isAuction && (
                  <div className='space-y-4'>
                    {product?.result && (
                      <div className='bg-purple-50 p-3 rounded-md'>
                        <p className='flex items-center text-purple-800 mb-1'>
                          <Clock className='h-4 w-4 mr-1' />
                          <span className='font-medium'>Auction ends:</span>
                        </p>
                        <p className='text-purple-900 font-semibold'>{formatDate(product?.result?.updated_at)}</p>
                      </div>
                    )}

                    {isBidding ? (
                      <div className='space-y-2'>
                        <p className='text-sm text-gray-600'>
                          Enter your bid amount (must be greater than {formatPrice(product?.result?.price)})
                        </p>
                        <div className='flex gap-2'>
                          <Input
                            type='number'
                            placeholder='Your bid amount'
                            value={bidAmount}
                            onChange={(e) => setBidAmount(e.target.value)}
                            min={product?.result?.price + 0.01}
                            step='0.01'
                            className='flex-1'
                          />
                          <Button onClick={handlePlaceBid} disabled={placingBid}>
                            {placingBid ? (
                              <>
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                                Bidding...
                              </>
                            ) : (
                              'Place Bid'
                            )}
                          </Button>
                        </div>
                        <Button variant='ghost' size='sm' onClick={() => setIsBidding(false)} className='w-full'>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button onClick={() => setIsBidding(true)} className='w-full'>
                        Place a Bid
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className='flex gap-2'>
                <Button variant='ghost' size='sm' className='flex-1'>
                  <Heart className='h-4 w-4 mr-2' />
                  Save
                </Button>
                <Button variant='ghost' size='sm' className='flex-1'>
                  <Share2 className='h-4 w-4 mr-2' />
                  Share
                </Button>
                <Button variant='ghost' size='sm' className='flex-1'>
                  <MessageSquare className='h-4 w-4 mr-2' />
                  Contact
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs section */}
      <div className='mt-8'>
        <Tabs defaultValue='description'>
          <TabsList className='mb-6'>
            <TabsTrigger value='description'>Description</TabsTrigger>
            <TabsTrigger value='specifications'>Specifications</TabsTrigger>
            <TabsTrigger value='shipping'>Shipping</TabsTrigger>
            <TabsTrigger value='reviews'>Reviews {reviews && `(${reviews.reviews.reviews.length})`}</TabsTrigger>
            {isAuction && <TabsTrigger value='bids'>Bids {bids && `(${bids.bids.bids.length})`}</TabsTrigger>}
          </TabsList>

          <TabsContent value='description' className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-xl font-semibold mb-4'>Product Description</h2>
            <div className='prose max-w-none'>
              {product?.result?.description ? (
                <p className='whitespace-pre-line'>{product?.result?.description}</p>
              ) : (
                <p className='text-gray-500 italic'>No description provided</p>
              )}
            </div>

            {/* Tags */}
            {product?.result?.tags && product?.result?.tags.length > 0 && (
              <div className='mt-6'>
                <h3 className='text-sm font-medium text-gray-900 mb-2'>Tags</h3>
                <div className='flex flex-wrap gap-2'>
                  {product?.result?.tags.map((tag, index) => (
                    <Badge key={index} variant='outline'>
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value='specifications' className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-xl font-semibold mb-4'>Product Specifications</h2>
            <div className='overflow-x-auto'>
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className='font-medium'>Condition</TableCell>
                    <TableCell>{getConditionText(product?.result?.condition)}</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell className='font-medium'>Category</TableCell>
                    <TableCell>{(product?.result as any)?.category_name || 'Uncategorized'}</TableCell>
                  </TableRow>
                  {product?.result?.variants && product?.result?.variants.length > 0 && (
                    <TableRow>
                      <TableCell className='font-medium'>Variants</TableCell>
                      <TableCell>{product?.result?.variants.length} variant(s) available</TableCell>
                    </TableRow>
                  )}
                  <TableRow>
                    <TableCell className='font-medium'>Listed On</TableCell>
                    <TableCell>{formatDate(product?.result?.created_at)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value='shipping' className='bg-white rounded-lg shadow-sm p-6'>
            <h2 className='text-xl font-semibold mb-4'>Shipping Information</h2>
            <div className='space-y-6'>
              <div className='flex items-start'>
                <Truck className='h-5 w-5 text-indigo-600 mt-0.5 mr-3' />
                <div>
                  <h3 className='font-medium'>Shipping</h3>
                  <p className='text-gray-600'>
                    {product?.result?.free_shipping ? (
                      'Free shipping'
                    ) : (
                      <>Shipping cost: {formatPrice(product?.result?.shipping_price || 0)}</>
                    )}
                  </p>
                </div>
              </div>

              <div className='flex items-start'>
                <ShieldCheck className='h-5 w-5 text-indigo-600 mt-0.5 mr-3' />
                <div>
                  <h3 className='font-medium'>Returns</h3>
                  <p className='text-gray-600'>30-day returns. Buyer pays for return shipping.</p>
                </div>
              </div>

              <div className='flex items-start'>
                <Info className='h-5 w-5 text-indigo-600 mt-0.5 mr-3' />
                <div>
                  <h3 className='font-medium'>Shipping Policy</h3>
                  <p className='text-gray-600'>
                    Items typically ship within 1-2 business days. Delivery times may vary based on location.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value='reviews' className='bg-white rounded-lg shadow-sm p-6'>
            <div className='flex justify-between items-center mb-6'>
              <h2 className='text-xl font-semibold'>Customer Reviews</h2>
              <Button variant='outline'>Write a Review</Button>
            </div>

            {reviews && reviews.reviews.reviews.length > 0 ? (
              <div className='space-y-6'>
                {/* Review summary */}
                <div className='flex items-center justify-between bg-gray-50 p-4 rounded-lg mb-6'>
                  <div className='flex items-center'>
                    <div className='text-4xl font-bold mr-3'>
                      {reviews.rating_distribution
                        ? (
                            Object.entries(reviews.rating_distribution).reduce((acc, [rating, count]) => {
                              return acc + parseInt(rating) * count
                            }, 0) / reviews.reviews.reviews.length
                          ).toFixed(1)
                        : '0.0'}
                    </div>
                    <div>
                      <div className='flex items-center text-yellow-500 mb-1'>
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < Math.round(reviews.reviews.reviews.reduce((acc: any, review: { rating: any }) => acc + review.rating, 0) / reviews.reviews.reviews.length) ? 'fill-yellow-500' : ''}`}
                            />
                          ))}
                      </div>
                      <p className='text-sm text-gray-600'>Based on {reviews.reviews.reviews.length} reviews</p>
                    </div>
                  </div>
                  <div>
                    {reviews.rating_distribution && (
                      <div className='space-y-1 min-w-[140px]'>
                        {[5, 4, 3, 2, 1].map((rating) => {
                          const count = reviews.result.rating_distribution[rating] || 0
                          const percentage = reviews.reviews.reviews.length
                            ? Math.round((count / reviews.reviews.reviews.length) * 100)
                            : 0

                          return (
                            <div key={rating} className='flex items-center text-sm'>
                              <div className='w-10 flex items-center'>
                                <span>{rating}</span>
                                <Star className='h-3 w-3 ml-1 fill-yellow-500 text-yellow-500' />
                              </div>
                              <div className='w-full bg-gray-200 rounded-full h-2 ml-2 mr-2'>
                                <div
                                  className='bg-yellow-500 h-2 rounded-full'
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                              <div className='w-8 text-right text-xs text-gray-600'>{count}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Review list */}
                <div className='space-y-6'>
                  {reviews &&
                    reviews.reviews.reviews.map((review: any) => (
                      <div key={review._id} className='border-b pb-6 last:border-0'>
                        <div className='flex justify-between items-start mb-2'>
                          <div className='flex items-center'>
                            <Avatar className='h-8 w-8 mr-2'>
                              <AvatarImage src={review.user?.avatar} />
                              <AvatarFallback>{review.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className='font-medium'>{review.user?.name || 'Anonymous'}</p>
                              <p className='text-xs text-gray-500'>{formatDate(review.created_at)}</p>
                            </div>
                          </div>
                          <div className='flex items-center'>
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-500 text-yellow-500' : 'text-gray-300'}`}
                                />
                              ))}
                          </div>
                        </div>
                        <p className='text-gray-700'>{review.comment}</p>

                        {/* Review images */}
                        {review.images && review.images.length > 0 && (
                          <div className='mt-3 flex flex-wrap gap-2'>
                            {review.images.map((image: string | undefined, i: number) => (
                              <img
                                key={i}
                                src={image}
                                alt={`Review ${i + 1}`}
                                className='h-16 w-16 object-cover rounded border'
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>

                {reviews && reviews.pagination.pagination.totalPages > 1 && (
                  <div className='mt-6 flex justify-center'>
                    <Button variant='outline'>View All Reviews</Button>
                  </div>
                )}
              </div>
            ) : (
              <div className='text-center py-10'>
                <p className='text-gray-500 mb-4'>This product has no reviews yet. Be the first to leave a review!</p>
                <Button>Write a Review</Button>
              </div>
            )}
          </TabsContent>

          {isAuction && (
            <TabsContent value='bids' className='bg-white rounded-lg shadow-sm p-6'>
              <h2 className='text-xl font-semibold mb-4'>Bid History</h2>

              {bids && bids.bids.bids.length > 0 ? (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bidder</TableHead>
                        <TableHead>Bid Amount</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bids.bids.bids.map((bid: any) => (
                        <TableRow key={bid._id}>
                          <TableCell>
                            <div className='flex items-center'>
                              <Avatar className='h-6 w-6 mr-2'>
                                <AvatarImage src={bid.bidder?.avatar} />
                                <AvatarFallback>{bid.bidder?.name?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              {bid.bidder?.name || 'Anonymous'}
                            </div>
                          </TableCell>
                          <TableCell>{formatPrice(bid.amount)}</TableCell>
                          <TableCell>{formatDate(bid.created_at)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='text-center py-8'>
                  <BarChart2 className='h-12 w-12 mx-auto text-gray-300 mb-3' />
                  <p className='text-gray-500 mb-4'>No bids have been placed yet. Be the first to place a bid!</p>
                  <Button onClick={() => setIsBidding(true)}>Place a Bid</Button>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Related products */}
      {relatedProducts && relatedProducts.result.length > 0 && (
        <div className='mt-12'>
          <h2 className='text-xl font-semibold mb-6'>Related Products</h2>

          <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4'>
            {relatedProducts.result.map((product: any) => (
              <Link to={`/products/${product?.result?._id}`} key={product?.result?._id}>
                <Card className='overflow-hidden h-full hover:shadow-md transition-shadow'>
                  <div className='aspect-square overflow-hidden bg-gray-100'>
                    <img
                      src={
                        product?.result?.medias.find((m: { is_primary: any }) => m.is_primary)?.url ||
                        product?.result?.medias[0]?.url
                      }
                      alt={product?.result?.name}
                      className='w-full h-full object-cover'
                    />
                  </div>
                  <CardHeader className='p-3'>
                    <CardTitle className='text-sm truncate'>{product?.result?.name}</CardTitle>
                    <CardDescription className='flex items-center gap-1'>
                      {getConditionBadge(product?.result?.condition)}
                      {product?.result?.free_shipping && (
                        <span className='bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded ml-1'>
                          Free Shipping
                        </span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className='p-3 pt-0 flex justify-between items-center'>
                    <span className='font-semibold'>{formatPrice(product?.result?.price)}</span>
                    {product?.result?.rating && (
                      <span className='flex items-center text-xs text-gray-500'>
                        <Star size={12} className='fill-yellow-500 text-yellow-500 mr-1' />
                        {product?.result?.rating.toFixed(1)}
                      </span>
                    )}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProductDetailSkeleton() {
  return (
    <div className='max-w-7xl mx-auto'>
      <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
        {/* Image skeleton */}
        <div className='lg:col-span-3'>
          <div className='bg-white rounded-lg shadow-sm overflow-hidden'>
            <Skeleton className='aspect-square w-full' />
            <div className='p-4 grid grid-cols-5 gap-2'>
              {Array(5)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} className='aspect-square w-full rounded' />
                ))}
            </div>
          </div>
        </div>

        {/* Info skeleton */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg shadow-sm p-6'>
            <Skeleton className='h-8 w-3/4 mb-4' />
            <div className='flex gap-2 mb-4'>
              <Skeleton className='h-6 w-16 rounded-full' />
              <Skeleton className='h-6 w-24 rounded-full' />
              <Skeleton className='h-6 w-20 rounded-full' />
            </div>

            <Skeleton className='h-10 w-1/3 mb-2' />
            <Skeleton className='h-4 w-1/4 mb-6' />

            <div className='mb-6 p-3 bg-gray-50 rounded-lg'>
              <div className='flex items-center'>
                <Skeleton className='h-10 w-10 rounded-full mr-3' />
                <div>
                  <Skeleton className='h-4 w-32 mb-1' />
                  <Skeleton className='h-3 w-20' />
                </div>
                <Skeleton className='h-9 w-24 ml-auto' />
              </div>
            </div>

            <Skeleton className='h-4 w-3/4 mb-4' />
            <Skeleton className='h-10 w-32 mb-6' />

            <div className='flex gap-2 mb-6'>
              <Skeleton className='h-10 flex-1' />
              <Skeleton className='h-10 flex-1' />
            </div>

            <div className='flex gap-2'>
              <Skeleton className='h-8 flex-1' />
              <Skeleton className='h-8 flex-1' />
              <Skeleton className='h-8 flex-1' />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className='mt-8'>
        <div className='flex gap-2 mb-6'>
          <Skeleton className='h-10 w-24' />
          <Skeleton className='h-10 w-28' />
          <Skeleton className='h-10 w-20' />
          <Skeleton className='h-10 w-24' />
        </div>

        <div className='bg-white rounded-lg shadow-sm p-6'>
          <Skeleton className='h-6 w-48 mb-4' />
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-4 w-full mb-2' />
          <Skeleton className='h-4 w-3/4 mb-2' />
          <Skeleton className='h-4 w-5/6 mb-2' />
          <Skeleton className='h-4 w-full' />
        </div>
      </div>
    </div>
  )
}

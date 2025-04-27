export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken
}

export enum MediaType {
  Image,
  Video,
  HLS
}

export enum MediaTypeQuery {
  Image = 'image',
  Video = 'video'
}

export enum EncodingStatus {
  Pending, //hàng đợi
  Processing, //Đang encode
  Success, // Encode thành công
  Failed // Encode thất bại
}

export enum TweetType {
  Tweet,
  Retweet,
  Comment,
  QuoteTweet
}

export enum TweetAudience {
  Everyone,
  TwitterCircle
}

export enum AccountStatus {
  FREE = 0,
  PREMIUM = 1,
  PLATINUM = 2
}

export enum NotificationStatus {
  Unread,
  Read
}

// New enums for eBay clone
export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

export enum ProductStatus {
  ACTIVE = 'active',
  SOLD_OUT = 'sold_out',
  DRAFT = 'draft',
  HIDDEN = 'hidden',
  DELETED = 'deleted'
}

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  GOOD = 'good',
  FAIR = 'fair',
  POOR = 'poor'
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  RETURNED = 'returned',
  REFUNDED = 'refunded'
}

export enum PaymentMethod {
  PAYPAL = 'paypal',
  COD = 'cod'
}

export enum DisputeStatus {
  PENDING = 'pending',
  UNDER_REVIEW = 'under_review',
  RESOLVED_BUYER = 'resolved_buyer',
  RESOLVED_SELLER = 'resolved_seller',
  CLOSED = 'closed'
}

export enum DisputeReason {
  ITEM_NOT_RECEIVED = 'item_not_received',
  ITEM_NOT_AS_DESCRIBED = 'item_not_as_described',
  DAMAGED_ITEM = 'damaged_item',
  WRONG_ITEM = 'wrong_item',
  RETURN_REQUEST = 'return_request',
  OTHER = 'other'
}

export enum CouponType {
  PERCENTAGE = 'percentage',
  FIXED = 'fixed'
}

export enum CouponApplicability {
  ALL_PRODUCTS = 'all_products',
  SPECIFIC_PRODUCTS = 'specific_products',
  SPECIFIC_CATEGORIES = 'specific_categories'
}

export enum StoreStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  BANNED = 'banned'
}

export enum ActionType {
  // Original action types
  FRIEND_REQUEST = 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED = 'FRIEND_REQUEST_ACCEPTED',
  FRIEND_REQUEST_REJECTED = 'FRIEND_REQUEST_REJECTED',
  FOLLOW = 'FOLLOW',
  UNFOLLOW = 'UNFOLLOW',
  LIKE = 'LIKE',
  UNLIKE = 'UNLIKE',
  COMMENT = 'COMMENT',
  REPLY = 'REPLY',
  TWEET = 'TWEET',
  QUOTE = 'QUOTE',
  MENTION = 'MENTION',
  TAG = 'TAG',
  SHARE = 'SHARE',
  REPORT = 'REPORT',
  BLOCK = 'BLOCK',
  UNBLOCK = 'UNBLOCK',
  MUTE = 'MUTE',
  UNMUTE = 'UNMUTE',
  STORY = 'STORY',
  STORY_REPLY = 'STORY_REPLY',
  BOOKMARK = 'BOOKMARK',
  UNBOOKMARK = 'UNBOOKMARK',

  // New action types for eBay clone
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_PAID = 'ORDER_PAID',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PRODUCT_ADDED = 'PRODUCT_ADDED',
  PRODUCT_UPDATED = 'PRODUCT_UPDATED',
  REVIEW_ADDED = 'REVIEW_ADDED',
  DISPUTE_OPENED = 'DISPUTE_OPENED',
  DISPUTE_UPDATED = 'DISPUTE_UPDATED',
  DISPUTE_RESOLVED = 'DISPUTE_RESOLVED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  PRICE_DROP = 'PRICE_DROP',
  COUPON_CREATED = 'COUPON_CREATED'
}

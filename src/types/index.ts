import type {
  User, Listing, CrmLead, Message, Conversation,
  ConversationMember, Notification, Subscription,
  SubscriptionPlanConfig,
} from '@prisma/client'

// ─── Extended Types ───────────────────────────────────────────────────────────

export type UserPublic = Pick<
  User,
  | 'id' | 'name' | 'avatar' | 'role' | 'verificationStatus'
  | 'companyName' | 'designation' | 'city' | 'state'
  | 'brokerScore' | 'brokerRank' | 'totalDealsClosed'
  | 'referralCode' | 'createdAt'
>

export type UserProfile = UserPublic & {
  _count?: {
    listings: number
    referrals: number
  }
  subscription?: Subscription | null
  badges?: string[]
}

export type ListingCard = Pick<
  Listing,
  | 'id' | 'slug' | 'title' | 'propertyType' | 'dealType'
  | 'area' | 'city' | 'state' | 'price' | 'priceOnRequest'
  | 'sizeSqft' | 'sizeAcres' | 'coverImage' | 'posterUrl'
  | 'viewCount' | 'inquiryCount' | 'isBoosted' | 'status'
  | 'createdAt'
> & {
  user: Pick<User, 'id' | 'name' | 'avatar' | 'verificationStatus' | 'phone'>
  matchScore?: number
}

export type ListingDetail = Listing & {
  user: UserPublic
  _count: { interests: number }
  hasExpressedInterest?: boolean
}

export type ConversationWithLastMessage = Conversation & {
  members: (ConversationMember & { user: UserPublic })[]
  messages: (Message & { sender: UserPublic })[]
  _count: { messages: number }
  unreadCount?: number
}

export type MessageWithSender = Message & {
  sender: UserPublic
  receipts?: { userId: string; readAt: Date | null }[]
}

export type CrmLeadWithDetails = CrmLead & {
  listing?: ListingCard | null
  assignee?: UserPublic | null
  activities?: { action: string; createdAt: Date }[]
}

export type PlanConfig = SubscriptionPlanConfig & {
  _count?: { subscriptions: number }
}

// ─── API Response Types ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

// ─── Auth Types ───────────────────────────────────────────────────────────────

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthUser {
  id: string
  name: string
  phone: string
  role: string
  avatar: string | null
  verificationStatus: string
  dealCreditsUsed: number
  dealCreditsLimit: number
  companyName: string | null
  subscription?: { plan: string; expiresAt: Date | null } | null
}

// ─── Form Types ───────────────────────────────────────────────────────────────

export interface CreateListingInput {
  title: string
  description: string
  propertyType: string
  dealType: string
  area: string
  city: string
  state: string
  pincode?: string
  address?: string
  price?: number
  priceOnRequest?: boolean
  priceNegotiable?: boolean
  sizeSqft?: number
  sizeAcres?: number
  bedrooms?: number
  bathrooms?: number
  amenities?: string[]
  images?: string[]
  coverImage?: string
  latitude?: number
  longitude?: number
}

export interface CreateLeadInput {
  name: string
  phone?: string
  email?: string
  company?: string
  budget?: number
  requirements?: string
  source?: string
  listingId?: string
  notes?: string
}

// ─── Search Filters ───────────────────────────────────────────────────────────

export interface ListingFilters {
  city?: string
  area?: string
  propertyType?: string
  dealType?: string
  priceMin?: number
  priceMax?: number
  sizeMin?: number
  sizeMax?: number
  verifiedOnly?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'match_score'
  page?: number
  limit?: number
}

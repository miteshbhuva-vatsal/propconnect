'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Eye, MessageSquare, Share2, CheckCircle, Star } from 'lucide-react'
import {
  formatIndianPrice, timeAgo, buildWhatsappShareUrl,
  buildPropertyWhatsappMessage, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, cn,
} from '@/lib/utils'
import type { ListingCard } from '@/types'

const DEAL_TYPE_COLORS: Record<string, string> = {
  SALE: 'bg-blue-50 text-blue-700',
  LEASE: 'bg-purple-50 text-purple-700',
  JOINT_VENTURE: 'bg-orange-50 text-orange-700',
  BARTER: 'bg-yellow-50 text-yellow-800',
  DISTRESSED: 'bg-red-50 text-red-700',
  RENTAL: 'bg-gray-100 text-gray-700',
}

interface Props {
  listing: ListingCard
  compact?: boolean
}

export default function PropertyCard({ listing, compact }: Props) {
  const price = listing.price
    ? formatIndianPrice(Number(listing.price))
    : listing.priceOnRequest ? 'Price on Request' : null

  const whatsappUrl = buildWhatsappShareUrl(
    buildPropertyWhatsappMessage({
      title: listing.title,
      city: listing.city,
      price: listing.price ? Number(listing.price) : null,
      size: listing.sizeSqft,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/p/${listing.slug}`,
    })
  )

  return (
    <div className={cn('card overflow-hidden group', compact ? '' : 'card-hover')}>
      <Link href={`/p/${listing.slug}`}>
        {/* Cover image */}
        <div className="relative h-48 bg-gradient-to-br from-wp-teal to-wp-green overflow-hidden">
          {listing.coverImage ? (
            <Image
              src={listing.coverImage}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, 600px"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
          )}

          {/* Boosted badge */}
          {listing.isBoosted && (
            <div className="absolute top-3 left-3 bg-wp-green text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <Star size={10} className="fill-current" />
              Featured
            </div>
          )}

          {/* Match score badge */}
          {listing.matchScore && listing.matchScore >= 80 && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-wp-teal text-xs font-bold px-2.5 py-1 rounded-full">
              {listing.matchScore}% Match
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        {/* Type tags */}
        <div className="flex items-center gap-2 mb-2">
          <span className="tag bg-wp-green/10 text-wp-green-dark text-xs">
            {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
          </span>
          <span className={`tag text-xs ${DEAL_TYPE_COLORS[listing.dealType] || 'bg-gray-100 text-gray-700'}`}>
            {DEAL_TYPE_LABELS[listing.dealType] || listing.dealType}
          </span>
        </div>

        <Link href={`/p/${listing.slug}`}>
          <h3 className="font-semibold text-wp-text text-base line-clamp-2 hover:text-wp-teal transition-colors">
            {listing.title}
          </h3>
        </Link>

        <div className="flex items-center gap-1 text-wp-text-secondary text-sm mt-1">
          <MapPin size={13} />
          <span>{listing.area}, {listing.city}</span>
        </div>

        {/* Price and size */}
        <div className="flex items-baseline gap-3 mt-2">
          {price && (
            <span className="text-wp-green font-bold text-lg">{price}</span>
          )}
          {listing.sizeSqft && (
            <span className="text-wp-text-secondary text-sm">
              {listing.sizeSqft.toLocaleString()} sq ft
            </span>
          )}
          {listing.sizeAcres && (
            <span className="text-wp-text-secondary text-sm">
              {listing.sizeAcres} acres
            </span>
          )}
        </div>

        {/* Broker info */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-wp-border">
          <Link href={`/profile/${listing.user.id}`} className="flex items-center gap-2">
            <div className="w-7 h-7 bg-wp-teal rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {listing.user.name[0]}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-wp-text truncate max-w-[100px]">
                  {listing.user.name}
                </span>
                {listing.user.verificationStatus === 'VERIFIED' && (
                  <CheckCircle size={12} className="text-wp-green flex-shrink-0" />
                )}
              </div>
              <span className="text-xs text-wp-text-secondary">{timeAgo(listing.createdAt)}</span>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            {/* Stats */}
            <div className="flex items-center gap-0.5 text-wp-icon text-xs mr-2">
              <Eye size={12} />
              <span>{listing.viewCount}</span>
            </div>

            {/* WhatsApp share */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="p-2 hover:bg-wp-green/10 rounded-lg transition-colors text-wp-green"
              title="Share on WhatsApp"
            >
              <Share2 size={16} />
            </a>

            {/* Inquire */}
            <Link
              href={`/p/${listing.slug}?inquire=1`}
              className="flex items-center gap-1 bg-wp-green text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageSquare size={12} />
              Inquire
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

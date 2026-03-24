import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import Image from 'next/image'
import Link from 'next/link'
import {
  MapPin, Maximize2, CheckCircle, BedDouble, Bath,
  Building2, Calendar, Award, Eye, MessageSquare, ChevronRight, Home,
  Layers, Leaf, Car, Zap, Shield, Wifi, Dumbbell, Trees, ExternalLink,
} from 'lucide-react'
import { db } from '@/lib/db'
import { formatIndianPrice, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS } from '@/lib/utils'
import ListingGallery from './ListingGallery'
import InquiryFlow from './InquiryFlow'
import TrackingPixel from './TrackingPixel'
import BackButton from './BackButton'

type Props = { params: { slug: string }; searchParams: Record<string, string> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await db.listing.findFirst({
    where: { slug: params.slug, status: 'APPROVED' },
    select: { title: true, description: true, city: true, coverImage: true, price: true, area: true },
  })
  if (!listing) return { title: 'Listing not found' }
  const price = listing.price ? formatIndianPrice(Number(listing.price)) : 'Price on Request'
  return {
    title: `${listing.title} | PropConnect`,
    description: listing.description.slice(0, 160),
    openGraph: {
      title: listing.title,
      description: `${listing.area}, ${listing.city} · ${price}`,
      images: listing.coverImage ? [{ url: listing.coverImage }] : [],
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: listing.title },
  }
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  Parking: <Car size={16} />,
  'Power Backup': <Zap size={16} />,
  Security: <Shield size={16} />,
  CCTV: <Shield size={16} />,
  Lift: <Layers size={16} />,
  'Swimming Pool': <Leaf size={16} />,
  Garden: <Trees size={16} />,
  Gym: <Dumbbell size={16} />,
  WiFi: <Wifi size={16} />,
}

// Converts a Google Maps share URL → embeddable iframe src (no API key needed)
function buildMapEmbedUrl(mapUrl: string): string | null {
  // Format: @lat,lng,ZOOMz  (most share links)
  const atMatch = mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) return `https://maps.google.com/maps?q=${atMatch[1]},${atMatch[2]}&z=15&output=embed`
  // Format: ?q=lat,lng  or  &q=lat,lng
  const qMatch = mapUrl.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (qMatch) return `https://maps.google.com/maps?q=${qMatch[1]},${qMatch[2]}&z=15&output=embed`
  // Format: query=lat,lng
  const queryMatch = mapUrl.match(/[?&]query=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (queryMatch) return `https://maps.google.com/maps?q=${queryMatch[1]},${queryMatch[2]}&z=15&output=embed`
  return null
}

function deviceTypeFromUA(ua: string): string {
  if (/mobile/i.test(ua)) return 'mobile'
  if (/tablet|ipad/i.test(ua)) return 'tablet'
  return 'desktop'
}

export default async function PublicListingPage({ params, searchParams }: Props) {
  const listing = await db.listing.findFirst({
    where: { slug: params.slug, status: 'APPROVED' },
    include: {
      user: {
        select: {
          name: true, phone: true, avatar: true, verificationStatus: true,
          companyName: true, designation: true, brokerScore: true, totalDealsClosed: true,
          brokerBadges: { select: { badgeType: true } },
        },
      },
    },
  })

  if (!listing) notFound()

  // Record page view server-side
  const headersList = headers()
  const ua = headersList.get('user-agent') || ''
  const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const referrer = headersList.get('referer') || ''

  const trackCode = searchParams.tc || null
  const utmSource = searchParams.utm_source || null
  const utmMedium = searchParams.utm_medium || null
  const utmCampaign = searchParams.utm_campaign || null

  // Record in background (fire-and-forget)
  db.listingPageView.create({
    data: {
      listingId: listing.id,
      trackCode,
      utmSource,
      utmMedium,
      utmCampaign,
      referrer: referrer.slice(0, 500),
      ipHash: ip ? Buffer.from(ip).toString('base64').slice(0, 32) : null,
      userAgent: ua.slice(0, 300),
      deviceType: deviceTypeFromUA(ua),
    },
  }).catch(() => null)

  // Increment view count
  db.listing.update({ where: { id: listing.id }, data: { viewCount: { increment: 1 } } }).catch(() => null)

  // Update TrackableLink click if tc param present
  if (trackCode) {
    db.trackableLink.update({
      where: { code: trackCode },
      data: { totalClicks: { increment: 1 }, lastClickAt: new Date() },
    }).catch(() => null)
  }

  // Fetch similar listings
  const similar = await db.listing.findMany({
    where: {
      status: 'APPROVED',
      city: listing.city,
      propertyType: listing.propertyType,
      id: { not: listing.id },
    },
    select: { id: true, slug: true, title: true, price: true, priceOnRequest: true, area: true, sizeSqft: true, bedrooms: true, coverImage: true },
    take: 3,
    orderBy: { createdAt: 'desc' },
  })

  const price = listing.price
    ? formatIndianPrice(Number(listing.price))
    : listing.priceOnRequest ? 'Price on Request' : null

  const whatsappNum = listing.user.phone.replace(/\D/g, '')
  const pageUrl = `https://propconnect.app/p/${listing.slug}`
  const whatsappMsg = encodeURIComponent(
    `Hi ${listing.user.name}, I found your property on PropConnect and I'm interested:\n\n*${listing.title}*\n📍 ${listing.area}, ${listing.city}\n💰 ${price || 'Price on Request'}\n\n${pageUrl}`
  )

  const allImages = [listing.coverImage, ...listing.images].filter(Boolean) as string[]
  const mapEmbedUrl = listing.mapUrl ? buildMapEmbedUrl(listing.mapUrl) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tracking pixel (client-side duration tracking) */}
      <TrackingPixel listingId={listing.id} trackCode={trackCode} />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 text-xs text-gray-500 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-wp-green flex items-center gap-1"><Home size={12} /> Home</Link>
        <ChevronRight size={10} />
        <Link href="/listings" className="hover:text-wp-green">Listings</Link>
        <ChevronRight size={10} />
        <Link href={`/listings?city=${listing.city}`} className="hover:text-wp-green">{listing.city}</Link>
        <ChevronRight size={10} />
        <span className="text-gray-700 font-medium truncate max-w-[180px]">{listing.title}</span>
      </div>

      {/* Photo Gallery with back button */}
      <div className="relative">
        <BackButton />
        <ListingGallery images={allImages} title={listing.title} />
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4 pb-32">
        {/* Title block */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-2 flex-wrap">
            <span className="tag bg-wp-teal/10 text-wp-teal text-xs">
              {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
            </span>
            <span className="tag bg-blue-50 text-blue-700 text-xs">
              {DEAL_TYPE_LABELS[listing.dealType] || listing.dealType}
            </span>
            {listing.isBoosted && (
              <span className="tag bg-yellow-50 text-yellow-700 text-xs flex items-center gap-1">
                <Award size={11} /> Featured
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-wp-text mt-2 leading-snug">{listing.title}</h1>
          <div className="flex items-center gap-1.5 text-wp-text-secondary text-sm mt-1.5">
            <MapPin size={14} className="text-wp-teal flex-shrink-0" />
            <span>{listing.area}, {listing.city}, {listing.state}</span>
          </div>
          {price && (
            <p className="text-wp-green text-2xl font-bold mt-3">
              {price}
              {listing.priceNegotiable && (
                <span className="text-sm font-normal text-wp-text-secondary ml-2">· Negotiable</span>
              )}
            </p>
          )}

          {/* Spec chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {listing.sizeSqft && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <Maximize2 size={13} className="text-wp-teal" />
                <span className="font-semibold">{listing.sizeSqft.toLocaleString()}</span>
                <span className="text-wp-text-secondary text-xs">sq ft</span>
              </div>
            )}
            {listing.sizeAcres && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <Maximize2 size={13} className="text-wp-teal" />
                <span className="font-semibold">{listing.sizeAcres}</span>
                <span className="text-wp-text-secondary text-xs">acres</span>
              </div>
            )}
            {listing.bedrooms && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <BedDouble size={13} className="text-wp-teal" />
                <span className="font-semibold">{listing.bedrooms} BHK</span>
              </div>
            )}
            {listing.bathrooms && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <Bath size={13} className="text-wp-teal" />
                <span className="font-semibold">{listing.bathrooms} Bath</span>
              </div>
            )}
            {listing.facing && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <span className="text-wp-text-secondary text-xs">{listing.facing} Facing</span>
              </div>
            )}
            {listing.floors && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-sm">
                <Building2 size={13} className="text-wp-teal" />
                <span className="font-semibold">{listing.floors} Floors</span>
              </div>
            )}
          </div>

          {/* Engagement stats */}
          <div className="flex items-center gap-4 mt-3 text-xs text-wp-text-secondary">
            <span className="flex items-center gap-1"><Eye size={12} /> {listing.viewCount} views</span>
            <span className="flex items-center gap-1"><MessageSquare size={12} /> {listing.inquiryCount} inquiries</span>
            {listing.ageYears !== null && listing.ageYears !== undefined && (
              <span className="flex items-center gap-1"><Calendar size={12} /> {listing.ageYears === 0 ? 'New Construction' : `${listing.ageYears} yr old`}</span>
            )}
          </div>
        </div>

        {/* About */}
        {listing.description && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-wp-text mb-2 text-sm">About this Property</h2>
            <p className="text-wp-text-secondary text-sm leading-relaxed">{listing.description}</p>
          </div>
        )}

        {/* Amenities */}
        {listing.amenities.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-wp-text mb-3 text-sm">Amenities & Features</h2>
            <div className="grid grid-cols-2 gap-2">
              {listing.amenities.map(a => (
                <div key={a} className="flex items-center gap-2 bg-wp-green/5 rounded-xl px-3 py-2 text-sm text-wp-text">
                  <span className="text-wp-teal">{AMENITY_ICONS[a] || <CheckCircle size={14} />}</span>
                  {a}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location Map */}
        {listing.mapUrl && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <h2 className="font-bold text-wp-text text-sm flex items-center gap-1.5">
                <MapPin size={14} className="text-wp-teal" /> Location
              </h2>
              <a
                href={listing.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-wp-teal font-medium hover:underline flex items-center gap-1"
              >
                Open in Google Maps <ExternalLink size={11} />
              </a>
            </div>
            <p className="text-xs text-wp-text-secondary px-4 pb-2">{listing.area}, {listing.city}</p>
            {mapEmbedUrl ? (
              <iframe
                src={mapEmbedUrl}
                className="w-full h-52 border-0"
                loading="lazy"
                title="Property location map"
              />
            ) : (
              <div className="px-4 pb-4">
                <a
                  href={listing.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-wp-teal/10 text-wp-teal text-sm font-medium py-3 rounded-xl hover:bg-wp-teal/20 transition-colors"
                >
                  <MapPin size={16} /> View Property Location on Google Maps
                </a>
              </div>
            )}
          </div>
        )}

        {/* Expected returns (for investment listings) */}
        {listing.expectedReturns && (
          <div className="bg-wp-green/5 border border-wp-green/20 rounded-2xl p-4">
            <h2 className="font-bold text-wp-text mb-1 text-sm flex items-center gap-1.5">
              <Award size={14} className="text-wp-green" /> Expected Returns
            </h2>
            <p className="text-sm text-wp-text-secondary">{listing.expectedReturns}</p>
          </div>
        )}

        {/* Broker/Agent card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-bold text-wp-text mb-3 text-sm">Listed by</h2>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-wp-teal to-wp-green rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow">
              {listing.user.avatar ? (
                <Image src={listing.user.avatar} alt={listing.user.name} width={56} height={56} className="rounded-full object-cover" />
              ) : (
                listing.user.name[0]
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-semibold text-wp-text">{listing.user.name}</p>
                {listing.user.verificationStatus === 'VERIFIED' && (
                  <CheckCircle size={15} className="text-wp-green flex-shrink-0" />
                )}
                {listing.user.brokerBadges?.map(b => (
                  <span key={b.badgeType} className="tag bg-yellow-50 text-yellow-700 text-[10px] py-0.5">{b.badgeType.replace(/_/g, ' ')}</span>
                ))}
              </div>
              <p className="text-xs text-wp-text-secondary">
                {listing.user.designation || 'Real Estate Professional'}
                {listing.user.companyName && ` · ${listing.user.companyName}`}
              </p>
              {(listing.user.brokerScore || listing.user.totalDealsClosed) && (
                <div className="flex items-center gap-3 mt-1 text-xs text-wp-text-secondary">
                  {listing.user.brokerScore ? <span>⭐ Score {listing.user.brokerScore}</span> : null}
                  {listing.user.totalDealsClosed ? <span>✅ {listing.user.totalDealsClosed} deals closed</span> : null}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inquiry flow — pre-fills user info, hides contact until submitted */}
        <InquiryFlow
          listingId={listing.id}
          listingTitle={listing.title}
          brokerPhone={listing.user.phone}
          whatsappUrl={`https://wa.me/${whatsappNum}?text=${whatsappMsg}`}
          pageUrl={pageUrl}
          autoFocus={!!searchParams.inquire}
          brochureUrl={listing.brochureUrl ?? null}
        />

        {/* Similar properties */}
        {similar.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-wp-text mb-3 text-sm">Similar Properties</h2>
            <div className="space-y-3">
              {similar.map(s => (
                <Link key={s.id} href={`/p/${s.slug}`} className="flex gap-3 hover:bg-gray-50 rounded-xl p-2 -mx-2 transition-colors">
                  <div className="w-20 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {s.coverImage ? (
                      <Image src={s.coverImage} alt={s.title} width={80} height={64} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-wp-text line-clamp-2">{s.title}</p>
                    <p className="text-xs text-wp-text-secondary mt-0.5">{s.area}</p>
                    <p className="text-xs text-wp-green font-semibold mt-0.5">
                      {s.price ? formatIndianPrice(Number(s.price)) : 'Price on Request'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Attribution */}
        <div className="text-center text-xs text-wp-text-secondary py-2">
          Listed on{' '}
          <Link href="/" className="text-wp-green font-semibold hover:underline">PropConnect</Link>
          {' '}· Verified Real Estate Platform
        </div>
      </div>

    </div>
  )
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess, generateSlug } from '@/lib/utils'
import { checkAndIncrementDealCredit } from '@/lib/auth'

const createSchema = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  propertyType: z.enum([
    'APARTMENT','VILLA','BUNGALOW','FARMHOUSE','WEEKEND_HOME',
    'LAND','FARMLAND','INDUSTRIAL_LAND','WAREHOUSE','GODOWN',
    'OFFICE_SPACE','BARTER_DEAL','JV_LAND',
  ]),
  dealType: z.enum(['SALE','LEASE','JOINT_VENTURE','BARTER','DISTRESSED','RENTAL']),
  area: z.string().min(2),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().optional(),
  address: z.string().optional(),
  price: z.number().positive().optional(),
  priceOnRequest: z.boolean().optional(),
  priceNegotiable: z.boolean().optional(),
  sizeSqft: z.number().positive().optional(),
  sizeAcres: z.number().positive().optional(),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().int().min(0).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  coverImage: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

// GET /api/listings — list with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const skip = (page - 1) * limit

  const city = searchParams.get('city')
  const area = searchParams.get('area')
  const propertyType = searchParams.get('propertyType')
  const dealType = searchParams.get('dealType')
  const priceMin = searchParams.get('priceMin')
  const priceMax = searchParams.get('priceMax')
  const verifiedOnly = searchParams.get('verifiedOnly') === 'true'
  const sortBy = searchParams.get('sortBy') || 'newest'
  const query = searchParams.get('q')

  const where: Record<string, unknown> = {
    status: 'APPROVED',
    expiresAt: { gt: new Date() },
  }

  if (city) where.city = { contains: city, mode: 'insensitive' }
  if (area) where.area = { contains: area, mode: 'insensitive' }
  if (propertyType) where.propertyType = propertyType
  if (dealType) where.dealType = dealType
  if (priceMin || priceMax) {
    where.price = {
      ...(priceMin ? { gte: BigInt(priceMin) } : {}),
      ...(priceMax ? { lte: BigInt(priceMax) } : {}),
    }
  }
  if (verifiedOnly) {
    where.user = { verificationStatus: 'VERIFIED' }
  }
  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { area: { contains: query, mode: 'insensitive' } },
      { city: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ]
  }

  const orderBy: Record<string, string> =
    sortBy === 'price_asc' ? { price: 'asc' }
    : sortBy === 'price_desc' ? { price: 'desc' }
    : { createdAt: 'desc' }

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ isBoosted: 'desc' }, orderBy],
      select: {
        id: true, slug: true, title: true, propertyType: true, dealType: true,
        area: true, city: true, state: true, price: true, priceOnRequest: true,
        sizeSqft: true, sizeAcres: true, coverImage: true, posterUrl: true,
        viewCount: true, inquiryCount: true, isBoosted: true, status: true,
        createdAt: true,
        user: {
          select: {
            id: true, name: true, avatar: true, verificationStatus: true, phone: true,
          },
        },
      },
    }),
    db.listing.count({ where }),
  ])

  // Serialize BigInt
  const serialized = listings.map(l => ({
    ...l,
    price: l.price ? l.price.toString() : null,
  }))

  return NextResponse.json(
    apiSuccess({ data: serialized, total, page, limit, hasMore: skip + limit < total })
  )
}

// POST /api/listings — create listing
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  try {
    const body = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        apiError('Validation failed', 'VALIDATION_ERROR'),
        { status: 400 }
      )
    }

    // Check deal credits (only for non-admin)
    if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
      const creditCheck = await checkAndIncrementDealCredit(userId)
      if (!creditCheck.allowed) {
        return NextResponse.json(
          apiError('Deal credit limit reached. Upgrade your plan.', 'CREDIT_LIMIT'),
          { status: 402 }
        )
      }
    }

    const { price, ...rest } = parsed.data

    // Developers need admin approval; brokers/investors publish directly
    const requiresApproval = userRole === 'DEVELOPER'

    const listing = await db.listing.create({
      data: {
        ...rest,
        price: price ? BigInt(price) : undefined,
        userId,
        status: requiresApproval ? 'PENDING_REVIEW' : 'APPROVED',
        slug: 'temp', // updated below
      },
    })

    // Generate slug after we have the ID
    const slug = generateSlug(rest.title, listing.id)
    const updated = await db.listing.update({
      where: { id: listing.id },
      data: { slug },
    })

    // Increment user listing count
    await db.user.update({
      where: { id: userId },
      data: { totalDealsPosted: { increment: 1 } },
    })

    return NextResponse.json(
      apiSuccess({ ...updated, price: updated.price?.toString() ?? null },
      requiresApproval ? 'Listing submitted for review' : 'Listing published'),
      { status: 201 }
    )
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json(apiError('Failed to create listing'), { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

type Params = { params: { id: string } }

// GET /api/listings/:id
export async function GET(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')

  const listing = await db.listing.findFirst({
    where: {
      OR: [{ id: params.id }, { slug: params.id }],
      status: 'APPROVED',
    },
    include: {
      user: {
        select: {
          id: true, name: true, avatar: true, verificationStatus: true,
          companyName: true, designation: true, phone: true, city: true,
          brokerScore: true, totalDealsClosed: true,
        },
      },
      _count: { select: { interests: true } },
    },
  })

  if (!listing) {
    return NextResponse.json(apiError('Listing not found'), { status: 404 })
  }

  // Increment view count (async, non-blocking)
  db.listing.update({
    where: { id: listing.id },
    data: { viewCount: { increment: 1 } },
  }).catch(() => null)

  // Check if current user expressed interest
  let hasExpressedInterest = false
  if (userId) {
    const interest = await db.interest.findUnique({
      where: { listingId_userId: { listingId: listing.id, userId } },
    })
    hasExpressedInterest = !!interest

    // Log activity
    db.activity.create({
      data: { userId, listingId: listing.id, action: 'viewed_listing' },
    }).catch(() => null)
  }

  return NextResponse.json(
    apiSuccess({
      ...listing,
      price: listing.price?.toString() ?? null,
      hasExpressedInterest,
    })
  )
}

// PATCH /api/listings/:id
export async function PATCH(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const listing = await db.listing.findUnique({ where: { id: params.id } })
  if (!listing) return NextResponse.json(apiError('Not found'), { status: 404 })

  const isOwner = listing.userId === userId
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')

  if (!isOwner && !isAdmin) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  const body = await request.json()
  const { price, ...rest } = body

  const updated = await db.listing.update({
    where: { id: params.id },
    data: {
      ...rest,
      ...(price !== undefined ? { price: BigInt(price) } : {}),
    },
  })

  return NextResponse.json(apiSuccess({ ...updated, price: updated.price?.toString() ?? null }))
}

// DELETE /api/listings/:id
export async function DELETE(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const listing = await db.listing.findUnique({ where: { id: params.id } })
  if (!listing) return NextResponse.json(apiError('Not found'), { status: 404 })

  const isOwner = listing.userId === userId
  const isAdmin = ['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')

  if (!isOwner && !isAdmin) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  await db.listing.delete({ where: { id: params.id } })
  return NextResponse.json(apiSuccess(null, 'Listing deleted'))
}

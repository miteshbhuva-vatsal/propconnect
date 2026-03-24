export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

// GET /api/admin/listings — all listings including pending
export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit

  const where = status ? { status: status as never } : {}

  const [listings, total] = await Promise.all([
    db.listing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, avatar: true, verificationStatus: true, role: true } },
      },
    }),
    db.listing.count({ where }),
  ])

  const serialized = listings.map(l => ({
    ...l,
    price: l.price?.toString() ?? null,
  }))

  return NextResponse.json(apiSuccess({ data: serialized, total, page, limit }))
}

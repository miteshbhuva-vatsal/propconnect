export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

// GET /api/users/me
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, phone: true, email: true, avatar: true,
      role: true, verificationStatus: true, companyName: true,
      designation: true, city: true, state: true, bio: true,
      reraNumber: true, gstNumber: true, website: true,
      dealCreditsUsed: true, dealCreditsLimit: true,
      totalDealsPosted: true, totalDealsClosed: true,
      referralCode: true, brokerScore: true, brokerRank: true,
      createdAt: true, lastActiveAt: true,
      preferredPropertyTypes: true, preferredLocations: true,
      preferredPriceMin: true, preferredPriceMax: true, preferredDealTypes: true,
      subscription: { select: { plan: true, expiresAt: true, dealCreditsUsed: true, dealCreditsTotal: true } },
      _count: { select: { listings: true, referrals: true } },
      brokerBadges: { select: { badgeType: true } },
    },
  })

  if (!user) return NextResponse.json(apiError('User not found'), { status: 404 })

  return NextResponse.json(
    apiSuccess({
      ...user,
      badges: user.brokerBadges.map(b => b.badgeType),
      brokerBadges: undefined,
      preferredPriceMin: user.preferredPriceMin ? Number(user.preferredPriceMin) : null,
      preferredPriceMax: user.preferredPriceMax ? Number(user.preferredPriceMax) : null,
    })
  )
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  reraNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['DEVELOPER', 'INVESTOR', 'BROKER']).optional(),
  preferredPropertyTypes: z.array(z.string()).optional(),
  preferredDealTypes: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredPriceMin: z.number().nullable().optional(),
  preferredPriceMax: z.number().nullable().optional(),
})

// PATCH /api/users/me
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid data'), { status: 400 })

  const { preferredPriceMin, preferredPriceMax, preferredPropertyTypes, preferredDealTypes, ...rest } = parsed.data

  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...rest,
      ...(preferredPropertyTypes !== undefined ? { preferredPropertyTypes: { set: preferredPropertyTypes as any[] } } : {}),
      ...(preferredDealTypes !== undefined ? { preferredDealTypes: { set: preferredDealTypes as any[] } } : {}),
      ...(preferredPriceMin !== undefined ? { preferredPriceMin: preferredPriceMin ? BigInt(preferredPriceMin) : null } : {}),
      ...(preferredPriceMax !== undefined ? { preferredPriceMax: preferredPriceMax ? BigInt(preferredPriceMax) : null } : {}),
    },
    select: {
      id: true, name: true, role: true, companyName: true,
      designation: true, city: true, bio: true, website: true,
    },
  })

  // Update localStorage cache key so client reflects new name
  return NextResponse.json(apiSuccess(user, 'Profile updated'))
}

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const user = await db.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, phone: true, avatar: true, role: true,
      verificationStatus: true, companyName: true, designation: true,
      city: true, state: true, bio: true, website: true,
      reraNumber: true, brokerScore: true, brokerRank: true,
      totalDealsPosted: true, totalDealsClosed: true, createdAt: true,
      _count: { select: { listings: true, referrals: true } },
      brokerBadges: { select: { badgeType: true } },
      listings: {
        where: { status: 'APPROVED', expiresAt: { gt: new Date() } },
        take: 12,
        orderBy: [{ isBoosted: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true, slug: true, title: true, propertyType: true, dealType: true,
          area: true, city: true, state: true, price: true, priceOnRequest: true,
          sizeSqft: true, sizeAcres: true, coverImage: true, posterUrl: true,
          viewCount: true, inquiryCount: true, isBoosted: true, status: true, createdAt: true,
        },
      },
    },
  })

  if (!user) return NextResponse.json(apiError('User not found'), { status: 404 })

  const { brokerBadges, listings, ...rest } = user

  return NextResponse.json(apiSuccess({
    ...rest,
    badges: brokerBadges.map(b => b.badgeType),
    listings: listings.map(l => ({
      ...l,
      price: l.price ? l.price.toString() : null,
      user: {
        id: user.id, name: user.name, avatar: user.avatar,
        verificationStatus: user.verificationStatus, phone: user.phone,
      },
    })),
  }))
}

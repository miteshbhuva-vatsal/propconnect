export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city') || ''

  const projects = await db.project.findMany({
    where: {
      isActive: true,
      ...(city ? { city: { contains: city, mode: 'insensitive' } } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 10,
    select: {
      id: true, slug: true, title: true, developerName: true,
      city: true, state: true, area: true,
      propertyTypes: true, priceFrom: true, priceTo: true,
      totalUnits: true, availableUnits: true, possessionDate: true,
      coverImage: true, isSponsored: true,
    },
  })

  const serialized = projects.map(p => ({
    ...p,
    priceFrom: p.priceFrom?.toString() ?? null,
    priceTo: p.priceTo?.toString() ?? null,
  }))

  return NextResponse.json(apiSuccess(serialized))
}

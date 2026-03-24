export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiSuccess, apiError, generateSlug } from '@/lib/utils'

const schema = z.object({
  title: z.string().min(3),
  developerName: z.string().min(2),
  description: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  area: z.string().optional(),
  propertyTypes: z.array(z.string()).default([]),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional(),
  totalUnits: z.number().int().optional(),
  availableUnits: z.number().int().optional(),
  possessionDate: z.string().optional(),
  reraNumber: z.string().optional(),
  coverImage: z.string().url().optional(),
  images: z.array(z.string()).default([]),
  brochureUrl: z.string().url().optional(),
  isSponsored: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
  sponsoredUntil: z.string().datetime().optional(),
})

export async function GET(request: NextRequest) {
  const role = request.headers.get('x-user-role')
  if (!role || !['SUPER_ADMIN', 'ADMIN'].includes(role)) {
    return NextResponse.json(apiError('Unauthorized'), { status: 403 })
  }

  const projects = await db.project.findMany({
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, slug: true, title: true, developerName: true,
      city: true, state: true, isActive: true, isSponsored: true,
      sortOrder: true, viewCount: true, inquiryCount: true,
      priceFrom: true, priceTo: true, createdAt: true,
    },
  })

  return NextResponse.json(apiSuccess(
    projects.map(p => ({ ...p, priceFrom: p.priceFrom?.toString(), priceTo: p.priceTo?.toString() }))
  ))
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  const role = request.headers.get('x-user-role')
  if (!userId || role !== 'SUPER_ADMIN') {
    return NextResponse.json(apiError('Only super admin can create projects'), { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(apiError('Invalid input'), { status: 400 })
  }

  const d = parsed.data
  const slug = generateSlug(d.title, crypto.randomUUID())

  const project = await db.project.create({
    data: {
      slug,
      title: d.title,
      developerName: d.developerName,
      description: d.description,
      city: d.city,
      state: d.state,
      area: d.area,
      propertyTypes: d.propertyTypes,
      priceFrom: d.priceFrom ? BigInt(d.priceFrom) : null,
      priceTo: d.priceTo ? BigInt(d.priceTo) : null,
      totalUnits: d.totalUnits,
      availableUnits: d.availableUnits,
      possessionDate: d.possessionDate,
      reraNumber: d.reraNumber,
      coverImage: d.coverImage,
      images: d.images,
      brochureUrl: d.brochureUrl,
      isSponsored: d.isSponsored,
      isActive: d.isActive,
      sortOrder: d.sortOrder,
      sponsoredUntil: d.sponsoredUntil ? new Date(d.sponsoredUntil) : null,
      createdById: userId,
    },
  })

  return NextResponse.json(apiSuccess({ id: project.id, slug: project.slug }), { status: 201 })
}

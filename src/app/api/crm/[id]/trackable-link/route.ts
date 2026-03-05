import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

const schema = z.object({
  listingId: z.string().optional(),
  label: z.string().optional(),
})

// POST /api/crm/:id/trackable-link — generate a trackable link for a lead
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const lead = await db.crmLead.findUnique({ where: { id: params.id } })
  if (!lead || lead.ownerId !== userId) {
    return NextResponse.json(apiError('Lead not found'), { status: 404 })
  }

  const body = await request.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  const listingId = parsed.success ? parsed.data.listingId : lead.listingId ?? undefined
  const label = parsed.success ? parsed.data.label : undefined

  const link = await db.trackableLink.create({
    data: {
      listingId: listingId ?? lead.listingId,
      leadId: lead.id,
      createdById: userId,
      label: label || `Link for ${lead.name}`,
    },
  })

  const trackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/t/${link.code}`

  return NextResponse.json(apiSuccess({ id: link.id, code: link.code, url: trackUrl }), { status: 201 })
}

// GET /api/crm/:id/trackable-link — get all trackable links + analytics for a lead
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const lead = await db.crmLead.findUnique({ where: { id: params.id } })
  if (!lead || lead.ownerId !== userId) {
    return NextResponse.json(apiError('Lead not found'), { status: 404 })
  }

  const links = await db.trackableLink.findMany({
    where: { leadId: params.id },
    include: {
      listing: { select: { title: true, slug: true } },
      clicks: { orderBy: { createdAt: 'desc' }, take: 5, select: { createdAt: true, userAgent: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  return NextResponse.json(apiSuccess(
    links.map(l => ({
      id: l.id,
      code: l.code,
      url: `${appUrl}/t/${l.code}`,
      label: l.label,
      listing: l.listing,
      totalClicks: l.totalClicks,
      uniqueVisitors: l.uniqueIps.length,
      lastClickAt: l.lastClickAt,
      createdAt: l.createdAt,
      recentClicks: l.clicks,
    }))
  ))
}

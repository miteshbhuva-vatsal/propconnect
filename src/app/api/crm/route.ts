export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

const createLeadSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  company: z.string().optional(),
  budget: z.number().positive().optional(),
  requirements: z.string().optional(),
  source: z.enum(['ORGANIC','REFERRAL','WHATSAPP_SHARE','DIRECT','LANDING_PAGE','ADMIN']).optional(),
  listingId: z.string().uuid().optional(),
  notes: z.string().optional(),
  assigneeId: z.string().uuid().optional(),
})

// GET /api/crm — get leads for current user
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const assigneeId = searchParams.get('assigneeId')

  const leads = await db.crmLead.findMany({
    where: {
      ownerId: userId,
      ...(status ? { status: status as never } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    include: {
      listing: {
        select: {
          id: true, slug: true, title: true, propertyType: true,
          city: true, price: true, coverImage: true,
        },
      },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const serialized = leads.map(l => ({
    ...l,
    budget: l.budget?.toString() ?? null,
    dealValue: l.dealValue?.toString() ?? null,
    listing: l.listing ? {
      ...l.listing,
      price: l.listing.price?.toString() ?? null,
    } : null,
  }))

  // Group by status for kanban view
  const grouped = {
    NEW: serialized.filter(l => l.status === 'NEW'),
    CONTACTED: serialized.filter(l => l.status === 'CONTACTED'),
    QUALIFIED: serialized.filter(l => l.status === 'QUALIFIED'),
    SITE_VISIT: serialized.filter(l => l.status === 'SITE_VISIT'),
    NEGOTIATION: serialized.filter(l => l.status === 'NEGOTIATION'),
    LOI_SIGNED: serialized.filter(l => l.status === 'LOI_SIGNED'),
    CLOSED: serialized.filter(l => l.status === 'CLOSED'),
    LOST: serialized.filter(l => l.status === 'LOST'),
  }

  return NextResponse.json(apiSuccess({ leads: serialized, grouped }))
}

// POST /api/crm — create lead
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const body = await request.json()
  const parsed = createLeadSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid data'), { status: 400 })

  const { budget, ...rest } = parsed.data
  const lead = await db.crmLead.create({
    data: {
      ...rest,
      budget: budget ? BigInt(budget) : undefined,
      ownerId: userId,
    },
  })

  // Log activity
  await db.activity.create({
    data: { userId, leadId: lead.id, action: 'lead_created' },
  })

  return NextResponse.json(
    apiSuccess({ ...lead, budget: lead.budget?.toString() ?? null }),
    { status: 201 }
  )
}

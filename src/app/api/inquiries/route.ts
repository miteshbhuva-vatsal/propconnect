export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

const schema = z.object({
  listingId: z.string(),
  name: z.string().min(2),
  phone: z.string().min(10),
  message: z.string().optional(),
  source: z.string().default('LANDING_PAGE'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(apiError('Invalid input'), { status: 400 })
    }

    const { listingId, name, phone, message, source } = parsed.data

    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true, userId: true },
    })

    if (!listing) {
      return NextResponse.json(apiError('Listing not found'), { status: 404 })
    }

    // Create CRM lead for the listing owner
    await db.crmLead.create({
      data: {
        ownerId: listing.userId,
        listingId: listing.id,
        name,
        phone,
        notes: message,
        source: 'LANDING_PAGE',
        status: 'NEW',
      },
    })

    // Increment inquiry count
    await db.listing.update({
      where: { id: listingId },
      data: { inquiryCount: { increment: 1 } },
    })

    return NextResponse.json(apiSuccess(null, 'Inquiry sent'))
  } catch (error) {
    console.error('Inquiry error:', error)
    return NextResponse.json(apiError('Failed to send inquiry'), { status: 500 })
  }
}

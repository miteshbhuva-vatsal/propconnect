export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

const schema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

// POST /api/admin/listings/:id/approve
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.headers.get('x-user-id')
  const userRole = request.headers.get('x-user-role')

  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid action'), { status: 400 })

  const listing = await db.listing.findUnique({
    where: { id: params.id },
    include: { user: { select: { id: true } } },
  })

  if (!listing) return NextResponse.json(apiError('Listing not found'), { status: 404 })

  const { action, reason } = parsed.data
  const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED'

  const updated = await db.listing.update({
    where: { id: params.id },
    data: {
      status: newStatus,
      approvedById: action === 'approve' ? userId : undefined,
      approvedAt: action === 'approve' ? new Date() : undefined,
      rejectionReason: action === 'reject' ? reason : undefined,
    },
  })

  // Create notification for listing owner
  await db.notification.create({
    data: {
      userId: listing.user.id,
      type: action === 'approve' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      title: action === 'approve' ? 'Listing Approved!' : 'Listing Rejected',
      body: action === 'approve'
        ? `Your listing "${listing.title}" is now live.`
        : `Your listing "${listing.title}" was rejected. ${reason ? `Reason: ${reason}` : ''}`,
      data: { listingId: listing.id },
    },
  })

  return NextResponse.json(apiSuccess(updated, `Listing ${action}d successfully`))
}

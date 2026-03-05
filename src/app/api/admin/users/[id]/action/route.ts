import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { revokeAllUserTokens } from '@/lib/auth'
import { apiError, apiSuccess } from '@/lib/utils'

const schema = z.object({
  action: z.enum(['suspend', 'activate', 'verify', 'reject_kyc', 'reset_credits']),
  reason: z.string().optional(),
  dealCreditsLimit: z.number().int().min(0).optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userRole = request.headers.get('x-user-role')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid action'), { status: 400 })

  const { action, reason, dealCreditsLimit } = parsed.data

  let updateData: Record<string, unknown> = {}
  let message = ''

  switch (action) {
    case 'suspend':
      updateData = { isSuspended: true, isActive: false, suspendedReason: reason }
      message = 'User suspended'
      // Revoke all active sessions
      await revokeAllUserTokens(params.id)
      break

    case 'activate':
      updateData = { isSuspended: false, isActive: true, suspendedReason: null }
      message = 'User activated'
      break

    case 'verify':
      updateData = { verificationStatus: 'VERIFIED' }
      message = 'User verified'
      await db.notification.create({
        data: {
          userId: params.id,
          type: 'GENERAL',
          title: 'Account Verified!',
          body: 'Your account has been verified. You now have a verified badge.',
        },
      })
      break

    case 'reject_kyc':
      updateData = { verificationStatus: 'REJECTED' }
      message = 'KYC rejected'
      break

    case 'reset_credits':
      updateData = {
        dealCreditsUsed: 0,
        ...(dealCreditsLimit !== undefined ? { dealCreditsLimit } : {}),
      }
      message = 'Credits reset'
      break
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: updateData,
  })

  return NextResponse.json(apiSuccess({ userId: user.id, action }, message))
}

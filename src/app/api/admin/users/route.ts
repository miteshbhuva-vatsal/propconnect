import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const skip = (page - 1) * limit
  const role = searchParams.get('role')
  const status = searchParams.get('status') // active | suspended
  const q = searchParams.get('q')

  const where: Record<string, unknown> = {}
  if (role) where.role = role
  if (status === 'suspended') where.isSuspended = true
  if (status === 'active') where.isSuspended = false
  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { companyName: { contains: q, mode: 'insensitive' } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, avatar: true, role: true, phone: true,
        email: true, companyName: true, verificationStatus: true,
        isActive: true, isSuspended: true, dealCreditsUsed: true,
        dealCreditsLimit: true, totalDealsPosted: true, totalDealsClosed: true,
        createdAt: true, lastActiveAt: true,
        subscription: { select: { plan: true, expiresAt: true, dealCreditsUsed: true } },
        _count: { select: { listings: true, referrals: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json(apiSuccess({ data: users, total, page, limit }))
}

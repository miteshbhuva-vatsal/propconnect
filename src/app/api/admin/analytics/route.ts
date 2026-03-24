export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

// GET /api/admin/analytics — dashboard analytics
export async function GET(request: NextRequest) {
  const userRole = request.headers.get('x-user-role')
  if (!['SUPER_ADMIN', 'ADMIN'].includes(userRole || '')) {
    return NextResponse.json(apiError('Forbidden'), { status: 403 })
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalUsers,
    activeUsers30d,
    totalListings,
    pendingListings,
    approvedListings,
    totalLeads,
    closedLeads,
    paidSubscriptions,
    usersByRole,
    listingsByType,
    recentSignups,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { lastActiveAt: { gte: thirtyDaysAgo } } }),
    db.listing.count(),
    db.listing.count({ where: { status: 'PENDING_REVIEW' } }),
    db.listing.count({ where: { status: 'APPROVED' } }),
    db.crmLead.count(),
    db.crmLead.count({ where: { status: 'CLOSED' } }),
    db.subscription.count({ where: { plan: { not: 'FREE' }, isActive: true } }),
    db.user.groupBy({ by: ['role'], _count: true }),
    db.listing.groupBy({ by: ['propertyType'], _count: true, where: { status: 'APPROVED' } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
  ])

  return NextResponse.json(
    apiSuccess({
      users: {
        total: totalUsers,
        active30d: activeUsers30d,
        newLast7d: recentSignups,
        byRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: r._count }), {}),
      },
      listings: {
        total: totalListings,
        pending: pendingListings,
        approved: approvedListings,
        byType: listingsByType.reduce((acc, r) => ({ ...acc, [r.propertyType]: r._count }), {}),
      },
      crm: {
        totalLeads,
        closedLeads,
        conversionRate: totalLeads > 0 ? ((closedLeads / totalLeads) * 100).toFixed(1) : '0',
      },
      revenue: {
        paidSubscriptions,
      },
    })
  )
}

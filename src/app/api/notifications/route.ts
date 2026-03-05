import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

// GET /api/notifications — list notifications for current user
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 60,
    }),
    db.notification.count({
      where: { userId, isRead: false },
    }),
  ])

  return NextResponse.json(apiSuccess({ notifications, unreadCount }))
}

// PATCH /api/notifications — mark all (or specific ids) as read
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const body = await request.json().catch(() => ({}))
  const ids: string[] | undefined = body.ids

  await db.notification.updateMany({
    where: {
      userId,
      isRead: false,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { isRead: true, readAt: new Date() },
  })

  return NextResponse.json(apiSuccess(null, 'Marked as read'))
}

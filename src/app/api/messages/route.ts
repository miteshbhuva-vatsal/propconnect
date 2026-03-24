export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

// GET /api/messages — list conversations for current user
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const conversations = await db.conversation.findMany({
    where: {
      members: { some: { userId } },
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true, name: true, avatar: true, verificationStatus: true,
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          id: true, messageType: true, plaintext: true, mediaUrl: true,
          createdAt: true, senderId: true,
        },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
  })

  // Compute unread count per conversation
  const withUnread = await Promise.all(
    conversations.map(async conv => {
      const member = conv.members.find(m => m.userId === userId)
      const lastReadAt = member?.lastReadAt

      const unreadCount = lastReadAt
        ? await db.message.count({
            where: {
              conversationId: conv.id,
              createdAt: { gt: lastReadAt },
              senderId: { not: userId },
            },
          })
        : await db.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
            },
          })

      return { ...conv, unreadCount }
    })
  )

  return NextResponse.json(apiSuccess(withUnread))
}

// POST /api/messages — start or get a direct conversation
export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const schema = z.object({
    recipientId: z.string().uuid(),
    listingId: z.string().uuid().optional(),
    type: z.enum(['direct', 'deal_room']).default('direct'),
    groupName: z.string().optional(),
  })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid request'), { status: 400 })

  const { recipientId, listingId, type } = parsed.data

  if (type === 'direct') {
    // Check if conversation already exists
    const existing = await db.conversation.findFirst({
      where: {
        type: 'direct',
        AND: [
          { members: { some: { userId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    if (existing) return NextResponse.json(apiSuccess(existing))

    const conversation = await db.conversation.create({
      data: {
        type: 'direct',
        listingId,
        members: {
          create: [{ userId }, { userId: recipientId }],
        },
      },
      include: {
        members: { include: { user: { select: { id: true, name: true, avatar: true } } } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    })

    return NextResponse.json(apiSuccess(conversation), { status: 201 })
  }

  return NextResponse.json(apiError('Invalid type'), { status: 400 })
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

type Params = { params: { conversationId: string } }

// GET /api/messages/:conversationId — get messages with pagination
export async function GET(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const { searchParams } = new URL(request.url)
  const cursor = searchParams.get('cursor')
  const limit = 50

  // Verify membership
  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: params.conversationId, userId } },
  })
  if (!member) return NextResponse.json(apiError('Not a member'), { status: 403 })

  const messages = await db.message.findMany({
    where: {
      conversationId: params.conversationId,
      isDeleted: false,
      ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
      receipts: { select: { userId: true, readAt: true } },
    },
  })

  // Mark messages as read
  await db.conversationMember.update({
    where: { conversationId_userId: { conversationId: params.conversationId, userId } },
    data: { lastReadAt: new Date() },
  })

  // Upsert read receipts for unread messages
  const unreadMessageIds = messages
    .filter(m => m.senderId !== userId)
    .map(m => m.id)

  if (unreadMessageIds.length > 0) {
    await Promise.all(
      unreadMessageIds.map(messageId =>
        db.messageReceipt.upsert({
          where: { messageId_userId: { messageId, userId } },
          update: { readAt: new Date() },
          create: { messageId, userId, deliveredAt: new Date(), readAt: new Date() },
        }).catch(() => null)
      )
    )
  }

  return NextResponse.json(
    apiSuccess({
      messages: messages.reverse(), // chronological order
      hasMore: messages.length === limit,
      nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null,
    })
  )
}

// POST /api/messages/:conversationId — send message
export async function POST(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const schema = z.object({
    // For E2E encrypted messages — client encrypts content before sending
    ciphertext: z.string().optional(),
    // For system messages or property cards (not user text)
    plaintext: z.string().optional(),
    messageType: z.enum(['TEXT','IMAGE','DOCUMENT','PROPERTY_CARD','DEAL_REQUEST','VOICE','SYSTEM']).default('TEXT'),
    mediaUrl: z.string().url().optional(),
    dealData: z.any().optional(),
    replyToId: z.string().uuid().optional(),
  })

  // Validate membership
  const member = await db.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: params.conversationId, userId } },
  })
  if (!member) return NextResponse.json(apiError('Not a member'), { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid message'), { status: 400 })

  const message = await db.message.create({
    data: {
      conversationId: params.conversationId,
      senderId: userId,
      ...parsed.data,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  })

  // Update conversation's lastMessageAt
  await db.conversation.update({
    where: { id: params.conversationId },
    data: { lastMessageAt: new Date() },
  })

  return NextResponse.json(apiSuccess(message), { status: 201 })
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

type Params = { params: { id: string } }

export async function GET(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '30'))
  const skip = (page - 1) * limit

  const [comments, total] = await Promise.all([
    db.postComment.findMany({
      where: { postId: params.id },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatar: true, city: true } },
      },
    }),
    db.postComment.count({ where: { postId: params.id } }),
  ])

  return NextResponse.json(apiSuccess({
    comments: comments.map(c => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
    total,
    page,
    hasMore: skip + limit < total,
  }))
}

export async function POST(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const body = await request.json().catch(() => ({}))
  const content = typeof body.content === 'string' ? body.content.trim() : ''
  if (!content) return NextResponse.json(apiError('Comment cannot be empty'), { status: 400 })

  const [comment] = await db.$transaction([
    db.postComment.create({
      data: { postId: params.id, userId, content },
      include: { user: { select: { id: true, name: true, avatar: true, city: true } } },
    }),
    db.post.update({
      where: { id: params.id },
      data: { commentCount: { increment: 1 } },
    }),
  ])

  return NextResponse.json(apiSuccess({
    ...comment,
    createdAt: comment.createdAt.toISOString(),
    updatedAt: comment.updatedAt.toISOString(),
  }), { status: 201 })
}

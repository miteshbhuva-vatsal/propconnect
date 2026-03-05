import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const existing = await db.postLike.findUnique({
    where: { postId_userId: { postId: params.id, userId } },
  })

  if (existing) {
    // Unlike
    await db.postLike.delete({ where: { id: existing.id } })
    const post = await db.post.update({
      where: { id: params.id },
      data: { likeCount: { decrement: 1 } },
      select: { likeCount: true },
    })
    return NextResponse.json(apiSuccess({ liked: false, likeCount: Math.max(0, post.likeCount) }))
  } else {
    // Like
    await db.postLike.create({ data: { postId: params.id, userId } })
    const post = await db.post.update({
      where: { id: params.id },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    })
    return NextResponse.json(apiSuccess({ liked: true, likeCount: post.likeCount }))
  }
}

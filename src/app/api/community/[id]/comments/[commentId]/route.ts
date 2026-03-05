import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const comment = await db.postComment.findUnique({
    where: { id: params.commentId },
    select: { userId: true, postId: true },
  })
  if (!comment) return NextResponse.json(apiError('Comment not found'), { status: 404 })
  if (comment.userId !== userId) return NextResponse.json(apiError('Forbidden'), { status: 403 })

  await db.$transaction([
    db.postComment.delete({ where: { id: params.commentId } }),
    db.post.update({
      where: { id: params.id },
      data: { commentCount: { decrement: 1 } },
    }),
  ])

  return NextResponse.json(apiSuccess({ deleted: true }))
}

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

type Params = { params: { id: string } }

export async function PATCH(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const post = await db.post.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!post) return NextResponse.json(apiError('Post not found'), { status: 404 })
  if (post.userId !== userId) return NextResponse.json(apiError('Forbidden'), { status: 403 })

  const body = await request.json().catch(() => ({}))
  const { content, images, linkUrl } = body

  const updated = await db.post.update({
    where: { id: params.id },
    data: {
      content: typeof content === 'string' ? content.trim() || null : undefined,
      images: Array.isArray(images) ? images.filter(Boolean) : undefined,
      linkUrl: typeof linkUrl === 'string' ? linkUrl.trim() || null : undefined,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, city: true, verificationStatus: true } },
    },
  })

  return NextResponse.json(apiSuccess({
    ...updated,
    isLiked: false,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }))
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const post = await db.post.findUnique({ where: { id: params.id }, select: { userId: true } })
  if (!post) return NextResponse.json(apiError('Post not found'), { status: 404 })
  if (post.userId !== userId) return NextResponse.json(apiError('Forbidden'), { status: 403 })

  await db.post.delete({ where: { id: params.id } })
  return NextResponse.json(apiSuccess({ deleted: true }))
}

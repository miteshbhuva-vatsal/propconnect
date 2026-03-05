import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/utils'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const skip = (page - 1) * limit

  // Get current user's city for filtering
  const me = await db.user.findUnique({ where: { id: userId }, select: { city: true } })
  const city = me?.city || null

  const where = city ? { city } : {}

  const [posts, total] = await Promise.all([
    db.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, avatar: true, city: true, verificationStatus: true } },
        likes: { where: { userId }, select: { id: true } },
      },
    }),
    db.post.count({ where }),
  ])

  const data = posts.map(p => ({
    id: p.id,
    content: p.content,
    city: p.city,
    images: p.images,
    linkUrl: p.linkUrl,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    shareCount: p.shareCount,
    isLiked: p.likes.length > 0,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    user: p.user,
  }))

  return NextResponse.json(apiSuccess({ posts: data, total, page, limit, hasMore: skip + limit < total }))
}

export async function POST(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const body = await request.json().catch(() => ({}))
  const { content, images, linkUrl } = body

  const trimmedContent = typeof content === 'string' ? content.trim() : ''
  const imageList: string[] = Array.isArray(images) ? images.filter(Boolean) : []
  const trimmedLink = typeof linkUrl === 'string' ? linkUrl.trim() : ''

  if (!trimmedContent && imageList.length === 0 && !trimmedLink) {
    return NextResponse.json(apiError('Post must have text, image, or link'), { status: 400 })
  }

  const user = await db.user.findUnique({ where: { id: userId }, select: { city: true } })
  const city = user?.city || 'Unknown'

  const post = await db.post.create({
    data: {
      userId,
      content: trimmedContent || null,
      city,
      images: imageList,
      linkUrl: trimmedLink || null,
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, city: true, verificationStatus: true } },
    },
  })

  return NextResponse.json(apiSuccess({
    ...post,
    isLiked: false,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
  }), { status: 201 })
}

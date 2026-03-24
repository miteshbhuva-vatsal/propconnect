export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { code: string } }) {
  const { code } = params
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || ''
  const ua = request.headers.get('user-agent') || ''
  const referrer = request.headers.get('referer') || ''

  const link = await db.trackableLink.findUnique({
    where: { code },
    include: { listing: { select: { slug: true, id: true } } },
  })

  if (!link || !link.listing) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const ipHash = ip ? Buffer.from(ip).toString('base64').slice(0, 32) : null
  const isUnique = ipHash && !link.uniqueIps.includes(ipHash)

  // Record click event
  await Promise.all([
    db.trackClick.create({
      data: {
        trackableLinkId: link.id,
        ipHash,
        userAgent: ua.slice(0, 300),
        referrer: referrer.slice(0, 500),
      },
    }),
    db.trackableLink.update({
      where: { id: link.id },
      data: {
        totalClicks: { increment: 1 },
        lastClickAt: new Date(),
        ...(isUnique ? { uniqueIps: { push: ipHash } } : {}),
      },
    }),
  ]).catch(() => null)

  const slug = link.listing.slug
  const redirectUrl = new URL(`/p/${slug}`, request.url)
  redirectUrl.searchParams.set('tc', code)

  return NextResponse.redirect(redirectUrl, 302)
}

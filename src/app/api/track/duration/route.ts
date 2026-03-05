import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const schema = z.object({
  listingId: z.string(),
  trackCode: z.string().nullable().optional(),
  duration: z.number().int().min(1).max(3600),
})

// Called via navigator.sendBeacon on page unload — updates duration on the latest page view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return new NextResponse(null, { status: 204 })

    const { listingId, trackCode, duration } = parsed.data

    // Find the most recent page view for this listing+trackCode and update duration
    const view = await db.listingPageView.findFirst({
      where: { listingId, trackCode: trackCode ?? null },
      orderBy: { createdAt: 'desc' },
    })

    if (view && !view.duration) {
      await db.listingPageView.update({
        where: { id: view.id },
        data: { duration },
      })
    }

    return new NextResponse(null, { status: 204 })
  } catch {
    return new NextResponse(null, { status: 204 })
  }
}

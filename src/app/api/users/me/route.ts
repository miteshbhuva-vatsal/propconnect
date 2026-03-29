export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { apiError, apiSuccess } from '@/lib/utils'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)!

async function sbFetch(path: string, options: RequestInit = {}) {
  return fetch(`${supabaseUrl}/rest/v1${path}`, {
    ...options,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...(options.headers || {}),
    },
  })
}

// GET /api/users/me
export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const userRes = await sbFetch(`/User?id=eq.${userId}&limit=1`)
  const users: any[] = await userRes.json()
  const user = users?.[0]
  if (!user) return NextResponse.json(apiError('User not found'), { status: 404 })

  // Fetch subscription separately
  const subRes = await sbFetch(`/Subscription?userId=eq.${userId}&limit=1`)
  const subs: any[] = await subRes.json()
  const subscription = subs?.[0] ?? null

  return NextResponse.json(
    apiSuccess({
      id: user.id,
      name: user.name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      verificationStatus: user.verificationStatus,
      companyName: user.companyName,
      designation: user.designation,
      city: user.city,
      state: user.state,
      bio: user.bio,
      reraNumber: user.reraNumber,
      gstNumber: user.gstNumber,
      website: user.website,
      dealCreditsUsed: user.dealCreditsUsed,
      dealCreditsLimit: user.dealCreditsLimit,
      totalDealsPosted: user.totalDealsPosted,
      totalDealsClosed: user.totalDealsClosed,
      referralCode: user.referralCode,
      brokerScore: user.brokerScore,
      brokerRank: user.brokerRank,
      createdAt: user.createdAt,
      lastActiveAt: user.lastActiveAt,
      preferredPropertyTypes: user.preferredPropertyTypes ?? [],
      preferredLocations: user.preferredLocations ?? [],
      preferredPriceMin: user.preferredPriceMin ? Number(user.preferredPriceMin) : null,
      preferredPriceMax: user.preferredPriceMax ? Number(user.preferredPriceMax) : null,
      preferredDealTypes: user.preferredDealTypes ?? [],
      subscription: subscription ? {
        plan: subscription.plan,
        expiresAt: subscription.expiresAt,
        dealCreditsUsed: subscription.dealCreditsUsed,
        dealCreditsTotal: subscription.dealCreditsTotal,
      } : null,
      badges: [],
      _count: { listings: 0, referrals: 0 },
    })
  )
}

const updateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  companyName: z.string().optional(),
  designation: z.string().optional(),
  bio: z.string().max(500).optional(),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().optional(),
  state: z.string().optional(),
  reraNumber: z.string().optional(),
  gstNumber: z.string().optional(),
  email: z.string().email().optional(),
  role: z.enum(['DEVELOPER', 'INVESTOR', 'BROKER']).optional(),
  preferredPropertyTypes: z.array(z.string()).optional(),
  preferredDealTypes: z.array(z.string()).optional(),
  preferredLocations: z.array(z.string()).optional(),
  preferredPriceMin: z.number().nullable().optional(),
  preferredPriceMax: z.number().nullable().optional(),
})

// PATCH /api/users/me
export async function PATCH(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json(apiError('Unauthorized'), { status: 401 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json(apiError('Invalid data'), { status: 400 })

  const { preferredPriceMin, preferredPriceMax, ...rest } = parsed.data

  const patch: Record<string, any> = {
    ...rest,
    updatedAt: new Date().toISOString(),
    ...(preferredPriceMin !== undefined ? { preferredPriceMin: preferredPriceMin ?? null } : {}),
    ...(preferredPriceMax !== undefined ? { preferredPriceMax: preferredPriceMax ?? null } : {}),
  }

  const res = await sbFetch(`/User?id=eq.${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  })

  const updated: any[] = await res.json()
  const user = Array.isArray(updated) ? updated[0] : updated

  if (!res.ok || !user) {
    console.error('[users/me PATCH] failed:', JSON.stringify(updated))
    return NextResponse.json(apiError('Failed to update profile'), { status: 500 })
  }

  return NextResponse.json(apiSuccess({
    id: user.id,
    name: user.name,
    role: user.role,
    companyName: user.companyName,
    designation: user.designation,
    city: user.city,
    bio: user.bio,
    website: user.website,
  }, 'Profile updated'))
}

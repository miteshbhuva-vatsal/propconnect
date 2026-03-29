export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { generateAccessToken, generateRefreshToken, hashPhone } from '@/lib/auth'
import { normalizePhone, apiSuccess, apiError } from '@/lib/utils'

// Use Supabase REST API (same pattern as OTP — bypasses Prisma/DATABASE_URL)
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

const schema = z.object({
  phone: z.string().min(10).max(15),
  deviceId: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(apiError('Invalid phone number'), { status: 400 })
    }

    const { deviceId } = parsed.data
    const phone = normalizePhone(parsed.data.phone)
    const phoneHash = hashPhone(phone)
    const now = new Date().toISOString()

    // Find user by phoneHash
    const findRes = await sbFetch(`/User?phoneHash=eq.${encodeURIComponent(phoneHash)}&limit=1`)
    const users: any[] = await findRes.json()
    let user = users?.[0]
    const isNewUser = !user

    if (!user) {
      // Create new user — provide all NOT NULL fields without DB defaults
      const createRes = await sbFetch('/User', {
        method: 'POST',
        body: JSON.stringify({
          id: randomUUID(),
          phone,
          phoneHash,
          name: `User${phone.slice(-4)}`,
          dealCreditsLimit: 5,
          referralCode: randomUUID().replace(/-/g, '').slice(0, 12),
          updatedAt: now,
          lastActiveAt: now,
        }),
      })
      const created: any[] = await createRes.json()
      user = Array.isArray(created) ? created[0] : created

      if (!user?.id) {
        console.error('[login] user create failed:', JSON.stringify(created))
        return NextResponse.json(apiError('Failed to create account'), { status: 500 })
      }
    } else {
      // Update lastActiveAt
      await sbFetch(`/User?id=eq.${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ lastActiveAt: now, updatedAt: now }),
      })
    }

    if (user.isSuspended) {
      return NextResponse.json(
        apiError('Your account has been suspended. Contact support.', 'SUSPENDED'),
        { status: 403 }
      )
    }

    const accessToken = generateAccessToken({ id: user.id, role: user.role })
    const refreshToken = generateRefreshToken(user.id)

    // Store refresh token via REST
    await sbFetch('/RefreshToken', {
      method: 'POST',
      body: JSON.stringify({
        id: randomUUID(),
        userId: user.id,
        token: refreshToken,
        deviceId: deviceId || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isRevoked: false,
        createdAt: now,
      }),
    })

    const response = NextResponse.json(
      apiSuccess({
        accessToken,
        refreshToken,
        isNewUser,
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          verificationStatus: user.verificationStatus,
          dealCreditsUsed: user.dealCreditsUsed,
          dealCreditsLimit: user.dealCreditsLimit,
          companyName: user.companyName,
        },
      })
    )

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    })
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    console.error('[login] error:', error)
    return NextResponse.json(apiError('Login failed'), { status: 500 })
  }
}

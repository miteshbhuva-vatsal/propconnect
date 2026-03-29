export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  generateAccessToken, generateRefreshToken,
  storeRefreshToken, hashPhone,
} from '@/lib/auth'
import { normalizePhone, apiSuccess, apiError } from '@/lib/utils'
import { db } from '@/lib/db'

const schema = z.object({
  phone: z.string().min(10).max(15),
  deviceId: z.string().optional(),
  fcmToken: z.string().optional(),
  deviceType: z.enum(['ios', 'android', 'web']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(apiError('Invalid phone number'), { status: 400 })
    }

    const { deviceId, fcmToken, deviceType } = parsed.data
    const phone = normalizePhone(parsed.data.phone)
    const phoneHash = hashPhone(phone)

    // Find or create user
    let user = await db.user.findUnique({ where: { phoneHash } })
    const isNewUser = !user

    if (!user) {
      user = await db.user.create({
        data: {
          phone,
          phoneHash,
          name: `User${phone.slice(-4)}`,
          dealCreditsLimit: 5,
          subscription: {
            create: {
              plan: 'FREE',
              dealCreditsTotal: 5,
              planConfig: {
                connectOrCreate: {
                  where: { name: 'Free Plan' },
                  create: {
                    name: 'Free Plan',
                    plan: 'FREE',
                    price: 0,
                    billingCycle: 'monthly',
                    dealCredits: 5,
                    features: ['Browse listings', '5 deal interactions'],
                  },
                },
              },
            },
          },
        },
      })
    }

    if (user.isSuspended) {
      return NextResponse.json(
        apiError('Your account has been suspended. Contact support.', 'SUSPENDED'),
        { status: 403 }
      )
    }

    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    if (deviceId) {
      await db.device.upsert({
        where: { userId_deviceId: { userId: user.id, deviceId } },
        update: { fcmToken, deviceType: deviceType || 'web', lastSeenAt: new Date() },
        create: {
          userId: user.id,
          deviceId,
          fcmToken,
          deviceType: deviceType || 'web',
          userAgent: request.headers.get('user-agent') || undefined,
        },
      })
    }

    const accessToken = generateAccessToken(user)
    const refreshToken = generateRefreshToken(user.id)
    await storeRefreshToken(user.id, refreshToken, deviceId)

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

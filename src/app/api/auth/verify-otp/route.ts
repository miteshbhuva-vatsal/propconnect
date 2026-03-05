import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  verifyOtp, generateAccessToken, generateRefreshToken,
  storeRefreshToken, hashPhone,
} from '@/lib/auth'
import { normalizePhone, apiSuccess, apiError } from '@/lib/utils'
import { db } from '@/lib/db'

const schema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
  deviceId: z.string().optional(),
  fcmToken: z.string().optional(),
  deviceType: z.enum(['ios', 'android', 'web']).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(apiError('Invalid request'), { status: 400 })
    }

    const { otp, deviceId, fcmToken, deviceType } = parsed.data
    const phone = normalizePhone(parsed.data.phone)

    const isValid = await verifyOtp(phone, otp)
    if (!isValid) {
      return NextResponse.json(
        apiError('Invalid or expired OTP', 'INVALID_OTP'),
        { status: 401 }
      )
    }

    const phoneHash = hashPhone(phone)

    // Find or create user
    let user = await db.user.findUnique({ where: { phoneHash } })
    const isNewUser = !user

    if (!user) {
      // Create new user with referral code auto-generated
      user = await db.user.create({
        data: {
          phone,
          phoneHash,
          name: `User${phone.slice(-4)}`,  // Temporary name, updated during onboarding
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

    // Check if user is suspended
    if (user.isSuspended) {
      return NextResponse.json(
        apiError('Your account has been suspended. Contact support.', 'SUSPENDED'),
        { status: 403 }
      )
    }

    // Update last active
    await db.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() },
    })

    // Register device
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

    // Set httpOnly cookie for web
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 min
    })
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(apiError('Authentication failed'), { status: 500 })
  }
}

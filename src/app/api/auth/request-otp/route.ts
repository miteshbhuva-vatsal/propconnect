export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createOtp } from '@/lib/auth'
import { normalizePhone, apiError, apiSuccess } from '@/lib/utils'
import { db } from '@/lib/db'

const schema = z.object({
  phone: z.string().min(10).max(15),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(apiError('Invalid phone number'), { status: 400 })
    }

    const phone = normalizePhone(parsed.data.phone)

    // Rate limit: max 5 OTPs per phone per 10 min (skip in dev)
    if (process.env.NODE_ENV !== 'development') {
      const recentOtps = await db.otpCode.count({
        where: {
          phone,
          isUsed: false,
          createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
        },
      })

      if (recentOtps >= 5) {
        return NextResponse.json(
          apiError('Too many OTP requests. Please wait 10 minutes.', 'RATE_LIMITED'),
          { status: 429 }
        )
      }
    }

    const otp = await createOtp(phone)

    // Dev mode or no SMS keys configured → skip SMS, log OTP
    const smsConfigured = !!process.env.MSG91_AUTH_KEY
    if (process.env.NODE_ENV === 'development' || !smsConfigured) {
      console.log(`[TEST] OTP for ${phone}: ${otp}`)
      return NextResponse.json(apiSuccess({ phone, devOtp: otp }, 'OTP sent'))
    }

    // Send OTP via SMS provider
    await sendSmsOtp(phone, otp)

    return NextResponse.json(apiSuccess({ phone }, 'OTP sent successfully'))
  } catch (error) {
    console.error('OTP request error:', error)
    return NextResponse.json(apiError('Failed to send OTP'), { status: 500 })
  }
}

async function sendSmsOtp(phone: string, otp: string) {
  const provider = process.env.SMS_PROVIDER || 'msg91'

  if (provider === 'msg91') {
    const url = 'https://api.msg91.com/api/v5/otp'
    await fetch(url, {
      method: 'POST',
      headers: {
        'authkey': process.env.MSG91_AUTH_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: process.env.MSG91_TEMPLATE_ID,
        mobile: phone.replace('+', ''),
        authkey: process.env.MSG91_AUTH_KEY,
        otp,
      }),
    })
  }
  // Add Twilio support here if needed
}

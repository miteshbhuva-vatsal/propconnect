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

    let otp: string
    try {
      otp = await createOtp(phone)
    } catch (dbErr) {
      console.error('[OTP] DB error creating OTP:', dbErr)
      return NextResponse.json(apiError('Database error, please try again'), { status: 500 })
    }

    // Dev mode or no SMS keys configured → skip SMS, log OTP
    const smsConfigured = !!process.env.MSG91_AUTH_KEY
    if (process.env.NODE_ENV === 'development' || !smsConfigured) {
      console.log(`[TEST] OTP for ${phone}: ${otp}`)
      return NextResponse.json(apiSuccess({ phone, devOtp: otp }, 'OTP sent'))
    }

    try {
      await sendSmsOtp(phone, otp)
    } catch (smsErr) {
      console.error('[OTP] SMS error:', smsErr)
      return NextResponse.json(apiError('Failed to send SMS, please try again'), { status: 500 })
    }

    return NextResponse.json(apiSuccess({ phone }, 'OTP sent successfully'))
  } catch (error) {
    console.error('[OTP] Unexpected error:', error)
    return NextResponse.json(apiError('Failed to send OTP'), { status: 500 })
  }
}

async function sendSmsOtp(phone: string, otp: string) {
  // Normalize to 91XXXXXXXXXX format
  const mobile = phone.replace(/^\+/, '').replace(/^0+/, '')
  const mobileWithCountry = mobile.startsWith('91') ? mobile : `91${mobile}`

  const res = await fetch('https://api.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'authkey': process.env.MSG91_AUTH_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: mobileWithCountry,
      authkey: process.env.MSG91_AUTH_KEY,
      otp,
      sender: process.env.MSG91_SENDER_ID || 'PRPCNT',
    }),
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok || data.type === 'error') {
    console.error('[MSG91] Failed to send OTP:', data)
    throw new Error(data.message || 'MSG91 send failed')
  }

  console.log(`[MSG91] OTP sent to ${mobileWithCountry}`)
}

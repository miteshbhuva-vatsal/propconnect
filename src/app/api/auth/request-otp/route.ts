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
      try {
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
      } catch (e) {
        console.error('[OTP] Rate limit check failed (continuing):', e)
      }
    }

    let otp: string
    try {
      otp = await createOtp(phone)
    } catch (dbErr) {
      console.error('[OTP] DB error creating OTP:', dbErr)
      return NextResponse.json(apiError('Database error, please try again'), { status: 500 })
    }

    // Dev mode or no SMS provider configured → skip SMS, log OTP
    const twilioConfigured = !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER)
    const msg91Configured = !!process.env.MSG91_AUTH_KEY

    if (process.env.NODE_ENV === 'development' || (!twilioConfigured && !msg91Configured)) {
      console.log(`[TEST] OTP for ${phone}: ${otp}`)
      return NextResponse.json(apiSuccess({ phone, devOtp: otp }, 'OTP sent'))
    }

    try {
      if (twilioConfigured) {
        await sendViaTwilio(phone, otp)
      } else {
        await sendViaMSG91(phone, otp)
      }
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

async function sendViaTwilio(phone: string, otp: string) {
  const mobile = phone.startsWith('+') ? phone : `+91${phone.replace(/^0+/, '').replace(/^91/, '')}`
  const accountSid = process.env.TWILIO_ACCOUNT_SID!
  const authToken = process.env.TWILIO_AUTH_TOKEN!
  const from = process.env.TWILIO_PHONE_NUMBER!

  const body = `${otp} is your PropConnect OTP. Valid for 5 minutes. Do not share with anyone.`

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: mobile, From: from, Body: body }).toString(),
  })

  const data = await res.json().catch(() => ({}))
  console.log(`[Twilio] Response for ${mobile}:`, JSON.stringify(data))

  if (!res.ok || data.status === 'failed' || data.error_code) {
    throw new Error(`Twilio error ${data.error_code}: ${data.error_message || JSON.stringify(data)}`)
  }
}

async function sendViaMSG91(phone: string, otp: string) {
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
      sender: process.env.MSG91_SENDER_ID || 'DGPROP',
    }),
  })

  const data = await res.json().catch(() => ({}))
  console.log(`[MSG91] Response for ${mobileWithCountry}:`, JSON.stringify(data))

  if (!res.ok || data.type === 'error') {
    throw new Error(`MSG91 error: ${data.message || JSON.stringify(data)}`)
  }
}

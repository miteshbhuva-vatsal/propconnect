export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { rotateRefreshToken, generateAccessToken } from '@/lib/auth'
import { db } from '@/lib/db'
import { apiError, apiSuccess } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('refresh_token')?.value
      || (await request.json().catch(() => ({}))).refreshToken

    if (!token) {
      return NextResponse.json(apiError('No refresh token'), { status: 401 })
    }

    const newRefreshToken = await rotateRefreshToken(token)
    if (!newRefreshToken) {
      return NextResponse.json(apiError('Invalid refresh token'), { status: 401 })
    }

    // Get userId from new refresh token store
    const stored = await db.refreshToken.findUnique({ where: { token: newRefreshToken } })
    if (!stored) return NextResponse.json(apiError('Token error'), { status: 401 })

    const user = await db.user.findUnique({ where: { id: stored.userId } })
    if (!user) return NextResponse.json(apiError('User not found'), { status: 401 })

    const accessToken = generateAccessToken(user)

    const response = NextResponse.json(apiSuccess({ accessToken, refreshToken: newRefreshToken }))
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
    })
    response.cookies.set('refresh_token', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
    })

    return response
  } catch {
    return NextResponse.json(apiError('Refresh failed'), { status: 500 })
  }
}

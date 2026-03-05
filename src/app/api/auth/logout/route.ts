import { NextRequest, NextResponse } from 'next/server'
import { verifyRefreshToken, revokeAllUserTokens } from '@/lib/auth'
import { apiSuccess } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('refresh_token')?.value

  if (refreshToken) {
    const payload = verifyRefreshToken(refreshToken)
    if (payload) {
      await revokeAllUserTokens(payload.userId).catch(() => null)
    }
  }

  const response = NextResponse.json(apiSuccess(null, 'Logged out'))
  response.cookies.delete('access_token')
  response.cookies.delete('refresh_token')
  return response
}

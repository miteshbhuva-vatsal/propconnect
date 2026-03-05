import jwt from 'jsonwebtoken'
import { createHash } from 'crypto'
import { db } from './db'
import type { User } from '@prisma/client'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m'
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d'

export interface JwtPayload {
  userId: string
  role: string
  planId: string
  iat?: number
  exp?: number
}

// ─── Token Generation ────────────────────────────────────────────────────────

export function generateAccessToken(user: Pick<User, 'id' | 'role'>): string {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  )
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string }
  } catch {
    return null
  }
}

// ─── OTP ─────────────────────────────────────────────────────────────────────

export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function createOtp(phone: string): Promise<string> {
  // Invalidate old unused OTPs for this phone
  await db.otpCode.updateMany({
    where: { phone, isUsed: false },
    data: { isUsed: true },
  })

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5 minutes

  await db.otpCode.create({
    data: { phone, code, expiresAt },
  })

  return code
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  const otp = await db.otpCode.findFirst({
    where: {
      phone,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) return false

  // Increment attempts
  await db.otpCode.update({
    where: { id: otp.id },
    data: { attempts: { increment: 1 } },
  })

  // Lock out after 5 failed attempts
  if (otp.attempts >= 4) {
    await db.otpCode.update({ where: { id: otp.id }, data: { isUsed: true } })
    return false
  }

  if (otp.code !== code) return false

  // Mark as used
  await db.otpCode.update({ where: { id: otp.id }, data: { isUsed: true } })
  return true
}

// ─── Phone Hashing ───────────────────────────────────────────────────────────

export function hashPhone(phone: string): string {
  return createHash('sha256').update(phone + process.env.JWT_SECRET).digest('hex')
}

// ─── Refresh Token Store ──────────────────────────────────────────────────────

export async function storeRefreshToken(userId: string, token: string, deviceId?: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await db.refreshToken.create({
    data: { userId, token, deviceId, expiresAt },
  })
}

export async function rotateRefreshToken(oldToken: string): Promise<string | null> {
  const existing = await db.refreshToken.findUnique({
    where: { token: oldToken },
    include: { user: true },
  })

  if (!existing || existing.isRevoked || existing.expiresAt < new Date()) {
    return null
  }

  // Revoke old
  await db.refreshToken.update({ where: { id: existing.id }, data: { isRevoked: true } })

  // Issue new
  const newToken = generateRefreshToken(existing.userId)
  await storeRefreshToken(existing.userId, newToken, existing.deviceId ?? undefined)

  return newToken
}

export async function revokeAllUserTokens(userId: string) {
  await db.refreshToken.updateMany({
    where: { userId, isRevoked: false },
    data: { isRevoked: true },
  })
}

// ─── Deal Credit Check ────────────────────────────────────────────────────────

export async function checkAndIncrementDealCredit(userId: string): Promise<{
  allowed: boolean
  creditsUsed: number
  creditsLimit: number
  requiresUpgrade: boolean
}> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { dealCreditsUsed: true, dealCreditsLimit: true },
  })

  if (!user) return { allowed: false, creditsUsed: 0, creditsLimit: 0, requiresUpgrade: false }

  if (user.dealCreditsUsed >= user.dealCreditsLimit) {
    return {
      allowed: false,
      creditsUsed: user.dealCreditsUsed,
      creditsLimit: user.dealCreditsLimit,
      requiresUpgrade: true,
    }
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: { dealCreditsUsed: { increment: 1 } },
    select: { dealCreditsUsed: true, dealCreditsLimit: true },
  })

  return {
    allowed: true,
    creditsUsed: updated.dealCreditsUsed,
    creditsLimit: updated.dealCreditsLimit,
    requiresUpgrade: false,
  }
}

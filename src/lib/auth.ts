import jwt from 'jsonwebtoken'
import { createHash, randomUUID } from 'crypto'
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

// Use Supabase REST API for OTP (bypasses Prisma pooler issues)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// Support both key names (Vercel pulls it as PUBLISHABLE_DEFAULT_KEY)
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

export async function createOtp(phone: string): Promise<string> {
  // Invalidate old unused OTPs for this phone
  await sbFetch(`/OtpCode?phone=eq.${encodeURIComponent(phone)}&isUsed=eq.false`, {
    method: 'PATCH',
    body: JSON.stringify({ isUsed: true }),
  })

  const code = generateOtp()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

  const res = await sbFetch('/OtpCode', {
    method: 'POST',
    body: JSON.stringify({ id: randomUUID(), phone, code, expiresAt, isUsed: false, attempts: 0 }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OTP create failed: ${err}`)
  }

  return code
}

export async function verifyOtp(phone: string, code: string): Promise<boolean> {
  // Master OTP for testing
  if (code === '654321') return true

  const now = new Date().toISOString()
  const res = await sbFetch(
    `/OtpCode?phone=eq.${encodeURIComponent(phone)}&isUsed=eq.false&expiresAt=gt.${now}&order=createdAt.desc&limit=1`
  )
  const rows: any[] = await res.json()
  const otp = rows[0]

  if (!otp) return false

  // Increment attempts
  await sbFetch(`/OtpCode?id=eq.${otp.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ attempts: (otp.attempts || 0) + 1 }),
  })

  // Lock out after 5 failed attempts
  if ((otp.attempts || 0) >= 4) {
    await sbFetch(`/OtpCode?id=eq.${otp.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isUsed: true }),
    })
    return false
  }

  if (otp.code !== code) return false

  // Mark as used
  await sbFetch(`/OtpCode?id=eq.${otp.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isUsed: true }),
  })
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

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

// ─── Tailwind Merge ───────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Currency ─────────────────────────────────────────────────────────────────

export function formatIndianPrice(amount: number | bigint | null | undefined): string {
  if (amount == null) return 'Price on Request'
  const num = typeof amount === 'bigint' ? Number(amount) : amount
  if (num >= 10_000_000) return `₹${(num / 10_000_000).toFixed(2)} Cr`
  if (num >= 100_000) return `₹${(num / 100_000).toFixed(2)} L`
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`
  return `₹${num.toLocaleString('en-IN')}`
}

// ─── Date ─────────────────────────────────────────────────────────────────────

export function timeAgo(date: Date | string): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDate(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string): string {
  return format(new Date(date), 'dd MMM yyyy, hh:mm a')
}

export function chatTime(date: Date | string): string {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return format(d, 'hh:mm a')
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return format(d, 'dd/MM/yy')
}

// ─── Slug ─────────────────────────────────────────────────────────────────────

export function generateSlug(title: string, id: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
  return `${base}-${id.slice(0, 8)}`
}

// ─── Phone ────────────────────────────────────────────────────────────────────

export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) return `+91${cleaned}`
  if (cleaned.startsWith('91') && cleaned.length === 12) return `+${cleaned}`
  return `+${cleaned}`
}

// ─── WhatsApp Share ───────────────────────────────────────────────────────────

export function buildWhatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`
}

export function buildPropertyWhatsappMessage(listing: {
  title: string
  city: string
  price: number | bigint | null
  size?: number | null
  url: string
}): string {
  const price = listing.price
    ? formatIndianPrice(listing.price)
    : 'Price on Request'
  return [
    `🏠 *${listing.title}*`,
    `📍 ${listing.city}`,
    `💰 ${price}`,
    listing.size ? `📐 ${listing.size.toLocaleString()} sq ft` : null,
    ``,
    `View full details & contact broker:`,
    listing.url,
    ``,
    `Powered by PropConnect 🔒`,
  ]
    .filter(Boolean)
    .join('\n')
}

// ─── API Response Helpers ─────────────────────────────────────────────────────

export function apiSuccess<T>(data: T, message?: string) {
  return { success: true, data, message }
}

export function apiError(message: string, code?: string) {
  return { success: false, error: message, code }
}

// ─── Property Type Labels ─────────────────────────────────────────────────────

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  BUNGALOW: 'Bungalow',
  FARMHOUSE: 'Farmhouse',
  WEEKEND_HOME: 'Weekend Home',
  LAND: 'Land',
  FARMLAND: 'Farmland',
  INDUSTRIAL_LAND: 'Industrial Land',
  WAREHOUSE: 'Warehouse',
  GODOWN: 'Godown',
  OFFICE_SPACE: 'Office Space',
  BARTER_DEAL: 'Barter Deal',
  JV_LAND: 'JV Land',
}

export const DEAL_TYPE_LABELS: Record<string, string> = {
  SALE: 'Sale',
  LEASE: 'Lease',
  JOINT_VENTURE: 'Joint Venture',
  BARTER: 'Barter',
  DISTRESSED: 'Distressed Sale',
  RENTAL: 'Rental',
}

export const PROPERTY_TYPES = Object.entries(PROPERTY_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const DEAL_TYPES = Object.entries(DEAL_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  SITE_VISIT: 'Site Visit',
  NEGOTIATION: 'Negotiation',
  LOI_SIGNED: 'LOI Signed',
  CLOSED: 'Closed',
  LOST: 'Lost',
}

export const LEAD_STATUSES = Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// ─── Community Feed ────────────────────────────────────────────────────────────

export function detectLinkType(url: string): 'youtube' | 'instagram' | 'other' {
  if (/youtube\.com\/watch|youtu\.be\//.test(url)) return 'youtube'
  if (/instagram\.com\/(reel|p)\//.test(url)) return 'instagram'
  return 'other'
}

export function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

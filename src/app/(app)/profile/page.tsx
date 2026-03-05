'use client'

import { useState, useEffect } from 'react'
import {
  LogOut, Shield, Crown, Phone, Mail, Globe, Edit2, X,
  CheckCircle, Share2, TrendingUp, MapPin, Award, SlidersHorizontal,
  ChevronRight, Building2, Calendar, Copy, Check,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { buildWhatsappShareUrl, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, formatIndianPrice } from '@/lib/utils'
import PropertyCard from '@/components/PropertyCard'
import PreferencesSheet from '@/components/PreferencesSheet'
import type { ListingCard } from '@/types'

interface UserProfile {
  id: string; name: string; phone: string; email: string | null
  avatar: string | null; role: string; verificationStatus: string
  companyName: string | null; designation: string | null
  city: string | null; state: string | null; bio: string | null
  reraNumber: string | null; gstNumber: string | null; website: string | null
  dealCreditsUsed: number; dealCreditsLimit: number
  totalDealsPosted: number; totalDealsClosed: number; referralCode: string
  brokerScore: number; brokerRank: number | null; createdAt: string
  preferredPropertyTypes: string[]
  preferredDealTypes: string[]
  preferredLocations: string[]
  preferredPriceMin: number | null
  preferredPriceMax: number | null
  subscription?: { plan: string; expiresAt: string | null } | null
  _count?: { listings: number; referrals: number }
  badges?: string[]
}

const ROLE_LABELS: Record<string, string> = {
  DEVELOPER: 'Developer',
  INVESTOR: 'Investor',
  BROKER: 'Broker',
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'bg-gray-100 text-gray-600',
  STARTER: 'bg-blue-100 text-blue-700',
  PRO: 'bg-wp-green/10 text-wp-green-dark',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
}

const BADGE_META: Record<string, { icon: string; label: string; color: string }> = {
  FIRST_DEAL: { icon: '🎯', label: 'First Deal', color: 'bg-blue-50' },
  '10_DEALS': { icon: '🔟', label: '10 Deals', color: 'bg-green-50' },
  TOP_BROKER: { icon: '👑', label: 'Top Broker', color: 'bg-yellow-50' },
  VERIFIED: { icon: '✅', label: 'Verified', color: 'bg-teal-50' },
}

function EditProfileSheet({
  user,
  onClose,
  onSaved,
}: {
  user: UserProfile
  onClose: () => void
  onSaved: (updates: Partial<UserProfile>) => void
}) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: user.name,
    companyName: user.companyName || '',
    designation: user.designation || '',
    role: user.role as 'DEVELOPER' | 'INVESTOR' | 'BROKER',
    city: user.city || '',
    state: user.state || '',
    bio: user.bio || '',
    email: user.email || '',
    reraNumber: user.reraNumber || '',
    gstNumber: user.gstNumber || '',
    website: user.website || '',
  })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.patch('/api/users/me', {
        ...form,
        website: form.website || undefined,
        email: form.email || undefined,
      })
      toast.success('Profile updated')
      onSaved(form)
      onClose()
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl max-h-[90vh] flex flex-col">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-wp-text">Edit Profile</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="input-label">Full Name *</label>
              <input className="input-field" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className="input-label">Company</label>
              <input className="input-field" value={form.companyName} onChange={e => set('companyName', e.target.value)} placeholder="Your firm name" />
            </div>
            <div>
              <label className="input-label">Designation</label>
              <input className="input-field" value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="e.g. Senior Broker" />
            </div>
            <div>
              <label className="input-label">Role</label>
              <select className="input-field" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="BROKER">Broker / Agent</option>
                <option value="DEVELOPER">Developer</option>
                <option value="INVESTOR">Investor</option>
              </select>
            </div>
            <div>
              <label className="input-label">City</label>
              <input className="input-field" value={form.city} onChange={e => set('city', e.target.value)} placeholder="Mumbai" />
            </div>
            <div>
              <label className="input-label">State</label>
              <input className="input-field" value={form.state} onChange={e => set('state', e.target.value)} placeholder="Maharashtra" />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@email.com" />
            </div>
          </div>

          <div>
            <label className="input-label">Bio</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.bio}
              onChange={e => set('bio', e.target.value)}
              placeholder="Tell others about your expertise, specialties, years of experience..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="input-label">RERA Number</label>
              <input className="input-field" value={form.reraNumber} onChange={e => set('reraNumber', e.target.value)} placeholder="MH/12345/2024" />
            </div>
            <div>
              <label className="input-label">GST Number</label>
              <input className="input-field" value={form.gstNumber} onChange={e => set('gstNumber', e.target.value)} placeholder="27ABCDE..." />
            </div>
            <div className="col-span-2">
              <label className="input-label">Website</label>
              <input className="input-field" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://yoursite.com" />
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [listings, setListings] = useState<ListingCard[]>([])
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [activeTab, setActiveTab] = useState<'about' | 'listings'>('about')
  const [codeCopied, setCodeCopied] = useState(false)

  useEffect(() => {
    axios.get('/api/users/me').then(res => {
      if (res.data.success) {
        const u = res.data.data
        setUser(u)
        axios.get(`/api/users/${u.id}`).then(r => {
          if (r.data.success) setListings(r.data.data.listings || [])
        }).catch(() => null)
      }
    }).catch(() => null).finally(() => setLoading(false))
  }, [])

  const handleLogout = async () => {
    await axios.post('/api/auth/logout').catch(() => null)
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    window.location.href = '/login'
  }

  const copyReferral = () => {
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'https://propconnect.app'}?ref=${user?.referralCode}`
    navigator.clipboard.writeText(url)
    setCodeCopied(true)
    toast.success('Referral link copied!')
    setTimeout(() => setCodeCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-52 bg-gray-200 animate-pulse rounded-b-3xl" />
        <div className="px-4 -mt-8 space-y-3">
          <div className="card h-24 animate-pulse" />
          <div className="card h-16 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!user) return null

  const plan = user.subscription?.plan || 'FREE'
  const creditPct = Math.min((user.dealCreditsUsed / user.dealCreditsLimit) * 100, 100)
  const referralUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://propconnect.app'}?ref=${user.referralCode}`
  const wpShareUrl = buildWhatsappShareUrl(
    `Hey! Join me on PropConnect — the best platform for real estate deals.\nUse my referral: ${referralUrl}`
  )

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })

  return (
    <div className="pb-20">
      {/* Hero header */}
      <div className="relative bg-gradient-to-br from-wp-teal via-wp-teal to-wp-green pt-6 pb-20 px-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 shadow-lg">
              {user.name[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-white font-bold text-lg leading-tight">{user.name}</h1>
                {user.verificationStatus === 'VERIFIED' && (
                  <CheckCircle size={16} className="text-wp-green flex-shrink-0" />
                )}
              </div>
              <p className="text-white/80 text-sm mt-0.5">
                {user.designation || ROLE_LABELS[user.role] || user.role}
                {user.companyName && <span className="text-white/60"> · {user.companyName}</span>}
              </p>
              {(user.city || user.state) && (
                <div className="flex items-center gap-1 text-white/60 text-xs mt-0.5">
                  <MapPin size={11} />
                  {[user.city, user.state].filter(Boolean).join(', ')}
                </div>
              )}
              <div className="flex items-center gap-1 text-white/50 text-xs mt-0.5">
                <Calendar size={10} />
                Member since {memberSince}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowEdit(true)}
            className="p-2 bg-white/15 hover:bg-white/25 rounded-xl transition-colors"
          >
            <Edit2 size={16} className="text-white" />
          </button>
        </div>

        {/* Broker rank badge */}
        {user.brokerRank && (
          <div className="absolute top-4 right-16 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            #{user.brokerRank} Broker
          </div>
        )}
      </div>

      <div className="px-4 -mt-12 space-y-4">
        {/* Stats card */}
        <div className="card shadow-md">
          <div className="grid grid-cols-4 divide-x divide-wp-border">
            {[
              { label: 'Listings', value: user._count?.listings ?? user.totalDealsPosted },
              { label: 'Closed', value: user.totalDealsClosed },
              { label: 'Score', value: user.brokerScore },
              { label: 'Referrals', value: user._count?.referrals ?? 0 },
            ].map(stat => (
              <div key={stat.label} className="py-4 text-center">
                <p className="text-xl font-bold text-wp-teal">{stat.value}</p>
                <p className="text-[11px] text-wp-text-secondary mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Subscription card */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Crown size={15} className="text-wp-teal" />
              <span className="font-semibold text-wp-text text-sm">Plan</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${PLAN_COLORS[plan]}`}>{plan}</span>
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-wp-text-secondary mb-1">
              <span>Deal credits</span>
              <span className="font-medium">{user.dealCreditsUsed} / {user.dealCreditsLimit}</span>
            </div>
            <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all ${creditPct >= 80 ? 'bg-red-500' : 'bg-wp-green'}`}
                style={{ width: `${creditPct}%` }}
              />
            </div>
          </div>
          {plan === 'FREE' && (
            <button className="w-full mt-2 bg-gradient-to-r from-wp-teal to-wp-green text-white text-sm font-semibold py-2.5 rounded-xl hover:opacity-90 transition-opacity">
              Upgrade to Pro — Unlimited Deals
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-2xl p-1 gap-1">
          {(['about', 'listings'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-white text-wp-text shadow-sm' : 'text-wp-text-secondary'
              }`}
            >
              {tab === 'listings' ? `Listings (${listings.length})` : 'About'}
            </button>
          ))}
        </div>

        {activeTab === 'about' ? (
          <>
            {/* Bio */}
            {user.bio ? (
              <div className="card p-4">
                <h2 className="font-semibold text-wp-text text-sm mb-2">About</h2>
                <p className="text-sm text-wp-text-secondary leading-relaxed">{user.bio}</p>
              </div>
            ) : (
              <button
                onClick={() => setShowEdit(true)}
                className="w-full card p-4 border-dashed border-2 text-center text-wp-text-secondary text-sm hover:border-wp-green hover:text-wp-green transition-colors"
              >
                + Add a bio to let others know about you
              </button>
            )}

            {/* Contact info */}
            <div className="card p-4 space-y-3">
              <h2 className="font-semibold text-wp-text text-sm">Contact</h2>
              <a href={`tel:${user.phone}`} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-wp-green/10 rounded-lg flex items-center justify-center">
                  <Phone size={14} className="text-wp-green" />
                </div>
                <span className="text-wp-text">{user.phone}</span>
              </a>
              {user.email && (
                <a href={`mailto:${user.email}`} className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-wp-green/10 rounded-lg flex items-center justify-center">
                    <Mail size={14} className="text-wp-green" />
                  </div>
                  <span className="text-wp-text">{user.email}</span>
                </a>
              )}
              {user.website && (
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-wp-green/10 rounded-lg flex items-center justify-center">
                    <Globe size={14} className="text-wp-green" />
                  </div>
                  <span className="text-wp-teal hover:underline">{user.website.replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {user.reraNumber && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Shield size={14} className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[11px] text-wp-text-secondary">RERA</p>
                    <p className="text-wp-text font-mono text-xs">{user.reraNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Preferences */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-wp-text text-sm">AI Preferences</h2>
                <button
                  onClick={() => setShowPreferences(true)}
                  className="flex items-center gap-1.5 text-xs text-wp-green font-medium"
                >
                  <SlidersHorizontal size={13} />
                  Edit
                </button>
              </div>
              {user.preferredPropertyTypes.length === 0 && user.preferredLocations.length === 0 ? (
                <button
                  onClick={() => setShowPreferences(true)}
                  className="w-full py-3 border border-dashed border-wp-border rounded-xl text-wp-text-secondary text-sm hover:border-wp-green hover:text-wp-green transition-colors"
                >
                  Set your property preferences for better matches
                </button>
              ) : (
                <div className="space-y-2.5">
                  {user.preferredPropertyTypes.length > 0 && (
                    <div>
                      <p className="text-[11px] text-wp-text-secondary mb-1.5">Property Types</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.preferredPropertyTypes.map(t => (
                          <span key={t} className="text-xs bg-wp-green/10 text-wp-green-dark px-2.5 py-1 rounded-full">
                            {PROPERTY_TYPE_LABELS[t] || t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.preferredDealTypes.length > 0 && (
                    <div>
                      <p className="text-[11px] text-wp-text-secondary mb-1.5">Deal Types</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.preferredDealTypes.map(t => (
                          <span key={t} className="text-xs bg-wp-teal/10 text-wp-teal px-2.5 py-1 rounded-full">
                            {DEAL_TYPE_LABELS[t] || t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.preferredLocations.length > 0 && (
                    <div>
                      <p className="text-[11px] text-wp-text-secondary mb-1.5">Cities</p>
                      <div className="flex flex-wrap gap-1.5">
                        {user.preferredLocations.map(loc => (
                          <span key={loc} className="text-xs bg-gray-100 text-wp-text-secondary px-2.5 py-1 rounded-full">
                            📍 {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(user.preferredPriceMin || user.preferredPriceMax) && (
                    <div>
                      <p className="text-[11px] text-wp-text-secondary mb-1">Budget</p>
                      <p className="text-sm text-wp-text font-medium">
                        {user.preferredPriceMin ? formatIndianPrice(user.preferredPriceMin) : '—'}
                        {' – '}
                        {user.preferredPriceMax ? formatIndianPrice(user.preferredPriceMax) : 'No limit'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Badges */}
            {user.badges && user.badges.length > 0 && (
              <div className="card p-4">
                <h2 className="font-semibold text-wp-text text-sm mb-3 flex items-center gap-2">
                  <Award size={15} className="text-wp-teal" />
                  Achievements
                </h2>
                <div className="flex gap-3 flex-wrap">
                  {user.badges.map(badge => {
                    const meta = BADGE_META[badge]
                    return (
                      <div key={badge} className="flex flex-col items-center gap-1.5">
                        <div className={`w-14 h-14 ${meta?.color || 'bg-gray-50'} rounded-2xl flex items-center justify-center text-2xl shadow-sm border border-gray-100`}>
                          {meta?.icon || '🏆'}
                        </div>
                        <span className="text-[11px] text-wp-text-secondary text-center max-w-[56px] leading-tight">
                          {meta?.label || badge.replace(/_/g, ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Referral */}
            <div className="card p-4 bg-gradient-to-br from-wp-green/5 to-wp-teal/5 border border-wp-green/20">
              <div className="flex items-center gap-2 mb-1">
                <Share2 size={15} className="text-wp-green" />
                <h2 className="font-semibold text-wp-text text-sm">Refer & Earn Credits</h2>
              </div>
              <p className="text-xs text-wp-text-secondary mb-3">
                Invite brokers using your link — earn deal credits for every signup.
              </p>
              <div className="flex gap-2 mb-3">
                <code className="flex-1 bg-white border border-wp-border rounded-xl px-3 py-2 text-sm font-mono text-wp-teal font-bold truncate">
                  {user.referralCode}
                </code>
                <button
                  onClick={copyReferral}
                  className="px-3 py-2 bg-white border border-wp-border rounded-xl text-sm transition-colors hover:bg-gray-50 flex items-center gap-1.5"
                >
                  {codeCopied ? <Check size={14} className="text-wp-green" /> : <Copy size={14} className="text-wp-icon" />}
                </button>
              </div>
              <a
                href={wpShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-wp-green text-white py-2.5 rounded-xl text-sm font-semibold w-full hover:bg-green-600 transition-colors"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Share on WhatsApp
              </a>
            </div>

            {/* Settings */}
            <div className="card divide-y divide-wp-border overflow-hidden">
              <Link href="/profile?tab=kyc" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Shield size={15} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-wp-text">KYC Verification</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    user.verificationStatus === 'VERIFIED'
                      ? 'bg-wp-green/10 text-wp-green'
                      : 'bg-orange-100 text-orange-600'
                  }`}>
                    {user.verificationStatus === 'VERIFIED' ? 'Verified' : 'Pending'}
                  </span>
                  <ChevronRight size={14} className="text-wp-icon" />
                </div>
              </Link>
              <Link href="/profile?tab=subscription" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Crown size={15} className="text-purple-600" />
                </div>
                <p className="flex-1 text-sm text-wp-text">Subscription & Billing</p>
                <ChevronRight size={14} className="text-wp-icon" />
              </Link>
              <Link href="/profile?tab=notifications" className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <TrendingUp size={15} className="text-orange-600" />
                </div>
                <p className="flex-1 text-sm text-wp-text">Notification Settings</p>
                <ChevronRight size={14} className="text-wp-icon" />
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3.5 w-full hover:bg-red-50 transition-colors"
              >
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                  <LogOut size={15} className="text-red-500" />
                </div>
                <p className="text-sm text-red-500 font-medium">Sign Out</p>
              </button>
            </div>

            <p className="text-center text-xs text-wp-text-secondary pb-4">
              PropConnect v1.0 · DPDP Act 2023 Compliant · 🔒 E2E Encrypted
            </p>
          </>
        ) : (
          /* Listings tab */
          <div className="space-y-4">
            {listings.length === 0 ? (
              <div className="text-center py-12 text-wp-text-secondary">
                <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-sm">No active listings</p>
                <Link href="/listings/new" className="mt-3 inline-block text-wp-green font-medium text-sm hover:underline">
                  Post your first listing →
                </Link>
              </div>
            ) : (
              listings.map(listing => <PropertyCard key={listing.id} listing={listing} />)
            )}
          </div>
        )}
      </div>

      {/* Edit profile sheet */}
      {showEdit && (
        <EditProfileSheet
          user={user}
          onClose={() => setShowEdit(false)}
          onSaved={updates => setUser(u => u ? { ...u, ...updates } : u)}
        />
      )}

      {/* Preferences sheet */}
      {showPreferences && (
        <PreferencesSheet
          onClose={() => setShowPreferences(false)}
          onSaved={() => {
            axios.get('/api/users/me').then(res => {
              if (res.data.success) setUser(res.data.data)
            }).catch(() => null)
          }}
        />
      )}
    </div>
  )
}

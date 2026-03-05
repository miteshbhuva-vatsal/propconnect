'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  CheckCircle, MapPin, Phone, Globe, Shield, Award,
  MessageSquare, Share2, Building2, ChevronLeft, Calendar,
} from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { buildWhatsappShareUrl, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, formatIndianPrice, timeAgo } from '@/lib/utils'
import PropertyCard from '@/components/PropertyCard'
import type { ListingCard } from '@/types'

interface PublicUser {
  id: string; name: string; phone: string; avatar: string | null
  role: string; verificationStatus: string
  companyName: string | null; designation: string | null
  city: string | null; state: string | null; bio: string | null
  website: string | null; reraNumber: string | null
  brokerScore: number; brokerRank: number | null
  totalDealsPosted: number; totalDealsClosed: number; createdAt: string
  _count: { listings: number; referrals: number }
  badges: string[]
  listings: ListingCard[]
}

const ROLE_LABELS: Record<string, string> = {
  DEVELOPER: 'Developer',
  INVESTOR: 'Investor',
  BROKER: 'Broker / Agent',
  SUPER_ADMIN: 'Admin',
  ADMIN: 'Admin',
}

const BADGE_META: Record<string, { icon: string; label: string; color: string }> = {
  FIRST_DEAL: { icon: '🎯', label: 'First Deal', color: 'bg-blue-50' },
  '10_DEALS': { icon: '🔟', label: '10 Deals', color: 'bg-green-50' },
  TOP_BROKER: { icon: '👑', label: 'Top Broker', color: 'bg-yellow-50' },
  VERIFIED: { icon: '✅', label: 'Verified', color: 'bg-teal-50' },
}

export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [user, setUser] = useState<PublicUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'about' | 'listings'>('about')
  const [startingChat, setStartingChat] = useState(false)

  useEffect(() => {
    if (!id) return
    axios.get(`/api/users/${id}`)
      .then(res => { if (res.data.success) setUser(res.data.data) })
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [id])

  const startChat = async () => {
    setStartingChat(true)
    try {
      const res = await axios.post('/api/messages', { recipientId: id, type: 'direct' })
      if (res.data.success) {
        window.location.href = `/messages/${res.data.data.id}`
      }
    } catch {
      // fallback to messages list
      window.location.href = '/messages'
    } finally {
      setStartingChat(false)
    }
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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-wp-text-secondary">
        <p className="font-medium">User not found</p>
        <Link href="/listings" className="mt-3 text-wp-green text-sm hover:underline">Browse listings</Link>
      </div>
    )
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
  const whatsappUrl = buildWhatsappShareUrl(
    `Hi ${user.name}, I found your profile on PropConnect and would like to connect regarding a property deal.`
  )
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/profile/${user.id}`

  return (
    <div className="pb-20">
      {/* Back nav */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        <Link href="/listings" className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={20} className="text-wp-icon" />
        </Link>
        <span className="text-sm text-wp-text-secondary">Back</span>
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-wp-teal via-wp-teal to-wp-green pt-4 pb-20 px-4">
        <div className="flex items-start gap-3">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl font-bold text-white border-2 border-white/30 shadow-lg flex-shrink-0">
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

        {user.brokerRank && (
          <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">
            #{user.brokerRank} Broker
          </div>
        )}
      </div>

      <div className="px-4 -mt-12 space-y-4">
        {/* Stats */}
        <div className="card shadow-md">
          <div className="grid grid-cols-4 divide-x divide-wp-border">
            {[
              { label: 'Listings', value: user._count.listings },
              { label: 'Closed', value: user.totalDealsClosed },
              { label: 'Score', value: user.brokerScore },
              { label: 'Referrals', value: user._count.referrals },
            ].map(stat => (
              <div key={stat.label} className="py-4 text-center">
                <p className="text-xl font-bold text-wp-teal">{stat.value}</p>
                <p className="text-[11px] text-wp-text-secondary mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact action buttons */}
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`tel:${user.phone}`}
            className="flex flex-col items-center gap-1.5 py-3 bg-wp-green text-white rounded-2xl font-medium text-xs hover:bg-green-600 transition-colors"
          >
            <Phone size={18} />
            Call
          </a>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-1.5 py-3 bg-white border border-wp-green text-wp-green rounded-2xl font-medium text-xs hover:bg-wp-green/5 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <button
            onClick={startChat}
            disabled={startingChat}
            className="flex flex-col items-center gap-1.5 py-3 bg-white border border-wp-border text-wp-text-secondary rounded-2xl font-medium text-xs hover:bg-gray-50 transition-colors disabled:opacity-60"
          >
            <MessageSquare size={18} />
            {startingChat ? '...' : 'Message'}
          </button>
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
              {tab === 'listings' ? `Listings (${user._count.listings})` : 'About'}
            </button>
          ))}
        </div>

        {activeTab === 'about' ? (
          <>
            {/* Bio */}
            {user.bio && (
              <div className="card p-4">
                <h2 className="font-semibold text-wp-text text-sm mb-2">About</h2>
                <p className="text-sm text-wp-text-secondary leading-relaxed">{user.bio}</p>
              </div>
            )}

            {/* Contact + credentials */}
            <div className="card p-4 space-y-3">
              <h2 className="font-semibold text-wp-text text-sm">Contact & Details</h2>
              <a href={`tel:${user.phone}`} className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-wp-green/10 rounded-lg flex items-center justify-center">
                  <Phone size={14} className="text-wp-green" />
                </div>
                <span className="text-wp-text">{user.phone}</span>
              </a>
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
                    <p className="text-[11px] text-wp-text-secondary">RERA Registered</p>
                    <p className="text-wp-text font-mono text-xs">{user.reraNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Badges */}
            {user.badges.length > 0 && (
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

            {/* Share profile */}
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({ title: `${user.name} on PropConnect`, url: shareUrl })
                } else {
                  navigator.clipboard.writeText(shareUrl)
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-wp-border rounded-2xl text-sm text-wp-text-secondary hover:bg-gray-50 transition-colors"
            >
              <Share2 size={15} />
              Share Profile
            </button>
          </>
        ) : (
          /* Listings tab */
          <div className="space-y-4">
            {user.listings.length === 0 ? (
              <div className="text-center py-12 text-wp-text-secondary">
                <Building2 size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-sm">No active listings</p>
              </div>
            ) : (
              user.listings.map(listing => <PropertyCard key={listing.id} listing={listing} />)
            )}
          </div>
        )}
      </div>
    </div>
  )
}

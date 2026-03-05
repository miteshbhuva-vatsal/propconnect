'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Bell, CheckCheck, MessageSquare, Home, TrendingUp, Award, AlertCircle, Gift, Star } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface Notification {
  id: string
  type: string
  title: string
  body: string
  data?: Record<string, string> | null
  isRead: boolean
  createdAt: string
}

const TYPE_META: Record<string, { icon: React.ReactNode; color: string }> = {
  NEW_MESSAGE:           { icon: <MessageSquare size={18} />,  color: 'bg-wp-teal/10 text-wp-teal' },
  NEW_MATCH:             { icon: <Home size={18} />,           color: 'bg-wp-green/10 text-wp-green-dark' },
  DEAL_REQUEST:          { icon: <TrendingUp size={18} />,     color: 'bg-blue-50 text-blue-600' },
  LISTING_APPROVED:      { icon: <CheckCheck size={18} />,     color: 'bg-wp-green/10 text-wp-green-dark' },
  LISTING_REJECTED:      { icon: <AlertCircle size={18} />,   color: 'bg-red-50 text-red-600' },
  SUBSCRIPTION_EXPIRING: { icon: <AlertCircle size={18} />,   color: 'bg-orange-50 text-orange-600' },
  DEAL_CREDIT_LOW:       { icon: <AlertCircle size={18} />,   color: 'bg-yellow-50 text-yellow-700' },
  REFERRAL_JOINED:       { icon: <Gift size={18} />,          color: 'bg-purple-50 text-purple-600' },
  RANK_CHANGED:          { icon: <Star size={18} />,          color: 'bg-yellow-50 text-yellow-700' },
  GENERAL:               { icon: <Bell size={18} />,          color: 'bg-gray-100 text-gray-600' },
}

function navTarget(notif: Notification): string | null {
  const d = notif.data || {}
  switch (notif.type) {
    case 'NEW_MESSAGE':    return d.conversationId ? `/messages/${d.conversationId}` : '/messages'
    case 'NEW_MATCH':      return d.listingSlug    ? `/p/${d.listingSlug}` : '/feed'
    case 'DEAL_REQUEST':   return d.conversationId ? `/messages/${d.conversationId}` : '/messages'
    case 'LISTING_APPROVED':
    case 'LISTING_REJECTED': return d.listingSlug ? `/p/${d.listingSlug}` : '/listings'
    default: return null
  }
}

function groupByDay(notifications: Notification[]) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups: { label: string; items: Notification[] }[] = []

  const map = new Map<string, Notification[]>()
  for (const n of notifications) {
    const day = new Date(n.createdAt).toDateString()
    const label = day === today ? 'Today' : day === yesterday ? 'Yesterday' : new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    if (!map.has(label)) map.set(label, [])
    map.get(label)!.push(n)
  }

  map.forEach((items, label) => groups.push({ label, items }))
  return groups
}

export default function NotificationsPage() {
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/notifications').then(res => {
      if (res.data.success) setNotifications(res.data.data.notifications)
    }).catch(() => null).finally(() => setLoading(false))

    // Mark all as read after 1.5s
    const t = setTimeout(() => {
      axios.patch('/api/notifications', {}).catch(() => null)
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const handleTap = (notif: Notification) => {
    const target = navTarget(notif)
    if (target) router.push(target)
  }

  const groups = groupByDay(notifications)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-wp-teal text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold text-base">Notifications</h1>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={() => {
                axios.patch('/api/notifications', {}).catch(() => null)
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
              }}
              className="text-xs text-white/80 hover:text-white flex items-center gap-1"
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="space-y-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-4 bg-white border-b border-gray-100 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3.5 bg-gray-200 rounded w-2/3" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-wp-text-secondary">
          <Bell size={44} className="text-gray-200 mb-4" />
          <p className="font-medium text-wp-text">All caught up!</p>
          <p className="text-sm mt-1">New matches, messages and deal updates will appear here.</p>
        </div>
      ) : (
        <div>
          {groups.map(({ label, items }) => (
            <div key={label}>
              <div className="px-4 py-2 bg-gray-100">
                <p className="text-xs font-semibold text-wp-text-secondary uppercase tracking-wide">{label}</p>
              </div>
              {items.map(notif => {
                const meta = TYPE_META[notif.type] || TYPE_META.GENERAL
                const tappable = !!navTarget(notif)
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleTap(notif)}
                    className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-100 transition-colors
                      ${!notif.isRead ? 'bg-wp-green/5' : 'bg-white'}
                      ${tappable ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                      {meta.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-snug ${notif.isRead ? 'text-wp-text font-normal' : 'text-wp-text font-semibold'}`}>
                          {notif.title}
                        </p>
                        <span className="text-xs text-wp-text-secondary flex-shrink-0 mt-0.5">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>
                      <p className="text-xs text-wp-text-secondary mt-0.5 leading-relaxed">{notif.body}</p>
                    </div>

                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div className="w-2.5 h-2.5 bg-wp-green rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

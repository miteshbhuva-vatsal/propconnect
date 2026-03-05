'use client'

import { useState, useEffect } from 'react'
import {
  Users, Building2, TrendingUp, CreditCard,
  Clock, CheckCircle, XCircle, BarChart3
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import axios from 'axios'
import { timeAgo } from '@/lib/utils'

interface Analytics {
  users: {
    total: number; active30d: number; newLast7d: number
    byRole: Record<string, number>
  }
  listings: {
    total: number; pending: number; approved: number
    byType: Record<string, number>
  }
  crm: { totalLeads: number; closedLeads: number; conversionRate: string }
  revenue: { paidSubscriptions: number }
}

const PIE_COLORS = ['#075E54', '#128C7E', '#25D366', '#DCF8C6', '#A8E6CF', '#3D9970']

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [pendingListings, setPendingListings] = useState<unknown[]>([])

  useEffect(() => {
    Promise.all([
      axios.get('/api/admin/analytics'),
      axios.get('/api/admin/listings?status=PENDING_REVIEW&limit=5'),
    ]).then(([analyticsRes, listingsRes]) => {
      if (analyticsRes.data.success) setData(analyticsRes.data.data)
      if (listingsRes.data.success) setPendingListings(listingsRes.data.data.data)
    }).catch(() => null).finally(() => setLoading(false))
  }, [])

  const STAT_CARDS = data ? [
    { label: 'Total Users', value: data.users.total.toLocaleString(), icon: Users, color: 'bg-blue-50 text-blue-600', change: `+${data.users.newLast7d} this week` },
    { label: 'Active 30d', value: data.users.active30d.toLocaleString(), icon: TrendingUp, color: 'bg-wp-green/10 text-wp-green-dark', change: `${((data.users.active30d / Math.max(data.users.total, 1)) * 100).toFixed(1)}% of total` },
    { label: 'Live Listings', value: data.listings.approved.toLocaleString(), icon: Building2, color: 'bg-purple-50 text-purple-600', change: `${data.listings.pending} pending review` },
    { label: 'Paid Subs', value: data.revenue.paidSubscriptions.toLocaleString(), icon: CreditCard, color: 'bg-orange-50 text-orange-600', change: 'Active subscriptions' },
  ] : []

  const roleData = data ? Object.entries(data.users.byRole).map(([name, value]) => ({ name, value })) : []
  const listingTypeData = data ? Object.entries(data.listings.byType).slice(0, 6).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value })) : []

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="card h-28 animate-pulse" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-wp-text">Dashboard</h1>
        <p className="text-wp-text-secondary text-sm mt-0.5">PropConnect platform overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => (
          <div key={card.label} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-wp-text-secondary">{card.label}</span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon size={18} />
              </div>
            </div>
            <p className="text-2xl font-bold text-wp-text">{card.value}</p>
            <p className="text-xs text-wp-text-secondary mt-1">{card.change}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Listings by type bar chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-wp-text mb-4">Listings by Property Type</h3>
          {listingTypeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={listingTypeData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E9EDEF" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#25D366" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-wp-text-secondary text-sm">No data yet</div>
          )}
        </div>

        {/* Users by role pie chart */}
        <div className="card p-5">
          <h3 className="font-semibold text-wp-text mb-4">Users by Role</h3>
          {roleData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={roleData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                    {roleData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {roleData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-wp-text-secondary capitalize">{item.name.toLowerCase()}</span>
                    <span className="font-semibold text-wp-text ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-wp-text-secondary text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* CRM overview */}
      {data && (
        <div className="card p-5">
          <h3 className="font-semibold text-wp-text mb-4">CRM Performance</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-wp-text">{data.crm.totalLeads}</p>
              <p className="text-xs text-wp-text-secondary">Total Leads</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-wp-green">{data.crm.closedLeads}</p>
              <p className="text-xs text-wp-text-secondary">Deals Closed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-wp-teal">{data.crm.conversionRate}%</p>
              <p className="text-xs text-wp-text-secondary">Conversion Rate</p>
            </div>
          </div>
          <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-wp-green h-2 rounded-full transition-all"
              style={{ width: `${Math.min(Number(data.crm.conversionRate), 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Pending listings */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-wp-text">Pending Approvals</h3>
          <a href="/admin/listings?status=PENDING_REVIEW" className="text-xs text-wp-green font-medium hover:underline">
            View all
          </a>
        </div>
        {pendingListings.length === 0 ? (
          <div className="flex items-center gap-2 text-wp-text-secondary text-sm py-4 justify-center">
            <CheckCircle size={16} className="text-wp-green" />
            All caught up! No pending listings.
          </div>
        ) : (
          <div className="space-y-3">
            {(pendingListings as Array<{ id: string; title: string; city: string; user: { name: string }; createdAt: string }>).map(listing => (
              <div key={listing.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-200">
                <div>
                  <p className="font-medium text-sm text-wp-text">{listing.title}</p>
                  <p className="text-xs text-wp-text-secondary">
                    {listing.city} · by {listing.user?.name} · {timeAgo(listing.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/admin/listings?id=${listing.id}`}
                    className="p-2 bg-wp-green/10 hover:bg-wp-green/20 text-wp-green rounded-lg transition-colors"
                    title="Approve"
                  >
                    <CheckCircle size={16} />
                  </a>
                  <a
                    href={`/admin/listings?id=${listing.id}`}
                    className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                    title="Reject"
                  >
                    <XCircle size={16} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

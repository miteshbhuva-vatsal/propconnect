'use client'

import { useState, useEffect } from 'react'
import { Search, CheckCircle, XCircle, Eye } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { timeAgo, PROPERTY_TYPE_LABELS, DEAL_TYPE_LABELS, formatIndianPrice } from '@/lib/utils'

interface AdminListing {
  id: string; title: string; propertyType: string; dealType: string
  status: string; city: string; state: string; price: string | null
  priceOnRequest: boolean; createdAt: string; rejectionReason?: string
  user: { id: string; name: string; role: string; verificationStatus: string }
}

const STATUS_TABS = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED']
const STATUS_COLORS: Record<string, string> = {
  PENDING_REVIEW: 'badge-pending',
  APPROVED: 'badge-verified',
  REJECTED: 'badge-rejected',
  DRAFT: 'text-xs text-gray-500',
  EXPIRED: 'text-xs text-gray-400',
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<AdminListing[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [activeTab, setActiveTab] = useState('PENDING_REVIEW')
  const [rejectModal, setRejectModal] = useState<{ id: string; title: string } | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState('')

  const fetchListings = async () => {
    setLoading(true)
    try {
      const status = activeTab === 'ALL' ? '' : activeTab
      const res = await axios.get(`/api/admin/listings${status ? `?status=${status}` : ''}`)
      if (res.data.success) {
        setListings(res.data.data.data)
        setTotal(res.data.data.total)
      }
    } catch {
      null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchListings() }, [activeTab])

  const approve = async (id: string) => {
    setActionLoading(id + 'approve')
    try {
      await axios.post(`/api/admin/listings/${id}/approve`, { action: 'approve' })
      toast.success('Listing approved and live!')
      fetchListings()
    } catch {
      toast.error('Failed to approve')
    } finally {
      setActionLoading('')
    }
  }

  const reject = async () => {
    if (!rejectModal) return
    setActionLoading(rejectModal.id + 'reject')
    try {
      await axios.post(`/api/admin/listings/${rejectModal.id}/approve`, {
        action: 'reject',
        reason: rejectReason,
      })
      toast.success('Listing rejected')
      setRejectModal(null)
      setRejectReason('')
      fetchListings()
    } catch {
      toast.error('Failed to reject')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-wp-text">Listings</h1>
          <p className="text-sm text-wp-text-secondary">{total} listings</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-5 overflow-x-auto hide-scrollbar">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-wp-teal shadow-sm'
                : 'text-wp-text-secondary hover:text-wp-text'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.replace(/_/g, ' ')}
            {tab === 'PENDING_REVIEW' && total > 0 && activeTab !== tab && (
              <span className="ml-1.5 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                {total}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Listings */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)
        ) : listings.length === 0 ? (
          <div className="card p-12 text-center text-wp-text-secondary">
            <CheckCircle size={32} className="mx-auto mb-2 text-gray-200" />
            <p>No listings in this category</p>
          </div>
        ) : listings.map(listing => (
          <div key={listing.id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={STATUS_COLORS[listing.status] || 'text-xs text-gray-500'}>
                    {listing.status.replace(/_/g, ' ')}
                  </span>
                  <span className="tag bg-gray-100 text-gray-600 text-xs">
                    {PROPERTY_TYPE_LABELS[listing.propertyType] || listing.propertyType}
                  </span>
                  <span className="tag bg-blue-50 text-blue-700 text-xs">
                    {DEAL_TYPE_LABELS[listing.dealType] || listing.dealType}
                  </span>
                </div>

                <h3 className="font-semibold text-wp-text text-sm">{listing.title}</h3>
                <p className="text-xs text-wp-text-secondary mt-0.5">
                  {listing.city}, {listing.state}
                  {listing.price && ` · ${formatIndianPrice(Number(listing.price))}`}
                  {listing.priceOnRequest && ' · Price on Request'}
                </p>

                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="w-5 h-5 bg-wp-teal rounded-full flex items-center justify-center text-white text-[9px] font-bold">
                    {listing.user.name[0]}
                  </div>
                  <span className="text-xs text-wp-text-secondary">
                    {listing.user.name} · {listing.user.role} · {timeAgo(listing.createdAt)}
                  </span>
                </div>

                {listing.rejectionReason && (
                  <p className="text-xs text-red-600 mt-1.5 bg-red-50 px-2 py-1 rounded">
                    Rejected: {listing.rejectionReason}
                  </p>
                )}
              </div>

              {listing.status === 'PENDING_REVIEW' && (
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => approve(listing.id)}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1 bg-wp-green/10 hover:bg-wp-green/20 text-wp-green-dark text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                  >
                    <CheckCircle size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejectModal({ id: listing.id, title: listing.title })}
                    disabled={!!actionLoading}
                    className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium px-3 py-2 rounded-xl transition-colors"
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <h2 className="font-semibold text-wp-text mb-1">Reject Listing</h2>
            <p className="text-sm text-wp-text-secondary mb-4">"{rejectModal.title}"</p>
            <label className="input-label">Reason for rejection (sent to user)</label>
            <textarea
              className="input-field resize-none mb-4"
              rows={3}
              placeholder="e.g. Missing required documents, price mismatch..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={reject}
                disabled={!rejectReason.trim() || !!actionLoading}
                className="btn-danger flex-1"
              >
                Reject Listing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Search, CheckCircle, XCircle, Ban, RefreshCw,
  Shield, User, ChevronDown
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { timeAgo, cn } from '@/lib/utils'

interface AdminUser {
  id: string; name: string; avatar: string | null; role: string; phone: string
  email: string | null; companyName: string | null; verificationStatus: string
  isActive: boolean; isSuspended: boolean; dealCreditsUsed: number
  dealCreditsLimit: number; totalDealsPosted: number; totalDealsClosed: number
  createdAt: string; lastActiveAt: string | null
  subscription?: { plan: string; expiresAt: string | null } | null
  _count?: { listings: number; referrals: number }
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-700',
  ADMIN: 'bg-orange-100 text-orange-700',
  DEVELOPER: 'bg-blue-100 text-blue-700',
  INVESTOR: 'bg-purple-100 text-purple-700',
  BROKER: 'bg-wp-green/10 text-wp-green-dark',
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const [actionLoading, setActionLoading] = useState('')

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('q', search)
      if (role) params.set('role', role)
      if (status) params.set('status', status)
      const res = await axios.get(`/api/admin/users?${params}`)
      if (res.data.success) {
        setUsers(res.data.data.data)
        setTotal(res.data.data.total)
      }
    } catch {
      null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [search, role, status])

  const performAction = async (userId: string, action: string, extra?: Record<string, unknown>) => {
    setActionLoading(userId + action)
    try {
      await axios.post(`/api/admin/users/${userId}/action`, { action, ...extra })
      toast.success(`Action "${action}" completed`)
      fetchUsers()
      setSelectedUser(null)
    } catch {
      toast.error('Action failed')
    } finally {
      setActionLoading('')
    }
  }

  return (
    <div className="p-4 lg:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-wp-text">User Management</h1>
          <p className="text-sm text-wp-text-secondary">{total.toLocaleString()} total users</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4 mb-5 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-icon" />
          <input
            className="input-field pl-9"
            placeholder="Search by name or company..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select className="input-field text-sm" value={role} onChange={e => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="BROKER">Broker</option>
            <option value="DEVELOPER">Developer</option>
            <option value="INVESTOR">Investor</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select className="input-field text-sm" value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* User table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-wp-border">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-wp-text-secondary">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-wp-text-secondary">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-wp-text-secondary">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-wp-text-secondary">Plan</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-wp-text-secondary">Deals</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-wp-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-wp-border">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-wp-teal rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {user.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-wp-text">{user.name}</p>
                        <p className="text-xs text-wp-text-secondary">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`tag text-xs ${ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {user.isSuspended ? (
                        <span className="badge-rejected">Suspended</span>
                      ) : user.verificationStatus === 'VERIFIED' ? (
                        <span className="badge-verified">Verified</span>
                      ) : user.verificationStatus === 'PENDING' ? (
                        <span className="badge-pending">KYC Pending</span>
                      ) : (
                        <span className="text-xs text-wp-text-secondary">Unverified</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-wp-text">{user.subscription?.plan || 'FREE'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-wp-text-secondary">
                      {user.dealCreditsUsed}/{user.dealCreditsLimit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {user.verificationStatus === 'PENDING' && (
                        <button
                          onClick={() => performAction(user.id, 'verify')}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-wp-green/10 hover:bg-wp-green/20 text-wp-green rounded-lg transition-colors"
                          title="Verify user"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      {!user.isSuspended ? (
                        <button
                          onClick={() => performAction(user.id, 'suspend', { reason: 'Policy violation' })}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                          title="Suspend user"
                        >
                          <Ban size={14} />
                        </button>
                      ) : (
                        <button
                          onClick={() => performAction(user.id, 'activate')}
                          disabled={!!actionLoading}
                          className="p-1.5 bg-wp-green/10 hover:bg-wp-green/20 text-wp-green rounded-lg transition-colors"
                          title="Activate user"
                        >
                          <RefreshCw size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => performAction(user.id, 'reset_credits')}
                        disabled={!!actionLoading}
                        className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors"
                        title="Reset credits"
                      >
                        <RefreshCw size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && users.length === 0 && (
            <div className="text-center py-12 text-wp-text-secondary">
              <User size={32} className="mx-auto mb-2 text-gray-300" />
              <p>No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

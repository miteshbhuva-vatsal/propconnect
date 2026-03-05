'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Building2, CreditCard,
  BarChart3, Shield, LogOut, Menu, X, FolderOpen,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/listings', icon: Building2, label: 'Listings' },
  { href: '/admin/projects', icon: FolderOpen, label: 'Projects' },
  { href: '/admin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
]

function NavLink({ href, icon: Icon, label, exact, onClose }: {
  href: string; icon: React.ElementType; label: string; exact?: boolean; onClose?: () => void
}) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
        isActive
          ? 'bg-wp-green text-white shadow-sm'
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-200 fixed top-0 left-0 h-full z-40">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-wp-teal rounded-xl flex items-center justify-center">
              <Shield size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-wp-teal text-sm">PropConnect</p>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(item => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <Link
            href="/feed"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LogOut size={18} />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-wp-teal text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} />
          <span className="font-bold">Admin Panel</span>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-64 h-full p-4 pt-16" onClick={e => e.stopPropagation()}>
            <nav className="space-y-1">
              {NAV_ITEMS.map(item => (
                <NavLink key={item.href} {...item} onClose={() => setMobileMenuOpen(false)} />
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  )
}

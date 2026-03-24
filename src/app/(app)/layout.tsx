'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, MessageSquare, BarChart3, User, Plus, Bell, ArrowLeft } from 'lucide-react'
import axios from 'axios'

const NAV_ITEMS = [
  { href: '/feed',     icon: Home,           label: 'Feed'     },
  { href: '/listings', icon: Search,         label: 'Listings' },
  { href: '/messages', icon: MessageSquare,  label: 'Messages' },
  { href: '/crm',      icon: BarChart3,      label: 'CRM'      },
  { href: '/profile',  icon: User,           label: 'Profile'  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)

  // Determine if we should show a back button
  // We show it if we're NOT on one of the main tab root pages
  const isTabRoot = NAV_ITEMS.some(item => item.href === pathname)
  const showBackButton = !isTabRoot && pathname !== '/'

  // Fetch unread notification count on mount + every 30s
  useEffect(() => {
    const fetchUnread = () => {
      axios.get('/api/notifications').then(res => {
        if (res.data.success) setUnreadCount(res.data.data.unreadCount)
      }).catch(() => null)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => clearInterval(interval)
  }, [])

  // Reset badge when visiting notifications page
  useEffect(() => {
    if (pathname === '/notifications') setUnreadCount(0)
  }, [pathname])

  // Auto-refresh access token on 401
  useEffect(() => {
    let isRefreshing = false

    const interceptor = axios.interceptors.response.use(
      res => res,
      async error => {
        const originalRequest = error.config
        if (error.response?.status === 401 && !originalRequest._retry && !isRefreshing) {
          originalRequest._retry = true
          isRefreshing = true
          try {
            await axios.post('/api/auth/refresh')
            isRefreshing = false
            return axios(originalRequest)
          } catch {
            isRefreshing = false
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )

    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-2xl mx-auto relative">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-wp-teal text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {showBackButton && (
            <button
              onClick={() => router.back()}
              className="p-1 -ml-1 hover:bg-white/10 rounded-full transition-colors flex items-center justify-center"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>
          )}
          <span className="font-bold text-base">PropConnect</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/listings?q=" className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Search size={20} />
          </Link>
          <Link href="/notifications" className="p-2 hover:bg-white/10 rounded-lg transition-colors relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pb-20 overflow-y-auto">
        {children}
      </main>

      {/* FAB — add listing */}
      <Link
        href="/listings/new"
        className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-wp-green rounded-full
                   flex items-center justify-center shadow-lg
                   hover:bg-green-500 transition-all duration-200
                   active:scale-95 animate-pulse-green"
      >
        <Plus size={26} className="text-white" />
      </Link>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} className={`nav-tab ${isActive ? 'active' : ''}`}>
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'text-wp-green' : 'text-wp-icon'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

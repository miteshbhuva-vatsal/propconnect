'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Lock, MessageSquare, Users } from 'lucide-react'
import axios from 'axios'
import { chatTime, cn } from '@/lib/utils'
import CommunityFeed from './CommunityFeed'

interface Conversation {
  id: string
  type: string
  name?: string
  members: {
    user: { id: string; name: string; avatar: string | null; verificationStatus: string }
  }[]
  messages: {
    id: string; messageType: string; plaintext?: string;
    mediaUrl?: string; createdAt: string; senderId: string
  }[]
  unreadCount: number
}

function getOtherUser(conv: Conversation, currentUserId: string) {
  return conv.members.find(m => m.user.id !== currentUserId)?.user
}

function getLastMessagePreview(msg: Conversation['messages'][0]): string {
  if (!msg) return 'Start a conversation'
  if (msg.messageType === 'IMAGE') return '📷 Photo'
  if (msg.messageType === 'DOCUMENT') return '📄 Document'
  if (msg.messageType === 'VOICE') return '🎙️ Voice message'
  if (msg.messageType === 'PROPERTY_CARD') return '🏠 Property shared'
  if (msg.messageType === 'DEAL_REQUEST') return '🤝 Deal Request'
  return msg.plaintext || '•••'
}

export default function MessagesPage() {
  const [tab, setTab] = useState<'chats' | 'community'>('chats')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserCity, setCurrentUserCity] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    setCurrentUserId(user?.id || null)
    // Fetch city from profile
    axios.get('/api/users/me').then(res => {
      if (res.data.success) setCurrentUserCity(res.data.data.city || null)
    }).catch(() => null)
  }, [])

  useEffect(() => {
    if (tab !== 'chats') return
    axios.get('/api/messages').then(res => {
      if (res.data.success) setConversations(res.data.data)
    }).catch(() => null).finally(() => setLoading(false))
  }, [tab])

  const filtered = conversations.filter(conv => {
    if (!search) return true
    const other = getOtherUser(conv, currentUserId || '')
    return other?.name.toLowerCase().includes(search.toLowerCase())
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tab switcher */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex">
          <button
            onClick={() => setTab('chats')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2',
              tab === 'chats'
                ? 'text-wp-green border-wp-green'
                : 'text-wp-text-secondary border-transparent hover:text-wp-text'
            )}
          >
            <MessageSquare size={16} />
            Chats
          </button>
          <button
            onClick={() => setTab('community')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold transition-colors border-b-2',
              tab === 'community'
                ? 'text-wp-green border-wp-green'
                : 'text-wp-text-secondary border-transparent hover:text-wp-text'
            )}
          >
            <Users size={16} />
            Community
          </button>
        </div>
      </div>

      {/* Chats tab */}
      {tab === 'chats' && (
        <div>
          {/* E2E notice */}
          <div className="bg-wp-green/10 px-4 py-2 flex items-center justify-center gap-1.5">
            <Lock size={11} className="text-wp-text-secondary" />
            <span className="text-xs text-wp-text-secondary">Messages are end-to-end encrypted</span>
          </div>

          {/* Search */}
          <div className="px-4 py-3 border-b border-wp-border bg-white">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-icon" />
              <input
                className="input-field pl-9"
                placeholder="Search conversations"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          {loading ? (
            <div className="space-y-0">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-4 animate-pulse border-b border-wp-border bg-white">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-wp-text-secondary">
              <MessageSquare size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No conversations yet</p>
              <p className="text-sm mt-1">Express interest in a listing to start chatting</p>
            </div>
          ) : (
            <div className="bg-white">
              {filtered.map(conv => {
                const other = getOtherUser(conv, currentUserId || '')
                const lastMsg = conv.messages[0]
                const isUnread = conv.unreadCount > 0

                return (
                  <Link
                    key={conv.id}
                    href={`/messages/${conv.id}`}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors border-b border-wp-border active:bg-gray-100"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-wp-teal rounded-full flex items-center justify-center text-white font-bold text-base">
                        {other?.name?.[0] || '?'}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-wp-green rounded-full border-2 border-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-sm truncate', isUnread ? 'font-semibold text-wp-text' : 'font-medium text-wp-text')}>
                          {other?.name || conv.name || 'Unknown'}
                        </span>
                        <span className={cn('text-xs flex-shrink-0 ml-2', isUnread ? 'text-wp-green font-medium' : 'text-wp-text-secondary')}>
                          {lastMsg ? chatTime(lastMsg.createdAt) : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className={cn('text-xs truncate max-w-[200px]', isUnread ? 'text-wp-text font-medium' : 'text-wp-text-secondary')}>
                          {getLastMessagePreview(lastMsg)}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-wp-green text-white text-xs font-bold min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 flex-shrink-0 ml-2">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Community tab */}
      {tab === 'community' && currentUserId && (
        <CommunityFeed
          currentUserId={currentUserId}
          currentUserCity={currentUserCity}
        />
      )}
    </div>
  )
}

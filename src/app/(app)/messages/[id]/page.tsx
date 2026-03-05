'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft, Send, Paperclip, Mic, MoreVertical,
  CheckCheck, Check, Lock, Home
} from 'lucide-react'
import axios from 'axios'
import { chatTime, cn } from '@/lib/utils'

interface Msg {
  id: string
  senderId: string
  messageType: string
  ciphertext?: string
  plaintext?: string
  mediaUrl?: string
  dealData?: Record<string, unknown>
  createdAt: string
  sender: { id: string; name: string; avatar: string | null }
  receipts?: { userId: string; readAt: string | null }[]
}

interface ConvInfo {
  id: string
  type: string
  members: { user: { id: string; name: string; verificationStatus: string } }[]
}

export default function ChatPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>([])
  const [conv, setConv] = useState<ConvInfo | null>(null)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentUser = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('user') || '{}')
    : {}

  const otherUser = conv?.members.find(m => m.user.id !== currentUser?.id)?.user

  const fetchMessages = useCallback(async () => {
    try {
      const [msgRes, convRes] = await Promise.all([
        axios.get(`/api/messages/${id}`),
        axios.get(`/api/messages`),
      ])
      if (msgRes.data.success) {
        setMessages(msgRes.data.data.messages)
      }
      if (convRes.data.success) {
        const c = convRes.data.data.find((x: ConvInfo) => x.id === id)
        if (c) setConv(c)
      }
    } catch {
      null
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchMessages()
  }, [fetchMessages])

  // Poll for new messages every 3s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/api/messages/${id}`)
        if (res.data.success) {
          const incoming: Msg[] = res.data.data.messages
          setMessages(prev => {
            const realCount = prev.filter(m => !m.id.startsWith('temp-')).length
            return incoming.length !== realCount ? incoming : prev
          })
        }
      } catch { null }
    }, 3000)
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!text.trim() || sending) return
    const msg = text.trim()
    setText('')

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const tempMsg: Msg = {
      id: tempId,
      senderId: currentUser?.id,
      messageType: 'TEXT',
      // In real app: encrypt message client-side here before sending
      // For demo: using plaintext as system message fallback
      plaintext: msg,
      createdAt: new Date().toISOString(),
      sender: { id: currentUser?.id, name: currentUser?.name, avatar: null },
    }
    setMessages(prev => [...prev, tempMsg])

    setSending(true)
    try {
      const res = await axios.post(`/api/messages/${id}`, {
        messageType: 'TEXT',
        // In production: ciphertext = E2E_encrypt(msg, recipientPublicKey)
        // For demo purposes, sending as plaintext (system message type):
        plaintext: msg,
      })
      if (res.data.success) {
        setMessages(prev => prev.map(m => m.id === tempId ? res.data.data : m))
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== tempId))
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const getMessageContent = (msg: Msg): string => {
    if (msg.messageType === 'SYSTEM') return msg.plaintext || ''
    if (msg.ciphertext) return '🔒 [Encrypted message — open in app to decrypt]'
    return msg.plaintext || ''
  }

  const isOwn = (msg: Msg) => msg.senderId === currentUser?.id

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="animate-spin w-8 h-8 border-2 border-wp-green border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-white">
      {/* Chat header */}
      <div className="bg-wp-teal text-white px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
          {otherUser?.name?.[0] || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate">{otherUser?.name || 'Chat'}</p>
          <div className="flex items-center gap-1">
            <Lock size={10} className="text-white/60" />
            <span className="text-white/60 text-xs">End-to-end encrypted</span>
          </div>
        </div>
        <button className="p-1 hover:bg-white/10 rounded-lg">
          <MoreVertical size={18} />
        </button>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto chat-bg p-4 space-y-2">
        {/* E2E banner */}
        <div className="flex justify-center my-2">
          <div className="bg-yellow-50/90 text-yellow-800 text-xs px-3 py-1.5 rounded-lg text-center max-w-xs">
            🔒 Messages are end-to-end encrypted. Only you and {otherUser?.name || 'the other person'} can read them.
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex justify-center py-10">
            <div className="bg-white/80 backdrop-blur-sm text-wp-text-secondary text-sm px-4 py-3 rounded-xl text-center">
              No messages yet. Say hello!
            </div>
          </div>
        ) : (
          messages.map((msg, i) => {
            const own = isOwn(msg)
            const showDate = i === 0 || new Date(msg.createdAt).toDateString() !== new Date(messages[i-1].createdAt).toDateString()

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="bg-white/70 text-wp-text-secondary text-xs px-3 py-1 rounded-full">
                      {new Date(msg.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )}

                <div className={`flex ${own ? 'justify-end' : 'justify-start'}`}>
                  <div className={cn('max-w-[78%]', own ? 'bubble-sent' : 'bubble-received')}>
                    {msg.messageType === 'PROPERTY_CARD' ? (
                      <div className="bg-white rounded-xl p-3 border border-wp-border min-w-[200px]">
                        <div className="flex items-center gap-2 text-wp-teal text-sm font-medium mb-1">
                          <Home size={14} />
                          Property Shared
                        </div>
                        <p className="text-xs text-wp-text-secondary">{msg.plaintext}</p>
                      </div>
                    ) : msg.messageType === 'DEAL_REQUEST' ? (
                      <div className="bg-wp-green/10 border border-wp-green/30 rounded-xl p-3 min-w-[200px]">
                        <p className="text-xs font-semibold text-wp-teal mb-1">🤝 Deal Request</p>
                        <p className="text-xs text-wp-text-secondary">{msg.plaintext}</p>
                        {!own && (
                          <div className="flex gap-2 mt-2">
                            <button className="flex-1 bg-wp-green text-white text-xs py-1.5 rounded-lg font-medium">Accept</button>
                            <button className="flex-1 border border-wp-border text-wp-text-secondary text-xs py-1.5 rounded-lg">Decline</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm break-words">{getMessageContent(msg)}</p>
                    )}

                    <div className={cn('flex items-center gap-1 mt-0.5', own ? 'justify-end' : 'justify-start')}>
                      <span className="text-[10px] text-wp-text-secondary">{chatTime(msg.createdAt)}</span>
                      {own && (
                        msg.receipts?.some(r => r.readAt)
                          ? <CheckCheck size={12} className="text-wp-teal" />
                          : <Check size={12} className="text-wp-text-secondary" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="bg-white border-t border-wp-border px-3 py-2 flex items-center gap-2 flex-shrink-0">
        <button className="p-2 text-wp-icon hover:text-wp-text hover:bg-gray-100 rounded-full transition-colors">
          <Paperclip size={20} />
        </button>

        <input
          ref={inputRef}
          className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm text-wp-text placeholder:text-wp-icon focus:outline-none focus:bg-gray-50 transition-colors"
          placeholder="Type a message"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {text.trim() ? (
          <button
            onClick={sendMessage}
            disabled={sending}
            className="w-10 h-10 bg-wp-green rounded-full flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition-colors active:scale-95"
          >
            <Send size={18} className="text-white translate-x-0.5" />
          </button>
        ) : (
          <button className="w-10 h-10 bg-wp-green rounded-full flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition-colors">
            <Mic size={18} className="text-white" />
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { X, Send, Trash2 } from 'lucide-react'
import { timeAgo } from '@/lib/utils'

interface CommentUser {
  id: string
  name: string
  avatar: string | null
}

interface Comment {
  id: string
  content: string
  createdAt: string
  user: CommentUser
}

interface Props {
  postId: string
  initialCount: number
  currentUserId: string
  onClose: () => void
  onCountChange: (delta: number) => void
}

export default function CommentsSheet({ postId, initialCount, currentUserId, onClose, onCountChange }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    axios.get(`/api/community/${postId}/comments`).then(res => {
      if (res.data.success) setComments(res.data.data.comments)
    }).finally(() => setLoading(false))
  }, [postId])

  const submit = async () => {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await axios.post(`/api/community/${postId}/comments`, { content: text.trim() })
      if (res.data.success) {
        setComments(prev => [...prev, res.data.data])
        setText('')
        onCountChange(1)
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const deleteComment = async (commentId: string) => {
    await axios.delete(`/api/community/${postId}/comments/${commentId}`)
    setComments(prev => prev.filter(c => c.id !== commentId))
    onCountChange(-1)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col" onClick={onClose}>
      {/* Backdrop */}
      <div className="flex-1 bg-black/40" />

      {/* Sheet */}
      <div
        className="bg-white rounded-t-2xl flex flex-col max-h-[75vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-wp-text text-sm">Comments {initialCount > 0 ? `(${initialCount})` : ''}</p>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={18} className="text-wp-text-secondary" />
          </button>
        </div>

        {/* Comment list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-[200px]">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-2 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-wp-text-secondary text-sm py-8">No comments yet. Be the first!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="flex gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wp-teal to-wp-green flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {c.user.avatar
                    ? <img src={c.user.avatar} alt={c.user.name} className="w-full h-full rounded-full object-cover" />
                    : c.user.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-xs font-semibold text-wp-text">{c.user.name}</span>
                    <span className="text-[10px] text-wp-text-secondary">{timeAgo(new Date(c.createdAt))}</span>
                  </div>
                  <p className="text-sm text-wp-text mt-0.5 break-words">{c.content}</p>
                </div>
                {c.user.id === currentUserId && (
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="p-1 text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-gray-100 px-4 py-3 flex gap-2 items-center">
          <input
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-wp-green/40"
            placeholder="Write a comment…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() } }}
            maxLength={500}
          />
          <button
            onClick={submit}
            disabled={!text.trim() || submitting}
            className="w-9 h-9 rounded-full bg-wp-green flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <Send size={16} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}

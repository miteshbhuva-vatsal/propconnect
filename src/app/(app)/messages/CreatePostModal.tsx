'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { X, ImagePlus, Link2, Plus } from 'lucide-react'
import { detectLinkType } from '@/lib/utils'
import type { CommunityPost } from './PostCard'

interface Props {
  onClose: () => void
  onCreated: (post: CommunityPost) => void
  editPost?: CommunityPost
}

export default function CreatePostModal({ onClose, onCreated, editPost }: Props) {
  const [content, setContent] = useState(editPost?.content || '')
  const [images, setImages] = useState<string[]>(editPost?.images || [])
  const [imgInput, setImgInput] = useState('')
  const [linkUrl, setLinkUrl] = useState(editPost?.linkUrl || '')
  const [submitting, setSubmitting] = useState(false)

  // Auto-focus
  useEffect(() => {
    const el = document.getElementById('post-textarea')
    el?.focus()
  }, [])

  const addImage = () => {
    const url = imgInput.trim()
    if (!url || images.includes(url)) return
    setImages(prev => [...prev, url])
    setImgInput('')
  }

  const canPost = content.trim() || images.length > 0 || linkUrl.trim()
  const linkType = linkUrl.trim() ? detectLinkType(linkUrl.trim()) : null

  const handleSubmit = async () => {
    if (!canPost || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        content: content.trim() || null,
        images,
        linkUrl: linkUrl.trim() || null,
      }
      const res = editPost
        ? await axios.patch(`/api/community/${editPost.id}`, payload)
        : await axios.post('/api/community', payload)

      if (res.data.success) {
        onCreated(res.data.data)
        toast.success(editPost ? 'Post updated!' : 'Post shared!')
        onClose()
      }
    } catch {
      toast.error('Failed to save post')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-t-2xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="font-bold text-wp-text">{editPost ? 'Edit Post' : 'Create Post'}</span>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} className="text-wp-text-secondary" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Text */}
          <textarea
            id="post-textarea"
            className="w-full resize-none text-sm text-wp-text placeholder-gray-400 outline-none min-h-[100px]"
            placeholder="What's on your mind? Share a deal update, market insight, or property news…"
            value={content}
            onChange={e => setContent(e.target.value)}
            maxLength={1000}
          />
          {content.length > 800 && (
            <p className="text-xs text-right text-wp-text-secondary">{content.length}/1000</p>
          )}

          {/* Image URLs */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-wp-text-secondary mb-2">
              <ImagePlus size={13} /> Photos (paste image URL)
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 input-field text-sm py-2"
                placeholder="https://example.com/image.jpg"
                value={imgInput}
                onChange={e => setImgInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addImage() } }}
              />
              <button
                onClick={addImage}
                disabled={!imgInput.trim()}
                className="px-3 py-2 bg-wp-teal/10 text-wp-teal rounded-xl text-sm font-medium hover:bg-wp-teal/20 disabled:opacity-40 transition-colors flex items-center gap-1"
              >
                <Plus size={15} /> Add
              </button>
            </div>
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-2">
                {images.map((img, i) => (
                  <div key={i} className="relative group w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = '' }}
                    />
                    <button
                      onClick={() => setImages(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link / Embed */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-wp-text-secondary mb-2">
              <Link2 size={13} /> Link (YouTube, Instagram, or any URL)
            </div>
            <input
              className="w-full input-field text-sm py-2"
              placeholder="https://youtube.com/watch?v=… or https://instagram.com/reel/…"
              value={linkUrl}
              onChange={e => setLinkUrl(e.target.value)}
            />
            {linkType && (
              <p className={`text-xs mt-1.5 font-medium ${linkType === 'youtube' ? 'text-red-500' : linkType === 'instagram' ? 'text-pink-500' : 'text-wp-teal'}`}>
                {linkType === 'youtube' ? '▶ YouTube video detected' : linkType === 'instagram' ? '📸 Instagram Reel detected' : '🔗 Link detected'}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-4 py-3">
          <button
            onClick={handleSubmit}
            disabled={!canPost || submitting}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? 'Sharing…' : editPost ? 'Save Changes' : 'Share Post'}
          </button>
        </div>
      </div>
    </div>
  )
}

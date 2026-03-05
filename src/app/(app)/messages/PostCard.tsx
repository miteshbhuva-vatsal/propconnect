'use client'

import { useState } from 'react'
import axios from 'axios'
import { Heart, MessageCircle, Share2, MoreVertical, Pencil, Trash2, ExternalLink, MapPin } from 'lucide-react'
import { timeAgo, detectLinkType, extractYoutubeId } from '@/lib/utils'
import CommentsSheet from './CommentsSheet'

export interface PostUser {
  id: string
  name: string
  avatar: string | null
  city: string | null
  verificationStatus?: string
}

export interface CommunityPost {
  id: string
  content: string | null
  city: string
  images: string[]
  linkUrl: string | null
  likeCount: number
  commentCount: number
  shareCount: number
  isLiked: boolean
  createdAt: string
  user: PostUser
}

interface Props {
  post: CommunityPost
  currentUserId: string
  onDelete: (id: string) => void
  onEdit: (post: CommunityPost) => void
}

export default function PostCard({ post, currentUserId, onDelete, onEdit }: Props) {
  const [liked, setLiked] = useState(post.isLiked)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const isOwn = post.user.id === currentUserId
  const linkType = post.linkUrl ? detectLinkType(post.linkUrl) : null
  const youtubeId = post.linkUrl && linkType === 'youtube' ? extractYoutubeId(post.linkUrl) : null

  const toggleLike = async () => {
    // Optimistic update
    setLiked(prev => !prev)
    setLikeCount(prev => liked ? prev - 1 : prev + 1)
    try {
      const res = await axios.post(`/api/community/${post.id}/like`)
      if (res.data.success) {
        setLiked(res.data.data.liked)
        setLikeCount(res.data.data.likeCount)
      }
    } catch {
      // Revert on error
      setLiked(prev => !prev)
      setLikeCount(prev => liked ? prev + 1 : prev - 1)
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/community/${post.id}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `Post by ${post.user.name}`, url })
      } else {
        await navigator.clipboard.writeText(url)
      }
    } catch { /* dismissed */ }
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-wp-teal to-wp-green flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            {post.user.avatar
              ? <img src={post.user.avatar} alt={post.user.name} className="w-full h-full object-cover" />
              : post.user.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm text-wp-text">{post.user.name}</span>
              {post.user.verificationStatus === 'VERIFIED' && (
                <span className="text-[10px] bg-wp-green/10 text-wp-green px-1.5 py-0.5 rounded-full font-medium">✓ Verified</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-wp-text-secondary mt-0.5">
              <MapPin size={10} />
              <span>{post.city}</span>
              <span>·</span>
              <span>{timeAgo(new Date(post.createdAt))}</span>
            </div>
          </div>
          {isOwn && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-wp-text-secondary"
              >
                <MoreVertical size={16} />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden w-36">
                    <button
                      onClick={() => { setShowMenu(false); onEdit(post) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-wp-text hover:bg-gray-50"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      onClick={() => { setShowMenu(false); onDelete(post.id) }}
                      className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-red-500 hover:bg-red-50"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Text content */}
        {post.content && (
          <div className="px-4 pb-3">
            <p className={`text-sm text-wp-text leading-relaxed ${!expanded && post.content.length > 200 ? 'line-clamp-3' : ''}`}>
              {post.content}
            </p>
            {post.content.length > 200 && (
              <button
                onClick={() => setExpanded(v => !v)}
                className="text-xs text-wp-teal font-medium mt-1 hover:underline"
              >
                {expanded ? 'See less' : 'See more'}
              </button>
            )}
          </div>
        )}

        {/* Images grid */}
        {post.images.length > 0 && (
          <div className={`grid gap-0.5 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
            {post.images.slice(0, 6).map((img, i) => (
              <div
                key={i}
                className={`relative bg-gray-100 overflow-hidden ${post.images.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}
              >
                <img
                  src={img}
                  alt={`Post image ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {i === 5 && post.images.length > 6 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl">
                    +{post.images.length - 6}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Link embed */}
        {post.linkUrl && (
          <div className="px-4 pb-3">
            {youtubeId ? (
              <div className="rounded-xl overflow-hidden mt-1">
                <iframe
                  src={`https://www.youtube.com/embed/${youtubeId}`}
                  className="w-full aspect-video border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube video"
                />
              </div>
            ) : linkType === 'instagram' ? (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-pink-100 rounded-xl px-4 py-3 mt-1 hover:bg-pink-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-700">Instagram Reel</p>
                  <p className="text-[11px] text-gray-500 truncate">{post.linkUrl}</p>
                </div>
                <ExternalLink size={14} className="text-gray-400 flex-shrink-0" />
              </a>
            ) : (
              <a
                href={post.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mt-1 hover:bg-gray-100 transition-colors text-sm text-wp-teal truncate"
              >
                <ExternalLink size={14} className="flex-shrink-0" />
                <span className="truncate">{post.linkUrl}</span>
              </a>
            )}
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-1 px-3 py-2 border-t border-gray-50">
          <button
            onClick={toggleLike}
            className={`flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium transition-colors ${liked ? 'text-red-500 bg-red-50' : 'text-wp-text-secondary hover:bg-gray-50'}`}
          >
            <Heart size={17} className={liked ? 'fill-current' : ''} />
            <span>{likeCount > 0 ? likeCount : ''} Like</span>
          </button>
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-wp-text-secondary hover:bg-gray-50 transition-colors"
          >
            <MessageCircle size={17} />
            <span>{commentCount > 0 ? commentCount : ''} Comment</span>
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 flex-1 justify-center py-2 rounded-xl text-sm font-medium text-wp-text-secondary hover:bg-gray-50 transition-colors"
          >
            <Share2 size={17} />
            <span>Share</span>
          </button>
        </div>
      </div>

      {showComments && (
        <CommentsSheet
          postId={post.id}
          initialCount={commentCount}
          currentUserId={currentUserId}
          onClose={() => setShowComments(false)}
          onCountChange={delta => setCommentCount(c => Math.max(0, c + delta))}
        />
      )}
    </>
  )
}

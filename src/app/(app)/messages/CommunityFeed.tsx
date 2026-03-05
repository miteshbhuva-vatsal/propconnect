'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { PenSquare, Users } from 'lucide-react'
import PostCard, { type CommunityPost } from './PostCard'
import CreatePostModal from './CreatePostModal'

interface Props {
  currentUserId: string
  currentUserCity: string | null
}

export default function CommunityFeed({ currentUserId, currentUserCity }: Props) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editPost, setEditPost] = useState<CommunityPost | undefined>()
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPosts = useCallback(async (p: number, append = false) => {
    if (append) setLoadingMore(true)
    try {
      const res = await axios.get(`/api/community?page=${p}&limit=10`)
      if (res.data.success) {
        const { posts: newPosts, hasMore: more } = res.data.data
        setPosts(prev => append ? [...prev, ...newPosts] : newPosts)
        setHasMore(more)
        setPage(p)
      }
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => { fetchPosts(1) }, [fetchPosts])

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        fetchPosts(page + 1, true)
      }
    }, { threshold: 0.1 })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, page, fetchPosts])

  const handleCreated = (newPost: CommunityPost) => {
    if (editPost) {
      setPosts(prev => prev.map(p => p.id === newPost.id ? newPost : p))
    } else {
      setPosts(prev => [newPost, ...prev])
    }
    setEditPost(undefined)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return
    try {
      await axios.delete(`/api/community/${id}`)
      setPosts(prev => prev.filter(p => p.id !== id))
      toast.success('Post deleted')
    } catch {
      toast.error('Failed to delete post')
    }
  }

  const handleEdit = (post: CommunityPost) => {
    setEditPost(post)
    setShowCreate(true)
  }

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl p-4 animate-pulse space-y-3">
            <div className="flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-gray-200 rounded w-32" />
                <div className="h-2.5 bg-gray-200 rounded w-20" />
              </div>
            </div>
            <div className="h-3 bg-gray-200 rounded w-full" />
            <div className="h-3 bg-gray-200 rounded w-5/6" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* City header */}
      {currentUserCity && (
        <div className="flex items-center gap-2 px-4 py-3 bg-wp-green/5 border-b border-wp-green/10">
          <Users size={14} className="text-wp-green" />
          <p className="text-xs text-wp-text-secondary">
            Showing posts from <span className="font-semibold text-wp-green">{currentUserCity}</span> community
          </p>
        </div>
      )}

      {/* Post list */}
      <div className="p-4 space-y-3 pb-24">
        {posts.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🏙️</div>
            <p className="font-semibold text-wp-text">No posts yet</p>
            <p className="text-sm text-wp-text-secondary mt-1">
              Be the first to share something in {currentUserCity || 'your city'}!
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary mt-4 px-6"
            >
              Create First Post
            </button>
          </div>
        ) : (
          <>
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                currentUserId={currentUserId}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            ))}
            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />
            {loadingMore && (
              <div className="flex justify-center py-2">
                <div className="w-5 h-5 border-2 border-wp-green border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!hasMore && posts.length > 0 && (
              <p className="text-center text-xs text-wp-text-secondary py-2">You're all caught up!</p>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => { setEditPost(undefined); setShowCreate(true) }}
        className="fixed bottom-24 right-4 z-30 w-14 h-14 bg-wp-green rounded-full shadow-lg flex items-center justify-center hover:bg-green-600 transition-colors"
        aria-label="Create post"
      >
        <PenSquare size={22} className="text-white" />
      </button>

      {/* Create/Edit modal */}
      {showCreate && (
        <CreatePostModal
          onClose={() => { setShowCreate(false); setEditPost(undefined) }}
          onCreated={handleCreated}
          editPost={editPost}
        />
      )}
    </div>
  )
}

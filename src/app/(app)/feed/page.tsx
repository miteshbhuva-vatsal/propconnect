'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, RefreshCw, SlidersHorizontal } from 'lucide-react'
import axios from 'axios'
import PropertyCard from '@/components/PropertyCard'
import PreferencesSheet from '@/components/PreferencesSheet'
import type { ListingCard } from '@/types'

export default function FeedPage() {
  const [listings, setListings] = useState<ListingCard[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)

  const fetchListings = useCallback(async (pageNum: number, reset = false) => {
    try {
      const res = await axios.get(`/api/listings?page=${pageNum}&limit=10&sortBy=newest`)
      const { data, hasMore: more } = res.data.data
      setListings(prev => reset ? data : [...prev, ...data])
      setHasMore(more)
    } catch {
      // silently fail — user sees empty state
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchListings(1)
  }, [fetchListings])

  const handleRefresh = async () => {
    setRefreshing(true)
    setPage(1)
    await fetchListings(1, true)
  }

  const handleLoadMore = () => {
    const next = page + 1
    setPage(next)
    fetchListings(next)
  }

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-48 bg-gray-200 rounded-t-2xl" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* AI Match Banner */}
      <div className="mx-4 mt-4 bg-gradient-to-r from-wp-teal to-wp-green rounded-2xl p-4 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-white font-semibold text-sm">
            <Sparkles size={16} />
            AI Matched for You
          </div>
          <p className="text-white/70 text-xs mt-0.5">Based on your preferences</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreferences(true)}
            className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-2"
            title="Edit preferences"
          >
            <SlidersHorizontal size={16} className="text-white" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/20 hover:bg-white/30 transition-colors rounded-xl p-2"
          >
            <RefreshCw size={16} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Listings */}
      <div className="p-4 space-y-4 mt-2">
        {listings.length === 0 ? (
          <div className="text-center py-16 text-wp-text-secondary">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-gray-300" />
            </div>
            <p className="font-medium">No listings yet</p>
            <p className="text-sm mt-1">Be the first to post a property!</p>
          </div>
        ) : (
          <>
            {listings.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PropertyCard listing={listing} />
              </motion.div>
            ))}

            {hasMore && (
              <button
                onClick={handleLoadMore}
                className="w-full py-3 text-wp-green font-medium text-sm hover:bg-wp-green/5 rounded-xl transition-colors"
              >
                Load more listings
              </button>
            )}
          </>
        )}
      </div>

      {/* Preferences sheet */}
      {showPreferences && (
        <PreferencesSheet
          onClose={() => setShowPreferences(false)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  )
}

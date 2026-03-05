'use client'

import { useEffect, useRef } from 'react'

interface Props {
  listingId: string
  trackCode: string | null
}

// Records time-on-page when user leaves
export default function TrackingPixel({ listingId, trackCode }: Props) {
  const startRef = useRef(Date.now())

  useEffect(() => {
    const handleUnload = () => {
      const duration = Math.round((Date.now() - startRef.current) / 1000)
      if (duration < 2) return // ignore accidental hits
      // Use sendBeacon for reliability on page unload
      const payload = JSON.stringify({ listingId, trackCode, duration })
      navigator.sendBeacon('/api/track/duration', payload)
    }

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') handleUnload()
    })
    window.addEventListener('pagehide', handleUnload)

    return () => {
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [listingId, trackCode])

  return null
}

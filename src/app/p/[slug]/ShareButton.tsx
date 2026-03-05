'use client'

import { Share2 } from 'lucide-react'

export default function ShareButton({ title, url }: { title: string; url: string }) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title, url }).catch(() => null)
    } else {
      navigator.clipboard.writeText(url).then(() => alert('Link copied!')).catch(() => null)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex flex-col items-center justify-center gap-0.5 bg-gray-100 text-wp-text-secondary py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
    >
      <Share2 size={18} />
      Share
    </button>
  )
}

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const [lightbox, setLightbox] = useState<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="relative h-64 bg-gradient-to-br from-wp-teal to-wp-green flex items-center justify-center text-white/30 text-7xl">
        🏠
      </div>
    )
  }

  const prev = () => setLightbox(i => (i === null || i === 0 ? images.length - 1 : i - 1))
  const next = () => setLightbox(i => (i === null || i === images.length - 1 ? 0 : i + 1))

  return (
    <>
      {/* Main gallery grid */}
      {images.length === 1 ? (
        <div className="relative h-72 cursor-pointer" onClick={() => setLightbox(0)}>
          <Image src={images[0]} alt={title} fill className="object-cover" priority />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-0.5 h-64 overflow-hidden">
          <div className="relative cursor-pointer row-span-2" onClick={() => setLightbox(0)}>
            <Image src={images[0]} alt={title} fill className="object-cover" priority />
          </div>
          <div className="relative cursor-pointer" onClick={() => setLightbox(1)}>
            <Image src={images[1]} alt={title} fill className="object-cover" />
          </div>
          {images[2] && (
            <div className="relative cursor-pointer" onClick={() => setLightbox(2)}>
              <Image src={images[2]} alt={title} fill className="object-cover" />
              {images.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-lg">
                  +{images.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/80 hover:text-white p-2"
            onClick={() => setLightbox(null)}
          >
            <X size={24} />
          </button>
          <button
            className="absolute left-3 text-white/80 hover:text-white p-3 bg-white/10 rounded-full"
            onClick={e => { e.stopPropagation(); prev() }}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="relative w-full h-[80vw] max-h-[80vh] max-w-2xl mx-12" onClick={e => e.stopPropagation()}>
            <Image src={images[lightbox]} alt={title} fill className="object-contain" />
          </div>
          <button
            className="absolute right-3 text-white/80 hover:text-white p-3 bg-white/10 rounded-full"
            onClick={e => { e.stopPropagation(); next() }}
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-4 text-white/60 text-sm">
            {lightbox + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  )
}

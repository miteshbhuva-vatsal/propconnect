'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, X, SlidersHorizontal, Building2, MapPin, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import PropertyCard from '@/components/PropertyCard'
import { PROPERTY_TYPES, DEAL_TYPES, formatIndianPrice } from '@/lib/utils'
import type { ListingCard } from '@/types'

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Jaipur']

interface SponsoredProject {
  id: string
  slug: string
  title: string
  developerName: string
  city: string
  state: string
  area?: string
  propertyTypes: string[]
  priceFrom?: string
  priceTo?: string
  availableUnits?: number
  possessionDate?: string
  coverImage?: string
  isSponsored: boolean
}

function ProjectCard({ project }: { project: SponsoredProject }) {
  return (
    <div className="flex-shrink-0 w-60 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
      <div className="relative h-32 bg-gradient-to-br from-wp-teal to-wp-green">
        {project.coverImage ? (
          <Image src={project.coverImage} alt={project.title} fill className="object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20 text-5xl">🏗️</div>
        )}
        <div className="absolute top-2 left-2">
          <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">SPONSORED</span>
        </div>
        {project.availableUnits !== undefined && (
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">
            {project.availableUnits} units left
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-wp-text text-sm leading-tight line-clamp-2">{project.title}</p>
        <p className="text-xs text-wp-text-secondary mt-0.5">{project.developerName}</p>
        <div className="flex items-center gap-1 text-xs text-wp-text-secondary mt-1">
          <MapPin size={11} />
          {project.area ? `${project.area}, ` : ''}{project.city}
        </div>
        {(project.priceFrom || project.priceTo) && (
          <p className="text-wp-green text-sm font-bold mt-1.5">
            {project.priceFrom ? formatIndianPrice(Number(project.priceFrom)) : '—'}
            {project.priceTo ? ` – ${formatIndianPrice(Number(project.priceTo))}` : '+'}
          </p>
        )}
        {project.possessionDate && (
          <p className="text-xs text-wp-text-secondary mt-0.5">Possession: {project.possessionDate}</p>
        )}
        <div className="flex flex-wrap gap-1 mt-2">
          {project.propertyTypes.slice(0, 2).map(t => (
            <span key={t} className="text-[10px] bg-wp-teal/10 text-wp-teal px-1.5 py-0.5 rounded-full">{t}</span>
          ))}
        </div>
        <button className="w-full mt-3 bg-wp-green text-white text-xs font-semibold py-2 rounded-xl hover:bg-green-600 transition-colors flex items-center justify-center gap-1">
          View Project <ChevronRight size={12} />
        </button>
      </div>
    </div>
  )
}

function ListingsContent() {
  const searchParams = useSearchParams()
  const [listings, setListings] = useState<ListingCard[]>([])
  const [projects, setProjects] = useState<SponsoredProject[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [total, setTotal] = useState(0)

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    city: searchParams.get('city') || '',
    propertyType: searchParams.get('propertyType') || '',
    dealType: searchParams.get('dealType') || '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    verifiedOnly: searchParams.get('verifiedOnly') === 'true',
  })

  const fetchListings = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, String(v)) })
      const res = await axios.get(`/api/listings?${params}`)
      setListings(res.data.data.data)
      setTotal(res.data.data.total)
    } catch {
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchListings() }, [fetchListings])

  useEffect(() => {
    const city = filters.city
    axios.get(`/api/projects${city ? `?city=${encodeURIComponent(city)}` : ''}`).then(res => {
      if (res.data.success) setProjects(res.data.data)
    }).catch(() => null)
  }, [filters.city])

  const clearFilters = () => {
    setFilters({ q: '', city: '', propertyType: '', dealType: '', priceMin: '', priceMax: '', sortBy: 'newest', verifiedOnly: false })
  }

  const hasActiveFilters = filters.city || filters.propertyType || filters.dealType || filters.priceMin || filters.priceMax || filters.verifiedOnly

  return (
    <div>
      {/* Search bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-wp-border px-4 py-3 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-icon" />
          <input
            className="input-field pl-9 pr-10"
            placeholder="Search properties, areas, cities..."
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          />
          {filters.q && (
            <button onClick={() => setFilters(f => ({ ...f, q: '' }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-wp-icon hover:text-wp-text">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition-colors ${
              hasActiveFilters ? 'bg-wp-green text-white border-wp-green' : 'border-wp-border text-wp-text-secondary hover:border-wp-green hover:text-wp-green'
            }`}
          >
            <SlidersHorizontal size={14} />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 bg-white/30 text-xs font-bold px-1.5 rounded-full">
                {[filters.city, filters.propertyType, filters.dealType, filters.priceMin, filters.verifiedOnly ? '1' : ''].filter(Boolean).length}
              </span>
            )}
          </button>

          <select
            className="text-sm border border-wp-border rounded-xl px-3 py-2 focus:outline-none focus:border-wp-green bg-white text-wp-text-secondary"
            value={filters.sortBy}
            onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
          >
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="match_score">Best Match</option>
          </select>

          <label className="flex items-center gap-1.5 text-sm cursor-pointer select-none ml-auto">
            <input type="checkbox" className="w-4 h-4 accent-wp-green" checked={filters.verifiedOnly} onChange={e => setFilters(f => ({ ...f, verifiedOnly: e.target.checked }))} />
            <span className="text-wp-text-secondary">Verified</span>
          </label>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4 border border-wp-border">
            <div className="flex justify-between items-center">
              <span className="font-medium text-sm">Filters</span>
              {hasActiveFilters && <button onClick={clearFilters} className="text-xs text-red-500 hover:underline">Clear all</button>}
            </div>
            <div>
              <label className="input-label text-xs">City</label>
              <select className="input-field text-sm" value={filters.city} onChange={e => setFilters(f => ({ ...f, city: e.target.value }))}>
                <option value="">All cities</option>
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label text-xs">Property Type</label>
                <select className="input-field text-sm" value={filters.propertyType} onChange={e => setFilters(f => ({ ...f, propertyType: e.target.value }))}>
                  <option value="">All types</option>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label text-xs">Deal Type</label>
                <select className="input-field text-sm" value={filters.dealType} onChange={e => setFilters(f => ({ ...f, dealType: e.target.value }))}>
                  <option value="">All deals</option>
                  {DEAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label text-xs">Min Price (₹ Lakhs)</label>
                <input className="input-field text-sm" type="number" placeholder="e.g. 50" value={filters.priceMin} onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))} />
              </div>
              <div>
                <label className="input-label text-xs">Max Price (₹ Lakhs)</label>
                <input className="input-field text-sm" type="number" placeholder="e.g. 500" value={filters.priceMax} onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sponsored Projects carousel */}
      {projects.length > 0 && (
        <div className="px-4 pt-4 pb-1">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Building2 size={14} className="text-wp-teal" />
              <h2 className="font-semibold text-wp-text text-sm">Featured Projects</h2>
            </div>
            <span className="text-xs text-wp-text-secondary">{projects.length} projects</span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar -mx-4 px-4">
            {projects.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>
      )}

      {projects.length > 0 && (
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="flex-1 h-px bg-wp-border" />
          <span className="text-xs text-wp-text-secondary font-medium">Individual Listings</span>
          <div className="flex-1 h-px bg-wp-border" />
        </div>
      )}

      {/* Results count */}
      <div className="px-4 py-1 text-xs text-wp-text-secondary">
        {loading ? 'Searching...' : `${total.toLocaleString()} properties found`}
      </div>

      {/* Listings */}
      <div className="px-4 pb-4 space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-48 bg-gray-200 rounded-t-2xl" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          ))
        ) : listings.length === 0 ? (
          <div className="text-center py-16 text-wp-text-secondary">
            <Filter size={32} className="mx-auto mb-3 text-gray-300" />
            <p className="font-medium">No listings found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-wp-green font-medium text-sm hover:underline">Clear filters</button>
            )}
          </div>
        ) : (
          listings.map(listing => <PropertyCard key={listing.id} listing={listing} />)
        )}
      </div>
    </div>
  )
}

export default function ListingsPage() {
  return <Suspense fallback={<div className="p-4"><div className="h-10 bg-gray-100 rounded-xl animate-pulse" /></div>}><ListingsContent /></Suspense>
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, X, Info } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { PROPERTY_TYPES, DEAL_TYPES } from '@/lib/utils'

const AMENITIES = [
  'Parking', 'Lift', 'Security', 'Power Backup', 'Garden',
  'Swimming Pool', 'Gym', 'Clubhouse', 'CCTV', 'Gated Society',
]

const INDIAN_STATES = [
  'Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana',
  'Gujarat', 'Rajasthan', 'Uttar Pradesh', 'West Bengal', 'Punjab',
]

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  const [form, setForm] = useState({
    title: '',
    description: '',
    propertyType: '',
    dealType: '',
    area: '',
    city: '',
    state: '',
    pincode: '',
    address: '',
    price: '',
    priceOnRequest: false,
    priceNegotiable: false,
    sizeSqft: '',
    sizeAcres: '',
    bedrooms: '',
    bathrooms: '',
    amenities: [] as string[],
    images: [] as string[],
    coverImage: '',
  })

  const set = (key: string, value: unknown) => setForm(f => ({ ...f, [key]: value }))

  const toggleAmenity = (a: string) => {
    set('amenities', form.amenities.includes(a)
      ? form.amenities.filter(x => x !== a)
      : [...form.amenities, a])
  }

  const handleSubmit = async () => {
    if (!form.title || !form.propertyType || !form.dealType || !form.area || !form.city || !form.state) {
      toast.error('Please fill all required fields')
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...form,
        price: form.priceOnRequest ? undefined : form.price ? Number(form.price) * 100000 : undefined,
        sizeSqft: form.sizeSqft ? Number(form.sizeSqft) : undefined,
        sizeAcres: form.sizeAcres ? Number(form.sizeAcres) : undefined,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : undefined,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : undefined,
      }

      const res = await axios.post('/api/listings', payload)
      if (res.data.success) {
        toast.success(res.data.message || 'Listing created!')
        router.push('/listings')
      }
    } catch (err: unknown) {
      const code = (err as { response?: { data?: { code?: string } } })?.response?.data?.code
      if (code === 'CREDIT_LIMIT') {
        toast.error('Deal credit limit reached. Please upgrade your plan.')
        router.push('/profile?tab=subscription')
      } else {
        toast.error('Failed to create listing')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-wp-teal text-white px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-semibold">New Property Listing</h1>
          <p className="text-white/70 text-xs">Step {step} of 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex">
        {[1, 2, 3].map(s => (
          <div
            key={s}
            className={`flex-1 h-1 transition-colors ${s <= step ? 'bg-wp-green' : 'bg-gray-200'}`}
          />
        ))}
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-5">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-semibold text-wp-text">Property Details</h2>

            <div>
              <label className="input-label">Listing Title *</label>
              <input className="input-field" placeholder="e.g. 3BHK Apartment in Bandra West" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Property Type *</label>
                <select className="input-field" value={form.propertyType} onChange={e => set('propertyType', e.target.value)}>
                  <option value="">Select type</option>
                  {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Deal Type *</label>
                <select className="input-field" value={form.dealType} onChange={e => set('dealType', e.target.value)}>
                  <option value="">Select deal</option>
                  {DEAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="input-label">Description *</label>
              <textarea
                className="input-field min-h-[100px] resize-none"
                placeholder="Describe the property, its features, investment potential..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={4}
              />
            </div>

            <button className="btn-primary w-full" onClick={() => setStep(2)}>
              Next: Location & Price
            </button>
          </div>
        )}

        {/* Step 2: Location & Price */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(1)} className="text-wp-text-secondary"><ArrowLeft size={18} /></button>
              <h2 className="font-semibold text-wp-text">Location & Pricing</h2>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Area / Locality *</label>
                <input className="input-field" placeholder="e.g. Bandra West" value={form.area} onChange={e => set('area', e.target.value)} />
              </div>
              <div>
                <label className="input-label">City *</label>
                <input className="input-field" placeholder="Mumbai" value={form.city} onChange={e => set('city', e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">State *</label>
                <select className="input-field" value={form.state} onChange={e => set('state', e.target.value)}>
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Pincode</label>
                <input className="input-field" placeholder="400050" value={form.pincode} onChange={e => set('pincode', e.target.value)} maxLength={6} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="input-label mb-0">Price (₹ Lakhs)</label>
                <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-wp-green"
                    checked={form.priceOnRequest}
                    onChange={e => set('priceOnRequest', e.target.checked)}
                  />
                  Price on Request
                </label>
              </div>
              {!form.priceOnRequest && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-wp-text-secondary text-sm">₹</span>
                  <input className="input-field pl-7" type="number" placeholder="e.g. 280 (for ₹2.8 Cr)" value={form.price} onChange={e => set('price', e.target.value)} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-wp-text-secondary text-xs">Lakhs</span>
                </div>
              )}
              <label className="flex items-center gap-1.5 text-xs mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="accent-wp-green"
                  checked={form.priceNegotiable}
                  onChange={e => set('priceNegotiable', e.target.checked)}
                />
                Price Negotiable
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="input-label">Size (sq ft)</label>
                <input className="input-field" type="number" placeholder="1250" value={form.sizeSqft} onChange={e => set('sizeSqft', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Size (acres)</label>
                <input className="input-field" type="number" step="0.01" placeholder="2.5" value={form.sizeAcres} onChange={e => set('sizeAcres', e.target.value)} />
              </div>
            </div>

            {['APARTMENT', 'VILLA', 'BUNGALOW', 'FARMHOUSE'].includes(form.propertyType) && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Bedrooms</label>
                  <select className="input-field" value={form.bedrooms} onChange={e => set('bedrooms', e.target.value)}>
                    <option value="">Select</option>
                    {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} BHK</option>)}
                  </select>
                </div>
                <div>
                  <label className="input-label">Bathrooms</label>
                  <select className="input-field" value={form.bathrooms} onChange={e => set('bathrooms', e.target.value)}>
                    <option value="">Select</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>
            )}

            <button className="btn-primary w-full" onClick={() => setStep(3)}>
              Next: Amenities & Photos
            </button>
          </div>
        )}

        {/* Step 3: Amenities & Media */}
        {step === 3 && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex items-center gap-2">
              <button onClick={() => setStep(2)} className="text-wp-text-secondary"><ArrowLeft size={18} /></button>
              <h2 className="font-semibold text-wp-text">Amenities & Photos</h2>
            </div>

            <div>
              <label className="input-label">Amenities</label>
              <div className="flex flex-wrap gap-2">
                {AMENITIES.map(a => (
                  <button
                    key={a}
                    onClick={() => toggleAmenity(a)}
                    className={`tag text-xs transition-all ${
                      form.amenities.includes(a)
                        ? 'bg-wp-green text-white'
                        : 'bg-gray-100 text-wp-text-secondary hover:bg-gray-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo upload placeholder */}
            <div>
              <label className="input-label">Photos</label>
              <div className="border-2 border-dashed border-wp-border rounded-xl p-8 text-center hover:border-wp-green transition-colors cursor-pointer">
                <Upload size={28} className="mx-auto text-wp-icon mb-2" />
                <p className="text-sm font-medium text-wp-text-secondary">Upload property photos</p>
                <p className="text-xs text-wp-icon mt-1">Max 10 images, up to 10MB each</p>
                <p className="text-xs text-wp-green mt-2">S3 upload integration — configure AWS credentials</p>
              </div>
            </div>

            {/* Developer notice */}
            <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl p-3 border border-amber-200">
              <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-xs font-medium">Developer listings require approval</p>
                <p className="text-amber-700 text-xs mt-0.5">
                  Your listing will be reviewed by our admin team within 24 hours before going live.
                </p>
              </div>
            </div>

            <button
              className="btn-primary w-full"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

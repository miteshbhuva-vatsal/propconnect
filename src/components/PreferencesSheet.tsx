'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { PROPERTY_TYPES, DEAL_TYPES } from '@/lib/utils'

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Indore',
]

interface Preferences {
  preferredPropertyTypes: string[]
  preferredDealTypes: string[]
  preferredLocations: string[]
  preferredPriceMin: number | null
  preferredPriceMax: number | null
}

interface Props {
  onClose: () => void
  onSaved?: () => void
}

export default function PreferencesSheet({ onClose, onSaved }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [prefs, setPrefs] = useState<Preferences>({
    preferredPropertyTypes: [],
    preferredDealTypes: [],
    preferredLocations: [],
    preferredPriceMin: null,
    preferredPriceMax: null,
  })

  useEffect(() => {
    axios.get('/api/users/me').then(res => {
      const u = res.data.data
      setPrefs({
        preferredPropertyTypes: u.preferredPropertyTypes || [],
        preferredDealTypes: u.preferredDealTypes || [],
        preferredLocations: u.preferredLocations || [],
        preferredPriceMin: u.preferredPriceMin ? Math.round(u.preferredPriceMin / 100000) : null,
        preferredPriceMax: u.preferredPriceMax ? Math.round(u.preferredPriceMax / 100000) : null,
      })
    }).catch(() => null).finally(() => setLoading(false))
  }, [])

  const toggle = (
    key: 'preferredPropertyTypes' | 'preferredDealTypes' | 'preferredLocations',
    value: string,
  ) => {
    setPrefs(p => {
      const arr = p[key]
      return { ...p, [key]: arr.includes(value) ? arr.filter(x => x !== value) : [...arr, value] }
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.patch('/api/users/me', {
        preferredPropertyTypes: prefs.preferredPropertyTypes,
        preferredDealTypes: prefs.preferredDealTypes,
        preferredLocations: prefs.preferredLocations,
        preferredPriceMin: prefs.preferredPriceMin ? prefs.preferredPriceMin * 100000 : null,
        preferredPriceMax: prefs.preferredPriceMax ? prefs.preferredPriceMax * 100000 : null,
      })
      toast.success('Preferences saved')
      onSaved?.()
      onClose()
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        <motion.div
          className="relative bg-white rounded-t-3xl max-h-[85vh] flex flex-col"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="font-semibold text-wp-text text-base">Edit Preferences</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} className="text-wp-icon" />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-wp-green border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              <div>
                <p className="text-xs font-semibold text-wp-text-secondary uppercase tracking-wide mb-2.5">Property Types</p>
                <div className="flex flex-wrap gap-2">
                  {PROPERTY_TYPES.map(t => {
                    const active = prefs.preferredPropertyTypes.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        onClick={() => toggle('preferredPropertyTypes', t.value)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-wp-green text-white border-wp-green'
                            : 'bg-white text-wp-text-secondary border-wp-border hover:border-wp-green hover:text-wp-green'
                        }`}
                      >
                        {active && <Check size={11} />}
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-wp-text-secondary uppercase tracking-wide mb-2.5">Deal Types</p>
                <div className="flex flex-wrap gap-2">
                  {DEAL_TYPES.map(t => {
                    const active = prefs.preferredDealTypes.includes(t.value)
                    return (
                      <button
                        key={t.value}
                        onClick={() => toggle('preferredDealTypes', t.value)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-wp-green text-white border-wp-green'
                            : 'bg-white text-wp-text-secondary border-wp-border hover:border-wp-green hover:text-wp-green'
                        }`}
                      >
                        {active && <Check size={11} />}
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-wp-text-secondary uppercase tracking-wide mb-2.5">Preferred Cities</p>
                <div className="flex flex-wrap gap-2">
                  {INDIAN_CITIES.map(city => {
                    const active = prefs.preferredLocations.includes(city)
                    return (
                      <button
                        key={city}
                        onClick={() => toggle('preferredLocations', city)}
                        className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-wp-teal text-white border-wp-teal'
                            : 'bg-white text-wp-text-secondary border-wp-border hover:border-wp-teal hover:text-wp-teal'
                        }`}
                      >
                        {active && <Check size={11} />}
                        {city}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-wp-text-secondary uppercase tracking-wide mb-2.5">Budget Range (₹ Lakhs)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-wp-text-secondary mb-1 block">Min</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      className="input-field text-sm"
                      value={prefs.preferredPriceMin ?? ''}
                      onChange={e => setPrefs(p => ({ ...p, preferredPriceMin: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-wp-text-secondary mb-1 block">Max</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      className="input-field text-sm"
                      value={prefs.preferredPriceMax ?? ''}
                      onChange={e => setPrefs(p => ({ ...p, preferredPriceMax: e.target.value ? Number(e.target.value) : null }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="px-5 py-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || loading}
              className="w-full bg-wp-green text-white font-semibold py-3 rounded-2xl hover:bg-green-600 transition-colors disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

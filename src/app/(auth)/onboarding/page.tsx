'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, User, TrendingUp, ArrowRight, ArrowLeft, Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { PROPERTY_TYPES } from '@/lib/utils'

type Role = 'DEVELOPER' | 'INVESTOR' | 'BROKER'
type Step = 'role' | 'profile' | 'preferences'

const ROLES: { role: Role; icon: React.ReactNode; title: string; desc: string }[] = [
  {
    role: 'DEVELOPER',
    icon: <Building2 size={28} />,
    title: 'Real Estate Developer',
    desc: 'List projects, manage approvals, connect with brokers',
  },
  {
    role: 'INVESTOR',
    icon: <TrendingUp size={28} />,
    title: 'Investor',
    desc: 'Find investment opportunities, track deals, manage portfolio',
  },
  {
    role: 'BROKER',
    icon: <User size={28} />,
    title: 'Broker / Agent',
    desc: 'Share listings, grow your network, earn referral credits',
  },
]

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Kolkata',
  'Pune', 'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Indore',
]

const CITY_AREAS: Record<string, string[]> = {
  Mumbai:    ['Bandra', 'Andheri', 'Powai', 'Worli', 'Lower Parel', 'BKC', 'Juhu', 'Borivali', 'Thane', 'Navi Mumbai', 'Malad', 'Goregaon'],
  Delhi:     ['Connaught Place', 'Dwarka', 'South Delhi', 'Vasant Kunj', 'Saket', 'Noida', 'Gurgaon', 'Rohini', 'Pitampura'],
  Bengaluru: ['Whitefield', 'Koramangala', 'Indiranagar', 'JP Nagar', 'Hebbal', 'Electronic City', 'Sarjapur', 'Marathahalli', 'HSR Layout'],
  Hyderabad: ['Banjara Hills', 'Jubilee Hills', 'Hitec City', 'Gachibowli', 'Kondapur', 'Madhapur', 'Kukatpally', 'Miyapur'],
  Chennai:   ['OMR', 'T Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Porur', 'Sholinganallur', 'Perambur'],
  Kolkata:   ['Salt Lake', 'New Town', 'Park Street', 'Alipore', 'Ballygunge', 'Rajarhat', 'Howrah'],
  Pune:      ['Koregaon Park', 'Hinjewadi', 'Wakad', 'Kharadi', 'Viman Nagar', 'Hadapsar', 'Aundh', 'Baner'],
  Ahmedabad: ['SG Highway', 'Prahlad Nagar', 'Bopal', 'Satellite', 'Thaltej', 'Vastrapur', 'Navrangpura'],
  Jaipur:    ['Vaishali Nagar', 'C-Scheme', 'Malviya Nagar', 'Mansarovar', 'Tonk Road', 'Jagatpura'],
  Surat:     ['Athwa', 'Vesu', 'Pal', 'Katargam', 'Adajan', 'Althan', 'Dumas Road'],
  Lucknow:   ['Gomti Nagar', 'Hazratganj', 'Aliganj', 'Indira Nagar', 'Mahanagar', 'Vrindavan Yojana'],
  Indore:    ['Vijay Nagar', 'Scheme 54', 'AB Road', 'Bhawarkuan', 'New Palasia', 'Super Corridor'],
}

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>('role')
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(false)

  const [profile, setProfile] = useState({
    name: '',
    companyName: '',
    designation: '',
    city: '',
    reraNumber: '',
  })

  const [preferences, setPreferences] = useState({
    propertyTypes: [] as string[],
    priceMin: '',
    priceMax: '',
    cities: [] as string[],
    areas: [] as string[],
  })

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    setStep('profile')
  }

  const handleProfileNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile.name) {
      toast.error('Please enter your name')
      return
    }
    setStep('preferences')
  }

  const togglePropertyType = (type: string) => {
    setPreferences(p => ({
      ...p,
      propertyTypes: p.propertyTypes.includes(type)
        ? p.propertyTypes.filter(t => t !== type)
        : [...p.propertyTypes, type],
    }))
  }

  const toggleCity = (city: string) => {
    setPreferences(p => {
      const removing = p.cities.includes(city)
      // When removing a city, also remove its areas
      const removedAreas = removing ? (CITY_AREAS[city] || []) : []
      return {
        ...p,
        cities: removing ? p.cities.filter(c => c !== city) : [...p.cities, city],
        areas: removing ? p.areas.filter(a => !removedAreas.includes(a)) : p.areas,
      }
    })
  }

  const toggleArea = (area: string) => {
    setPreferences(p => ({
      ...p,
      areas: p.areas.includes(area)
        ? p.areas.filter(a => a !== area)
        : [...p.areas, area],
    }))
  }

  // All areas available for selected cities
  const availableAreas = preferences.cities.flatMap(c => CITY_AREAS[c] || [])

  const handleFinish = async () => {
    setLoading(true)
    try {
      await axios.patch('/api/users/me', {
        role: selectedRole,
        ...profile,
        preferredPropertyTypes: preferences.propertyTypes,
        // Save selected areas; fall back to cities if none picked
        preferredLocations: preferences.areas.length > 0 ? preferences.areas : preferences.cities,
        preferredPriceMin: preferences.priceMin ? Number(preferences.priceMin) : null,
        preferredPriceMax: preferences.priceMax ? Number(preferences.priceMax) : null,
      })
      toast.success('Profile setup complete!')
      window.location.href = '/feed'
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = step === 'role' ? 0 : step === 'profile' ? 1 : 2

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-wp-teal px-6 pt-10 pb-16">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 size={18} className="text-white" />
            </div>
            <span className="font-bold text-white">PropConnect</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Set up your profile</h1>
          <p className="text-white/70 text-sm">Takes less than 2 minutes</p>

          {/* Step indicator */}
          <div className="flex gap-2 mt-5">
            {['Role', 'Profile', 'Preferences'].map((label, i) => (
              <div
                key={label}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                  i <= stepIndex ? 'bg-wp-green' : 'bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8">
        <div className="max-w-sm mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Role Selection */}
            {step === 'role' && (
              <motion.div
                key="role"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="card p-4 shadow-lg mb-4">
                  <p className="text-sm font-semibold text-wp-text mb-4">I am a...</p>
                  {ROLES.map(({ role, icon, title, desc }) => (
                    <button
                      key={role}
                      onClick={() => handleRoleSelect(role)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 mb-3 last:mb-0 transition-all
                        ${selectedRole === role
                          ? 'border-wp-green bg-wp-green/5'
                          : 'border-wp-border hover:border-wp-green/40 hover:bg-gray-50'
                        }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                        ${selectedRole === role ? 'bg-wp-green text-white' : 'bg-gray-100 text-wp-text-secondary'}`}>
                        {icon}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-wp-text text-sm">{title}</p>
                        <p className="text-xs text-wp-text-secondary">{desc}</p>
                      </div>
                      <ArrowRight size={16} className="ml-auto text-wp-text-secondary" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Profile */}
            {step === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="card p-5 shadow-lg">
                  <button
                    onClick={() => setStep('role')}
                    className="flex items-center gap-1 text-sm text-wp-text-secondary mb-4 hover:text-wp-text"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>
                  <form onSubmit={handleProfileNext} className="space-y-4">
                    <div>
                      <label className="input-label">Full Name *</label>
                      <input
                        className="input-field"
                        placeholder="Rajesh Mehta"
                        value={profile.name}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">Company Name</label>
                      <input
                        className="input-field"
                        placeholder="Mehta Realtors"
                        value={profile.companyName}
                        onChange={e => setProfile(p => ({ ...p, companyName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">Your Role / Designation</label>
                      <input
                        className="input-field"
                        placeholder="Senior Broker"
                        value={profile.designation}
                        onChange={e => setProfile(p => ({ ...p, designation: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="input-label">City</label>
                      <select
                        className="input-field"
                        value={profile.city}
                        onChange={e => setProfile(p => ({ ...p, city: e.target.value }))}
                      >
                        <option value="">Select city</option>
                        {INDIAN_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {selectedRole === 'DEVELOPER' && (
                      <div>
                        <label className="input-label">RERA Number</label>
                        <input
                          className="input-field"
                          placeholder="MH/1234/2024"
                          value={profile.reraNumber}
                          onChange={e => setProfile(p => ({ ...p, reraNumber: e.target.value }))}
                        />
                      </div>
                    )}
                    <button type="submit" className="btn-primary w-full">
                      Next → Set Preferences
                    </button>
                  </form>
                </div>
              </motion.div>
            )}

            {/* Step 3: Preferences */}
            {step === 'preferences' && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="card p-5 shadow-lg space-y-5">
                  <button
                    onClick={() => setStep('profile')}
                    className="flex items-center gap-1 text-sm text-wp-text-secondary hover:text-wp-text"
                  >
                    <ArrowLeft size={14} /> Back
                  </button>

                  <div>
                    <p className="font-semibold text-wp-text text-sm mb-3">
                      Property types you're interested in
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PROPERTY_TYPES.map(({ value, label }) => (
                        <button
                          key={value}
                          onClick={() => togglePropertyType(value)}
                          className={`tag text-xs transition-all ${
                            preferences.propertyTypes.includes(value)
                              ? 'bg-wp-green text-white'
                              : 'bg-gray-100 text-wp-text-secondary hover:bg-gray-200'
                          }`}
                        >
                          {preferences.propertyTypes.includes(value) && (
                            <Check size={10} className="inline mr-1" />
                          )}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-wp-text text-sm mb-3">
                      Preferred cities
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {INDIAN_CITIES.map(city => (
                        <button
                          key={city}
                          onClick={() => toggleCity(city)}
                          className={`tag text-xs transition-all ${
                            preferences.cities.includes(city)
                              ? 'bg-wp-teal text-white'
                              : 'bg-gray-100 text-wp-text-secondary hover:bg-gray-200'
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  {availableAreas.length > 0 && (
                    <div>
                      <p className="font-semibold text-wp-text text-sm mb-1">
                        Preferred areas
                      </p>
                      <p className="text-xs text-wp-text-secondary mb-3">
                        Select specific neighbourhoods (optional)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableAreas.map(area => (
                          <button
                            key={area}
                            onClick={() => toggleArea(area)}
                            className={`tag text-xs transition-all ${
                              preferences.areas.includes(area)
                                ? 'bg-wp-green text-white'
                                : 'bg-gray-100 text-wp-text-secondary hover:bg-gray-200'
                            }`}
                          >
                            {preferences.areas.includes(area) && (
                              <Check size={10} className="inline mr-1" />
                            )}
                            {area}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-wp-text text-sm mb-3">Budget range</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="input-label text-xs">Min (₹ Lakhs)</label>
                        <input
                          className="input-field text-sm"
                          placeholder="50"
                          type="number"
                          value={preferences.priceMin}
                          onChange={e => setPreferences(p => ({ ...p, priceMin: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="input-label text-xs">Max (₹ Lakhs)</label>
                        <input
                          className="input-field text-sm"
                          placeholder="500"
                          type="number"
                          value={preferences.priceMax}
                          onChange={e => setPreferences(p => ({ ...p, priceMax: e.target.value }))}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleFinish}
                    disabled={loading}
                    className="btn-primary w-full"
                  >
                    {loading ? 'Setting up...' : 'Go to PropConnect →'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

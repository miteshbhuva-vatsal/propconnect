'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Shield } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit number')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/request-otp', { phone })
      if (res.data.success) {
        if (res.data.data?.devOtp) {
          toast(`Test OTP: ${res.data.data.devOtp}`, { icon: '🔑', duration: 10000 })
        } else {
          toast.success('OTP sent to your phone')
        }
        router.push(`/login/otp?phone=${encodeURIComponent(phone)}`)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <div className="bg-wp-teal px-6 pt-12 pb-20">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">PropConnect</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome back</h1>
          <p className="text-white/70 text-sm">Enter your phone number to continue</p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-10">
        <div className="max-w-sm mx-auto">
          <div className="card p-6 shadow-lg">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="input-label">Phone Number</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-wp-text-secondary text-sm font-medium">
                    <span className="text-base">🇮🇳</span>
                    <span>+91</span>
                    <div className="w-px h-4 bg-wp-border ml-0.5" />
                  </div>
                  <input
                    type="tel"
                    className="input-field pl-20"
                    placeholder="98765 43210"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    autoFocus
                    inputMode="numeric"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading || phone.length < 10}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending OTP...
                  </span>
                ) : 'Send OTP →'}
              </button>

              <div className="flex items-center gap-2 text-xs text-wp-text-secondary text-center justify-center">
                <Shield size={12} className="text-wp-green flex-shrink-0" />
                <span>By continuing, you agree to our Terms & Privacy Policy</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Building2, ArrowLeft, Smartphone } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

function OtpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone') || ''

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(30)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!phone) {
      router.replace('/login')
      return
    }
    setTimeout(() => inputRefs.current[0]?.focus(), 100)
  }, [phone, router])

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const verifyOtp = async (code: string) => {
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/verify-otp', { phone, otp: code })
      if (res.data.success) {
        const { isNewUser, accessToken } = res.data.data
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('user', JSON.stringify(res.data.data.user))
        toast.success('Welcome to PropConnect!')
        window.location.href = isNewUser ? '/onboarding' : '/feed'
      }
    } catch {
      toast.error('Invalid OTP. Please try again.')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)
    if (value && index < 5) inputRefs.current[index + 1]?.focus()
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleResend = async () => {
    if (resendTimer > 0) return
    setOtp(['', '', '', '', '', ''])
    try {
      const res = await axios.post('/api/auth/request-otp', { phone })
      if (res.data.data?.devOtp) {
        toast(`Test OTP: ${res.data.data.devOtp}`, { icon: '🔑', duration: 10000 })
      } else {
        toast.success('OTP resent')
      }
      setResendTimer(30)
      setTimeout(() => inputRefs.current[0]?.focus(), 100)
    } catch {
      toast.error('Failed to resend OTP')
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
          <h1 className="text-2xl font-bold text-white mb-2">Verify your number</h1>
          <p className="text-white/70 text-sm">
            We sent a 6-digit code to +91 {phone}
          </p>
        </div>
      </div>

      <div className="flex-1 px-6 -mt-10">
        <div className="max-w-sm mx-auto">
          <div className="card p-6 shadow-lg space-y-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-sm text-wp-text-secondary hover:text-wp-text"
            >
              <ArrowLeft size={14} />
              Change number
            </button>

            {/* OTP inputs */}
            <div className="flex gap-3 justify-center">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all
                    ${digit
                      ? 'border-wp-green bg-wp-green/5 text-wp-teal'
                      : 'border-wp-border bg-white text-wp-text'
                    }
                    focus:outline-none focus:border-wp-green focus:ring-2 focus:ring-wp-green/20`}
                />
              ))}
            </div>

            {loading && (
              <div className="text-center text-sm text-wp-text-secondary">Verifying...</div>
            )}

            <div className="text-center text-sm">
              {resendTimer > 0 ? (
                <span className="text-wp-text-secondary">
                  Resend OTP in <span className="font-semibold text-wp-teal">{resendTimer}s</span>
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  className="text-wp-green font-semibold hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-wp-text-secondary">
              <Smartphone size={12} />
              <span>OTP sent via SMS & WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OtpPage() {
  return (
    <Suspense>
      <OtpForm />
    </Suspense>
  )
}

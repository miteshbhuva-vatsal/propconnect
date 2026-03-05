'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, ArrowLeft, Smartphone, Shield } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('phone')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
      return () => clearTimeout(t)
    }
  }, [resendTimer])

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (phone.replace(/\D/g, '').length < 10) {
      toast.error('Please enter a valid 10-digit number')
      return
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/request-otp', { phone })
      if (res.data.success) {
        // Dev mode: show OTP hint
        if (res.data.data?.devOtp) {
          toast('Dev OTP: ' + res.data.data.devOtp, { icon: '🔑', duration: 10000 })
        } else {
          toast.success('OTP sent to your phone')
        }
        setStep('otp')
        setResendTimer(30)
        setTimeout(() => inputRefs.current[0]?.focus(), 100)
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      toast.error(msg || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const newOtp = [...otp]
    newOtp[index] = value.slice(-1)
    setOtp(newOtp)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
    if (newOtp.every(d => d) && newOtp.join('').length === 6) {
      verifyOtp(newOtp.join(''))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const verifyOtp = async (code: string) => {
    setLoading(true)
    try {
      const res = await axios.post('/api/auth/verify-otp', { phone, otp: code })
      if (res.data.success) {
        const { isNewUser, accessToken } = res.data.data
        // Store in localStorage for mobile/SPA use (cookie is also set by server)
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('user', JSON.stringify(res.data.data.user))

        toast.success('Welcome to PropConnect!')
        // Hard redirect so the new access_token cookie is sent with the fresh request
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

  const handleResend = async () => {
    if (resendTimer > 0) return
    setOtp(['', '', '', '', '', ''])
    await handlePhoneSubmit({ preventDefault: () => {} } as React.FormEvent)
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Green header */}
      <div className="bg-wp-teal px-6 pt-12 pb-20">
        <div className="max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <span className="font-bold text-white text-lg">PropConnect</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            {step === 'phone' ? 'Welcome back' : 'Verify your number'}
          </h1>
          <p className="text-white/70 text-sm">
            {step === 'phone'
              ? 'Enter your phone number to continue'
              : `We sent a 6-digit code to ${phone}`
            }
          </p>
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 px-6 -mt-10">
        <div className="max-w-sm mx-auto">
          <div className="card p-6 shadow-lg">
            <AnimatePresence mode="wait">
              {step === 'phone' ? (
                <motion.form
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  onSubmit={handlePhoneSubmit}
                  className="space-y-5"
                >
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
                    ) : 'Send OTP'}
                  </button>

                  <div className="flex items-center gap-2 text-xs text-wp-text-secondary text-center justify-center">
                    <Shield size={12} className="text-wp-green flex-shrink-0" />
                    <span>By continuing, you agree to our Terms & Privacy Policy</span>
                  </div>
                </motion.form>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <button
                    onClick={() => setStep('phone')}
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
                        onKeyDown={e => handleOtpKeyDown(i, e)}
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
                    <div className="text-center text-sm text-wp-text-secondary">
                      Verifying...
                    </div>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

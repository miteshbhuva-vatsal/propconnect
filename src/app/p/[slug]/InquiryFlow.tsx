'use client'

import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Phone, MessageSquare, FileDown } from 'lucide-react'
import ShareButton from './ShareButton'

interface Props {
  listingId: string
  listingTitle: string
  brokerPhone: string
  whatsappUrl: string
  pageUrl: string
  autoFocus?: boolean
  brochureUrl?: string | null
}

export default function InquiryFlow({
  listingId,
  listingTitle,
  brokerPhone,
  whatsappUrl,
  pageUrl,
  autoFocus,
  brochureUrl,
}: Props) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  // Pre-fill from logged-in user profile
  useEffect(() => {
    axios.get('/api/users/me').then(res => {
      if (res.data.success) {
        const u = res.data.data
        setForm(f => ({
          ...f,
          name: u.name || '',
          phone: u.phone || '',
        }))
      }
    }).catch(() => null)
  }, [])

  // Auto-scroll to form when coming from Inquire button
  useEffect(() => {
    if (autoFocus && formRef.current) {
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 300)
    }
  }, [autoFocus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.phone.trim()) return
    setLoading(true)
    try {
      await axios.post('/api/inquiries', {
        listingId,
        name: form.name.trim(),
        phone: form.phone.trim(),
        message: form.message.trim() || `I'm interested in: ${listingTitle}`,
        source: 'LANDING_PAGE',
      })
      setSubmitted(true)
      toast.success('Inquiry sent! The broker will contact you shortly.')
    } catch {
      toast.error('Failed to send inquiry. Please try calling directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Inline form card */}
      <div ref={formRef} className="bg-white rounded-2xl p-4 shadow-sm border border-wp-green/10">
        {submitted ? (
          <div className="text-center py-2">
            <div className="text-3xl mb-2">✅</div>
            <p className="font-semibold text-wp-text">Inquiry Sent!</p>
            <p className="text-sm text-wp-text-secondary mt-1">
              The broker will reach out to you within 24 hours.
            </p>
            {brochureUrl && (
              <a
                href={brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="mt-3 inline-flex items-center gap-2 bg-wp-teal/10 text-wp-teal text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-wp-teal/20 transition-colors"
              >
                <FileDown size={16} />
                Download Brochure (PDF)
              </a>
            )}
          </div>
        ) : (
          <>
            <h2 className="font-bold text-wp-text mb-0.5 text-sm">Interested? Get a callback</h2>
            <p className="text-xs text-wp-text-secondary mb-3">Leave your details — broker will contact you</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                className="input-field"
                placeholder="Your name *"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
              <input
                className="input-field"
                type="tel"
                placeholder="Phone number *"
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                required
              />
              <textarea
                className="input-field resize-none"
                rows={2}
                placeholder="Message (optional)"
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              />
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full disabled:opacity-60"
              >
                {loading ? 'Sending...' : 'Send Inquiry'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Sticky bottom CTA bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-40 shadow-lg">
        <div className="max-w-2xl mx-auto">
          {submitted ? (
            /* After inquiry: show Call, WhatsApp, Share */
            <div className="grid grid-cols-3 gap-2">
              <a
                href={`tel:${brokerPhone}`}
                className="flex flex-col items-center justify-center gap-0.5 bg-wp-teal/10 text-wp-teal py-2.5 rounded-xl text-xs font-semibold hover:bg-wp-teal/20 transition-colors"
              >
                <Phone size={18} />
                Call
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-0.5 bg-wp-green text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </a>
              <ShareButton title={listingTitle} url={pageUrl} />
            </div>
          ) : (
            /* Before inquiry: single Send Inquiry CTA */
            <button
              onClick={() => {
                formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }}
              className="w-full flex items-center justify-center gap-2 bg-wp-green text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-600 transition-colors shadow-sm"
            >
              <MessageSquare size={18} />
              Send Inquiry to Get Contact Details
            </button>
          )}
        </div>
      </div>
    </>
  )
}

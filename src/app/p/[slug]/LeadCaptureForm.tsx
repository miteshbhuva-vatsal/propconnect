'use client'

import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface Props {
  listingId: string
  listingTitle: string
  brokerId: string
}

export default function LeadCaptureForm({ listingId, listingTitle, brokerId }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

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

  if (submitted) {
    return (
      <div className="bg-wp-green/10 border border-wp-green/30 rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">✅</div>
        <p className="font-semibold text-wp-text">Inquiry Sent!</p>
        <p className="text-sm text-wp-text-secondary mt-1">The broker will reach out to you within 24 hours.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-wp-green/10">
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
    </div>
  )
}

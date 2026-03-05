'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import {
  Plus, Phone, Mail, Building2, Clock, X,
  Link2, Copy, Eye, Users, ExternalLink, ChevronDown, ChevronUp,
} from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatDate, formatIndianPrice, LEAD_STATUS_LABELS, timeAgo, cn } from '@/lib/utils'

interface TrackableLink {
  id: string
  code: string
  url: string
  label?: string
  listing?: { title: string; slug: string }
  totalClicks: number
  uniqueVisitors: number
  lastClickAt?: string
  createdAt: string
}

interface Lead {
  id: string
  name: string
  phone?: string
  email?: string
  company?: string
  budget?: string
  status: string
  source: string
  notes?: string
  nextFollowUp?: string
  listingId?: string
  listing?: { title: string; city: string; price: string | null; coverImage?: string | null }
  createdAt: string
}

const KANBAN_COLUMNS = [
  { key: 'NEW', label: 'New', color: 'bg-gray-100 text-gray-700' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { key: 'QUALIFIED', label: 'Qualified', color: 'bg-purple-100 text-purple-700' },
  { key: 'SITE_VISIT', label: 'Site Visit', color: 'bg-yellow-100 text-yellow-800' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-100 text-orange-700' },
  { key: 'CLOSED', label: 'Closed ✓', color: 'bg-wp-green/20 text-wp-green-dark' },
  { key: 'LOST', label: 'Lost', color: 'bg-red-100 text-red-700' },
]

type GroupedLeads = Record<string, Lead[]>

function TrackingPanel({ lead }: { lead: Lead }) {
  const [links, setLinks] = useState<TrackableLink[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    axios.get(`/api/crm/${lead.id}/trackable-link`).then(res => {
      if (res.data.success) setLinks(res.data.data)
    }).catch(() => null).finally(() => setLoading(false))
  }, [lead.id])

  const generateLink = async () => {
    setGenerating(true)
    try {
      const res = await axios.post(`/api/crm/${lead.id}/trackable-link`, {
        listingId: lead.listingId,
        label: `Link for ${lead.name}`,
      })
      const updated = await axios.get(`/api/crm/${lead.id}/trackable-link`)
      if (updated.data.success) setLinks(updated.data.data)
      navigator.clipboard.writeText(res.data.data.url).catch(() => null)
      toast.success('Trackable link created & copied!')
    } catch {
      toast.error('Failed to generate link')
    } finally {
      setGenerating(false)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => toast.success('Copied!')).catch(() => null)
  }

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-wp-text-secondary">
          <Link2 size={11} /> Trackable Links
        </div>
        <button
          onClick={generateLink}
          disabled={generating}
          className="flex items-center gap-1 text-[11px] text-wp-teal font-medium hover:underline disabled:opacity-50"
        >
          <Plus size={11} />
          {generating ? 'Generating...' : 'New Link'}
        </button>
      </div>

      {loading ? (
        <div className="h-6 bg-gray-100 rounded animate-pulse" />
      ) : links.length === 0 ? (
        <p className="text-[11px] text-wp-text-secondary italic">No links yet. Generate one to track opens.</p>
      ) : (
        <div className="space-y-2">
          {links.map(link => (
            <div key={link.id} className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center justify-between gap-1">
                <p className="text-[11px] text-wp-text font-medium truncate flex-1">{link.label || link.code}</p>
                <button onClick={() => copyUrl(link.url)} className="p-1 hover:bg-gray-200 rounded text-wp-text-secondary flex-shrink-0">
                  <Copy size={11} />
                </button>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-gray-200 rounded text-wp-text-secondary flex-shrink-0">
                  <ExternalLink size={11} />
                </a>
              </div>
              {link.listing && (
                <p className="text-[10px] text-wp-text-secondary mt-0.5 truncate">🏠 {link.listing.title}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 text-[10px] text-wp-text-secondary">
                <span className="flex items-center gap-0.5 font-semibold text-wp-teal">
                  <Eye size={10} /> {link.totalClicks} opens
                </span>
                <span className="flex items-center gap-0.5">
                  <Users size={10} /> {link.uniqueVisitors} unique
                </span>
                {link.lastClickAt && <span>Last: {timeAgo(link.lastClickAt)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LeadKanbanCard({ lead }: { lead: Lead }) {
  const [showTracking, setShowTracking] = useState(false)

  return (
    <div className="card p-3">
      <p className="font-medium text-sm text-wp-text">{lead.name}</p>
      {lead.company && (
        <div className="flex items-center gap-1 text-xs text-wp-text-secondary mt-0.5">
          <Building2 size={11} /> {lead.company}
        </div>
      )}
      {lead.budget && (
        <p className="text-xs text-wp-green font-medium mt-1">Budget: {formatIndianPrice(Number(lead.budget))}</p>
      )}
      {lead.listing && (
        <div className="mt-2 bg-gray-50 rounded-lg px-2 py-1.5 text-xs text-wp-text-secondary truncate">
          🏠 {lead.listing.title}
        </div>
      )}
      {lead.nextFollowUp && (
        <div className="flex items-center gap-1 text-xs text-orange-600 mt-1.5">
          <Clock size={10} /> Follow-up: {formatDate(lead.nextFollowUp)}
        </div>
      )}
      <div className="flex gap-2 mt-2">
        {lead.phone && (
          <a href={`tel:${lead.phone}`} className="p-1.5 bg-wp-green/10 rounded-lg text-wp-green hover:bg-wp-green/20 transition-colors">
            <Phone size={12} />
          </a>
        )}
        {lead.email && (
          <a href={`mailto:${lead.email}`} className="p-1.5 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
            <Mail size={12} />
          </a>
        )}
        <button
          onClick={() => setShowTracking(v => !v)}
          className={cn(
            'ml-auto p-1.5 rounded-lg flex items-center gap-0.5 transition-colors',
            showTracking ? 'bg-wp-teal/10 text-wp-teal' : 'bg-gray-100 text-wp-text-secondary hover:bg-gray-200'
          )}
        >
          <Link2 size={11} />
          {showTracking ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
      </div>
      {showTracking && <TrackingPanel lead={lead} />}
    </div>
  )
}

export default function CrmPage() {
  const [grouped, setGrouped] = useState<GroupedLeads>({})
  const [loading, setLoading] = useState(true)
  const [showNewLead, setShowNewLead] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')

  const [newLead, setNewLead] = useState({
    name: '', phone: '', email: '', company: '', budget: '', notes: '', source: 'DIRECT',
  })

  useEffect(() => { fetchLeads() }, [])

  const fetchLeads = async () => {
    try {
      const res = await axios.get('/api/crm')
      if (res.data.success) setGrouped(res.data.data.grouped)
    } catch { null } finally { setLoading(false) }
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination || destination.droppableId === source.droppableId) return

    const newStatus = destination.droppableId
    const leadId = draggableId

    setGrouped(prev => {
      const newGrouped = { ...prev }
      const lead = newGrouped[source.droppableId]?.find(l => l.id === leadId)
      if (!lead) return prev
      newGrouped[source.droppableId] = newGrouped[source.droppableId].filter(l => l.id !== leadId)
      newGrouped[newStatus] = [...(newGrouped[newStatus] || []), { ...lead, status: newStatus }]
      return newGrouped
    })

    try {
      await axios.patch(`/api/crm/${leadId}`, { status: newStatus })
      toast.success(`Lead moved to ${LEAD_STATUS_LABELS[newStatus]}`)
    } catch {
      toast.error('Failed to update lead')
      fetchLeads()
    }
  }

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await axios.post('/api/crm', {
        ...newLead,
        budget: newLead.budget ? Number(newLead.budget) * 100000 : undefined,
      })
      if (res.data.success) {
        toast.success('Lead created!')
        setShowNewLead(false)
        setNewLead({ name: '', phone: '', email: '', company: '', budget: '', notes: '', source: 'DIRECT' })
        fetchLeads()
      }
    } catch {
      toast.error('Failed to create lead')
    }
  }

  const allLeads = Object.values(grouped).flat()
  const closedValue = (grouped.CLOSED || []).reduce((sum, l) => sum + (l.budget ? Number(l.budget) : 0), 0)

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => <div key={i} className="card h-24 animate-pulse" />)}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-wp-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="font-bold text-wp-text text-base">Lead Pipeline</h1>
            <p className="text-xs text-wp-text-secondary">{allLeads.length} total leads</p>
          </div>
          <button onClick={() => setShowNewLead(true)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
            <Plus size={16} /> Add Lead
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: allLeads.length, color: 'text-wp-text' },
            { label: 'Closed', value: grouped.CLOSED?.length || 0, color: 'text-wp-green' },
            { label: 'Pipeline', value: formatIndianPrice(closedValue), color: 'text-wp-teal' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
              <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
              <p className="text-xs text-wp-text-secondary">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-1 mt-3 bg-gray-100 rounded-xl p-1">
          {(['kanban', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={cn('flex-1 text-xs py-1.5 rounded-lg font-medium transition-all capitalize', view === v ? 'bg-white text-wp-teal shadow-sm' : 'text-wp-text-secondary')}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      {view === 'kanban' ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto p-4 flex-1 hide-scrollbar">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.key} className="flex-shrink-0 w-64">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`tag text-xs ${col.color}`}>{col.label}</span>
                  <span className="text-xs text-wp-text-secondary font-medium">{grouped[col.key]?.length || 0}</span>
                </div>
                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn('min-h-[200px] rounded-xl p-2 space-y-2 transition-colors', snapshot.isDraggingOver ? 'bg-wp-green/10' : 'bg-gray-50')}
                    >
                      {(grouped[col.key] || []).map((lead, i) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={i}>
                          {(prov, snap) => (
                            <div
                              ref={prov.innerRef}
                              {...prov.draggableProps}
                              {...prov.dragHandleProps}
                              className={cn('cursor-grab active:cursor-grabbing', snap.isDragging ? 'shadow-lg rotate-1' : '')}
                            >
                              <LeadKanbanCard lead={lead} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allLeads.length === 0 ? (
            <div className="text-center py-16 text-wp-text-secondary">
              <p className="font-medium">No leads yet</p>
              <p className="text-sm mt-1">Add your first lead to get started</p>
            </div>
          ) : (
            allLeads.map(lead => {
              const col = KANBAN_COLUMNS.find(c => c.key === lead.status)
              return (
                <div key={lead.id} className="card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-wp-text">{lead.name}</p>
                      {lead.company && <p className="text-xs text-wp-text-secondary">{lead.company}</p>}
                    </div>
                    <span className={`tag text-xs ${col?.color || ''}`}>{col?.label}</span>
                  </div>
                  {lead.budget && (
                    <p className="text-sm text-wp-green font-medium mt-1">{formatIndianPrice(Number(lead.budget))}</p>
                  )}
                  <div className="flex gap-3 mt-2">
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-xs text-wp-green hover:underline">
                        <Phone size={12} /> {lead.phone}
                      </a>
                    )}
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <Mail size={12} /> {lead.email}
                      </a>
                    )}
                  </div>
                  <TrackingPanel lead={lead} />
                </div>
              )
            })
          )}
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLead && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-wp-border">
              <h2 className="font-semibold text-wp-text">New Lead</h2>
              <button onClick={() => setShowNewLead(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateLead} className="p-4 space-y-4">
              <div>
                <label className="input-label">Name *</label>
                <input className="input-field" placeholder="Rahul Verma" value={newLead.name} onChange={e => setNewLead(l => ({ ...l, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Phone</label>
                  <input className="input-field" placeholder="9876543210" value={newLead.phone} onChange={e => setNewLead(l => ({ ...l, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Budget (₹ Lakhs)</label>
                  <input className="input-field" type="number" placeholder="150" value={newLead.budget} onChange={e => setNewLead(l => ({ ...l, budget: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="input-label">Company</label>
                <input className="input-field" placeholder="Company name" value={newLead.company} onChange={e => setNewLead(l => ({ ...l, company: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Source</label>
                <select className="input-field" value={newLead.source} onChange={e => setNewLead(l => ({ ...l, source: e.target.value }))}>
                  <option value="DIRECT">Direct</option>
                  <option value="REFERRAL">Referral</option>
                  <option value="WHATSAPP_SHARE">WhatsApp Share</option>
                  <option value="LANDING_PAGE">Landing Page</option>
                  <option value="ORGANIC">Organic</option>
                </select>
              </div>
              <div>
                <label className="input-label">Notes</label>
                <textarea className="input-field resize-none" rows={3} placeholder="Add notes about this lead..." value={newLead.notes} onChange={e => setNewLead(l => ({ ...l, notes: e.target.value }))} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowNewLead(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn-primary flex-1">Create Lead</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

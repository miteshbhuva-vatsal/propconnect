'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Eye, MessageSquare, X, ToggleLeft, ToggleRight } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatIndianPrice } from '@/lib/utils'

interface Project {
  id: string
  slug: string
  title: string
  developerName: string
  city: string
  state: string
  isActive: boolean
  isSponsored: boolean
  sortOrder: number
  viewCount: number
  inquiryCount: number
  priceFrom?: string
  priceTo?: string
  createdAt: string
}

const EMPTY_FORM = {
  title: '', developerName: '', city: '', state: '', area: '',
  description: '', propertyTypes: [] as string[],
  priceFrom: '', priceTo: '',
  totalUnits: '', availableUnits: '', possessionDate: '',
  reraNumber: '', coverImage: '', isSponsored: true, isActive: true, sortOrder: 0,
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchProjects() }, [])

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/admin/projects')
      setProjects(res.data.data)
    } catch { toast.error('Failed to load projects') }
    finally { setLoading(false) }
  }

  const openCreate = () => {
    setEditId(null)
    setForm(EMPTY_FORM)
    setShowForm(true)
  }

  const openEdit = (p: Project) => {
    setEditId(p.id)
    setForm({
      title: p.title, developerName: p.developerName,
      city: p.city, state: p.state, area: '',
      description: '', propertyTypes: [],
      priceFrom: p.priceFrom ? String(Number(p.priceFrom) / 100000) : '',
      priceTo: p.priceTo ? String(Number(p.priceTo) / 100000) : '',
      totalUnits: '', availableUnits: '', possessionDate: '',
      reraNumber: '', coverImage: '', isSponsored: p.isSponsored,
      isActive: p.isActive, sortOrder: p.sortOrder,
    })
    setShowForm(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        priceFrom: form.priceFrom ? Number(form.priceFrom) * 100000 : undefined,
        priceTo: form.priceTo ? Number(form.priceTo) * 100000 : undefined,
        totalUnits: form.totalUnits ? Number(form.totalUnits) : undefined,
        availableUnits: form.availableUnits ? Number(form.availableUnits) : undefined,
      }

      if (editId) {
        await axios.patch(`/api/admin/projects/${editId}`, payload)
        toast.success('Project updated')
      } else {
        await axios.post('/api/admin/projects', payload)
        toast.success('Project created')
      }
      setShowForm(false)
      fetchProjects()
    } catch {
      toast.error('Failed to save project')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return
    try {
      await axios.delete(`/api/admin/projects/${id}`)
      toast.success('Project deleted')
      fetchProjects()
    } catch { toast.error('Failed to delete') }
  }

  const toggleActive = async (p: Project) => {
    try {
      await axios.patch(`/api/admin/projects/${p.id}`, { isActive: !p.isActive })
      fetchProjects()
    } catch { toast.error('Failed to update') }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsored Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real estate projects shown as ads in the listings page</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Project
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🏗️</p>
          <p className="font-medium">No projects yet</p>
          <p className="text-sm mt-1">Add the first sponsored real estate project</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900">{p.title}</p>
                  {p.isSponsored && (
                    <span className="text-[11px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full font-medium">Sponsored</span>
                  )}
                  {!p.isActive && (
                    <span className="text-[11px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{p.developerName} · {p.city}, {p.state}</p>
                {(p.priceFrom || p.priceTo) && (
                  <p className="text-sm text-wp-green font-medium mt-0.5">
                    {p.priceFrom ? formatIndianPrice(Number(p.priceFrom)) : '—'}
                    {p.priceTo ? ` – ${formatIndianPrice(Number(p.priceTo))}` : '+'}
                  </p>
                )}
                <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Eye size={11} /> {p.viewCount} views</span>
                  <span className="flex items-center gap-1"><MessageSquare size={11} /> {p.inquiryCount} inquiries</span>
                  <span>Order: {p.sortOrder}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleActive(p)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title={p.isActive ? 'Deactivate' : 'Activate'}>
                  {p.isActive ? <ToggleRight size={20} className="text-wp-green" /> : <ToggleLeft size={20} />}
                </button>
                <button onClick={() => openEdit(p)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(p.id)} className="p-2 hover:bg-red-50 rounded-lg text-red-400">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="font-bold text-gray-900">{editId ? 'Edit Project' : 'New Sponsored Project'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} className="p-4 space-y-4">
              <div>
                <label className="input-label">Project Title *</label>
                <input className="input-field" placeholder="Prestige Heights Phase 2" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
              </div>
              <div>
                <label className="input-label">Developer Name *</label>
                <input className="input-field" placeholder="Prestige Group" value={form.developerName} onChange={e => setForm(f => ({ ...f, developerName: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">City *</label>
                  <input className="input-field" placeholder="Pune" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} required />
                </div>
                <div>
                  <label className="input-label">State *</label>
                  <input className="input-field" placeholder="Maharashtra" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Price From (₹ Lakhs)</label>
                  <input className="input-field" type="number" placeholder="80" value={form.priceFrom} onChange={e => setForm(f => ({ ...f, priceFrom: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Price To (₹ Lakhs)</label>
                  <input className="input-field" type="number" placeholder="200" value={form.priceTo} onChange={e => setForm(f => ({ ...f, priceTo: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Total Units</label>
                  <input className="input-field" type="number" placeholder="250" value={form.totalUnits} onChange={e => setForm(f => ({ ...f, totalUnits: e.target.value }))} />
                </div>
                <div>
                  <label className="input-label">Possession Date</label>
                  <input className="input-field" placeholder="Dec 2027" value={form.possessionDate} onChange={e => setForm(f => ({ ...f, possessionDate: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="input-label">RERA Number</label>
                <input className="input-field" placeholder="MH/1234/2024" value={form.reraNumber} onChange={e => setForm(f => ({ ...f, reraNumber: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Cover Image URL</label>
                <input className="input-field" type="url" placeholder="https://..." value={form.coverImage} onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">Sort Order (lower = higher priority)</label>
                <input className="input-field" type="number" value={form.sortOrder} onChange={e => setForm(f => ({ ...f, sortOrder: Number(e.target.value) }))} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-wp-green" checked={form.isSponsored} onChange={e => setForm(f => ({ ...f, isSponsored: e.target.checked }))} />
                  <span className="text-sm">Sponsored</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-wp-green" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
                  <span className="text-sm">Active</span>
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Saving...' : editId ? 'Update' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

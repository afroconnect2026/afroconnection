'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertCircle,
  Percent,
  DollarSign,
  Tag,
  Calendar,
  Users,
  Eye,
  EyeOff,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ManagePromoCodesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [promoCodes, setPromoCodes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    max_redemptions: '',
    valid_until: '',
    is_active: true
  })

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, params.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, organizer_id')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to manage promo codes for this event')
      }

      setEvent(eventData)

      const { data: promoCodesData } = await supabase
        .from('event_promo_codes')
        .select('*')
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })

      setPromoCodes(promoCodesData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      max_redemptions: '',
      valid_until: '',
      is_active: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (promo: any) => {
    setFormData({
      code: promo.code,
      description: promo.description || '',
      discount_type: promo.discount_type,
      discount_value: promo.discount_value.toString(),
      max_redemptions: promo.max_redemptions?.toString() || '',
      valid_until: promo.valid_until ? new Date(promo.valid_until).toISOString().slice(0, 16) : '',
      is_active: promo.is_active
    })
    setEditingId(promo.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.code.trim() || !formData.discount_value) {
      setError('Code and discount value are required')
      return
    }

    const discountValue = parseFloat(formData.discount_value)
    if (isNaN(discountValue) || discountValue <= 0) {
      setError('Discount value must be a positive number')
      return
    }

    if (formData.discount_type === 'percentage' && discountValue > 100) {
      setError('Percentage discount cannot exceed 100%')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const data = {
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim() || null,
        discount_type: formData.discount_type,
        discount_value: discountValue,
        max_redemptions: formData.max_redemptions ? parseInt(formData.max_redemptions) : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
        is_active: formData.is_active
      }

      if (editingId) {
        const { error } = await supabase
          .from('event_promo_codes')
          .update(data)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('event_promo_codes')
          .insert({
            ...data,
            event_id: params.id,
            created_by: user.id
          })
        if (error) throw error
      }

      await loadData()
      resetForm()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this promo code? This action cannot be undone.')) return

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('event_promo_codes')
        .delete()
        .eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('event_promo_codes')
        .update({ is_active: !currentValue })
        .eq('id', id)
      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error && !event) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href={`/events/${params.id}`} className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg">
            Back to Event
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Header */}
          <div className="mb-8">
            <Link href={`/events/${params.id}`} className="inline-flex items-center gap-2 text-primary-600 mb-4">
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-900">Manage Promo Codes</h1>
                <p className="text-gray-600 mt-2">{event?.title}</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-5 w-5" />
                Create Promo Code
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && event && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{editingId ? 'Edit' : 'Create'} Promo Code</h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Code */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Promo Code *</label>
                    <input
                      type="text"
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="EARLY20"
                      className="w-full px-4 py-3 border rounded-lg uppercase"
                      pattern="[A-Z0-9]+"
                      maxLength={20}
                    />
                    <p className="text-xs text-gray-500 mt-1">Uppercase letters and numbers only</p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={2}
                      placeholder="20% off for early birds"
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  {/* Discount Type & Value */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Discount Type</label>
                      <select
                        value={formData.discount_type}
                        onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      >
                        <option value="percentage">Percentage (%)</option>
                        <option value="fixed">Fixed Amount ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Discount Value *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.discount_value}
                        onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                        placeholder={formData.discount_type === 'percentage' ? '20' : '10.00'}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Max Redemptions & Expiry */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Max Uses</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.max_redemptions}
                        onChange={(e) => setFormData({ ...formData, max_redemptions: e.target.value })}
                        placeholder="Unlimited"
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Expires On</label>
                      <input
                        type="datetime-local"
                        value={formData.valid_until}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <label htmlFor="is_active" className="text-sm">
                      <span className="font-medium">Active</span>
                      <p className="text-gray-600">Users can apply this code</p>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      {saving ? 'Saving...' : editingId ? 'Update' : 'Create'} Code
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Promo Codes List */}
          {promoCodes.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <Tag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No promo codes yet</h3>
              <p className="text-gray-600 mb-6">Create discount codes to boost ticket sales</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg"
              >
                <Plus className="h-5 w-5" />
                Create First Promo Code
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {promoCodes.map((promo) => {
                const usagePercent = promo.max_redemptions
                  ? Math.round((promo.current_redemptions / promo.max_redemptions) * 100)
                  : 0
                const isExpired = promo.valid_until && new Date(promo.valid_until) < new Date()

                return (
                  <div key={promo.id} className="bg-white rounded-xl p-6 border hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Tag className="h-6 w-6 text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-navy-900 text-xl font-mono">{promo.code}</h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                promo.discount_type === 'percentage'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-green-100 text-green-700'
                              }`}>
                                {promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `$${promo.discount_value}`} OFF
                              </span>
                            </div>
                            {promo.description && (
                              <p className="text-sm text-gray-700">{promo.description}</p>
                            )}
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{promo.current_redemptions} / {promo.max_redemptions || '∞'} used</span>
                          </div>
                          {promo.valid_until && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Expires {new Date(promo.valid_until).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Usage Bar */}
                        {promo.max_redemptions && (
                          <div className="mb-3">
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                              <div
                                className={`h-full ${usagePercent >= 100 ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {/* Status Badges */}
                        <div className="flex items-center gap-2 mb-4">
                          {isExpired && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Expired
                            </span>
                          )}
                          <button
                            onClick={() => toggleActive(promo.id, promo.is_active)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              promo.is_active
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {promo.is_active ? (
                              <>
                                <Eye className="h-3 w-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Inactive
                              </>
                            )}
                          </button>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(promo)}
                            className="flex items-center gap-1 px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-lg text-sm"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(promo.id)}
                            disabled={deleting === promo.id}
                            className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>

                        <div className="text-xs text-gray-500 mt-3">
                          Created {new Date(promo.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

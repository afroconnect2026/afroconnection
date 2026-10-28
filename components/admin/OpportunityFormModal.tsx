'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { describeError } from '@/lib/admin'

interface OpportunityFormModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity?: any // If provided, we're editing. If null, we're creating
  onSuccess: () => void
}

// Must match the types used by the public create page (/opportunities/create)
const opportunityTypes = [
  { value: 'job', label: 'Job' },
  { value: 'investment', label: 'Investment' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'mentorship', label: 'Mentorship' }
]

const emptyForm = {
  title: '',
  type: 'job',
  description: '',
  company_name: '',
  location: '',
  country: '',
  industry: '',
  is_remote: false,
  application_url: '',
  application_email: '',
  application_deadline: '',
  status: 'active'
}

export default function OpportunityFormModal({
  isOpen,
  onClose,
  opportunity,
  onSuccess
}: OpportunityFormModalProps) {
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (opportunity) {
      setFormData({
        title: opportunity.title || '',
        type: opportunity.type || 'job',
        description: opportunity.description || '',
        company_name: opportunity.company_name || '',
        location: opportunity.location || '',
        country: opportunity.country || '',
        industry: opportunity.industry || '',
        is_remote: !!opportunity.is_remote,
        application_url: opportunity.application_url || '',
        application_email: opportunity.application_email || '',
        application_deadline: opportunity.application_deadline ? opportunity.application_deadline.split('T')[0] : '',
        status: opportunity.status || 'active'
      })
    } else {
      setFormData(emptyForm)
    }
  }, [opportunity, isOpen])

  const set = (key: keyof typeof emptyForm, value: any) => setFormData((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim()) {
      toast.error('Title and description are required')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .eq('is_active', true)
        .maybeSingle()

      if (!adminData) throw new Error('Not authorized')

      const opportunityData: any = {
        title: formData.title.trim(),
        type: formData.type,
        description: formData.description.trim(),
        company_name: formData.company_name.trim() || null,
        location: formData.location.trim() || null,
        country: formData.country.trim() || null,
        industry: formData.industry.trim() || null,
        is_remote: formData.is_remote,
        application_url: formData.application_url.trim() || null,
        application_email: formData.application_email.trim() || null,
        application_deadline: formData.application_deadline || null,
        status: formData.status
      }

      if (opportunity) {
        const { data, error } = await supabase
          .from('opportunities')
          .update(opportunityData)
          .eq('id', opportunity.id)
          .select('id')

        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error('Update was blocked. Make sure sql/PRODUCTION-ADMIN-FIX.sql has been run.')
        }

        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'edit_content',
          target_type: 'opportunity',
          target_id: opportunity.id,
          details: { title: opportunityData.title }
        })

        toast.success('Opportunity updated successfully!')
      } else {
        // Admin-created opportunities are pre-approved and owned by the admin's profile
        opportunityData.creator_id = adminData.id
        opportunityData.moderation_status = 'approved'
        opportunityData.moderated_by = adminData.id
        opportunityData.moderated_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('opportunities')
          .insert(opportunityData)
          .select('id')
          .single()

        if (error) throw error

        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'create_content',
          target_type: 'opportunity',
          target_id: data?.id,
          details: { title: opportunityData.title }
        })

        toast.success('Opportunity created and published!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(describeError(error) || 'Failed to save opportunity')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const inputClass =
    'w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {opportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select value={formData.type} onChange={(e) => set('type', e.target.value)} className={inputClass} required>
                {opportunityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company / Organization</label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => set('company_name', e.target.value)}
                className={inputClass}
                placeholder="e.g., AfroTech Ltd"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => set('description', e.target.value)}
              className={inputClass}
              rows={6}
              placeholder="Describe the opportunity in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => set('location', e.target.value)}
                className={inputClass}
                placeholder="e.g., Nairobi"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => set('country', e.target.value)}
                className={inputClass}
                placeholder="e.g., Kenya"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <input
                type="text"
                value={formData.industry}
                onChange={(e) => set('industry', e.target.value)}
                className={inputClass}
                placeholder="e.g., Fintech"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center space-x-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.is_remote}
                  onChange={(e) => set('is_remote', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span>Remote friendly</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application URL</label>
              <input
                type="url"
                value={formData.application_url}
                onChange={(e) => set('application_url', e.target.value)}
                className={inputClass}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Email</label>
              <input
                type="email"
                value={formData.application_email}
                onChange={(e) => set('application_email', e.target.value)}
                className={inputClass}
                placeholder="jobs@company.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Application Deadline</label>
              <input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => set('application_deadline', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{opportunity ? 'Update Opportunity' : 'Create Opportunity'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

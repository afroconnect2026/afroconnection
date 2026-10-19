'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface OpportunityFormModalProps {
  isOpen: boolean
  onClose: () => void
  opportunity?: any // If provided, we're editing. If null, we're creating
  onSuccess: () => void
}

const opportunityTypes = [
  { value: 'job', label: 'Job Opening' },
  { value: 'funding', label: 'Funding Opportunity' },
  { value: 'advisor', label: 'Advisor/Board Position' },
  { value: 'partnership', label: 'Partnership' }
]

export default function OpportunityFormModal({
  isOpen,
  onClose,
  opportunity,
  onSuccess
}: OpportunityFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'job',
    description: '',
    requirements: '',
    location: '',
    compensation: '',
    deadline: '',
    status: 'active'
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (opportunity) {
      // Editing existing opportunity
      setFormData({
        title: opportunity.title || '',
        type: opportunity.type || 'job',
        description: opportunity.description || '',
        requirements: opportunity.requirements || '',
        location: opportunity.location || '',
        compensation: opportunity.compensation || '',
        deadline: opportunity.deadline ? opportunity.deadline.split('T')[0] : '',
        status: opportunity.status || 'active'
      })
    } else {
      // Creating new opportunity - reset form
      setFormData({
        title: '',
        type: 'job',
        description: '',
        requirements: '',
        location: '',
        compensation: '',
        deadline: '',
        status: 'active'
      })
    }
  }, [opportunity, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check admin status
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminData) throw new Error('Not authorized')

      const opportunityData: any = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        requirements: formData.requirements || null,
        location: formData.location || null,
        compensation: formData.compensation || null,
        deadline: formData.deadline || null,
        status: formData.status,
        moderation_status: 'approved', // Admin-created opportunities are pre-approved
        moderated_by: adminData.id,
        moderated_at: new Date().toISOString()
      }

      if (opportunity) {
        // Update existing opportunity
        const { error } = await supabase
          .from('opportunities')
          .update(opportunityData)
          .eq('id', opportunity.id)

        if (error) throw error

        // Log activity
        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'edit_content',
          target_type: 'opportunity',
          target_id: opportunity.id,
          details: `Updated opportunity: ${formData.title}`
        })

        toast.success('Opportunity updated successfully!')
      } else {
        // Create new opportunity
        // Admin creates on behalf of the system, so use admin's ID as creator
        opportunityData.creator_id = adminData.id

        const { error } = await supabase
          .from('opportunities')
          .insert(opportunityData)

        if (error) throw error

        // Log activity
        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'create_content',
          target_type: 'opportunity',
          details: `Created opportunity: ${formData.title}`
        })

        toast.success('Opportunity created successfully!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save opportunity')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {opportunity ? 'Edit Opportunity' : 'Create New Opportunity'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Senior Software Engineer"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {opportunityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={6}
              placeholder="Describe the opportunity in detail..."
              required
            />
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <textarea
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Skills, experience, qualifications needed..."
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., Remote, Nairobi, Kenya"
            />
          </div>

          {/* Compensation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Compensation/Budget
            </label>
            <input
              type="text"
              value={formData.compensation}
              onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., $80,000 - $120,000/year"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Application Deadline
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Actions */}
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

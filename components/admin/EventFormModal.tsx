'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  event?: any // If provided, we're editing. If null, we're creating
  onSuccess: () => void
}

const eventTypes = [
  { value: 'networking', label: 'Networking Event' },
  { value: 'workshop', label: 'Workshop/Training' },
  { value: 'conference', label: 'Conference' },
  { value: 'pitch', label: 'Pitch Event' },
  { value: 'meetup', label: 'Meetup' }
]

export default function EventFormModal({
  isOpen,
  onClose,
  event,
  onSuccess
}: EventFormModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'networking',
    description: '',
    date: '',
    time: '',
    location: '',
    venue_address: '',
    is_virtual: false,
    meeting_link: '',
    max_attendees: '',
    status: 'upcoming'
  })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (event) {
      // Editing existing event
      const eventDate = event.date ? new Date(event.date) : null
      setFormData({
        title: event.title || '',
        type: event.type || 'networking',
        description: event.description || '',
        date: eventDate ? eventDate.toISOString().split('T')[0] : '',
        time: eventDate ? eventDate.toTimeString().slice(0, 5) : '',
        location: event.location || '',
        venue_address: event.venue_address || '',
        is_virtual: event.is_virtual || false,
        meeting_link: event.meeting_link || '',
        max_attendees: event.max_attendees?.toString() || '',
        status: event.status || 'upcoming'
      })
    } else {
      // Creating new event - reset form
      setFormData({
        title: '',
        type: 'networking',
        description: '',
        date: '',
        time: '',
        location: '',
        venue_address: '',
        is_virtual: false,
        meeting_link: '',
        max_attendees: '',
        status: 'upcoming'
      })
    }
  }, [event, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description || !formData.date || !formData.time) {
      toast.error('Title, description, date, and time are required')
      return
    }

    if (formData.is_virtual && !formData.meeting_link) {
      toast.error('Meeting link is required for virtual events')
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

      // Combine date and time
      const eventDateTime = new Date(`${formData.date}T${formData.time}:00`)

      const eventData: any = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        date: eventDateTime.toISOString(),
        location: formData.location || null,
        venue_address: formData.venue_address || null,
        is_virtual: formData.is_virtual,
        meeting_link: formData.is_virtual ? formData.meeting_link : null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        status: formData.status,
        moderation_status: 'approved', // Admin-created events are pre-approved
        moderated_by: adminData.id,
        moderated_at: new Date().toISOString()
      }

      if (event) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', event.id)

        if (error) throw error

        // Log activity
        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'edit_content',
          target_type: 'event',
          target_id: event.id,
          details: `Updated event: ${formData.title}`
        })

        toast.success('Event updated successfully!')
      } else {
        // Create new event
        eventData.organizer_id = adminData.id

        const { error } = await supabase
          .from('events')
          .insert(eventData)

        if (error) throw error

        // Log activity
        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'create_content',
          target_type: 'event',
          details: `Created event: ${formData.title}`
        })

        toast.success('Event created successfully!')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(error.message || 'Failed to save event')
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
            {event ? 'Edit Event' : 'Create New Event'}
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
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., AfroTech Founders Meetup"
              required
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {eventTypes.map((type) => (
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
              placeholder="Describe the event, agenda, and what attendees can expect..."
              required
            />
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          {/* Virtual Event Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="is_virtual"
              checked={formData.is_virtual}
              onChange={(e) => setFormData({ ...formData, is_virtual: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="is_virtual" className="text-sm font-medium text-gray-700">
              This is a virtual event
            </label>
          </div>

          {/* Meeting Link (if virtual) */}
          {formData.is_virtual && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.meeting_link}
                onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://zoom.us/j/..."
                required={formData.is_virtual}
              />
            </div>
          )}

          {/* Location (if not virtual) */}
          {!formData.is_virtual && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location/City
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Nairobi, Kenya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Venue Address
                </label>
                <input
                  type="text"
                  value={formData.venue_address}
                  onChange={(e) => setFormData({ ...formData, venue_address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Full venue address"
                />
              </div>
            </>
          )}

          {/* Max Attendees */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Attendees
            </label>
            <input
              type="number"
              value={formData.max_attendees}
              onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Leave empty for unlimited"
              min="1"
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
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
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
                <span>{event ? 'Update Event' : 'Create Event'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

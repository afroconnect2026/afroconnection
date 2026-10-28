'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { describeError } from '@/lib/admin'

interface EventFormModalProps {
  isOpen: boolean
  onClose: () => void
  event?: any // If provided, we're editing. If null, we're creating
  onSuccess: () => void
}

// Must match the values used by the public create page (/events/create)
const eventTypes = [
  { value: 'conference', label: 'Conference' },
  { value: 'meetup', label: 'Meetup' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'networking', label: 'Networking' }
]

const formats = [
  { value: 'in-person', label: 'In-Person' },
  { value: 'virtual', label: 'Virtual' },
  { value: 'hybrid', label: 'Hybrid' }
]

// Convert ISO string -> value for <input type="datetime-local"> in local time
function toLocalInput(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const emptyForm = {
  title: '',
  event_type: 'networking',
  format: 'in-person',
  description: '',
  start: '',
  end: '',
  location: '',
  venue_name: '',
  address: '',
  city: '',
  country: '',
  virtual_link: '',
  max_attendees: '',
  is_free: true,
  ticket_price: '',
  currency: 'USD',
  status: 'published'
}

export default function EventFormModal({ isOpen, onClose, event, onSuccess }: EventFormModalProps) {
  const [formData, setFormData] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title || '',
        event_type: event.event_type || 'networking',
        format: event.format || 'in-person',
        description: event.description || '',
        start: toLocalInput(event.start_date),
        end: toLocalInput(event.end_date),
        location: event.location || '',
        venue_name: event.venue_name || '',
        address: event.address || '',
        city: event.city || '',
        country: event.country || '',
        virtual_link: event.virtual_link || '',
        max_attendees: event.max_attendees?.toString() || '',
        is_free: event.is_free ?? true,
        ticket_price: event.ticket_price?.toString() || '',
        currency: event.currency || 'USD',
        status: event.status || 'published'
      })
    } else {
      setFormData(emptyForm)
    }
  }, [event, isOpen])

  const set = (key: keyof typeof emptyForm, value: any) => setFormData((f) => ({ ...f, [key]: value }))
  const needsVenue = formData.format !== 'virtual'
  const needsLink = formData.format !== 'in-person'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title.trim() || !formData.description.trim() || !formData.start || !formData.end) {
      toast.error('Title, description, start and end time are required')
      return
    }
    const start = new Date(formData.start)
    const end = new Date(formData.end)
    if (end <= start) {
      toast.error('End time must be after start time')
      return
    }
    if (needsLink && !formData.virtual_link.trim()) {
      toast.error('A meeting link is required for virtual/hybrid events')
      return
    }
    if (!formData.is_free && !(parseFloat(formData.ticket_price) > 0)) {
      toast.error('Enter a ticket price for paid events')
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

      const eventData: any = {
        title: formData.title.trim(),
        event_type: formData.event_type,
        format: formData.format,
        description: formData.description.trim(),
        start_date: start.toISOString(),
        end_date: end.toISOString(),
        location: needsVenue ? formData.location.trim() || null : null,
        venue_name: needsVenue ? formData.venue_name.trim() || null : null,
        address: needsVenue ? formData.address.trim() || null : null,
        city: needsVenue ? formData.city.trim() || null : null,
        country: formData.country.trim() || null,
        virtual_link: needsLink ? formData.virtual_link.trim() : null,
        max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
        is_free: formData.is_free,
        ticket_price: formData.is_free ? null : parseFloat(formData.ticket_price),
        currency: formData.currency,
        status: formData.status
      }

      if (event) {
        const { data, error } = await supabase.from('events').update(eventData).eq('id', event.id).select('id')
        if (error) throw error
        if (!data || data.length === 0) {
          throw new Error('Update was blocked. Make sure sql/PRODUCTION-ADMIN-FIX.sql has been run.')
        }

        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'edit_content',
          target_type: 'event',
          target_id: event.id,
          details: { title: eventData.title }
        })

        toast.success('Event updated successfully!')
      } else {
        // Admin-created events are pre-approved and owned by the admin's profile
        eventData.organizer_id = adminData.id
        eventData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
        eventData.moderation_status = 'approved'
        eventData.moderated_by = adminData.id
        eventData.moderated_at = new Date().toISOString()

        const { data, error } = await supabase.from('events').insert(eventData).select('id').single()
        if (error) throw error

        await supabase.from('admin_activity_log').insert({
          admin_id: adminData.id,
          action: 'create_content',
          target_type: 'event',
          target_id: data?.id,
          details: { title: eventData.title }
        })

        toast.success(formData.status === 'published' ? 'Event created and published!' : 'Event saved')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Save error:', error)
      toast.error(describeError(error) || 'Failed to save event')
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
          <h2 className="text-2xl font-bold text-gray-900">{event ? 'Edit Event' : 'Create New Event'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputClass}
              placeholder="e.g., AfroTech Founders Meetup"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type <span className="text-red-500">*</span>
              </label>
              <select value={formData.event_type} onChange={(e) => set('event_type', e.target.value)} className={inputClass}>
                {eventTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format <span className="text-red-500">*</span>
              </label>
              <select value={formData.format} onChange={(e) => set('format', e.target.value)} className={inputClass}>
                {formats.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
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
              placeholder="Describe the event, agenda, and what attendees can expect..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Starts <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.start}
                onChange={(e) => set('start', e.target.value)}
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ends <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={formData.end}
                onChange={(e) => set('end', e.target.value)}
                className={inputClass}
                required
              />
            </div>
          </div>

          {needsLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link <span className="text-red-500">*</span>
              </label>
              <input
                type="url"
                value={formData.virtual_link}
                onChange={(e) => set('virtual_link', e.target.value)}
                className={inputClass}
                placeholder="https://zoom.us/j/..."
              />
            </div>
          )}

          {needsVenue && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue Name</label>
                  <input
                    type="text"
                    value={formData.venue_name}
                    onChange={(e) => set('venue_name', e.target.value)}
                    className={inputClass}
                    placeholder="e.g., iHub"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => set('location', e.target.value)}
                    className={inputClass}
                    placeholder="e.g., Nairobi, Kenya"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => set('address', e.target.value)}
                  className={inputClass}
                  placeholder="Full venue address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input type="text" value={formData.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                  <input type="text" value={formData.country} onChange={(e) => set('country', e.target.value)} className={inputClass} />
                </div>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Maximum Attendees</label>
              <input
                type="number"
                value={formData.max_attendees}
                onChange={(e) => set('max_attendees', e.target.value)}
                className={inputClass}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select value={formData.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={formData.is_free}
                onChange={(e) => set('is_free', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span>Free event</span>
            </label>
            {!formData.is_free && (
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.ticket_price}
                  onChange={(e) => set('ticket_price', e.target.value)}
                  className={inputClass}
                  placeholder="Ticket price"
                />
                <select value={formData.currency} onChange={(e) => set('currency', e.target.value)} className={inputClass}>
                  {['USD', 'KES', 'NGN', 'ZAR', 'GHS', 'EUR', 'RWF'].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
                <span>{event ? 'Update Event' : 'Create Event'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

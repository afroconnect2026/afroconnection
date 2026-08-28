'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Video,
  DollarSign,
  Users,
  Upload,
  X,
  AlertCircle,
  Globe,
  Building2,
  Zap
} from 'lucide-react'
import Image from 'next/image'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function CreateEventPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'conference',
    format: 'in-person',
    category: '',

    // Location
    location: '',
    venue_name: '',
    address: '',
    city: '',
    country: '',
    virtual_link: '',

    // Date & Time
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    timezone: 'Africa/Nairobi',

    // Capacity & Pricing
    max_attendees: '',
    is_free: true,
    ticket_price: '',
    currency: 'USD',

    // Media
    cover_image_url: '',

    // Tags
    tags: [] as string[],
    tagInput: ''
  })

  const eventTypes = [
    { value: 'conference', label: 'Conference', icon: Building2, desc: 'Large professional gathering' },
    { value: 'meetup', label: 'Meetup', icon: Users, desc: 'Casual community gathering' },
    { value: 'webinar', label: 'Webinar', icon: Video, desc: 'Online presentation or workshop' },
    { value: 'workshop', label: 'Workshop', icon: Zap, desc: 'Hands-on learning session' },
    { value: 'networking', label: 'Networking', icon: Globe, desc: 'Professional networking event' }
  ]

  const formatOptions = [
    { value: 'in-person', label: 'In-Person', icon: MapPin, desc: 'Physical venue only' },
    { value: 'virtual', label: 'Virtual', icon: Video, desc: 'Online only' },
    { value: 'hybrid', label: 'Hybrid', icon: Globe, desc: 'Both in-person and online' }
  ]

  const timezones = [
    'Africa/Nairobi',
    'Africa/Lagos',
    'Africa/Cairo',
    'Africa/Johannesburg',
    'Africa/Accra',
    'UTC'
  ]

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file')
      return
    }

    try {
      setUploadingImage(true)
      setError(null)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const filePath = `event-covers/${fileName}`

      // Upload to Supabase Storage (using public-uploads bucket)
      const { error: uploadError } = await supabase.storage
        .from('public-uploads')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('public-uploads')
        .getPublicUrl(filePath)

      setFormData({ ...formData, cover_image_url: publicUrl })
    } catch (err: any) {
      console.error('Error uploading image:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  const removeImage = () => {
    setFormData({ ...formData, cover_image_url: '' })
  }

  const addTag = () => {
    if (formData.tagInput.trim() && !formData.tags.includes(formData.tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.tagInput.trim()],
        tagInput: ''
      })
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag)
    })
  }

  const handleSubmit = async (e: React.FormEvent, status: 'draft' | 'published') => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in to create an event')

      // Validate required fields
      if (!formData.title.trim()) throw new Error('Event title is required')
      if (!formData.description.trim()) throw new Error('Event description is required')
      if (!formData.start_date || !formData.start_time) throw new Error('Start date and time are required')
      if (!formData.end_date || !formData.end_time) throw new Error('End date and time are required')

      // Format-specific validation
      if (formData.format === 'virtual' && !formData.virtual_link.trim()) {
        throw new Error('Virtual link is required for online events')
      }
      if (formData.format === 'in-person' && !formData.city.trim()) {
        throw new Error('City is required for in-person events')
      }
      if (formData.format === 'hybrid' && (!formData.city.trim() || !formData.virtual_link.trim())) {
        throw new Error('Both city and virtual link are required for hybrid events')
      }

      // Pricing validation
      if (!formData.is_free && !formData.ticket_price) {
        throw new Error('Ticket price is required for paid events')
      }

      // Combine date and time
      const start_date = new Date(`${formData.start_date}T${formData.start_time}:00`)
      const end_date = new Date(`${formData.end_date}T${formData.end_time}:00`)

      if (end_date <= start_date) {
        throw new Error('End date must be after start date')
      }

      // Insert event
      const { data: event, error: insertError } = await supabase
        .from('events')
        .insert({
          organizer_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          event_type: formData.event_type,
          format: formData.format,
          category: formData.category.trim() || null,

          location: formData.location.trim() || null,
          venue_name: formData.venue_name.trim() || null,
          address: formData.address.trim() || null,
          city: formData.city.trim() || null,
          country: formData.country.trim() || null,
          virtual_link: formData.virtual_link.trim() || null,

          start_date: start_date.toISOString(),
          end_date: end_date.toISOString(),
          timezone: formData.timezone,

          max_attendees: formData.max_attendees ? parseInt(formData.max_attendees) : null,
          is_free: formData.is_free,
          ticket_price: formData.is_free ? null : parseFloat(formData.ticket_price),
          currency: formData.currency,

          cover_image_url: formData.cover_image_url || null,
          thumbnail_url: formData.cover_image_url || null,

          tags: formData.tags.length > 0 ? formData.tags : null,
          status
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to event detail page
      router.push(`/events/${event.id}`)
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event')
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-display font-bold text-navy-900 mb-2">
              Create Event
            </h1>
            <p className="text-gray-600">
              Host a gathering for Africa's tech and business community
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          <form className="space-y-8">
            {/* Basic Information */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Basic Information</h2>

              <div className="space-y-6">
                {/* Event Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., AfroTech Summit 2026"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your event, what attendees will learn, who should attend..."
                    rows={5}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Event Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Event Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, event_type: type.value })}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.event_type === type.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${
                            formData.event_type === type.value ? 'text-primary-600' : 'text-gray-600'
                          }`} />
                          <div className="font-medium text-navy-900">{type.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{type.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Tech, Business, Networking, Social"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Format & Location */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Format & Location</h2>

              <div className="space-y-6">
                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Event Format *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {formatOptions.map((format) => {
                      const Icon = format.icon
                      return (
                        <button
                          key={format.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, format: format.value })}
                          className={`p-4 rounded-lg border-2 transition-all text-left ${
                            formData.format === format.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-primary-300'
                          }`}
                        >
                          <Icon className={`h-6 w-6 mb-2 ${
                            formData.format === format.value ? 'text-primary-600' : 'text-gray-600'
                          }`} />
                          <div className="font-medium text-navy-900">{format.label}</div>
                          <div className="text-xs text-gray-600 mt-1">{format.desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Virtual Link */}
                {(formData.format === 'virtual' || formData.format === 'hybrid') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Virtual Link * {formData.format === 'hybrid' && '(for online attendees)'}
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.virtual_link}
                      onChange={(e) => setFormData({ ...formData, virtual_link: e.target.value })}
                      placeholder="https://zoom.us/j/... or Google Meet link"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Physical Location */}
                {(formData.format === 'in-person' || formData.format === 'hybrid') && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Venue Name
                        </label>
                        <input
                          type="text"
                          value={formData.venue_name}
                          onChange={(e) => setFormData({ ...formData, venue_name: e.target.value })}
                          placeholder="e.g., Nairobi Tech Hub"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="e.g., Nairobi"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Street address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      <input
                        type="text"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="e.g., Kenya"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Date & Time</h2>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Time *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.end_time}
                      onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Capacity & Pricing */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Capacity & Pricing</h2>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Attendees (Optional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_attendees}
                    onChange={(e) => setFormData({ ...formData, max_attendees: e.target.value })}
                    placeholder="Leave blank for unlimited"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="is_free"
                    checked={formData.is_free}
                    onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                    className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="is_free" className="text-sm font-medium text-gray-700">
                    This is a free event
                  </label>
                </div>

                {!formData.is_free && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ticket Price *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={formData.ticket_price}
                        onChange={(e) => setFormData({ ...formData, ticket_price: e.target.value })}
                        placeholder="0.00"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="KES">KES (KSh)</option>
                        <option value="NGN">NGN (₦)</option>
                        <option value="ZAR">ZAR (R)</option>
                        <option value="GHS">GHS (GH₵)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cover Image */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Cover Image</h2>

              {formData.cover_image_url ? (
                <div className="relative">
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={formData.cover_image_url}
                      alt="Event cover"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <label className="block">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors cursor-pointer">
                    {uploadingImage ? (
                      <div className="flex flex-col items-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                        <p className="text-sm text-gray-600">Uploading image...</p>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm font-medium text-gray-900 mb-1">
                          Click to upload cover image
                        </p>
                        <p className="text-xs text-gray-600">
                          PNG, JPG up to 5MB
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              )}
            </div>

            {/* Tags */}
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <h2 className="text-xl font-bold text-navy-900 mb-6">Tags (Optional)</h2>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={formData.tagInput}
                  onChange={(e) => setFormData({ ...formData, tagInput: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tags (e.g., AI, Blockchain, Startups)"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                >
                  Add
                </button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-primary-900"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'draft')}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, 'published')}
                  disabled={loading}
                  className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Publishing...' : 'Publish Event'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

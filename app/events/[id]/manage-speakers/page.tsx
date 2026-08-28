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
  User,
  Briefcase,
  Building2,
  Linkedin,
  Twitter,
  Globe,
  GripVertical,
  Upload,
  Image as ImageIcon
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ManageSpeakersPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [speakers, setSpeakers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    bio: '',
    photo_url: '',
    linkedin_url: '',
    twitter_url: '',
    website_url: ''
  })

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEventAndSpeakers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEventAndSpeakers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load event and check if user is organizer
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, organizer_id')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError

      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to manage speakers for this event')
      }

      setEvent(eventData)

      // Load speakers
      const { data: speakersData, error: speakersError } = await supabase
        .from('event_speakers')
        .select('*')
        .eq('event_id', params.id)
        .order('order_index', { ascending: true })

      if (speakersError) throw speakersError

      setSpeakers(speakersData || [])
    } catch (err: any) {
      console.error('Error loading:', err)
      setError(err.message || 'Failed to load speakers')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const fileExt = file.name.split('.').pop()
      const fileName = `speaker-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `speakers/${fileName}`

      const { data, error: uploadError } = await supabase.storage
        .from('public-uploads')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public-uploads')
        .getPublicUrl(filePath)

      setFormData({ ...formData, photo_url: publicUrl })
      setImageFile(file)
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      title: '',
      company: '',
      bio: '',
      photo_url: '',
      linkedin_url: '',
      twitter_url: '',
      website_url: ''
    })
    setImageFile(null)
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (speaker: any) => {
    setFormData({
      name: speaker.name || '',
      title: speaker.title || '',
      company: speaker.company || '',
      bio: speaker.bio || '',
      photo_url: speaker.photo_url || '',
      linkedin_url: speaker.linkedin_url || '',
      twitter_url: speaker.twitter_url || '',
      website_url: speaker.website_url || ''
    })
    setEditingId(speaker.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      setError('Speaker name is required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (editingId) {
        // Update existing speaker
        const { error } = await supabase
          .from('event_speakers')
          .update({
            name: formData.name.trim(),
            title: formData.title.trim() || null,
            company: formData.company.trim() || null,
            bio: formData.bio.trim() || null,
            photo_url: formData.photo_url.trim() || null,
            linkedin_url: formData.linkedin_url.trim() || null,
            twitter_url: formData.twitter_url.trim() || null,
            website_url: formData.website_url.trim() || null
          })
          .eq('id', editingId)

        if (error) throw error
      } else {
        // Create new speaker
        const { error } = await supabase
          .from('event_speakers')
          .insert({
            event_id: params.id,
            name: formData.name.trim(),
            title: formData.title.trim() || null,
            company: formData.company.trim() || null,
            bio: formData.bio.trim() || null,
            photo_url: formData.photo_url.trim() || null,
            linkedin_url: formData.linkedin_url.trim() || null,
            twitter_url: formData.twitter_url.trim() || null,
            website_url: formData.website_url.trim() || null,
            order_index: speakers.length
          })

        if (error) throw error
      }

      await loadEventAndSpeakers()
      resetForm()
    } catch (err: any) {
      console.error('Error saving speaker:', err)
      setError(err.message || 'Failed to save speaker')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this speaker?')) return

    try {
      setDeleting(id)
      setError(null)

      const { error } = await supabase
        .from('event_speakers')
        .delete()
        .eq('id', id)

      if (error) throw error

      await loadEventAndSpeakers()
    } catch (err: any) {
      console.error('Error deleting speaker:', err)
      setError(err.message || 'Failed to delete speaker')
    } finally {
      setDeleting(null)
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
          <Link
            href={`/events/${params.id}`}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Back to Event
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/events/${params.id}`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-navy-900">
                  Manage Speakers
                </h1>
                <p className="text-gray-600 mt-2">{event?.title}</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Speaker
              </button>
            </div>
          </div>

          {/* Error Alert */}
          {error && event && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
            </div>
          )}

          {/* Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-navy-900">
                    {editingId ? 'Edit Speaker' : 'Add Speaker'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  {/* Title & Company */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="CEO, Speaker, etc."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder="Company name"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bio
                    </label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      placeholder="Brief bio about the speaker..."
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                    />
                  </div>

                  {/* Photo Upload/URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speaker Photo
                    </label>

                    {/* Upload Button */}
                    <div className="mb-3">
                      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={uploading}
                          className="hidden"
                        />
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600"></div>
                            <span className="text-sm text-gray-600">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="h-5 w-5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {formData.photo_url ? 'Change Photo' : 'Upload Photo'}
                            </span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Preview */}
                    {formData.photo_url && (
                      <div className="mb-3 relative">
                        <img
                          src={formData.photo_url}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, photo_url: '' })}
                          className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* OR divider */}
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">OR paste URL</span>
                      </div>
                    </div>

                    {/* URL Input */}
                    <input
                      type="url"
                      value={formData.photo_url}
                      onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
                      placeholder="https://example.com/photo.jpg"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-700">Social Links</h3>

                    <div className="flex items-center gap-3">
                      <Linkedin className="h-5 w-5 text-blue-600" />
                      <input
                        type="url"
                        value={formData.linkedin_url}
                        onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                        placeholder="LinkedIn profile URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Twitter className="h-5 w-5 text-blue-400" />
                      <input
                        type="url"
                        value={formData.twitter_url}
                        onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
                        placeholder="Twitter/X profile URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-gray-600" />
                      <input
                        type="url"
                        value={formData.website_url}
                        onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                        placeholder="Website URL"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      {saving ? 'Saving...' : editingId ? 'Update Speaker' : 'Add Speaker'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      disabled={saving}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Speakers List */}
          {speakers.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                No speakers yet
              </h3>
              <p className="text-gray-600 mb-6">
                Add speakers to showcase who will be presenting at your event
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add First Speaker
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {speakers.map((speaker) => (
                <div
                  key={speaker.id}
                  className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex items-start gap-4 mb-4">
                    {speaker.photo_url ? (
                      <img
                        src={speaker.photo_url}
                        alt={speaker.name}
                        className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">
                          {speaker.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-navy-900 mb-1">
                        {speaker.name}
                      </h3>
                      {speaker.title && (
                        <p className="text-sm text-gray-600">{speaker.title}</p>
                      )}
                      {speaker.company && (
                        <p className="text-sm text-primary-600">{speaker.company}</p>
                      )}
                    </div>
                  </div>

                  {speaker.bio && (
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {speaker.bio}
                    </p>
                  )}

                  {/* Social Links */}
                  {(speaker.linkedin_url || speaker.twitter_url || speaker.website_url) && (
                    <div className="flex gap-2 mb-4">
                      {speaker.linkedin_url && (
                        <a
                          href={speaker.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Linkedin className="h-4 w-4" />
                        </a>
                      )}
                      {speaker.twitter_url && (
                        <a
                          href={speaker.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-500"
                        >
                          <Twitter className="h-4 w-4" />
                        </a>
                      )}
                      {speaker.website_url && (
                        <a
                          href={speaker.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <Globe className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => handleEdit(speaker)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-primary-600 border border-primary-300 rounded-lg font-medium hover:bg-primary-50 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(speaker.id)}
                      disabled={deleting === speaker.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      {deleting === speaker.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

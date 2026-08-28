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
  Clock,
  Coffee,
  Mic,
  Users as UsersIcon
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function ManageSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [schedule, setSchedule] = useState<any[]>([])
  const [speakers, setSpeakers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    location: '',
    session_type: 'keynote',
    speaker_id: '',
    speaker_name: '',
    is_break: false
  })

  const sessionTypes = [
    { value: 'keynote', label: 'Keynote', icon: Mic },
    { value: 'panel', label: 'Panel Discussion', icon: UsersIcon },
    { value: 'workshop', label: 'Workshop', icon: UsersIcon },
    { value: 'break', label: 'Break', icon: Coffee },
    { value: 'networking', label: 'Networking', icon: UsersIcon }
  ]

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
        .select('id, title, organizer_id, start_date, end_date')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to manage this event')
      }

      setEvent(eventData)

      const { data: scheduleData } = await supabase
        .from('event_schedule')
        .select('*')
        .eq('event_id', params.id)
        .order('start_time', { ascending: true })
      setSchedule(scheduleData || [])

      const { data: speakersData } = await supabase
        .from('event_speakers')
        .select('id, name')
        .eq('event_id', params.id)
      setSpeakers(speakersData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      session_type: 'keynote',
      speaker_id: '',
      speaker_name: '',
      is_break: false
    })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (item: any) => {
    setFormData({
      title: item.title || '',
      description: item.description || '',
      start_time: item.start_time ? new Date(item.start_time).toISOString().slice(0, 16) : '',
      end_time: item.end_time ? new Date(item.end_time).toISOString().slice(0, 16) : '',
      location: item.location || '',
      session_type: item.session_type || 'keynote',
      speaker_id: item.speaker_id || '',
      speaker_name: item.speaker_name || '',
      is_break: item.is_break || false
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.start_time || !formData.end_time) {
      setError('Title, start time, and end time are required')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const data = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
        location: formData.location.trim() || null,
        session_type: formData.session_type,
        speaker_id: formData.speaker_id || null,
        speaker_name: formData.speaker_name.trim() || null,
        is_break: formData.session_type === 'break'
      }

      if (editingId) {
        const { error } = await supabase
          .from('event_schedule')
          .update(data)
          .eq('id', editingId)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('event_schedule')
          .insert({ ...data, event_id: params.id })
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
    if (!confirm('Delete this schedule item?')) return

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('event_schedule')
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
          <div className="mb-8">
            <Link href={`/events/${params.id}`} className="inline-flex items-center gap-2 text-primary-600 mb-4">
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-900">Manage Schedule</h1>
                <p className="text-gray-600 mt-2">{event?.title}</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-5 w-5" />
                Add Session
              </button>
            </div>
          </div>

          {error && event && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">{editingId ? 'Edit' : 'Add'} Session</h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Session Type</label>
                    <select
                      value={formData.session_type}
                      onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    >
                      {sessionTypes.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Start Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">End Time *</label>
                      <input
                        type="datetime-local"
                        required
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="w-full px-4 py-3 border rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Location/Room</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Main Hall, Room A, etc."
                      className="w-full px-4 py-3 border rounded-lg"
                    />
                  </div>

                  {speakers.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Speaker</label>
                      <select
                        value={formData.speaker_id}
                        onChange={(e) => {
                          const speaker = speakers.find(s => s.id === e.target.value)
                          setFormData({
                            ...formData,
                            speaker_id: e.target.value,
                            speaker_name: speaker?.name || ''
                          })
                        }}
                        className="w-full px-4 py-3 border rounded-lg"
                      >
                        <option value="">No speaker</option>
                        {speakers.map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                      {saving ? 'Saving...' : editingId ? 'Update' : 'Add'} Session
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

          {schedule.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No schedule yet</h3>
              <p className="text-gray-600 mb-6">Create a timeline for your event</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg"
              >
                <Plus className="h-5 w-5" />
                Add First Session
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {schedule.map((item, index) => (
                <div key={item.id} className="bg-white rounded-xl p-6 border hover:shadow-lg transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                      {index < schedule.length - 1 && <div className="w-0.5 flex-1 bg-gray-300 mt-2"></div>}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-navy-900 mb-1">{item.title}</h3>
                          <div className="flex items-center gap-3 text-sm text-primary-600 mb-2">
                            <Clock className="h-4 w-4" />
                            {new Date(item.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - {new Date(item.end_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          </div>
                          {item.session_type && (
                            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                              {item.session_type}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            disabled={deleting === item.id}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {item.description && <p className="text-sm text-gray-700 mb-2">{item.description}</p>}
                      {item.speaker_name && <p className="text-sm text-gray-600"><strong>Speaker:</strong> {item.speaker_name}</p>}
                      {item.location && <p className="text-sm text-gray-600"><strong>Location:</strong> {item.location}</p>}
                    </div>
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

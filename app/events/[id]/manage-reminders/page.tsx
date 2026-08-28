'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Save,
  AlertCircle,
  Mail,
  Clock,
  Calendar,
  CheckCircle,
  Info,
  Bell
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const reminderTypes = [
  {
    type: 'one_week',
    label: '1 Week Before',
    description: 'Send reminder 7 days before the event',
    icon: Calendar,
    defaultSubject: 'Your event is in 1 week!'
  },
  {
    type: 'one_day',
    label: '1 Day Before',
    description: 'Send reminder 24 hours before the event',
    icon: Clock,
    defaultSubject: 'Your event is tomorrow!'
  },
  {
    type: 'one_hour',
    label: '1 Hour Before',
    description: 'Send reminder 1 hour before the event starts',
    icon: Bell,
    defaultSubject: 'Your event starts in 1 hour!'
  }
]

export default function ManageRemindersPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [settings, setSettings] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

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
        .select('id, title, start_date, organizer_id')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to manage reminders for this event')
      }

      setEvent(eventData)

      // Load existing settings
      const { data: settingsData } = await supabase
        .from('event_reminder_settings')
        .select('*')
        .eq('event_id', params.id)

      // Convert array to object for easier access
      const settingsMap: any = {}
      settingsData?.forEach((setting) => {
        settingsMap[setting.reminder_type] = setting
      })

      // Initialize with defaults if not set
      reminderTypes.forEach((type) => {
        if (!settingsMap[type.type]) {
          settingsMap[type.type] = {
            reminder_type: type.type,
            is_enabled: false,
            email_subject: type.defaultSubject
          }
        }
      })

      setSettings(settingsMap)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (reminderType: string) => {
    setSettings({
      ...settings,
      [reminderType]: {
        ...settings[reminderType],
        is_enabled: !settings[reminderType].is_enabled
      }
    })
  }

  const handleSubjectChange = (reminderType: string, subject: string) => {
    setSettings({
      ...settings,
      [reminderType]: {
        ...settings[reminderType],
        email_subject: subject
      }
    })
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Save each reminder setting
      for (const reminderType of Object.keys(settings)) {
        const setting = settings[reminderType]

        if (setting.id) {
          // Update existing
          const { error } = await supabase
            .from('event_reminder_settings')
            .update({
              is_enabled: setting.is_enabled,
              email_subject: setting.email_subject
            })
            .eq('id', setting.id)
          if (error) throw error
        } else {
          // Insert new
          const { error } = await supabase
            .from('event_reminder_settings')
            .insert({
              event_id: params.id,
              reminder_type: setting.reminder_type,
              is_enabled: setting.is_enabled,
              email_subject: setting.email_subject
            })
          if (error) throw error
        }
      }

      setSuccess(true)
      await loadData()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Header */}
          <div className="mb-8">
            <Link href={`/events/${params.id}`} className="inline-flex items-center gap-2 text-primary-600 mb-4">
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <h1 className="text-3xl font-bold text-navy-900">Email Reminder Settings</h1>
            <p className="text-gray-600 mt-2">{event?.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              Event starts: {new Date(event?.start_date).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Info Alert */}
          <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Automated Email Reminders</p>
              <p>
                Configure automatic email reminders for attendees. Reminders will be sent to all users who RSVP'd as "Going".
                <br />
                <span className="text-blue-600 font-medium">Note: Email service integration required to send reminders.</span>
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && event && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">Settings saved successfully!</p>
            </div>
          )}

          {/* Reminder Settings */}
          <div className="space-y-4 mb-8">
            {reminderTypes.map((type) => {
              const setting = settings[type.type] || {}
              const Icon = type.icon

              return (
                <div key={type.type} className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      setting.is_enabled ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      <Icon className={`h-6 w-6 ${
                        setting.is_enabled ? 'text-primary-600' : 'text-gray-400'
                      }`} />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-navy-900">{type.label}</h3>
                          <p className="text-sm text-gray-600">{type.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={setting.is_enabled || false}
                            onChange={() => handleToggle(type.type)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                        </label>
                      </div>

                      {setting.is_enabled && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Subject
                          </label>
                          <input
                            type="text"
                            value={setting.email_subject || type.defaultSubject}
                            onChange={(e) => handleSubjectChange(type.type, e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder={type.defaultSubject}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Save Button */}
          <div className="flex gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors font-medium"
            >
              <Save className="h-5 w-5" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>

          {/* Setup Instructions */}
          <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
            <h3 className="font-bold text-navy-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary-600" />
              Email Service Setup Required
            </h3>
            <div className="text-sm text-gray-700 space-y-3">
              <p>
                To activate automatic email reminders, you need to integrate an email service provider.
              </p>
              <p className="font-medium text-navy-900">Recommended: Resend.com</p>
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Sign up at <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">resend.com</a></li>
                <li>Get your API key from the dashboard</li>
                <li>Add to Supabase Edge Functions or use a scheduled task</li>
                <li>Call the database function: <code className="bg-gray-200 px-2 py-1 rounded">get_users_needing_reminders()</code></li>
                <li>Send emails via Resend API</li>
              </ol>
              <p className="text-xs text-gray-500 mt-4">
                The database is ready. Settings saved here will be used once email service is connected.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

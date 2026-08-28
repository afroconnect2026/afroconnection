'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { ArrowLeft, Bell, Mail, Smartphone, Save } from 'lucide-react'
import toast from 'react-hot-toast'

interface NotificationPreferences {
  email_messages: boolean
  email_applications: boolean
  email_opportunities: boolean
  email_connections: boolean
  email_events: boolean
  push_messages: boolean
  push_applications: boolean
  push_opportunities: boolean
  push_connections: boolean
  push_events: boolean
}

export default function NotificationPreferencesPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    email_messages: true,
    email_applications: true,
    email_opportunities: true,
    email_connections: true,
    email_events: false,
    push_messages: true,
    push_applications: true,
    push_opportunities: true,
    push_connections: true,
    push_events: true
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setPreferences({
          email_messages: data.email_messages,
          email_applications: data.email_applications,
          email_opportunities: data.email_opportunities,
          email_connections: data.email_connections,
          email_events: data.email_events,
          push_messages: data.push_messages,
          push_applications: data.push_applications,
          push_opportunities: data.push_opportunities,
          push_connections: data.push_connections,
          push_events: data.push_events
        })
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading preferences:', error)
      toast.error('Failed to load preferences')
      setLoading(false)
    }
  }

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences
        })

      if (error) throw error

      toast.success('Preferences saved successfully!')
    } catch (error) {
      console.error('Error saving preferences:', error)
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  const notificationTypes = [
    {
      id: 'messages',
      title: 'Messages',
      description: 'Get notified when you receive a new message',
      icon: '💬'
    },
    {
      id: 'applications',
      title: 'Applications',
      description: 'Updates on your job/opportunity applications',
      icon: '📝'
    },
    {
      id: 'opportunities',
      title: 'Opportunities',
      description: 'New opportunities matching your profile',
      icon: '💼'
    },
    {
      id: 'connections',
      title: 'Connections',
      description: 'New connection requests and acceptances',
      icon: '🤝'
    },
    {
      id: 'events',
      title: 'Events',
      description: 'Event reminders and updates',
      icon: '📅'
    }
  ]

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 bg-gray-200 rounded w-48 mb-8 animate-pulse"></div>
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-6"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-12 bg-gray-200 rounded"></div>
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/notifications')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Notifications
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
          <p className="text-gray-600 mt-1">
            Choose how you want to be notified
          </p>
        </div>

        {/* Preferences */}
        <div className="space-y-6">
          {notificationTypes.map(type => (
            <div key={type.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className="text-3xl">{type.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {type.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {type.description}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Email</span>
                  </div>
                  <button
                    onClick={() => handleToggle(`email_${type.id}` as keyof NotificationPreferences)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences[`email_${type.id}` as keyof NotificationPreferences]
                        ? 'bg-primary-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences[`email_${type.id}` as keyof NotificationPreferences]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Push Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">In-App</span>
                  </div>
                  <button
                    onClick={() => handleToggle(`push_${type.id}` as keyof NotificationPreferences)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences[`push_${type.id}` as keyof NotificationPreferences]
                        ? 'bg-primary-600'
                        : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences[`push_${type.id}` as keyof NotificationPreferences]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="mt-8 flex items-center justify-end space-x-4">
          <button
            onClick={() => router.push('/notifications')}
            className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-5 w-5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

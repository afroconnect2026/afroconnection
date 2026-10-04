'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Settings as SettingsIcon,
  Globe,
  Mail,
  Shield,
  Database,
  Save
} from 'lucide-react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<any>({
    platformName: 'AfroConnect',
    contactEmail: 'support@afroconnect.io',
    maintenanceMode: false,
    userRegistration: true,
    autoApproveOpportunities: false,
    autoApproveEvents: false,
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSave = async () => {
    setLoading(true)
    setSuccess(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Log settings update
      await supabase.from('admin_activity_log').insert({
        admin_id: user.id,
        action: 'update_settings',
        target_type: 'system',
        details: settings
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Failed to save settings')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure platform settings</p>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <Save className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-green-900 font-medium">Settings saved successfully!</p>
        </div>
      )}

      {/* Platform Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Platform Settings</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Platform Name
            </label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Feature Toggles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Feature Controls</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <ToggleSetting
            label="Maintenance Mode"
            description="Disable platform access for non-admin users"
            value={settings.maintenanceMode}
            onChange={(val) => setSettings({ ...settings, maintenanceMode: val })}
            dangerous
          />

          <ToggleSetting
            label="User Registration"
            description="Allow new users to register on the platform"
            value={settings.userRegistration}
            onChange={(val) => setSettings({ ...settings, userRegistration: val })}
          />

          <ToggleSetting
            label="Auto-Approve Opportunities"
            description="Automatically approve new opportunity postings"
            value={settings.autoApproveOpportunities}
            onChange={(val) => setSettings({ ...settings, autoApproveOpportunities: val })}
          />

          <ToggleSetting
            label="Auto-Approve Events"
            description="Automatically approve new event creations"
            value={settings.autoApproveEvents}
            onChange={(val) => setSettings({ ...settings, autoApproveEvents: val })}
          />
        </div>
      </div>

      {/* Email Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Email Configuration</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Email templates and SMTP settings can be configured in Supabase dashboard
          </p>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Open Supabase Dashboard →
          </a>
        </div>
      </div>

      {/* Database Info */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">Database Information</h2>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Database Provider</p>
              <p className="font-medium text-gray-900">Supabase PostgreSQL</p>
            </div>
            <div>
              <p className="text-gray-600">Storage Provider</p>
              <p className="font-medium text-gray-900">Supabase Storage</p>
            </div>
            <div>
              <p className="text-gray-600">Authentication</p>
              <p className="font-medium text-gray-900">Supabase Auth</p>
            </div>
            <div>
              <p className="text-gray-600">Real-time</p>
              <p className="font-medium text-gray-900">Enabled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  )
}

// Toggle Setting Component
function ToggleSetting({
  label,
  description,
  value,
  onChange,
  dangerous = false
}: {
  label: string
  description: string
  value: boolean
  onChange: (val: boolean) => void
  dangerous?: boolean
}) {
  return (
    <div className={`flex items-center justify-between p-4 rounded-lg border ${
      dangerous ? 'border-red-200 bg-red-50' : 'border-gray-200'
    }`}>
      <div>
        <h3 className={`font-medium ${dangerous ? 'text-red-900' : 'text-gray-900'}`}>
          {label}
        </h3>
        <p className={`text-sm mt-1 ${dangerous ? 'text-red-700' : 'text-gray-600'}`}>
          {description}
        </p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          value
            ? (dangerous ? 'bg-red-600' : 'bg-blue-600')
            : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}

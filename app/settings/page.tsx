'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import {
  Settings,
  User,
  Lock,
  ShieldCheck,
  Bell,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'

type Tab = 'account' | 'verification' | 'notifications'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('account')
  const [email, setEmail] = useState('')
  const [profile, setProfile] = useState<any>(null)
  const [verification, setVerification] = useState<any>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setEmail(user.email || '')
      const [{ data: p }, { data: vr }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, user_type, is_verified').eq('id', user.id).maybeSingle(),
        supabase
          .from('verification_requests')
          .select('status, rejection_reason, updated_at, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ])
      setProfile(p)
      setVerification(vr)
      setLoading(false)
    }
    load()
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : ''
    if (hash === 'verification' || hash === 'notifications' || hash === 'account') setTab(hash)
  }, [router, supabase])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    } finally {
      setSavingPassword(false)
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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'verification', label: 'Verification', icon: ShieldCheck },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ]

  const vStatus = profile?.is_verified ? 'verified' : verification?.status && verification.status !== 'approved' ? verification.status : 'none'
  const vConfig: Record<string, { label: string; icon: any; color: string; cta: string }> = {
    verified: { label: 'Verified', icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-200', cta: 'View details' },
    pending: { label: 'Under review', icon: Clock, color: 'text-yellow-800 bg-yellow-50 border-yellow-200', cta: 'View or update request' },
    info_needed: { label: 'More information needed', icon: AlertCircle, color: 'text-blue-800 bg-blue-50 border-blue-200', cta: 'Provide information' },
    rejected: { label: 'Not approved', icon: XCircle, color: 'text-red-800 bg-red-50 border-red-200', cta: 'Update and resubmit' },
    none: { label: 'Not verified', icon: ShieldCheck, color: 'text-gray-700 bg-gray-50 border-gray-200', cta: 'Request verification' },
  }
  const v = vConfig[vStatus] || vConfig.none
  const VIcon = v.icon

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-navy-900">Settings</h1>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  history.replaceState(null, '', `#${t.id}`)
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                  tab === t.id ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.id === 'verification' && (vStatus === 'info_needed' || vStatus === 'rejected') && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
              </button>
            )
          })}
        </div>

        {tab === 'account' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-navy-900 mb-4">Account</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900 break-all">{email}</p>
                </div>
                <div>
                  <p className="text-gray-500">Account type</p>
                  <p className="font-medium text-gray-900 capitalize">{profile?.user_type || 'n/a'}</p>
                </div>
              </div>
              <Link
                href="/profile"
                className="mt-4 inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                Edit profile <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Lock className="w-5 h-5" /> Change Password
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (min 8 characters)"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  minLength={8}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button
                type="submit"
                disabled={savingPassword}
                className="bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50"
              >
                {savingPassword ? 'Saving...' : 'Change Password'}
              </button>
            </form>
          </div>
        )}

        {tab === 'verification' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">Account Verification</h2>
            <div className={`flex items-start gap-3 border rounded-lg p-4 ${v.color}`}>
              <VIcon className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">{v.label}</p>
                {vStatus === 'none' && <p className="text-sm mt-1">Get a verified badge to build trust and rank higher in search.</p>}
                {(vStatus === 'info_needed' || vStatus === 'rejected') && verification?.rejection_reason && (
                  <p className="text-sm mt-1">{verification.rejection_reason}</p>
                )}
              </div>
            </div>
            <Link
              href="/settings/verification"
              className="mt-4 inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700"
            >
              <ShieldCheck className="w-4 h-4" />
              {v.cta}
            </Link>
          </div>
        )}

        {tab === 'notifications' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-2">Notifications</h2>
            <p className="text-sm text-gray-600 mb-4">Choose which email and in-app notifications you receive.</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/notifications/preferences"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700"
              >
                <Bell className="w-4 h-4" /> Notification preferences
              </Link>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                View all notifications
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

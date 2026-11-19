'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { useTranslation } from '@/lib/i18n/LanguageContext'
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
  Globe,
} from 'lucide-react'
import toast from 'react-hot-toast'
import LanguageSwitcher from '@/components/LanguageSwitcher'

type Tab = 'account' | 'verification' | 'notifications' | 'language'

export default function SettingsPage() {
  const { t } = useTranslation()
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
      toast.error(t('settings.account.passwordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.account.passwordsNoMatch'))
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword('')
      setConfirmPassword('')
      toast.success(t('settings.account.passwordChanged'))
    } catch (error: any) {
      toast.error(error.message || t('settings.account.passwordChangeFailed'))
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
    { id: 'account', label: t('settings.tabs.account'), icon: User },
    { id: 'verification', label: t('settings.tabs.verification'), icon: ShieldCheck },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'language', label: t('settings.tabs.language'), icon: Globe },
  ]

  const vStatus = profile?.is_verified ? 'verified' : verification?.status && verification.status !== 'approved' ? verification.status : 'none'
  const vConfig: Record<string, { label: string; icon: any; color: string; cta: string }> = {
    verified: { label: t('settings.verification.status.verified'), icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-200', cta: t('settings.verification.cta.viewDetails') },
    pending: { label: t('settings.verification.status.pending'), icon: Clock, color: 'text-yellow-800 bg-yellow-50 border-yellow-200', cta: t('settings.verification.cta.viewOrUpdate') },
    info_needed: { label: t('settings.verification.status.infoNeeded'), icon: AlertCircle, color: 'text-blue-800 bg-blue-50 border-blue-200', cta: t('settings.verification.cta.provideInfo') },
    rejected: { label: t('settings.verification.status.rejected'), icon: XCircle, color: 'text-red-800 bg-red-50 border-red-200', cta: t('settings.verification.cta.updateResubmit') },
    none: { label: t('settings.verification.status.none'), icon: ShieldCheck, color: 'text-gray-700 bg-gray-50 border-gray-200', cta: t('settings.verification.cta.requestVerification') },
  }
  const v = vConfig[vStatus] || vConfig.none
  const VIcon = v.icon

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-navy-900">{t('settings.title')}</h1>
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
              <h2 className="text-lg font-bold text-navy-900 mb-4">{t('settings.account.title')}</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">{t('settings.account.email')}</p>
                  <p className="font-medium text-gray-900 break-all">{email}</p>
                </div>
                <div>
                  <p className="text-gray-500">{t('settings.account.accountType')}</p>
                  <p className="font-medium text-gray-900 capitalize">{profile?.user_type || 'n/a'}</p>
                </div>
              </div>
              <Link
                href="/profile"
                className="mt-4 inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium text-sm"
              >
                {t('settings.account.editProfile')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <form onSubmit={handleChangePassword} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                <Lock className="w-5 h-5" /> {t('settings.account.changePassword')}
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.account.newPassword')}
                  minLength={8}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.account.confirmPassword')}
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
                {savingPassword ? t('settings.account.saving') : t('settings.account.changePasswordButton')}
              </button>
            </form>
          </div>
        )}

        {tab === 'verification' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-4">{t('settings.verification.title')}</h2>
            <div className={`flex items-start gap-3 border rounded-lg p-4 ${v.color}`}>
              <VIcon className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="font-semibold">{v.label}</p>
                {vStatus === 'none' && <p className="text-sm mt-1">{t('settings.verification.noneMessage')}</p>}
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
            <h2 className="text-lg font-bold text-navy-900 mb-2">{t('settings.notifications.title')}</h2>
            <p className="text-sm text-gray-600 mb-4">{t('settings.notifications.description')}</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/notifications/preferences"
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-primary-700"
              >
                <Bell className="w-4 h-4" /> {t('settings.notifications.preferences')}
              </Link>
              <Link
                href="/notifications"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg font-medium hover:bg-gray-50"
              >
                {t('settings.notifications.viewAll')}
              </Link>
            </div>
          </div>
        )}

        {tab === 'language' && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-navy-900 mb-2">{t('settings.language.title')}</h2>
            <p className="text-sm text-gray-600 mb-6">
              {t('settings.language.description')}
            </p>
            <LanguageSwitcher variant="inline" showIcon />
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

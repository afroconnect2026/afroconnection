'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Lock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function ResetPasswordPage() {
  const { t } = useTranslation()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error(t('auth.register.errors.passwordLength'))
      return
    }
    if (password !== confirm) {
      toast.error(t('auth.resetPasswordPage.errors.passwordsNoMatch'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success(t('auth.resetPasswordPage.success.passwordUpdated'))
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || t('auth.resetPasswordPage.errors.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-3">{t('auth.resetPasswordPage.title')}</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {hasSession === false ? (
            <div className="text-center">
              <p className="text-gray-700 mb-4">{t('auth.resetPasswordPage.linkInvalid')}</p>
              <Link href="/auth/forgot-password" className="text-primary-600 font-semibold hover:underline">
                {t('auth.resetPasswordPage.requestNewLink')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('auth.resetPasswordPage.newPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={8}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('auth.confirmPassword')}</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={8}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || hasSession === null}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50"
              >
                {loading ? t('auth.resetPasswordPage.updating') : t('auth.resetPasswordPage.updatePassword')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslation } from '@/lib/i18n/LanguageContext'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      toast.error(t('auth.forgotPassword.errors.enterEmail'))
      return
    }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      })
      if (error) throw error
      setSent(true)
      toast.success(t('auth.forgotPassword.success.checkEmail'))
    } catch (error: any) {
      toast.error(error.message || t('auth.forgotPassword.errors.sendFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-display font-bold text-white mb-3">{t('auth.forgotPassword.title')}</h1>
          <p className="text-gray-300">{t('auth.forgotPassword.subtitle')}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
              <p className="text-gray-800 font-semibold mb-2">{t('auth.forgotPassword.emailSent')}</p>
              <p
                className="text-gray-600 text-sm mb-6"
                dangerouslySetInnerHTML={{ __html: t('auth.forgotPassword.emailSentMessage').replace('{email}', email) }}
              />
              <button onClick={() => setSent(false)} className="text-primary-600 hover:underline text-sm font-semibold">
                {t('auth.forgotPassword.sendAgain')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">{t('auth.emailAddress')}</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-gray-900 focus:outline-none focus:border-primary-500 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-4 rounded-xl font-bold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50"
              >
                {loading ? t('auth.forgotPassword.sending') : t('auth.sendResetLink')}
              </button>
            </form>
          )}
          <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-4 h-4" /> {t('auth.forgotPassword.backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  )
}

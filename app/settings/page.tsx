'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import ComingSoon from '@/components/ComingSoon'
import { Settings } from 'lucide-react'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComingSoon
          icon={Settings}
          title="Settings Coming Soon"
          description="Customize your AfroConnect experience with comprehensive account and privacy settings."
          features={[
            'Account settings and profile management',
            'Privacy and visibility controls',
            'Notification preferences',
            'Email and communication settings',
            'Security settings (password, 2FA)',
            'Connected accounts and integrations',
            'Data export and account deletion'
          ]}
        />
      </div>
    </AuthenticatedLayout>
  )
}

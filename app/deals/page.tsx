'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import ComingSoon from '@/components/ComingSoon'
import { Briefcase } from 'lucide-react'

export default function DealsPage() {
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
          icon={Briefcase}
          title="Deal Queue"
          description="Triage founder matches one by one, with full context on every company."
          features={[
            'Swipe-style deal triage with save and pass actions',
            'Pipeline stages: matched, contacted, in diligence, committed',
            'Pass reasons that sharpen future match quality',
            'Side-by-side comparison against your investment thesis',
            'Watchlist and portfolio tracking'
          ]}
        />
      </div>
    </AuthenticatedLayout>
  )
}

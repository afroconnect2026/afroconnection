'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import ComingSoon from '@/components/ComingSoon'
import { ShieldCheck } from 'lucide-react'

export default function VerificationPage() {
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
          icon={ShieldCheck}
          title="Get Verified"
          description="Earn a verified badge so founders and companies know you are who you say you are."
          features={[
            'Identity verification with government ID',
            'Verified investor badge with accreditation checks',
            'Company domain and registration verification',
            'Higher ranking in search and match results',
            'Verified-only filters across the network'
          ]}
        />
      </div>
    </AuthenticatedLayout>
  )
}

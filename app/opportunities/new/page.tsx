'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import ComingSoon from '@/components/ComingSoon'
import { PlusCircle } from 'lucide-react'

export default function NewOpportunityPage() {
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
          icon={PlusCircle}
          title="Post an Opportunity"
          description="Share a role, raise, partnership, or mentorship offer with the AfroConnect network."
          features={[
            'Post jobs, investments, partnerships, and mentorship offers',
            'Target by industry, location, and remote availability',
            'Set budget ranges and application deadlines',
            'Track views and applications in your dashboard',
            'Manage your hiring and deal pipeline'
          ]}
        />
      </div>
    </AuthenticatedLayout>
  )
}

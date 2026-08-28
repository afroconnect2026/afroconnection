'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import ComingSoon from '@/components/ComingSoon'
import { Users } from 'lucide-react'

export default function ApplicantsPage() {
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
          icon={Users}
          title="Applicant Tracking"
          description="Manage your hiring pipeline from first application to offer."
          features={[
            'Review applications across all of your open roles',
            'Move candidates through shortlisted, interviewing, and hired',
            'Read cover notes and download resumes',
            'Message candidates directly from the pipeline',
            'Build a talent pool of saved candidates'
          ]}
        />
      </div>
    </AuthenticatedLayout>
  )
}

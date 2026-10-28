'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AdminNav from '@/components/admin/AdminNav'
import AdminHeader from '@/components/admin/AdminHeader'
import {
  AdminContext,
  AdminCountsContext,
  AdminPendingCounts,
  EMPTY_COUNTS,
} from '@/components/admin/AdminContext'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [admin, setAdmin] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [counts, setCounts] = useState<AdminPendingCounts>(EMPTY_COUNTS)
  const router = useRouter()
  const pathname = usePathname()
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    const checkAdminAuth = async () => {
      // Skip auth check on login page
      if (pathname === '/admin/login') {
        setLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      // Check if user is an admin
      const { data: adminData, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .eq('is_active', true)
        .single()

      if (error || !adminData) {
        router.push('/admin/login')
        return
      }

      setAdmin((prev: any) => (prev?.id === adminData.id && prev?.role === adminData.role ? prev : adminData))
      setLoading(false)
    }

    checkAdminAuth()
  }, [pathname, router, supabase])

  // Update last login once per session (RPC: admins cannot write admin_users directly)
  useEffect(() => {
    if (!admin?.id) return
    supabase.rpc('admin_touch_login').then(({ error }) => {
      if (error) console.warn('admin_touch_login failed:', error.message)
    })
  }, [admin?.id, supabase])

  const refreshCounts = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_pending_counts')
    if (!error && data) {
      setCounts({ ...EMPTY_COUNTS, ...(data as any) })
      return
    }
    // Fallback when sql/VERIFICATION-NOTIFICATIONS-FIX.sql has not been run yet
    const { data: stats } = await supabase.rpc('admin_platform_stats')
    if (stats) {
      const s = stats as any
      setCounts({
        verifications: s.pending_verifications || 0,
        verifications_info: 0,
        opportunities: s.pending_opportunities || 0,
        events: s.pending_events || 0,
        reports: s.pending_reports || 0,
      })
    }
  }, [supabase])

  // Keep pending counts fresh: on load, every 60s, when the tab regains focus
  useEffect(() => {
    if (!admin?.id) return
    refreshCounts()
    const interval = setInterval(refreshCounts, 60000)
    const onFocus = () => refreshCounts()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [admin?.id, refreshCounts])

  // Show login page without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Admin Portal...</p>
        </div>
      </div>
    )
  }

  if (!admin) {
    return null
  }

  return (
    <AdminContext.Provider value={admin}>
      <AdminCountsContext.Provider value={{ counts, refresh: refreshCounts }}>
        <div className="min-h-screen bg-gray-50">
          <AdminHeader admin={admin} />
          <div className="flex">
            <AdminNav admin={admin} />
            <main className="flex-1 ml-64 pt-16">
              <div className="p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </AdminCountsContext.Provider>
    </AdminContext.Provider>
  )
}

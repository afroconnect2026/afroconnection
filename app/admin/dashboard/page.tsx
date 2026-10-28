'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  CheckCircle,
  Flag,
  UserCheck,
  Activity,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import StatCard from '@/components/admin/StatCard'
import ActivityLog from '@/components/admin/ActivityLog'
import { rpc } from '@/lib/admin'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setRefreshing(true)
    setLoadError(null)
    try {
      const data = await rpc<any>('admin_platform_stats')
      setStats({
        totalUsers: data.total_users || 0,
        activeUsers: data.active_users_7d || 0,
        newUsers: data.new_users_30d || 0,
        verifiedUsers: data.verified_users || 0,
        totalOpportunities: data.total_opportunities || 0,
        activeOpportunities: data.active_opportunities || 0,
        pendingOpportunities: data.pending_opportunities || 0,
        totalEvents: data.total_events || 0,
        upcomingEvents: data.upcoming_events || 0,
        pendingEvents: data.pending_events || 0,
        totalConnections: data.total_connections || 0,
        pendingVerifications: data.pending_verifications || 0,
        pendingReports: data.pending_reports || 0,
      })

      // Fetch recent admin activity
      const { data: activityData, error: activityError } = await supabase
        .from('admin_activity_log')
        .select(`
          *,
          admin:admin_users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      if (activityError) console.error('Error fetching activity:', activityError)
      setRecentActivity(activityData || [])
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      setLoadError(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage AfroConnect platform
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{loadError}</div>
      )}

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          subtitle={`${stats?.activeUsers} active (7d) • ${stats?.newUsers} new (30d)`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Opportunities"
          value={stats?.activeOpportunities}
          subtitle={`${stats?.totalOpportunities} total • live`}
          icon={FileText}
          color="green"
        />
        <StatCard
          title="Events"
          value={stats?.upcomingEvents}
          subtitle={`${stats?.totalEvents} total • upcoming`}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Connections"
          value={stats?.totalConnections}
          subtitle="Accepted connections"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ActionCard
          title="Pending Opportunities"
          count={stats?.pendingOpportunities}
          href="/admin/opportunities"
          icon={FileText}
          color="yellow"
        />
        <ActionCard
          title="Pending Events"
          count={stats?.pendingEvents}
          href="/admin/events"
          icon={Calendar}
          color="yellow"
        />
        <ActionCard
          title="Pending Verifications"
          count={stats?.pendingVerifications}
          href="/admin/verifications"
          icon={CheckCircle}
          color="yellow"
        />
        <ActionCard
          title="Pending Reports"
          count={stats?.pendingReports}
          href="/admin/reports"
          icon={Flag}
          color="red"
        />
        <ActionCard
          title="Verified Users"
          count={stats?.verifiedUsers}
          href="/admin/users?verified=verified"
          icon={UserCheck}
          color="green"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Admin Activity
            </h2>
          </div>
        </div>
        <ActivityLog activities={recentActivity} />
      </div>
    </div>
  )
}

// Action Card Component
function ActionCard({
  title,
  count,
  href,
  icon: Icon,
  color
}: {
  title: string
  count: number
  href: string
  icon: any
  color: string
}) {
  const colors = {
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    green: 'bg-green-50 text-green-600 border-green-200',
  }

  return (
    <Link
      href={href}
      className={`block p-6 rounded-lg border-2 ${colors[color as keyof typeof colors]} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        <span className="text-3xl font-bold">{count ?? 0}</span>
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm mt-1 opacity-80">Click to review →</p>
    </Link>
  )
}

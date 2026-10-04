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
  Activity
} from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import ActivityLog from '@/components/admin/ActivityLog'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch platform statistics
      const [
        usersResult,
        opportunitiesResult,
        eventsResult,
        connectionsResult,
        verificationsResult,
        reportsResult,
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('content_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ])

      // Active users (last 7 days)
      const { count: activeUsersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

      // Active opportunities
      const { count: activeOpportunitiesCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      // Upcoming events
      const { count: upcomingEventsCount } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .gte('start_date', new Date().toISOString())

      setStats({
        totalUsers: usersResult.count || 0,
        activeUsers: activeUsersCount || 0,
        totalOpportunities: opportunitiesResult.count || 0,
        activeOpportunities: activeOpportunitiesCount || 0,
        totalEvents: eventsResult.count || 0,
        upcomingEvents: upcomingEventsCount || 0,
        totalConnections: connectionsResult.count || 0,
        pendingVerifications: verificationsResult.count || 0,
        pendingReports: reportsResult.count || 0,
      })

      // Fetch recent admin activity
      const { data: activityData } = await supabase
        .from('admin_activity_log')
        .select(`
          *,
          admin:admin_users(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecentActivity(activityData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setLoading(false)
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Monitor and manage AfroConnect platform
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers}
          subtitle={`${stats?.activeUsers} active (7d)`}
          icon={Users}
          color="blue"
          trend="+12%"
        />
        <StatCard
          title="Opportunities"
          value={stats?.activeOpportunities}
          subtitle={`${stats?.totalOpportunities} total`}
          icon={FileText}
          color="green"
          trend="+8%"
        />
        <StatCard
          title="Events"
          value={stats?.upcomingEvents}
          subtitle={`${stats?.totalEvents} total`}
          icon={Calendar}
          color="purple"
          trend="+15%"
        />
        <StatCard
          title="Connections"
          value={stats?.totalConnections}
          subtitle="Accepted connections"
          icon={TrendingUp}
          color="orange"
          trend="+20%"
        />
      </div>

      {/* Action Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          count={Math.round(stats?.totalUsers * 0.3)} // Mock percentage
          href="/admin/users?verified=true"
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
    <a
      href={href}
      className={`block p-6 rounded-lg border-2 ${colors[color as keyof typeof colors]} hover:shadow-md transition-shadow`}
    >
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8" />
        <span className="text-3xl font-bold">{count}</span>
      </div>
      <h3 className="font-medium">{title}</h3>
      <p className="text-sm mt-1 opacity-80">Click to review →</p>
    </a>
  )
}

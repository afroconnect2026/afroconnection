'use client'

import { useEffect, useState } from 'react'
import {
  Users,
  TrendingUp,
  FileText,
  Calendar,
  MessageCircle,
  UserCheck,
  Download,
  RefreshCw
} from 'lucide-react'
import StatCard from '@/components/admin/StatCard'
import { rpc } from '@/lib/admin'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setRefreshing(true)
    setLoadError(null)
    try {
      const data = await rpc<any>('admin_platform_stats')
      setAnalytics({
        totalUsers: data.total_users || 0,
        activeUsers: data.active_users_7d || 0,
        newUsers: data.new_users_30d || 0,
        verifiedUsers: data.verified_users || 0,
        bannedUsers: data.banned_users || 0,
        totalOpportunities: data.total_opportunities || 0,
        activeOpportunities: data.active_opportunities || 0,
        totalEvents: data.total_events || 0,
        upcomingEvents: data.upcoming_events || 0,
        totalConnections: data.total_connections || 0,
        typeDistribution: data.users_by_type || {},
        countryDistribution: data.users_by_country || {}
      })
    } catch (error: any) {
      console.error('Error fetching analytics:', error)
      setLoadError(error.message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const exportData = () => {
    if (!analytics) return
    const rows: (string | number)[][] = [
      ['Metric', 'Value'],
      ['Total users', analytics.totalUsers],
      ['Active users (7d)', analytics.activeUsers],
      ['New users (30d)', analytics.newUsers],
      ['Verified users', analytics.verifiedUsers],
      ['Banned users', analytics.bannedUsers],
      ['Total opportunities', analytics.totalOpportunities],
      ['Live opportunities', analytics.activeOpportunities],
      ['Total events', analytics.totalEvents],
      ['Upcoming events', analytics.upcomingEvents],
      ['Accepted connections', analytics.totalConnections],
      [],
      ['User type', 'Count'],
      ...Object.entries(analytics.typeDistribution).map(([k, v]) => [k, v as number]),
      [],
      ['Country', 'Count'],
      ...Object.entries(analytics.countryDistribution).map(([k, v]) => [k, v as number])
    ]
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `afroconnect-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const pct = (n: number) => (analytics?.totalUsers ? Math.round((n / analytics.totalUsers) * 100) : 0)
  const ratio = (n: number) => (analytics?.totalUsers ? Math.round((n / analytics.totalUsers) * 10) / 10 : 0)

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  if (!analytics) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">
        {loadError || 'Failed to load analytics'}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform insights and statistics</p>
        </div>
        <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">All-time totals • live data</span>
        <button
          onClick={fetchAnalytics}
          disabled={refreshing}
          className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={analytics.totalUsers}
          subtitle={`${analytics.activeUsers} active (7d)`}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Verified Users"
          value={analytics.verifiedUsers}
          subtitle={`${pct(analytics.verifiedUsers)}% verified`}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Opportunities"
          value={analytics.totalOpportunities}
          subtitle={`${analytics.activeOpportunities} live`}
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Events"
          value={analytics.totalEvents}
          subtitle={`${analytics.upcomingEvents} upcoming`}
          icon={Calendar}
          color="orange"
        />
      </div>

      {/* User Type Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Distribution by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(analytics.typeDistribution || {}).map(([type, count]: [string, any]) => (
            <div key={type} className="bg-gray-50 rounded-lg p-4">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-sm text-gray-600 capitalize">{type}</p>
              <p className="text-xs text-gray-500 mt-1">
                {pct(count)}%
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Country Distribution */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h2>
        <div className="space-y-2">
          {Object.entries(analytics.countryDistribution || {})
            .sort((a: any, b: any) => b[1] - a[1])
            .slice(0, 10)
            .map(([country, count]: [string, any]) => (
              <div key={country} className="flex items-center justify-between">
                <span className="text-gray-700">{country}</span>
                <div className="flex items-center gap-3">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${pct(count)}%` }}
                    />
                  </div>
                  <span className="text-gray-900 font-semibold w-12 text-right">{count}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Engagement Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{analytics.totalConnections}</p>
            <p className="text-gray-600">Total Connections</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {ratio(analytics.totalOpportunities)}
            </p>
            <p className="text-gray-600">Avg Opportunities/User</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {ratio(analytics.totalEvents)}
            </p>
            <p className="text-gray-600">Avg Events/User</p>
          </div>
        </div>
      </div>
    </div>
  )
}

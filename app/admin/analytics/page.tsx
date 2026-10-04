'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Users,
  TrendingUp,
  FileText,
  Calendar,
  MessageCircle,
  UserCheck,
  Download
} from 'lucide-react'
import StatCard from '@/components/admin/StatCard'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Fetch comprehensive analytics
      const [
        totalUsers,
        activeUsers,
        verifiedUsers,
        totalOpps,
        totalEvents,
        totalConnections,
        usersByType,
        usersByCountry
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true })
          .gte('last_active_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_verified', true),
        supabase.from('opportunities').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('connections').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
        supabase.from('profiles').select('user_type'),
        supabase.from('profiles').select('location')
      ])

      // Process user type distribution
      const typeDistribution = usersByType.data?.reduce((acc: any, user: any) => {
        acc[user.user_type] = (acc[user.user_type] || 0) + 1
        return acc
      }, {})

      // Process country distribution
      const countryDistribution = usersByCountry.data?.reduce((acc: any, user: any) => {
        const country = user.location?.split(',').pop()?.trim() || 'Unknown'
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {})

      setAnalytics({
        totalUsers: totalUsers.count || 0,
        activeUsers: activeUsers.count || 0,
        verifiedUsers: verifiedUsers.count || 0,
        totalOpportunities: totalOpps.count || 0,
        totalEvents: totalEvents.count || 0,
        totalConnections: totalConnections.count || 0,
        typeDistribution,
        countryDistribution
      })

      setLoading(false)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setLoading(false)
    }
  }

  const exportData = async () => {
    alert('Export functionality coming soon!')
  }

  if (loading) {
    return <div className="text-center py-12">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Platform insights and statistics</p>
        </div>
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
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
          subtitle={`${Math.round((analytics.verifiedUsers / analytics.totalUsers) * 100)}% verified`}
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Opportunities"
          value={analytics.totalOpportunities}
          subtitle="Posted on platform"
          icon={FileText}
          color="purple"
        />
        <StatCard
          title="Events"
          value={analytics.totalEvents}
          subtitle="Created"
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
              <p className="text-sm text-gray-600 capitalize">{type}s</p>
              <p className="text-xs text-gray-500 mt-1">
                {Math.round((count / analytics.totalUsers) * 100)}%
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
                      style={{ width: `${(count / analytics.totalUsers) * 100}%` }}
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
              {Math.round(analytics.totalOpportunities / analytics.totalUsers * 10) / 10}
            </p>
            <p className="text-gray-600">Avg Opportunities/User</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(analytics.totalEvents / analytics.totalUsers * 10) / 10}
            </p>
            <p className="text-gray-600">Avg Events/User</p>
          </div>
        </div>
      </div>
    </div>
  )
}

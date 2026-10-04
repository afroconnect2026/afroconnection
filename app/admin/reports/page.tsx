'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Flag, CheckCircle, XCircle, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export default function AdminReportsPage() {
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const supabase = createClient()

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      let query = supabase
        .from('content_reports')
        .select(`
          *,
          reporter:profiles!reporter_id(full_name, email),
          reported_user:profiles!reported_user_id(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setReports(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching reports:', error)
      setLoading(false)
    }
  }

  const handleResolve = async (id: string) => {
    const notes = prompt('Enter resolution notes:')
    if (!notes) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminData) return

      await supabase
        .from('content_reports')
        .update({
          status: 'resolved',
          resolved_by: adminData.id,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes
        })
        .eq('id', id)

      await supabase.from('admin_activity_log').insert({
        admin_id: adminData.id,
        action: 'resolve_report',
        target_type: 'report',
        target_id: id,
        details: { notes }
      })

      fetchReports()
    } catch (error) {
      console.error('Error resolving report:', error)
    }
  }

  const handleDismiss = async (id: string) => {
    if (!confirm('Dismiss this report?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminData) return

      await supabase
        .from('content_reports')
        .update({
          status: 'dismissed',
          resolved_by: adminData.id,
          resolved_at: new Date().toISOString()
        })
        .eq('id', id)

      fetchReports()
    } catch (error) {
      console.error('Error dismissing report:', error)
    }
  }

  const pendingCount = reports.filter(r => r.status === 'pending').length

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Review user reports and flagged content</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-red-50 px-4 py-2 rounded-lg">
            <span className="text-red-900 font-semibold">
              {pendingCount} Pending Review
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
        {['pending', 'reviewing', 'resolved', 'dismissed', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg shadow-sm border-2 border-red-100 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <Flag className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">{report.report_type}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Reported by {report.reporter?.full_name} • {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  report.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {report.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  report.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  report.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  report.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {report.severity}
                </span>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900 mb-1">Report Details</p>
              <p className="text-sm text-gray-700">{report.description}</p>
            </div>

            {report.reported_user && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-gray-600">Reported User:</span>
                <span className="font-medium text-gray-900">{report.reported_user.full_name}</span>
                <span className="text-gray-500">({report.reported_user.email})</span>
              </div>
            )}

            {report.reported_content_type && (
              <div className="flex items-center gap-2 mb-4 text-sm">
                <span className="text-gray-600">Content Type:</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  {report.reported_content_type}
                </span>
              </div>
            )}

            {report.resolution_notes && (
              <div className="bg-green-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Resolution Notes</p>
                <p className="text-sm text-gray-700">{report.resolution_notes}</p>
              </div>
            )}

            {report.status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleResolve(report.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve
                </button>
                <button
                  onClick={() => handleDismiss(report.id)}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700"
                >
                  <XCircle className="w-4 h-4" />
                  Dismiss
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {reports.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          No {filter} reports
        </div>
      )}
    </div>
  )
}

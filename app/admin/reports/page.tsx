'use client'

import { useEffect, useState } from 'react'
import { Flag, CheckCircle, XCircle, Eye, Search, Trash2, Ban } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { rpc, can } from '@/lib/admin'
import { useAdmin, useAdminCounts } from '@/components/admin/AdminContext'
import ReasonModal from '@/components/admin/ReasonModal'

const contentLink = (report: any) => {
  if (!report.reported_content_id && !report.reported_user_id) return null
  switch (report.reported_content_type) {
    case 'opportunity':
      return `/opportunities/${report.reported_content_id}`
    case 'event':
      return `/events/${report.reported_content_id}`
    case 'user':
      return `/profile/${report.reported_user_id || report.reported_content_id}`
    default:
      return report.reported_user_id ? `/profile/${report.reported_user_id}` : null
  }
}

export default function AdminReportsPage() {
  const admin = useAdmin()
  const canHandle = can(admin?.role, 'reports')
  const canRemove = can(admin?.role, 'moderate')
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState('pending')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notesFor, setNotesFor] = useState<{ report: any; status: string; removeContent: boolean } | null>(null)
  const { refresh: refreshCounts } = useAdminCounts()

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    setLoadError(null)
    try {
      const data = await rpc<any[]>('admin_list_reports', { p_status: filter })
      setReports(data || [])
    } catch (error: any) {
      console.error('Error fetching reports:', error)
      setLoadError(error.message)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const update = async (
    report: any,
    status: string,
    opts: { removeContent?: boolean; askNotes?: boolean; notes?: string } = {}
  ) => {
    const notes: string | null = opts.notes ?? null
    if (opts.askNotes && notes === null) {
      // collect notes in a modal (window.prompt is blocked in some browsers/PWAs)
      setNotesFor({ report, status, removeContent: !!opts.removeContent })
      return
    }
    if (status === 'dismissed' && !confirm('Dismiss this report as no violation?')) {
      return
    }

    setBusyId(report.id)
    try {
      await rpc('admin_update_report', {
        p_report_id: report.id,
        p_status: status,
        p_notes: notes,
        p_remove_content: !!opts.removeContent
      })
      toast.success(
        opts.removeContent
          ? 'Content removed and report resolved'
          : status === 'reviewing'
          ? 'Marked as under review'
          : status === 'dismissed'
          ? 'Report dismissed'
          : 'Report resolved'
      )
      await fetchReports()
      refreshCounts()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

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
        {filter === 'pending' && reports.length > 0 && (
          <div className="bg-red-50 px-4 py-2 rounded-lg">
            <span className="text-red-900 font-semibold">{reports.length} Pending Review</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
        {['pending', 'reviewing', 'resolved', 'dismissed', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm ${
              filter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{loadError}</div>
      )}

      <div className="space-y-4">
        {reports.map((report) => {
          const link = contentLink(report)
          const busy = busyId === report.id
          const open = report.status === 'pending' || report.status === 'reviewing'
          const removable =
            (report.reported_content_type === 'opportunity' || report.reported_content_type === 'event') &&
            report.reported_content_id &&
            report.content_moderation_status !== 'rejected'
          return (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border-2 border-red-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <Flag className="w-5 h-5 text-red-600 mt-1" />
                  <div>
                    <h3 className="font-semibold text-gray-900 capitalize">{report.report_type?.replace(/_/g, ' ')}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Reported by {report.reporter?.full_name || 'Unknown'}
                      {report.reporter?.email ? ` (${report.reporter.email})` : ''} •{' '}
                      {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : report.status === 'reviewing'
                        ? 'bg-blue-100 text-blue-700'
                        : report.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {report.status}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      report.severity === 'critical'
                        ? 'bg-red-100 text-red-700'
                        : report.severity === 'high'
                        ? 'bg-orange-100 text-orange-700'
                        : report.severity === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {report.severity}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-900 mb-1">Report Details</p>
                <p className="text-sm text-gray-700">{report.description || 'No description provided'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                {report.reported_content_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Content:</span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{report.reported_content_type}</span>
                    {report.content_title && <span className="font-medium text-gray-900">{report.content_title}</span>}
                    {report.content_moderation_status === 'rejected' && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">removed</span>
                    )}
                  </div>
                )}
                {report.reported_user && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">User:</span>
                    <Link href={`/admin/users/${report.reported_user.id}`} className="font-medium text-blue-600 hover:underline">
                      {report.reported_user.full_name}
                    </Link>
                    {report.reported_user.email && <span className="text-gray-500">({report.reported_user.email})</span>}
                    {report.reported_user.is_banned && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">banned</span>
                    )}
                  </div>
                )}
              </div>

              {report.resolution_notes && (
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-1">Resolution Notes</p>
                  <p className="text-sm text-gray-700">{report.resolution_notes}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                {canHandle && open && (
                  <>
                    <button
                      onClick={() => update(report, 'resolved', { askNotes: true })}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Resolve
                    </button>
                    {canRemove && removable && (
                      <button
                        onClick={() => update(report, 'resolved', { askNotes: true, removeContent: true })}
                        disabled={busy}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove Content
                      </button>
                    )}
                    {report.status === 'pending' && (
                      <button
                        onClick={() => update(report, 'reviewing')}
                        disabled={busy}
                        className="flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-50 disabled:opacity-50"
                      >
                        <Search className="w-4 h-4" />
                        Mark Reviewing
                      </button>
                    )}
                    <button
                      onClick={() => update(report, 'dismissed')}
                      disabled={busy}
                      className="flex-1 flex items-center justify-center gap-2 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Dismiss
                    </button>
                  </>
                )}
                {can(admin?.role, 'ban') && report.reported_user && !report.reported_user.is_banned && (
                  <Link
                    href={`/admin/users/${report.reported_user.id}?action=ban`}
                    className="flex items-center justify-center gap-2 border-2 border-orange-300 text-orange-700 py-2 px-4 rounded-lg hover:bg-orange-50"
                  >
                    <Ban className="w-4 h-4" />
                    Ban User
                  </Link>
                )}
                {link && (
                  <Link
                    href={link}
                    target="_blank"
                    className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {reports.length === 0 && !loadError && (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          No {filter === 'all' ? '' : filter} reports
        </div>
      )}

      {notesFor && (
        <ReasonModal
          title={notesFor.removeContent ? 'Remove reported content' : 'Resolve report'}
          description={
            notesFor.removeContent
              ? 'The content is unpublished and the owner is notified with this reason. The reporter is told action was taken.'
              : 'The reporter is notified that the report was reviewed and action was taken.'
          }
          label={notesFor.removeContent ? 'Reason (sent to the content owner)' : 'Resolution notes'}
          confirmLabel={notesFor.removeContent ? 'Remove Content' : 'Resolve'}
          confirmClassName={notesFor.removeContent ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          busy={busyId === notesFor.report.id}
          onClose={() => setNotesFor(null)}
          onConfirm={async (text) => {
            const n = notesFor
            setNotesFor(null)
            await update(n.report, n.status, { removeContent: n.removeContent, askNotes: true, notes: text })
          }}
        />
      )}
    </div>
  )
}

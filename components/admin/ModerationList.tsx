'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Eye, Plus, Edit, Trash2, Calendar, RotateCcw } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { rpc, can, describeError } from '@/lib/admin'
import { useAdmin, useAdminCounts } from '@/components/admin/AdminContext'
import ReasonModal from '@/components/admin/ReasonModal'

type ContentType = 'opportunity' | 'event'

interface ModerationListProps {
  contentType: ContentType
  renderModal: (props: { isOpen: boolean; onClose: () => void; item: any; onSuccess: () => void }) => React.ReactNode
}

const CONFIG = {
  opportunity: {
    table: 'opportunities',
    ownerKey: 'creator_id',
    ownerEmbed: 'owner:profiles!creator_id(id, full_name)',
    title: 'Opportunities',
    subtitle: 'Create, edit, and moderate opportunities',
    publicPath: '/opportunities',
    singular: 'opportunity',
  },
  event: {
    table: 'events',
    ownerKey: 'organizer_id',
    ownerEmbed: 'owner:profiles!organizer_id(id, full_name)',
    title: 'Events',
    subtitle: 'Create, edit, and moderate events',
    publicPath: '/events',
    singular: 'event',
  },
} as const

export default function ModerationList({ contentType, renderModal }: ModerationListProps) {
  const cfg = CONFIG[contentType]
  const admin = useAdmin()
  const canModerate = can(admin?.role, 'moderate')
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [filter, setFilter] = useState('pending')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [rejecting, setRejecting] = useState<any>(null)
  const { refresh: refreshCounts } = useAdminCounts()
  const supabase = createClient()

  useEffect(() => {
    fetchItems()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const fetchCounts = async () => {
    const statuses = ['pending', 'approved', 'rejected']
    const results = await Promise.all(
      statuses.map((s) => {
        const q = supabase.from(cfg.table).select('id', { count: 'exact', head: true })
        // legacy rows created before moderation existed have NULL status = approved
        return s === 'approved'
          ? q.or('moderation_status.eq.approved,moderation_status.is.null')
          : q.eq('moderation_status', s)
      })
    )
    const next: Record<string, number> = {}
    statuses.forEach((s, i) => (next[s] = results[i].count || 0))
    setCounts(next)
    refreshCounts()
  }

  const fetchItems = async () => {
    setLoadError(null)
    try {
      let query = supabase
        .from(cfg.table)
        .select(`*, ${cfg.ownerEmbed}`)
        .order('created_at', { ascending: false })

      if (filter === 'approved') {
        query = query.or('moderation_status.eq.approved,moderation_status.is.null')
      } else if (filter !== 'all') {
        query = query.eq('moderation_status', filter)
      }

      const { data, error } = await query
      if (error) throw error
      setItems(data || [])
      fetchCounts()
    } catch (error: any) {
      console.error(`Error fetching ${cfg.table}:`, error)
      setLoadError(describeError(error))
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleModerate = async (item: any, decision: 'approved' | 'rejected' | 'pending', notes: string | null = null) => {
    if (decision === 'rejected' && notes === null) {
      // ask for a reason in a modal (window.prompt is blocked in some browsers/PWAs)
      setRejecting(item)
      return
    }

    setBusyId(item.id)
    try {
      await rpc('admin_moderate_content', {
        p_content_type: contentType,
        p_content_id: item.id,
        p_decision: decision,
        p_notes: notes,
      })
      toast.success(
        decision === 'approved'
          ? `Approved - "${item.title}" is now live and the owner was notified`
          : decision === 'rejected'
          ? 'Rejected - the owner was notified'
          : 'Moved back to pending review'
      )
      await fetchItems()
    } catch (error: any) {
      toast.error(error.message || `Failed to update ${cfg.singular}`)
    } finally {
      setBusyId(null)
    }
  }

  const handleDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to delete "${item.title}"? This action cannot be undone.`)) return

    setBusyId(item.id)
    try {
      const { data, error } = await supabase.from(cfg.table).delete().eq('id', item.id).select('id')
      if (error) throw error
      if (!data || data.length === 0) {
        throw new Error('Delete was blocked. Make sure sql/PRODUCTION-ADMIN-FIX.sql has been run.')
      }

      await supabase.from('admin_activity_log').insert({
        admin_id: admin?.id,
        action: 'delete_content',
        target_type: contentType,
        target_id: item.id,
        details: { title: item.title },
      })

      toast.success(`${contentType === 'event' ? 'Event' : 'Opportunity'} deleted`)
      await fetchItems()
    } catch (error: any) {
      toast.error(describeError(error))
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
          <h1 className="text-3xl font-bold text-gray-900">{cfg.title}</h1>
          <p className="text-gray-600 mt-1">{cfg.subtitle}</p>
        </div>
        <div className="flex items-center space-x-3">
          {(counts.pending || 0) > 0 && (
            <div className="bg-yellow-50 px-4 py-2 rounded-lg">
              <span className="text-yellow-900 font-semibold">{counts.pending} Pending Review</span>
            </div>
          )}
          <button
            onClick={() => {
              setEditing(null)
              setModalOpen(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create New</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              filter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && counts[status] !== undefined && (
              <span className="ml-1 opacity-75">({counts[status]})</span>
            )}
          </button>
        ))}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{loadError}</div>
      )}

      {!canModerate && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm">
          Your role ({admin?.role}) cannot approve or reject content.
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const status = item.moderation_status || 'approved'
          const busy = busyId === item.id
          const typeLabel = contentType === 'event' ? item.event_type : item.type
          return (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    by{' '}
                    {item.owner?.id ? (
                      <Link href={`/admin/users/${item.owner.id}`} className="text-blue-600 hover:underline">
                        {item.owner.full_name || 'Unknown user'}
                      </Link>
                    ) : (
                      'Unknown user'
                    )}{' '}
                    • {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {item.status && (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {item.status}
                    </span>
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {status}
                  </span>
                </div>
              </div>

              <p className="text-gray-700 mb-4">
                {item.description?.slice(0, 200)}
                {item.description?.length > 200 ? '...' : ''}
              </p>

              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {contentType === 'event' && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{item.start_date ? format(new Date(item.start_date), 'MMM d, yyyy h:mm a') : 'No date'}</span>
                  </span>
                )}
                {typeLabel && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">{typeLabel}</span>}
                {contentType === 'event' && item.format && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">{item.format}</span>
                )}
                {(item.location || item.city || item.is_remote) && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                    {item.location || item.city || 'Remote'}
                  </span>
                )}
              </div>

              {item.moderation_notes && (
                <div className="bg-red-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Moderation notes: </span>
                  {item.moderation_notes}
                </div>
              )}

              <div className="flex gap-3 flex-wrap">
                {canModerate && status !== 'approved' && (
                  <button
                    onClick={() => handleModerate(item, 'approved')}
                    disabled={busy}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {busy ? 'Saving...' : 'Approve'}
                  </button>
                )}
                {canModerate && status !== 'rejected' && (
                  <button
                    onClick={() => handleModerate(item, 'rejected')}
                    disabled={busy}
                    className={`${status === 'pending' ? 'flex-1 bg-red-600 text-white hover:bg-red-700' : 'border-2 border-red-300 text-red-700 hover:bg-red-50'} flex items-center justify-center gap-2 py-2 px-4 rounded-lg disabled:opacity-50`}
                  >
                    <XCircle className="w-4 h-4" />
                    {status === 'approved' ? 'Unpublish' : 'Reject'}
                  </button>
                )}
                {canModerate && status !== 'pending' && (
                  <button
                    onClick={() => handleModerate(item, 'pending')}
                    disabled={busy}
                    title="Move back to pending review"
                    className="flex items-center justify-center gap-2 border-2 border-yellow-300 text-yellow-700 py-2 px-4 rounded-lg hover:bg-yellow-50 disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset to Pending
                  </button>
                )}
                <button
                  onClick={() => {
                    setEditing(item)
                    setModalOpen(true)
                  }}
                  className="flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-50"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  disabled={busy}
                  className="flex items-center justify-center gap-2 border-2 border-red-300 text-red-700 py-2 px-4 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <Link
                  href={`${cfg.publicPath}/${item.id}`}
                  target="_blank"
                  className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View
                </Link>
              </div>
            </div>
          )
        })}
      </div>

      {items.length === 0 && !loadError && (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          No {filter === 'all' ? '' : filter} {cfg.title.toLowerCase()}
        </div>
      )}

      {rejecting && (
        <ReasonModal
          title={(rejecting.moderation_status || 'approved') === 'approved' ? `Unpublish "${rejecting.title}"` : `Reject "${rejecting.title}"`}
          description={`The ${contentType === 'event' ? 'organizer' : 'poster'} is notified with this reason and can edit and resubmit.`}
          label="Reason"
          placeholder="e.g. Please add the salary range and a valid application link."
          confirmLabel={(rejecting.moderation_status || 'approved') === 'approved' ? 'Unpublish' : 'Reject'}
          busy={busyId === rejecting.id}
          onClose={() => setRejecting(null)}
          onConfirm={async (reason) => {
            const item = rejecting
            setRejecting(null)
            await handleModerate(item, 'rejected', reason)
          }}
        />
      )}

      {renderModal({
        isOpen: modalOpen,
        onClose: () => {
          setModalOpen(false)
          setEditing(null)
        },
        item: editing,
        onSuccess: fetchItems,
      })}
    </div>
  )
}

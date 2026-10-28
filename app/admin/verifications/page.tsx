'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Linkedin,
  Building2,
  Globe,
  HelpCircle,
  Mail,
  Search,
  RefreshCw,
  Paperclip,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { rpc, can, MIGRATION_HINT } from '@/lib/admin'
import { useAdmin, useAdminCounts } from '@/components/admin/AdminContext'
import EmailUserModal from '@/components/admin/EmailUserModal'
import { sendUserEmail } from '@/lib/email'
import {
  REQUESTABLE_DOCUMENTS,
  STATUS_LABELS,
  VERIFICATION_BUCKET,
  VerificationDocument,
} from '@/lib/verification'

type Decision = 'approved' | 'rejected' | 'info_needed'
const TABS = ['pending', 'info_needed', 'approved', 'rejected', 'all'] as const

export default function AdminVerificationsPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading verifications...</div>}>
      <AdminVerificationsContent />
    </Suspense>
  )
}

function AdminVerificationsContent() {
  const admin = useAdmin()
  const { refresh: refreshCounts } = useAdminCounts()
  const searchParams = useSearchParams()
  const initialTab = (TABS as readonly string[]).includes(searchParams?.get('status') || '')
    ? (searchParams!.get('status') as string)
    : 'pending'

  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<string>(initialTab)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState<{ request: any; decision: Decision } | null>(null)
  const [emailing, setEmailing] = useState<any>(null)
  const canVerify = can(admin?.role, 'verify')

  useEffect(() => {
    fetchVerificationRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchVerificationRequests = async () => {
    setLoadError(null)
    setRefreshing(true)
    try {
      // Load every request once; tabs + search filter client-side so counts are always visible
      const data = await rpc<any[]>('admin_list_verification_requests', { p_status: 'all' })
      setRequests(data || [])
      refreshCounts()
    } catch (error: any) {
      console.error('Error fetching verification requests:', error)
      setLoadError(error.message)
      setRequests([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: requests.length }
    for (const r of requests) c[r.status] = (c[r.status] || 0) + 1
    return c
  }, [requests])

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return requests.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false
      if (!term) return true
      const p = r.profile || {}
      return [p.full_name, p.email, p.country, p.city, p.industry, r.company_registration, r.linkedin_url, r.website_url]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    })
  }, [requests, filter, search])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading verifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verifications</h1>
          <p className="text-gray-600 mt-1">Review, approve, or request more documents from users</p>
        </div>
        <div className="flex items-center gap-3">
          {(counts.pending || 0) > 0 && (
            <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
              <Clock className="w-5 h-5 text-yellow-600" />
              <span className="text-yellow-900 font-semibold">{counts.pending} Pending</span>
            </div>
          )}
          <button
            onClick={fetchVerificationRequests}
            disabled={refreshing}
            className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1 overflow-x-auto">
        {TABS.map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 whitespace-nowrap px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {STATUS_LABELS[status]}
            <span className="ml-1 opacity-75">({counts[status] || 0})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, country, registration number..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{loadError}</div>
      )}

      {!canVerify && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4 text-sm">
          Your role ({admin?.role}) can view verification requests but cannot approve or reject them.
        </div>
      )}

      {/* Verification Requests */}
      <div className="space-y-4">
        {visible.map((request) => (
          <VerificationCard
            key={request.id}
            request={request}
            canAct={canVerify}
            onDecision={(decision) => setReviewing({ request, decision })}
            onEmail={() => setEmailing(request)}
          />
        ))}
      </div>

      {visible.length === 0 && !loadError && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">
            {search ? 'No requests match your search' : `No ${filter === 'all' ? '' : STATUS_LABELS[filter].toLowerCase()} verification requests`}
          </p>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          request={reviewing.request}
          decision={reviewing.decision}
          onClose={() => setReviewing(null)}
          onDone={async () => {
            setReviewing(null)
            await fetchVerificationRequests()
          }}
        />
      )}

      {emailing && (
        <EmailUserModal
          userId={emailing.profile?.id || emailing.user_id}
          userName={emailing.profile?.full_name}
          email={emailing.profile?.email}
          defaultSubject="About your AfroConnect verification request"
          onClose={() => setEmailing(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
function VerificationCard({
  request,
  canAct,
  onDecision,
  onEmail,
}: {
  request: any
  canAct: boolean
  onDecision: (d: Decision) => void
  onEmail: () => void
}) {
  const user = request.profile
  const documents: VerificationDocument[] = Array.isArray(request.documents) ? request.documents : []
  const requestedDocs: string[] = Array.isArray(request.requested_documents) ? request.requested_documents : []

  const badges = {
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
    approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
    rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
    info_needed: { color: 'bg-blue-100 text-blue-700', icon: HelpCircle },
  }
  const badge = badges[request.status as keyof typeof badges] || badges.pending
  const BadgeIcon = badge.icon

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{user?.full_name || 'N/A'}</h3>
            <p className="text-gray-600">{user?.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              {user?.user_type || 'n/a'} • {[user?.city, user?.country].filter(Boolean).join(', ') || 'Location N/A'}
            </p>
            {(request.submission_count || 1) > 1 && (
              <p className="text-xs text-purple-700 bg-purple-50 inline-block px-2 py-0.5 rounded mt-2">
                Resubmission #{request.submission_count}
                {request.resubmitted_at ? ` • ${formatDistanceToNow(new Date(request.resubmitted_at), { addSuffix: true })}` : ''}
              </p>
            )}
          </div>
        </div>
        <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${badge.color}`}>
          <BadgeIcon className="w-4 h-4" />
          {STATUS_LABELS[request.status] || request.status}
        </span>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Industry</p>
          <p className="font-medium text-gray-900">{user?.industry || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Profile Website</p>
          <p className="font-medium text-gray-900 truncate">{user?.website_url || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Member Since</p>
          <p className="font-medium text-gray-900">
            {user?.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Last Updated</p>
          <p className="font-medium text-gray-900">
            {formatDistanceToNow(new Date(request.updated_at || request.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* Verification Documents */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h4 className="font-medium text-gray-900 mb-3">Verification Documents</h4>
        <div className="space-y-2">
          {request.linkedin_url && (
            <a href={request.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <Linkedin className="w-4 h-4" />
              <span className="text-sm break-all">{request.linkedin_url}</span>
            </a>
          )}
          {request.website_url && (
            <a href={request.website_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:text-blue-700">
              <Globe className="w-4 h-4" />
              <span className="text-sm break-all">{request.website_url}</span>
            </a>
          )}
          {request.company_registration && (
            <div className="flex items-center gap-2 text-gray-700">
              <Building2 className="w-4 h-4" />
              <span className="text-sm">Company Registration: {request.company_registration}</span>
            </div>
          )}
          {documents.map((doc) => (
            <DocumentLink key={doc.path} doc={doc} />
          ))}
          {!request.linkedin_url && !request.website_url && !request.company_registration && documents.length === 0 && (
            <p className="text-sm text-gray-500">No documents provided</p>
          )}
        </div>
      </div>

      {request.notes && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">User Notes</h4>
          <p className="text-sm text-gray-700 whitespace-pre-line">{request.notes}</p>
        </div>
      )}

      {request.status === 'info_needed' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Waiting on user - information requested</h4>
          {request.rejection_reason && <p className="text-sm text-blue-900 mb-2">{request.rejection_reason}</p>}
          {requestedDocs.length > 0 && (
            <ul className="list-disc list-inside text-sm text-blue-800">
              {requestedDocs.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {request.status === 'rejected' && request.rejection_reason && (
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Rejection Reason</h4>
          <p className="text-sm text-gray-700">{request.rejection_reason}</p>
        </div>
      )}

      {request.admin_notes && request.status !== 'info_needed' && request.status !== 'rejected' && (
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Last Admin Note</h4>
          <p className="text-sm text-gray-700">{request.admin_notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {canAct && (request.status === 'pending' || request.status === 'info_needed') && (
          <>
            <button
              onClick={() => onDecision('approved')}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Verification
            </button>
            <button
              onClick={() => onDecision('rejected')}
              className="flex-1 min-w-[120px] flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircle className="w-5 h-5" />
              Reject
            </button>
            <button
              onClick={() => onDecision('info_needed')}
              className="flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              {request.status === 'info_needed' ? 'Update Info Request' : 'Request More Info'}
            </button>
          </>
        )}
        {canAct && request.status === 'rejected' && (
          <>
            <button
              onClick={() => onDecision('approved')}
              className="flex items-center justify-center gap-2 border-2 border-green-300 text-green-700 py-3 px-4 rounded-lg hover:bg-green-50 transition-colors"
            >
              <CheckCircle className="w-5 h-5" />
              Approve Anyway
            </button>
            <button
              onClick={() => onDecision('info_needed')}
              className="flex items-center justify-center gap-2 border-2 border-blue-300 text-blue-700 py-3 px-4 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Request More Info
            </button>
          </>
        )}
        {user?.id && (
          <button
            onClick={onEmail}
            className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            Email User
          </button>
        )}
        {user?.id && (
          <Link
            href={`/admin/users/${user.id}`}
            className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-5 h-5" />
            View User
          </Link>
        )}
      </div>
    </div>
  )
}

function DocumentLink({ doc }: { doc: VerificationDocument }) {
  const [opening, setOpening] = useState(false)
  const open = async () => {
    setOpening(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.storage.from(VERIFICATION_BUCKET).createSignedUrl(doc.path, 300)
      if (error || !data?.signedUrl) throw error || new Error('Could not open document')
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (error: any) {
      toast.error(error?.message || 'Could not open document')
    } finally {
      setOpening(false)
    }
  }
  return (
    <button onClick={open} disabled={opening} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-left disabled:opacity-50">
      <Paperclip className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm break-all">{doc.name}</span>
      {doc.size ? <span className="text-xs text-gray-500">({Math.round(doc.size / 1024)} KB)</span> : null}
      {opening && <span className="text-xs text-gray-500">opening...</span>}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Review modal (approve / reject / request more info)
// ---------------------------------------------------------------------------
function ReviewModal({
  request,
  decision,
  onClose,
  onDone,
}: {
  request: any
  decision: Decision
  onClose: () => void
  onDone: () => void
}) {
  const user = request.profile || {}
  const [message, setMessage] = useState('')
  const [docs, setDocs] = useState<string[]>(
    decision === 'info_needed' && Array.isArray(request.requested_documents) ? request.requested_documents : []
  )
  const [otherDoc, setOtherDoc] = useState('')
  const [alsoEmail, setAlsoEmail] = useState(decision !== 'approved')
  const [saving, setSaving] = useState(false)

  const config = {
    approved: {
      title: 'Approve verification',
      intro: `${user.full_name || 'This user'} will receive the verified badge and an in-app notification.`,
      label: 'Note to the user (optional)',
      placeholder: 'e.g. Welcome aboard! Thanks for providing your documents.',
      button: 'Approve & Verify',
      color: 'bg-green-600 hover:bg-green-700',
    },
    rejected: {
      title: 'Reject verification',
      intro: 'The user sees this reason on their verification page and can resubmit.',
      label: 'Rejection reason (shown to the user)',
      placeholder: 'e.g. The LinkedIn profile does not match the name on your AfroConnect profile.',
      button: 'Reject Request',
      color: 'bg-red-600 hover:bg-red-700',
    },
    info_needed: {
      title: 'Request more information',
      intro: 'Pick the documents you need and/or write a message. The user is notified and can upload files and resubmit.',
      label: 'Message to the user',
      placeholder: 'e.g. Please upload a clear photo of your national ID so we can confirm your identity.',
      button: 'Send Request',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  }[decision]

  const allDocs = [...docs, ...(otherDoc.trim() ? [otherDoc.trim()] : [])]

  const toggleDoc = (d: string) => setDocs((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))

  const submit = async () => {
    if (decision === 'rejected' && !message.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    if (decision === 'info_needed' && !message.trim() && allDocs.length === 0) {
      toast.error('Select at least one document or write a message')
      return
    }

    setSaving(true)
    try {
      const reason = message.trim() || null
      try {
        await rpc('admin_review_verification', {
          p_request_id: request.id,
          p_decision: decision,
          p_reason: reason,
          p_requested_documents: decision === 'info_needed' && allDocs.length ? allDocs : null,
        })
      } catch (err: any) {
        // Older database (before VERIFICATION-NOTIFICATIONS-FIX.sql): 3-argument version
        if (err.message !== MIGRATION_HINT) throw err
        const folded =
          decision === 'info_needed' && allDocs.length
            ? `${reason ? reason + ' ' : ''}Please provide: ${allDocs.join('; ')}`
            : reason
        await rpc('admin_review_verification', { p_request_id: request.id, p_decision: decision, p_reason: folded })
      }

      toast.success(
        decision === 'approved'
          ? 'User verified and notified'
          : decision === 'rejected'
          ? 'Verification rejected and user notified'
          : 'Information requested - user notified'
      )

      if (alsoEmail && user.id) {
        const subject =
          decision === 'approved'
            ? 'Your AfroConnect account is verified'
            : decision === 'rejected'
            ? 'Update on your AfroConnect verification request'
            : 'Action needed: more information for your AfroConnect verification'
        const lines = [
          `Hi ${user.full_name?.split(' ')[0] || 'there'},`,
          '',
          decision === 'approved'
            ? 'Good news - your AfroConnect account has been verified. Your verified badge is now visible on your profile.'
            : decision === 'rejected'
            ? 'We reviewed your verification request and could not approve it at this time.'
            : 'Thank you for requesting verification. To complete the review we need a bit more information.',
          '',
          ...(reason ? [decision === 'rejected' ? `Reason: ${reason}` : reason, ''] : []),
          ...(decision === 'info_needed' && allDocs.length
            ? ['Please provide:', ...allDocs.map((d) => `  - ${d}`), '']
            : []),
          ...(decision !== 'approved'
            ? [`You can upload documents and resubmit here: ${window.location.origin}/settings/verification`, '']
            : []),
          'Best regards,',
          'The AfroConnect Team',
        ]
        try {
          const result = await sendUserEmail({ userId: user.id, email: user.email, subject, message: lines.join('\n') })
          toast.success(result === 'sent' ? 'Email sent' : 'Opened your email app with the message ready to send')
        } catch (e: any) {
          toast.error(`In-app notification sent, but email failed: ${e.message}`)
        }
      }

      onDone()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update verification')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{config.title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">{config.intro}</p>

        {decision === 'info_needed' && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" /> Documents to request
            </p>
            <div className="space-y-2">
              {REQUESTABLE_DOCUMENTS.map((d) => (
                <label key={d} className="flex items-start gap-2 text-sm text-gray-800 cursor-pointer">
                  <input type="checkbox" checked={docs.includes(d)} onChange={() => toggleDoc(d)} className="mt-0.5" />
                  <span>{d}</span>
                </label>
              ))}
              <input
                value={otherDoc}
                onChange={(e) => setOtherDoc(e.target.value)}
                placeholder="Other document (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        )}

        <label className="block text-sm font-medium text-gray-700 mb-1">
          {config.label} {decision === 'rejected' && <span className="text-red-500">*</span>}
        </label>
        <textarea
          autoFocus={decision !== 'info_needed'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          placeholder={config.placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />

        <label className="flex items-center gap-2 text-sm text-gray-700 mt-3 cursor-pointer">
          <input type="checkbox" checked={alsoEmail} onChange={(e) => setAlsoEmail(e.target.checked)} />
          Also send an email to {user.email || 'the user'}
        </label>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${config.color}`}
          >
            {saving ? 'Saving...' : config.button}
          </button>
        </div>
      </div>
    </div>
  )
}

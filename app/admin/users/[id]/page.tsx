'use client'

import { Suspense, useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle,
  Ban,
  Trash2,
  FileText,
  Users,
  ShieldCheck,
  Mail
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { rpc, can } from '@/lib/admin'
import { useAdmin, useAdminCounts } from '@/components/admin/AdminContext'
import EmailUserModal from '@/components/admin/EmailUserModal'

export default function UserDetailPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <UserDetailContent />
    </Suspense>
  )
}

function ModerationBadge({ status }: { status?: string }) {
  const s = status || 'approved'
  const color =
    s === 'approved' ? 'bg-green-100 text-green-700' : s === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
  return <span className={`text-xs px-2 py-1 rounded ${color}`}>{s}</span>
}

function UserDetailContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const admin = useAdmin()
  const userId = params.id as string
  const [details, setDetails] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [showBanModal, setShowBanModal] = useState(searchParams?.get('action') === 'ban')
  const [showEmail, setShowEmail] = useState(false)
  const { refresh: refreshCounts } = useAdminCounts()
  const supabase = createClient()

  useEffect(() => {
    fetchUserDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const fetchUserDetails = async () => {
    try {
      const data = await rpc<any>('admin_get_user', { p_user_id: userId })
      setDetails(data)

      const [oppsRes, eventsRes] = await Promise.all([
        supabase.from('opportunities').select('*').eq('creator_id', userId).order('created_at', { ascending: false }),
        supabase.from('events').select('*').eq('organizer_id', userId).order('created_at', { ascending: false })
      ])
      if (oppsRes.error) console.error('Opportunities error:', oppsRes.error)
      if (eventsRes.error) console.error('Events error:', eventsRes.error)
      setOpportunities(oppsRes.data || [])
      setEvents(eventsRes.data || [])
    } catch (error: any) {
      console.error('Error fetching user details:', error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const run = async (fn: () => Promise<any>, success: string, after?: () => void) => {
    setBusy(true)
    try {
      await fn()
      toast.success(success)
      refreshCounts()
      if (after) after()
      else await fetchUserDetails()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const user = details?.profile

  const handleToggleVerified = () => {
    const next = !user.is_verified
    if (!confirm(next ? 'Verify this user?' : 'Remove this user\'s verified badge?')) return
    run(
      () => rpc('admin_set_user_verified', { p_user_id: userId, p_verified: next }),
      next ? 'User verified and notified' : 'Verification removed'
    )
  }

  const handleUnban = () => {
    if (!confirm('Lift this ban?')) return
    run(() => rpc('admin_unban_user', { p_user_id: userId }), 'User unbanned')
  }

  const handleDeleteUser = () => {
    if (!confirm('Are you sure you want to DELETE this user? This permanently removes their account and data!')) return
    run(() => rpc('admin_delete_user', { p_user_id: userId }), 'User deleted', () => router.push('/admin/users'))
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-12">User not found</div>
  }

  const location = [user.city, user.country].filter(Boolean).join(', ')
  const isSelf = admin?.id === user.id

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
          <p className="text-gray-600 mt-1">Complete profile and activity</p>
        </div>
      </div>

      {details.is_banned && details.active_ban && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          <strong>Banned</strong> ({details.active_ban.ban_type}
          {details.active_ban.expires_at ? `, until ${new Date(details.active_ban.expires_at).toLocaleDateString()}` : ''}):{' '}
          {details.active_ban.reason}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-semibold">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                {user.is_verified && <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-100" />}
              </div>
              <p className="text-gray-600">{user.email}</p>
              <div className="flex gap-2 mt-2">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                  {user.user_type}
                </span>
                {details.is_staff && (
                  <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">staff</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Link
              href={`/profile/${user.id}`}
              target="_blank"
              className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              <Users className="w-4 h-4" />
              Public Profile
            </Link>
            {user.email && (
              <button
                onClick={() => setShowEmail(true)}
                className="flex items-center gap-2 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
              >
                <Mail className="w-4 h-4" />
                Email
              </button>
            )}
            {can(admin?.role, 'verify') && (
              <button
                onClick={handleToggleVerified}
                disabled={busy}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg disabled:opacity-50 ${
                  user.is_verified
                    ? 'border-2 border-green-300 text-green-700 hover:bg-green-50'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                {user.is_verified ? 'Remove Verification' : 'Verify User'}
              </button>
            )}
            {can(admin?.role, 'ban') && !details.is_staff && !isSelf && (
              details.is_banned ? (
                <button
                  onClick={handleUnban}
                  disabled={busy}
                  className="flex items-center gap-2 border-2 border-orange-300 text-orange-700 px-4 py-2 rounded-lg hover:bg-orange-50 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => setShowBanModal(true)}
                  disabled={busy}
                  className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                >
                  <Ban className="w-4 h-4" />
                  Ban
                </button>
              )
            )}
            {can(admin?.role, 'deleteUser') && !details.is_staff && !isSelf && (
              <button
                onClick={handleDeleteUser}
                disabled={busy}
                className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {location || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Industry</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {user.industry || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Last Sign-in</p>
            <p className="font-medium text-gray-900">
              {user.last_sign_in_at ? formatDistanceToNow(new Date(user.last_sign_in_at), { addSuffix: true }) : 'Never'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joined</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'N/A'}
            </p>
          </div>
        </div>

        {user.bio && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
            <p className="text-gray-700">{user.bio}</p>
          </div>
        )}

        {(user.linkedin_url || user.website_url) && (
          <div className="flex gap-4 text-sm">
            {user.linkedin_url && (
              <a href={user.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                LinkedIn
              </a>
            )}
            {user.website_url && (
              <a href={user.website_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                Website
              </a>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Opportunities Posted" value={opportunities.length} icon={FileText} color="blue" />
        <StatCard title="Events Created" value={events.length} icon={Calendar} color="purple" />
        <StatCard title="Connections" value={details.connections_count || 0} icon={Users} color="green" />
      </div>

      {details.verification_requests?.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              Verification Requests
            </h3>
            <Link
              href={`/admin/verifications?status=${details.verification_requests[0]?.status || 'all'}`}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Review in Verifications →
            </Link>
          </div>
          <div className="space-y-2">
            {details.verification_requests.map((vr: any) => (
              <div key={vr.id} className="flex items-center justify-between border border-gray-200 rounded-lg p-3 text-sm">
                <span>
                  {formatDistanceToNow(new Date(vr.created_at), { addSuffix: true })}
                  {vr.rejection_reason ? ` - ${vr.rejection_reason}` : ''}
                </span>
                <ModerationBadge status={vr.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {opportunities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Posted Opportunities
          </h3>
          <div className="space-y-3">
            {opportunities.map((opp) => (
              <div key={opp.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{opp.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{opp.description?.slice(0, 100)}...</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{opp.type}</span>
                      <ModerationBadge status={opp.moderation_status} />
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(opp.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <Link href="/admin/opportunities" className="text-blue-600 hover:text-blue-700 text-sm">
                    Moderate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {events.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Created Events
          </h3>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-900">{event.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{event.description?.slice(0, 100)}...</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">{event.event_type}</span>
                      <ModerationBadge status={event.moderation_status} />
                      <span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link href="/admin/events" className="text-blue-600 hover:text-blue-700 text-sm">
                    Moderate →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showEmail && (
        <EmailUserModal
          userId={user.id}
          userName={user.full_name}
          email={user.email}
          onClose={() => setShowEmail(false)}
        />
      )}

      {showBanModal && (
        <BanUserModal
          userId={userId}
          userName={user.full_name}
          onClose={() => setShowBanModal(false)}
          onSuccess={() => {
            setShowBanModal(false)
            fetchUserDetails()
          }}
        />
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: { title: string; value: number; icon: any; color: 'blue' | 'purple' | 'green' }) {
  const colors: Record<'blue' | 'purple' | 'green', string> = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-gray-600 text-sm font-medium">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}

function BanUserModal({ userId, userName, onClose, onSuccess }: any) {
  const [reason, setReason] = useState('')
  const [banType, setBanType] = useState('temporary')
  const [expiresIn, setExpiresIn] = useState('7')
  const [loading, setLoading] = useState(false)

  const handleBan = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for banning')
      return
    }

    setLoading(true)
    try {
      await rpc('admin_ban_user', {
        p_user_id: userId,
        p_reason: reason.trim(),
        p_ban_type: banType,
        p_days: parseInt(expiresIn) || 7
      })
      toast.success('User banned')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to ban user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ban User</h2>
        <p className="text-gray-600 mb-4">
          You are about to ban <strong>{userName}</strong>. They will be signed out and hidden from the platform.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ban Type</label>
            <select value={banType} onChange={(e) => setBanType(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
              <option value="temporary">Temporary</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>

          {banType === 'temporary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (days)</label>
              <input
                type="number"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                min="1"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Ban</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              rows={4}
              placeholder="Explain why this user is being banned..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleBan}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Banning...' : 'Ban User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

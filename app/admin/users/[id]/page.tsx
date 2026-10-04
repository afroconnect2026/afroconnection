'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  CheckCircle,
  XCircle,
  Ban,
  Trash2,
  Edit,
  FileText,
  Users,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

export default function UserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showBanModal, setShowBanModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchUserDetails()
  }, [params.id])

  const fetchUserDetails = async () => {
    try {
      // Fetch user profile
      const { data: userData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single()

      setUser(userData)

      // Fetch user's opportunities
      const { data: oppsData } = await supabase
        .from('opportunities')
        .select('*')
        .eq('creator_id', params.id)
        .order('created_at', { ascending: false })

      setOpportunities(oppsData || [])

      // Fetch user's events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .eq('creator_id', params.id)
        .order('created_at', { ascending: false })

      setEvents(eventsData || [])

      // Fetch user's connections
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${params.id},addressee_id.eq.${params.id}`)
        .eq('status', 'accepted')

      setConnections(connectionsData || [])

      setLoading(false)
    } catch (error) {
      console.error('Error fetching user details:', error)
      setLoading(false)
    }
  }

  const handleVerifyUser = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', currentUser.id)
      .single()

    if (!adminData) return

    await supabase
      .from('profiles')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: adminData.id
      })
      .eq('id', params.id)

    await supabase.from('admin_activity_log').insert({
      admin_id: adminData.id,
      action: 'verify_user',
      target_type: 'user',
      target_id: params.id
    })

    fetchUserDetails()
    alert('User verified successfully!')
  }

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to DELETE this user? This action cannot be undone!')) return

    const { data: { user: currentUser } } = await supabase.auth.getUser()
    if (!currentUser) return

    const { data: adminData } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', currentUser.id)
      .single()

    if (!adminData) return

    await supabase.from('admin_activity_log').insert({
      admin_id: adminData.id,
      action: 'delete_user',
      target_type: 'user',
      target_id: params.id,
      details: { email: user?.email, name: user?.full_name }
    })

    await supabase
      .from('profiles')
      .delete()
      .eq('id', params.id)

    alert('User deleted successfully')
    router.push('/admin/users')
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-12">User not found</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
          <p className="text-gray-600 mt-1">Complete profile and activity</p>
        </div>
      </div>

      {/* User Profile Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-semibold">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{user.full_name}</h2>
                {user.is_verified && (
                  <CheckCircle className="w-6 h-6 text-blue-600 fill-blue-100" />
                )}
              </div>
              <p className="text-gray-600">{user.email}</p>
              <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {user.user_type}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!user.is_verified && (
              <button
                onClick={handleVerifyUser}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4" />
                Verify User
              </button>
            )}
            <button
              onClick={() => setShowBanModal(true)}
              className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
            >
              <Ban className="w-4 h-4" />
              Ban
            </button>
            <button
              onClick={handleDeleteUser}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>

        {/* User Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">Location</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {user.location || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Company</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <Briefcase className="w-4 h-4" />
              {user.company || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Industry</p>
            <p className="font-medium text-gray-900">{user.industry || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Joined</p>
            <p className="font-medium text-gray-900 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
            <p className="text-gray-700">{user.bio}</p>
          </div>
        )}

        {/* Skills */}
        {user.skills && user.skills.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {user.skills.map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Opportunities Posted"
          value={opportunities.length}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Events Created"
          value={events.length}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Connections"
          value={connections.length}
          icon={Users}
          color="green"
        />
      </div>

      {/* Opportunities */}
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
                      <span className="text-xs text-gray-500">{formatDistanceToNow(new Date(opp.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Link
                    href={`/opportunities/${opp.id}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
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
                      <span className="text-xs text-gray-500">{new Date(event.start_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Link
                    href={`/events/${event.id}`}
                    target="_blank"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    View →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {showBanModal && (
        <BanUserModal
          userId={params.id as string}
          userName={user.full_name}
          onClose={() => setShowBanModal(false)}
          onSuccess={() => {
            setShowBanModal(false)
            router.push('/admin/users')
          }}
        />
      )}
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
    green: 'bg-green-50 text-green-600',
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
  const supabase = createClient()

  const handleBan = async () => {
    if (!reason.trim()) {
      alert('Please provide a reason for banning')
      return
    }

    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminData) return

      const expiresAt = banType === 'temporary'
        ? new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString()
        : null

      await supabase.from('user_bans').insert({
        user_id: userId,
        banned_by: adminData.id,
        reason,
        ban_type: banType,
        expires_at: expiresAt,
        is_active: true
      })

      await supabase.from('admin_activity_log').insert({
        admin_id: adminData.id,
        action: 'ban_user',
        target_type: 'user',
        target_id: userId,
        details: { reason, ban_type: banType }
      })

      alert(`User banned successfully`)
      onSuccess()
    } catch (error) {
      console.error('Error banning user:', error)
      alert('Failed to ban user')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Ban User</h2>
        <p className="text-gray-600 mb-4">
          You are about to ban <strong>{userName}</strong>
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ban Type
            </label>
            <select
              value={banType}
              onChange={(e) => setBanType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="temporary">Temporary</option>
              <option value="permanent">Permanent</option>
            </select>
          </div>

          {banType === 'temporary' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (days)
              </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Ban
            </label>
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
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
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

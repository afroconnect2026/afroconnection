'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  FileText,
  Linkedin,
  Building2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const supabase = createClient()

  useEffect(() => {
    fetchVerificationRequests()
  }, [filter])

  const fetchVerificationRequests = async () => {
    try {
      let query = supabase
        .from('verification_requests')
        .select(`
          *,
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setRequests(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching verification requests:', error)
      setLoading(false)
    }
  }

  const handleApprove = async (requestId: string, userId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get admin user
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminData) return

      // Update verification request
      await supabase
        .from('verification_requests')
        .update({
          status: 'approved',
          reviewed_by: adminData.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', requestId)

      // Update user profile
      await supabase
        .from('profiles')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          verified_by: adminData.id
        })
        .eq('id', userId)

      // Log admin action
      await supabase.from('admin_activity_log').insert({
        admin_id: adminData.id,
        action: 'verify_user',
        target_type: 'user',
        target_id: userId,
        details: { verification_request_id: requestId }
      })

      fetchVerificationRequests()
      alert('User verified successfully!')
    } catch (error) {
      console.error('Error approving verification:', error)
      alert('Failed to approve verification')
    }
  }

  const handleReject = async (requestId: string, userId: string) => {
    const reason = prompt('Enter rejection reason:')
    if (!reason) return

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
        .from('verification_requests')
        .update({
          status: 'rejected',
          reviewed_by: adminData.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: reason
        })
        .eq('id', requestId)

      // Log admin action
      await supabase.from('admin_activity_log').insert({
        admin_id: adminData.id,
        action: 'reject_verification',
        target_type: 'user',
        target_id: userId,
        details: { verification_request_id: requestId, reason }
      })

      fetchVerificationRequests()
      alert('Verification rejected')
    } catch (error) {
      console.error('Error rejecting verification:', error)
      alert('Failed to reject verification')
    }
  }

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

  const pendingCount = requests.filter(r => r.status === 'pending').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verifications</h1>
          <p className="text-gray-600 mt-1">
            Review and approve user verification requests
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-900 font-semibold">
              {pendingCount} Pending
            </span>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Verification Requests */}
      <div className="space-y-4">
        {requests.map((request) => (
          <VerificationCard
            key={request.id}
            request={request}
            onApprove={() => handleApprove(request.id, request.user_id)}
            onReject={() => handleReject(request.id, request.user_id)}
          />
        ))}
      </div>

      {requests.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No {filter} verification requests</p>
        </div>
      )}
    </div>
  )
}

// Verification Card Component
function VerificationCard({
  request,
  onApprove,
  onReject
}: {
  request: any
  onApprove: () => void
  onReject: () => void
}) {
  const user = request.profile

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock },
      approved: { color: 'bg-green-100 text-green-700', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-700', icon: XCircle },
      info_needed: { color: 'bg-blue-100 text-blue-700', icon: FileText },
    }
    const badge = badges[status as keyof typeof badges] || badges.pending
    const Icon = badge.icon

    return (
      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {status.replace('_', ' ')}
      </span>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {user?.full_name || 'N/A'}
            </h3>
            <p className="text-gray-600">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-gray-500">
                {user?.user_type} • {user?.location}
              </span>
            </div>
          </div>
        </div>
        {getStatusBadge(request.status)}
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div>
          <p className="text-sm text-gray-500">Industry</p>
          <p className="font-medium text-gray-900">{user?.industry || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Company</p>
          <p className="font-medium text-gray-900">{user?.company || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Skills</p>
          <p className="font-medium text-gray-900">
            {user?.skills?.slice(0, 3).join(', ') || 'N/A'}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Requested</p>
          <p className="font-medium text-gray-900">
            {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
          </p>
        </div>
      </div>

      {/* LinkedIn & Documents */}
      {(request.linkedin_url || request.documents) && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Verification Documents</h4>
          <div className="space-y-2">
            {request.linkedin_url && (
              <a
                href={request.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
              >
                <Linkedin className="w-4 h-4" />
                <span className="text-sm">LinkedIn Profile</span>
              </a>
            )}
            {request.company_registration && (
              <div className="flex items-center gap-2 text-gray-700">
                <Building2 className="w-4 h-4" />
                <span className="text-sm">Company Registration: {request.company_registration}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Notes */}
      {request.notes && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">User Notes</h4>
          <p className="text-sm text-gray-700">{request.notes}</p>
        </div>
      )}

      {/* Admin Notes */}
      {request.admin_notes && (
        <div className="bg-purple-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
          <p className="text-sm text-gray-700">{request.admin_notes}</p>
        </div>
      )}

      {/* Rejection Reason */}
      {request.rejection_reason && (
        <div className="bg-red-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Rejection Reason</h4>
          <p className="text-sm text-gray-700">{request.rejection_reason}</p>
        </div>
      )}

      {/* Actions */}
      {request.status === 'pending' && (
        <div className="flex items-center gap-3">
          <button
            onClick={onApprove}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors"
          >
            <CheckCircle className="w-5 h-5" />
            Approve Verification
          </button>
          <button
            onClick={onReject}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors"
          >
            <XCircle className="w-5 h-5" />
            Reject
          </button>
          <Link
            href={`/profile/${user?.id}`}
            target="_blank"
            className="flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-5 h-5" />
            View Profile
          </Link>
        </div>
      )}
    </div>
  )
}

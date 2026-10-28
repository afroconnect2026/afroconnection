'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  Users,
  CheckCircle,
  XCircle,
  MoreVertical,
  Mail,
  Ban,
  Trash2,
  Eye,
  Clock,
  ShieldCheck,
  Download,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { rpc, can } from '@/lib/admin'
import { useAdmin } from '@/components/admin/AdminContext'
import EmailUserModal from '@/components/admin/EmailUserModal'

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading users...</div>}>
      <AdminUsersContent />
    </Suspense>
  )
}

function AdminUsersContent() {
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterVerified, setFilterVerified] = useState(searchParams?.get('verified') || 'all')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setLoadError(null)
    try {
      const data = await rpc<any[]>('admin_list_users')
      setUsers(data || [])
    } catch (error: any) {
      console.error('Error fetching users:', error)
      setLoadError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const term = searchTerm.toLowerCase()
  const filteredUsers = users.filter((user) => {
    if (term) {
      const haystack = [user.full_name, user.email, user.city, user.country, user.industry]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      if (!haystack.includes(term)) return false
    }
    if (filterType !== 'all' && user.user_type !== filterType) return false
    if (filterVerified === 'verified' && !user.is_verified) return false
    if (filterVerified === 'unverified' && user.is_verified) return false
    if (filterVerified === 'pending' && !user.has_pending_verification) return false
    if (filterVerified === 'banned' && !user.is_banned) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
        </div>
      </div>
    )
  }

  const verifiedCount = users.filter((u) => u.is_verified).length

  const exportCsv = () => {
    const header = ['Name', 'Email', 'Type', 'City', 'Country', 'Industry', 'Verified', 'Pending verification', 'Banned', 'Staff', 'Joined', 'Last sign-in']
    const rows = filteredUsers.map((u) => [
      u.full_name, u.email, u.user_type, u.city, u.country, u.industry,
      u.is_verified ? 'yes' : 'no', u.has_pending_verification ? 'yes' : 'no',
      u.is_banned ? 'yes' : 'no', u.is_staff ? 'yes' : 'no',
      u.created_at ? new Date(u.created_at).toISOString().slice(0, 10) : '',
      u.last_sign_in_at ? new Date(u.last_sign_in_at).toISOString().slice(0, 10) : '',
    ])
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `afroconnect-users-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${rows.length} users`)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">Manage all platform users</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            <span className="text-green-900 font-semibold">{verifiedCount} Verified</span>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-semibold">{users.length} Total Users</span>
          </div>
          <button
            onClick={() => { setLoading(true); fetchUsers() }}
            className="flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={filteredUsers.length === 0}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 text-sm">{loadError}</div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, city, country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Types</option>
            <option value="entrepreneur">Entrepreneurs</option>
            <option value="investor">Investors</option>
            <option value="professional">Professionals</option>
            <option value="company">Companies</option>
          </select>

          <select
            value={filterVerified}
            onChange={(e) => setFilterVerified(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Unverified Only</option>
            <option value="pending">Verification Pending</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-visible">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} onUpdate={fetchUsers} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loadError && (
          <div className="p-12 text-center text-gray-500">No users found matching your filters</div>
        )}
      </div>
    </div>
  )
}

function UserRow({ user, onUpdate }: { user: any; onUpdate: () => void }) {
  const admin = useAdmin()
  const [showMenu, setShowMenu] = useState(false)
  const [busy, setBusy] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)

  const getUserTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      entrepreneur: 'bg-purple-100 text-purple-700',
      investor: 'bg-green-100 text-green-700',
      professional: 'bg-blue-100 text-blue-700',
      company: 'bg-orange-100 text-orange-700'
    }
    return colors[type] || 'bg-gray-100 text-gray-700'
  }

  const run = async (fn: () => Promise<any>, success: string) => {
    setShowMenu(false)
    setBusy(true)
    try {
      await fn()
      toast.success(success)
      onUpdate()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusy(false)
    }
  }

  const toggleVerified = () => {
    const next = !user.is_verified
    if (!confirm(`${next ? 'Verify' : 'Remove verification from'} ${user.full_name || 'this user'}?`)) return
    run(
      () => rpc('admin_set_user_verified', { p_user_id: user.id, p_verified: next }),
      next ? 'User verified and notified' : 'Verification removed'
    )
  }

  const unban = () => {
    if (!confirm(`Lift the ban on ${user.full_name || 'this user'}?`)) return
    run(() => rpc('admin_unban_user', { p_user_id: user.id }), 'User unbanned')
  }

  const deleteUser = () => {
    if (!confirm(`Permanently DELETE ${user.full_name || 'this user'} and all their data? This cannot be undone.`)) return
    run(() => rpc('admin_delete_user', { p_user_id: user.id }), 'User deleted')
  }

  const location = [user.city, user.country].filter(Boolean).join(', ')

  return (
    <tr className={`hover:bg-gray-50 ${busy ? 'opacity-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user.full_name?.charAt(0) || 'U'}
          </div>
          <div>
            <p className="font-medium text-gray-900">
              {user.full_name || 'N/A'}
              {user.is_staff && (
                <span className="ml-2 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">staff</span>
              )}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
          {user.user_type || 'n/a'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{location || 'N/A'}</td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col gap-1">
          {user.is_verified ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Verified</span>
            </span>
          ) : user.has_pending_verification ? (
            <Link href="/admin/verifications" className="flex items-center gap-1 text-yellow-600 hover:underline">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Pending review</span>
            </Link>
          ) : (
            <span className="flex items-center gap-1 text-gray-400">
              <XCircle className="w-4 h-4" />
              <span className="text-sm">Not Verified</span>
            </span>
          )}
          {user.is_banned && (
            <span className="flex items-center gap-1 text-red-600 text-sm">
              <Ban className="w-4 h-4" />
              Banned
            </span>
          )}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
        {user.created_at ? formatDistanceToNow(new Date(user.created_at), { addSuffix: true }) : 'N/A'}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={busy}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 z-20 text-left">
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </Link>
                <Link
                  href={`/profile/${user.id}`}
                  target="_blank"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                  View Public Profile
                </Link>
                {user.email && (
                  <button
                    onClick={() => {
                      setShowMenu(false)
                      setEmailOpen(true)
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                  >
                    <Mail className="w-4 h-4" />
                    Send Email
                  </button>
                )}
                {can(admin?.role, 'verify') && (
                  <button
                    onClick={toggleVerified}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-green-700 hover:bg-green-50 w-full text-left"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {user.is_verified ? 'Remove Verification' : 'Verify User'}
                  </button>
                )}
                {can(admin?.role, 'ban') && !user.is_staff && (
                  user.is_banned ? (
                    <button
                      onClick={unban}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                    >
                      <Ban className="w-4 h-4" />
                      Unban User
                    </button>
                  ) : (
                    <Link
                      href={`/admin/users/${user.id}?action=ban`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <Ban className="w-4 h-4" />
                      Ban User
                    </Link>
                  )
                )}
                {can(admin?.role, 'deleteUser') && !user.is_staff && user.id !== admin?.id && (
                  <button
                    onClick={deleteUser}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left border-t border-gray-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {emailOpen && (
          <EmailUserModal
            userId={user.id}
            userName={user.full_name}
            email={user.email}
            onClose={() => setEmailOpen(false)}
          />
        )}
      </td>
    </tr>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { rpc, describeError } from '@/lib/admin'
import { useAdmin } from '@/components/admin/AdminContext'
import { Shield, UserPlus, Trash2, Check, X } from 'lucide-react'

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const currentAdmin = useAdmin()
  const supabase = createClient()

  useEffect(() => {
    fetchStaff()
  }, [])

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setStaff(data || [])
    } catch (error: any) {
      console.error('Error fetching staff:', error)
      toast.error(describeError(error))
    } finally {
      setLoading(false)
    }
  }

  const withBusy = async (id: string, fn: () => Promise<any>, success: string) => {
    setBusyId(id)
    try {
      await fn()
      toast.success(success)
      await fetchStaff()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setBusyId(null)
    }
  }

  const toggleStaffStatus = (staffId: string, currentStatus: boolean) =>
    withBusy(
      staffId,
      () => rpc('admin_update_staff', { p_admin_id: staffId, p_is_active: !currentStatus, p_role: null }),
      currentStatus ? 'Staff member deactivated' : 'Staff member activated'
    )

  const changeRole = (staffId: string, role: string) =>
    withBusy(staffId, () => rpc('admin_update_staff', { p_admin_id: staffId, p_is_active: null, p_role: role }), 'Role updated')

  const deleteStaff = (staffId: string) => {
    if (!confirm('Remove this staff member? They will lose all admin access.')) return
    withBusy(staffId, () => rpc('admin_remove_staff', { p_admin_id: staffId }), 'Staff member removed')
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (currentAdmin?.role !== 'super_admin') {
    return (
      <div className="text-center py-12">
        <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only Super Admins can manage staff</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-600 mt-1">Manage admin team members and roles</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-5 h-5" />
          Add Staff Member
        </button>
      </div>

      {/* Staff List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff Member</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {staff.map((member) => (
              <tr key={member.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{member.full_name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  {member.id === currentAdmin?.id ? (
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      {member.role.replace('_', ' ').toUpperCase()} (you)
                    </span>
                  ) : (
                    <select
                      value={member.role}
                      disabled={busyId === member.id}
                      onChange={(e) => changeRole(member.id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="super_admin">Super Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="support">Support</option>
                      <option value="analytics">Analytics</option>
                    </select>
                  )}
                </td>
                <td className="px-6 py-4">
                  {member.is_active ? (
                    <span className="flex items-center gap-1 text-green-600">
                      <Check className="w-4 h-4" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-600">
                      <X className="w-4 h-4" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {member.last_login ? new Date(member.last_login).toLocaleDateString() : 'Never'}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {member.id !== currentAdmin?.id && (
                    <button
                      onClick={() => toggleStaffStatus(member.id, member.is_active)}
                      disabled={busyId === member.id}
                      className={`px-3 py-1 rounded text-sm ${
                        member.is_active
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {member.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    )}
                    {member.id !== currentAdmin?.id && (
                      <button
                        onClick={() => deleteStaff(member.id)}
                        disabled={busyId === member.id}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <AddStaffModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            fetchStaff()
          }}
        />
      )}
    </div>
  )
}

// Add Staff Modal Component
function AddStaffModal({ onClose, onSuccess }: any) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('moderator')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await rpc('admin_add_staff', { p_email: email.trim(), p_full_name: fullName.trim(), p_role: role })
      toast.success('Staff member added')
      onSuccess()
    } catch (err: any) {
      setError(err.message || 'Failed to add staff member')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Staff Member</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="staff@example.com"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              User must already have an AfroConnect account
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="moderator">Moderator - Verify users & moderate content</option>
              <option value="support">Support - View users & handle reports</option>
              <option value="analytics">Analytics - View analytics only</option>
              <option value="super_admin">Super Admin - Full access</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

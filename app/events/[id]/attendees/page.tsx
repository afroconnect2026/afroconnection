'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Users,
  CheckCircle,
  Circle,
  Star,
  Download,
  Search,
  Filter,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

export default function EventAttendeesPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [attendees, setAttendees] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'going' | 'interested'>('all')

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEventAndAttendees()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEventAndAttendees = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*, organizer:profiles!events_organizer_id_fkey(full_name)')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError

      // Check if user is organizer
      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to view this page')
      }

      setEvent(eventData)

      // Load RSVPs with user details
      const { data: rsvpData, error: rsvpError } = await supabase
        .from('event_rsvps')
        .select(`
          *,
          user:profiles!event_rsvps_user_id_fkey(
            id,
            full_name,
            avatar_url,
            email,
            country,
            bio
          )
        `)
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })

      if (rsvpError) throw rsvpError

      setAttendees(rsvpData || [])
    } catch (err: any) {
      console.error('Error loading attendees:', err)
      setError(err.message || 'Failed to load attendees')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (rsvpId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('event_rsvps')
        .update({
          checked_in: !currentStatus,
          checked_in_at: !currentStatus ? new Date().toISOString() : null
        })
        .eq('id', rsvpId)

      if (error) throw error

      await loadEventAndAttendees()
    } catch (err: any) {
      console.error('Error updating check-in:', err)
      alert(err.message || 'Failed to update check-in status')
    }
  }

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Country', 'Status', 'RSVP Date', 'Checked In', 'Check-in Time']
    const rows = filteredAttendees.map((attendee) => [
      attendee.user?.full_name || 'N/A',
      attendee.user?.email || 'N/A',
      attendee.user?.country || 'N/A',
      attendee.status,
      new Date(attendee.created_at).toLocaleString(),
      attendee.checked_in ? 'Yes' : 'No',
      attendee.checked_in_at ? new Date(attendee.checked_in_at).toLocaleString() : 'N/A'
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title}-attendees-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Filter attendees
  const filteredAttendees = attendees.filter((attendee) => {
    // Status filter
    if (statusFilter !== 'all' && attendee.status !== statusFilter) {
      return false
    }

    // Search filter
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      const name = attendee.user?.full_name?.toLowerCase() || ''
      const email = attendee.user?.email?.toLowerCase() || ''
      const country = attendee.user?.country?.toLowerCase() || ''
      if (!name.includes(lowerQuery) && !email.includes(lowerQuery) && !country.includes(lowerQuery)) {
        return false
      }
    }

    return true
  })

  const stats = {
    total: attendees.length,
    going: attendees.filter((a) => a.status === 'going').length,
    interested: attendees.filter((a) => a.status === 'interested').length,
    checkedIn: attendees.filter((a) => a.checked_in).length
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/events/my"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Back to My Events
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/events/${event.id}`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <h1 className="text-4xl font-display font-bold text-navy-900 mb-2">
              Attendee Management
            </h1>
            <p className="text-gray-600">{event.title}</p>
          </div>

          {/* Stats Cards */}
          <motion.div
            variants={fadeIn}
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
          >
            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Total RSVPs</span>
                <Users className="h-5 w-5 text-primary-600" />
              </div>
              <div className="text-3xl font-bold text-navy-900">{stats.total}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Going</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-navy-900">{stats.going}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Interested</span>
                <Star className="h-5 w-5 text-gold-600" />
              </div>
              <div className="text-3xl font-bold text-navy-900">{stats.interested}</div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">Checked In</span>
                <CheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-navy-900">{stats.checkedIn}</div>
            </div>
          </motion.div>

          {/* Search & Filters */}
          <motion.div variants={fadeIn} className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or country..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'going', label: 'Going' },
                  { value: 'interested', label: 'Interested' }
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value as any)}
                    className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                      statusFilter === filter.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Export Button */}
              <button
                onClick={exportToCSV}
                disabled={attendees.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="h-5 w-5" />
                Export CSV
              </button>
            </div>
          </motion.div>

          {/* Attendees Table */}
          <motion.div variants={fadeIn} className="bg-white rounded-xl overflow-hidden border border-gray-200">
            {filteredAttendees.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Attendee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Country
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        RSVP Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check-In
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAttendees.map((attendee) => (
                      <tr key={attendee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-white">
                                {attendee.user?.full_name?.charAt(0) || 'A'}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-navy-900">
                                {attendee.user?.full_name || 'Anonymous'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendee.user?.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {attendee.user?.country || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              attendee.status === 'going'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gold-100 text-gold-800'
                            }`}
                          >
                            {attendee.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(attendee.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleCheckIn(attendee.id, attendee.checked_in)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                              attendee.checked_in
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {attendee.checked_in ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm">Checked In</span>
                              </>
                            ) : (
                              <>
                                <Circle className="h-4 w-4" />
                                <span className="text-sm">Check In</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  No attendees found
                </h3>
                <p className="text-gray-600">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try adjusting your filters'
                    : 'No one has RSVP\'d to this event yet'}
                </p>
              </div>
            )}
          </motion.div>

          {/* Summary Note */}
          {filteredAttendees.length > 0 && (
            <motion.div variants={fadeIn} className="mt-4 text-sm text-gray-600 text-center">
              Showing {filteredAttendees.length} of {attendees.length} total RSVPs
            </motion.div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  Search,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Trash2,
  Filter,
  Linkedin,
  AlertCircle,
  UserCheck,
  UserX,
  MessageSquare
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

type ConnectionStatus = 'all' | 'pending' | 'accepted' | 'rejected'

export default function EventConnectionsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ConnectionStatus>('all')

  const [connections, setConnections] = useState<any[]>([])
  const [filteredConnections, setFilteredConnections] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [acceptedCount, setAcceptedCount] = useState(0)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEventAndConnections()
    }
  }, [user, params.id])

  useEffect(() => {
    filterConnections()
  }, [connections, searchQuery, statusFilter])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEventAndConnections = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, start_date')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load all connections (sent and received)
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('event_networking')
        .select('*')
        .eq('event_id', params.id)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (connectionsError) throw connectionsError

      // Load profiles for all unique user IDs
      if (connectionsData && connectionsData.length > 0) {
        const userIds = [...new Set(
          connectionsData.flatMap(c => [c.sender_id, c.receiver_id])
        )]

        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, country, bio, linkedin_url')
          .in('id', userIds)

        // Attach profiles to connections
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
        connectionsData.forEach((conn: any) => {
          conn.sender = profilesMap.get(conn.sender_id)
          conn.receiver = profilesMap.get(conn.receiver_id)
        })
      }

      // Calculate counts
      const pending = connectionsData?.filter(
        c => c.status === 'pending' && c.receiver_id === user.id
      ).length || 0
      const accepted = connectionsData?.filter(c => c.status === 'accepted').length || 0

      setPendingCount(pending)
      setAcceptedCount(accepted)
      setConnections(connectionsData || [])
      setFilteredConnections(connectionsData || [])
    } catch (err: any) {
      console.error('Error loading connections:', err)
      setError(err.message || 'Failed to load connections')
    } finally {
      setLoading(false)
    }
  }

  const filterConnections = () => {
    let filtered = [...connections]

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(c => {
        const otherUser = c.sender_id === user.id ? c.receiver : c.sender
        return (
          otherUser?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          otherUser?.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          otherUser?.bio?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })
    }

    setFilteredConnections(filtered)
  }

  const handleAccept = async (connectionId: string) => {
    try {
      setProcessingId(connectionId)
      setError(null)

      const { error } = await supabase
        .from('event_networking')
        .update({ status: 'accepted' })
        .eq('id', connectionId)

      if (error) throw error

      await loadEventAndConnections()
    } catch (err: any) {
      console.error('Error accepting connection:', err)
      setError(err.message || 'Failed to accept connection')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (connectionId: string) => {
    try {
      setProcessingId(connectionId)
      setError(null)

      const { error } = await supabase
        .from('event_networking')
        .update({ status: 'rejected' })
        .eq('id', connectionId)

      if (error) throw error

      await loadEventAndConnections()
    } catch (err: any) {
      console.error('Error rejecting connection:', err)
      setError(err.message || 'Failed to reject connection')
    } finally {
      setProcessingId(null)
    }
  }

  const handleRemove = async (connectionId: string) => {
    if (!confirm('Remove this connection?')) return

    try {
      setProcessingId(connectionId)
      setError(null)

      const { error } = await supabase
        .from('event_networking')
        .delete()
        .eq('id', connectionId)

      if (error) throw error

      await loadEventAndConnections()
    } catch (err: any) {
      console.error('Error removing connection:', err)
      setError(err.message || 'Failed to remove connection')
    } finally {
      setProcessingId(null)
    }
  }

  const getConnectionDirection = (connection: any) => {
    const isSender = connection.sender_id === user.id
    const otherUser = isSender ? connection.receiver : connection.sender
    return { isSender, otherUser }
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

  if (error && !event) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-700">{error}</p>
            <Link
              href="/events"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/events/${params.id}`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <h1 className="text-3xl font-display font-bold text-navy-900">
              My Connections
            </h1>
            <p className="text-gray-600 mt-2">{event?.title}</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <Users className="h-8 w-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-900">{connections.length}</span>
              </div>
              <p className="text-sm font-medium text-blue-800 mt-2">Total Connections</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <UserCheck className="h-8 w-8 text-green-600" />
                <span className="text-3xl font-bold text-green-900">{acceptedCount}</span>
              </div>
              <p className="text-sm font-medium text-green-800 mt-2">Accepted</p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <Clock className="h-8 w-8 text-orange-600" />
                <span className="text-3xl font-bold text-orange-900">{pendingCount}</span>
              </div>
              <p className="text-sm font-medium text-orange-800 mt-2">Pending Requests</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search connections..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setStatusFilter('pending')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'pending'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setStatusFilter('accepted')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    statusFilter === 'accepted'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Accepted
                </button>
              </div>
            </div>
          </div>

          {/* Connections List */}
          {filteredConnections.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No connections found' : 'No connections yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Start networking with other attendees!'}
              </p>
              <Link
                href={`/events/${params.id}/networking`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Users className="h-5 w-5" />
                Browse Attendees
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {filteredConnections.map((connection) => {
                  const { isSender, otherUser } = getConnectionDirection(connection)
                  const isPending = connection.status === 'pending'
                  const isAccepted = connection.status === 'accepted'
                  const isRejected = connection.status === 'rejected'
                  const canRespond = !isSender && isPending

                  return (
                    <motion.div
                      key={connection.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-xl font-bold text-white">
                            {otherUser?.full_name?.charAt(0) || 'A'}
                          </span>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-navy-900 text-lg">
                                {otherUser?.full_name || 'Anonymous'}
                              </h3>
                              {otherUser?.country && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                                  <MapPin className="h-4 w-4" />
                                  {otherUser.country}
                                </div>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div>
                              {isAccepted && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                                  <CheckCircle className="h-4 w-4" />
                                  Connected
                                </span>
                              )}
                              {isPending && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                                  <Clock className="h-4 w-4" />
                                  {isSender ? 'Sent' : 'Received'}
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                                  <XCircle className="h-4 w-4" />
                                  Declined
                                </span>
                              )}
                            </div>
                          </div>

                          {otherUser?.bio && (
                            <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                              {otherUser.bio}
                            </p>
                          )}

                          {/* Connection Message */}
                          {connection.message && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border-l-4 border-primary-500">
                              <p className="text-sm text-gray-700 italic">"{connection.message}"</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-2 mt-4">
                            {canRespond && (
                              <>
                                <button
                                  onClick={() => handleAccept(connection.id)}
                                  disabled={processingId === connection.id}
                                  className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Accept
                                </button>
                                <button
                                  onClick={() => handleReject(connection.id)}
                                  disabled={processingId === connection.id}
                                  className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Decline
                                </button>
                              </>
                            )}

                            {isAccepted && (
                              <Link
                                href={`/messages?user=${otherUser?.id}`}
                                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                              >
                                <MessageSquare className="h-4 w-4" />
                                Message
                              </Link>
                            )}

                            {otherUser?.linkedin_url && (
                              <a
                                href={otherUser.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                              >
                                <Linkedin className="h-4 w-4" />
                                LinkedIn
                              </a>
                            )}

                            <button
                              onClick={() => handleRemove(connection.id)}
                              disabled={processingId === connection.id}
                              className="ml-auto flex items-center gap-1 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 text-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>

                          <div className="text-xs text-gray-500 mt-3">
                            {new Date(connection.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

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
  Send,
  CheckCircle,
  AlertCircle,
  UserPlus,
  X,
  Linkedin,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function EventNetworkingPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const [attendees, setAttendees] = useState<any[]>([])
  const [filteredAttendees, setFilteredAttendees] = useState<any[]>([])
  const [connections, setConnections] = useState<any[]>([])
  const [sendingRequest, setSendingRequest] = useState<string | null>(null)

  // Connection Request Modal
  const [showConnectionModal, setShowConnectionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [connectionMessage, setConnectionMessage] = useState('')

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEventAndAttendees()
    }
  }, [user, params.id])

  useEffect(() => {
    // Filter attendees based on search query
    if (searchQuery.trim()) {
      const filtered = attendees.filter((attendee) =>
        attendee.user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.user.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        attendee.user.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredAttendees(filtered)
    } else {
      setFilteredAttendees(attendees)
    }
  }, [searchQuery, attendees])

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
        .select('id, title, start_date')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Load attendees (users who RSVP'd as "going")
      const { data: attendeesData, error: attendeesError } = await supabase
        .from('event_rsvps')
        .select('id, user_id, created_at')
        .eq('event_id', params.id)
        .eq('status', 'going')
        .order('created_at', { ascending: true })

      if (attendeesError) throw attendeesError

      // Load profiles for attendees
      if (attendeesData && attendeesData.length > 0) {
        const userIds = attendeesData.map(a => a.user_id)
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, country, bio, linkedin_url')
          .in('id', userIds)

        // Attach profiles to attendees
        const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || [])
        attendeesData.forEach((attendee: any) => {
          attendee.user = profilesMap.get(attendee.user_id)
        })
      }

      setAttendees(attendeesData || [])
      setFilteredAttendees(attendeesData || [])

      // Load user's connections for this event
      const { data: connectionsData } = await supabase
        .from('event_networking')
        .select('*')
        .eq('event_id', params.id)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

      setConnections(connectionsData || [])
    } catch (err: any) {
      console.error('Error loading:', err)
      setError(err.message || 'Failed to load attendees')
    } finally {
      setLoading(false)
    }
  }

  const openConnectionModal = (attendee: any) => {
    setSelectedUser(attendee.user)
    setConnectionMessage(`Hi ${attendee.user.full_name?.split(' ')[0]}, I'd like to connect with you at this event!`)
    setShowConnectionModal(true)
  }

  const closeConnectionModal = () => {
    setShowConnectionModal(false)
    setSelectedUser(null)
    setConnectionMessage('')
  }

  const handleSendConnectionRequest = async () => {
    if (!user || !selectedUser) return

    try {
      setSendingRequest(selectedUser.id)
      setError(null)

      const { error } = await supabase
        .from('event_networking')
        .insert({
          event_id: params.id,
          sender_id: user.id,
          receiver_id: selectedUser.id,
          message: connectionMessage.trim() || null,
          status: 'pending'
        })

      if (error) throw error

      // Reload connections
      await loadEventAndAttendees()
      closeConnectionModal()
    } catch (err: any) {
      console.error('Error sending connection request:', err)
      setError(err.message || 'Failed to send connection request')
    } finally {
      setSendingRequest(null)
    }
  }

  const getConnectionStatus = (targetUserId: string) => {
    return connections.find(c =>
      (c.sender_id === user.id && c.receiver_id === targetUserId) ||
      (c.receiver_id === user.id && c.sender_id === targetUserId)
    )
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
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Header */}
          <div className="mb-8">
            <Link
              href={`/events/${params.id}`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-navy-900">
                  Event Attendees
                </h1>
                <p className="text-gray-600 mt-2">{event?.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Connect with other attendees and expand your professional network
                </p>
              </div>
              <Link
                href={`/events/${params.id}/connections`}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                My Connections
              </Link>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Stats & Search */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary-600" />
                <span className="text-lg font-bold text-navy-900">
                  {attendees.length} {attendees.length === 1 ? 'Attendee' : 'Attendees'}
                </span>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, country, or bio..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Attendees Grid */}
          {filteredAttendees.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-navy-900 mb-2">
                {searchQuery ? 'No attendees found' : 'No attendees yet'}
              </h3>
              <p className="text-gray-600">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : 'Be the first to RSVP to this event!'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredAttendees.map((attendee) => {
                const isCurrentUser = attendee.user_id === user?.id
                const connection = getConnectionStatus(attendee.user_id)

                return (
                  <div
                    key={attendee.id}
                    className="bg-white rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-white">
                          {attendee.user?.full_name?.charAt(0) || 'A'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-navy-900 mb-1">
                          {attendee.user?.full_name || 'Anonymous'}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs font-medium text-primary-600">(You)</span>
                          )}
                        </h3>

                        {attendee.user?.country && (
                          <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4" />
                            {attendee.user.country}
                          </div>
                        )}

                        {attendee.user?.bio && (
                          <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                            {attendee.user.bio}
                          </p>
                        )}

                        {/* Actions */}
                        {!isCurrentUser && (
                          <div className="flex gap-2">
                            {connection ? (
                              <div className="flex items-center gap-2 text-sm">
                                {connection.status === 'pending' && (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-orange-600" />
                                    <span className="text-orange-600 font-medium">
                                      {connection.sender_id === user.id ? 'Request Sent' : 'Request Received'}
                                    </span>
                                  </>
                                )}
                                {connection.status === 'accepted' && (
                                  <>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-green-600 font-medium">Connected</span>
                                  </>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => openConnectionModal(attendee)}
                                disabled={sendingRequest === attendee.user_id}
                                className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors text-sm font-medium"
                              >
                                <UserPlus className="h-4 w-4" />
                                {sendingRequest === attendee.user_id ? 'Sending...' : 'Connect'}
                              </button>
                            )}

                            {attendee.user?.linkedin_url && (
                              <a
                                href={attendee.user.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                              >
                                <Linkedin className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Connection Request Modal */}
          <AnimatePresence>
            {showConnectionModal && selectedUser && (
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-navy-900">Send Connection Request</h2>
                    <button
                      onClick={closeConnectionModal}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="h-6 w-6 text-gray-500" />
                    </button>
                  </div>

                  {/* User Preview */}
                  <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
                      <span className="text-lg font-bold text-white">
                        {selectedUser.full_name?.charAt(0) || 'A'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-navy-900">{selectedUser.full_name}</h3>
                      {selectedUser.country && (
                        <p className="text-sm text-gray-600">{selectedUser.country}</p>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Add a message (optional)
                    </label>
                    <textarea
                      value={connectionMessage}
                      onChange={(e) => setConnectionMessage(e.target.value)}
                      rows={4}
                      placeholder="Introduce yourself or explain why you'd like to connect..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {connectionMessage.length}/500 characters
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleSendConnectionRequest}
                      disabled={!!sendingRequest}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                    >
                      <Send className="h-5 w-5" />
                      {sendingRequest ? 'Sending...' : 'Send Request'}
                    </button>
                    <button
                      onClick={closeConnectionModal}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

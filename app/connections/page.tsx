'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  MessageCircle,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getMyConnections,
  getPendingRequests,
  getSentRequests,
  acceptConnectionRequest,
  declineConnectionRequest,
  removeConnection
} from '@/lib/connections'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

type Tab = 'connections' | 'requests' | 'sent'

export default function ConnectionsPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Tab>('connections')
  const [connections, setConnections] = useState<any[]>([])
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [sentRequests, setSentRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [activeTab, user])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }
    setUser(user)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'connections') {
        const { data } = await getMyConnections()
        setConnections(data || [])
      } else if (activeTab === 'requests') {
        const { data } = await getPendingRequests()
        setPendingRequests(data || [])
      } else if (activeTab === 'sent') {
        const { data } = await getSentRequests()
        setSentRequests(data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (connectionId: string) => {
    setActionLoading(connectionId)
    try {
      const { error } = await acceptConnectionRequest(connectionId)
      if (error) throw error

      toast.success('Connection accepted!')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDecline = async (connectionId: string) => {
    setActionLoading(connectionId)
    try {
      const { error } = await declineConnectionRequest(connectionId)
      if (error) throw error

      toast.success('Request declined')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (connectionId: string) => {
    if (!confirm('Are you sure you want to remove this connection?')) return

    setActionLoading(connectionId)
    try {
      const { error } = await removeConnection(connectionId)
      if (error) throw error

      toast.success('Connection removed')
      loadData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove')
    } finally {
      setActionLoading(null)
    }
  }

  const handleMessage = async (otherUserId: string) => {
    try {
      // Check if conversation exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_a_id.eq.${user.id},participant_b_id.eq.${otherUserId}),and(participant_a_id.eq.${otherUserId},participant_b_id.eq.${user.id})`)
        .maybeSingle()

      if (existing) {
        router.push(`/messages?conversation=${existing.id}`)
        return
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          participant_a_id: user.id,
          participant_b_id: otherUserId
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/messages?conversation=${newConvo.id}`)
    } catch (error) {
      toast.error('Failed to start conversation')
    }
  }

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'entrepreneur': return 'from-primary-500 to-primary-600'
      case 'investor': return 'from-gold-500 to-gold-600'
      case 'professional': return 'from-blue-500 to-blue-600'
      case 'company': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const renderConnectionCard = (connection: any) => {
    const otherUser = connection.requester_id === user.id
      ? connection.addressee
      : connection.requester

    if (!otherUser) return null

    return (
      <motion.div
        key={connection.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6 hover:border-primary-300 transition-all"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <Link href={`/profile/${otherUser.id}`}>
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getUserTypeColor(otherUser.user_type)} flex items-center justify-center cursor-pointer`}>
                <span className="text-xl font-bold text-white">
                  {otherUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1">
              <Link
                href={`/profile/${otherUser.id}`}
                className="text-lg font-bold text-navy-900 hover:text-primary-600 cursor-pointer"
              >
                {otherUser.full_name || 'Anonymous'}
              </Link>
              <p className="text-sm text-primary-600 font-medium capitalize mb-1">
                {otherUser.user_type}
              </p>
              {otherUser.bio && (
                <p className="text-sm text-gray-600 line-clamp-2">{otherUser.bio}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={() => handleMessage(otherUser.id)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Message</span>
            </button>
            <button
              onClick={() => handleRemove(connection.id)}
              disabled={actionLoading === connection.id}
              className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Remove connection"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderRequestCard = (request: any, type: 'received' | 'sent') => {
    const otherUser = type === 'received' ? request.requester : request.addressee

    if (!otherUser) return null

    return (
      <motion.div
        key={request.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-gray-200 p-6"
      >
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            {/* Avatar */}
            <Link href={`/profile/${otherUser.id}`}>
              <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getUserTypeColor(otherUser.user_type)} flex items-center justify-center cursor-pointer`}>
                <span className="text-xl font-bold text-white">
                  {otherUser.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1">
              <Link
                href={`/profile/${otherUser.id}`}
                className="text-lg font-bold text-navy-900 hover:text-primary-600 cursor-pointer"
              >
                {otherUser.full_name || 'Anonymous'}
              </Link>
              <p className="text-sm text-primary-600 font-medium capitalize mb-2">
                {otherUser.user_type}
              </p>
              {request.request_message && (
                <p className="text-sm text-gray-600 italic mb-2">"{request.request_message}"</p>
              )}
              <p className="text-xs text-gray-400">
                {new Date(request.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Actions */}
          {type === 'received' ? (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => handleAccept(request.id)}
                disabled={actionLoading === request.id}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                <span>Accept</span>
              </button>
              <button
                onClick={() => handleDecline(request.id)}
                disabled={actionLoading === request.id}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50"
              >
                <UserX className="h-4 w-4" />
                <span>Decline</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-gray-500 ml-4">
              <Clock className="h-5 w-5" />
              <span className="text-sm font-medium">Pending</span>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  if (!user) {
    return null
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
            <h1 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-2">
              My Connections
            </h1>
            <p className="text-gray-600">
              Manage your professional network
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 mb-8 flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('connections')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'connections'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Connections ({connections.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Requests ({pendingRequests.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'sent'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Sent ({sentRequests.length})</span>
            </button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'connections' && (
                <>
                  {connections.length > 0 ? (
                    connections.map(renderConnectionCard)
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                      <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-navy-900 mb-2">No connections yet</h3>
                      <p className="text-gray-600 mb-4">Start building your network!</p>
                      <Link
                        href="/explore"
                        className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <UserPlus className="h-5 w-5" />
                        <span>Explore Network</span>
                      </Link>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'requests' && (
                <>
                  {pendingRequests.length > 0 ? (
                    pendingRequests.map(req => renderRequestCard(req, 'received'))
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                      <UserPlus className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-navy-900 mb-2">No pending requests</h3>
                      <p className="text-gray-600">You're all caught up!</p>
                    </div>
                  )}
                </>
              )}

              {activeTab === 'sent' && (
                <>
                  {sentRequests.length > 0 ? (
                    sentRequests.map(req => renderRequestCard(req, 'sent'))
                  ) : (
                    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                      <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-bold text-navy-900 mb-2">No pending sent requests</h3>
                      <p className="text-gray-600">Send connection requests to start networking!</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

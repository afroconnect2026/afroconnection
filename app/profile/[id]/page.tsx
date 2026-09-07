'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  MapPin,
  Globe,
  Linkedin,
  Twitter,
  Briefcase,
  Mail,
  UserPlus,
  UserCheck,
  UserX,
  Clock,
  MessageCircle,
  ArrowLeft
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getConnectionStatus, sendConnectionRequest, acceptConnectionRequest, declineConnectionRequest, removeConnection } from '@/lib/connections'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function PublicProfilePage() {
  const params = useParams()
  const userId = params?.id as string
  const router = useRouter()
  const supabase = createClient()

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'declined'>('none')
  const [connection, setConnection] = useState<any>(null)
  const [isRequester, setIsRequester] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [userId])

  const loadProfile = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Redirect if viewing own profile
      if (user.id === userId) {
        router.push('/profile')
        return
      }

      setCurrentUser(user)

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError || !profileData) {
        toast.error('Profile not found')
        router.push('/explore')
        return
      }

      setProfile(profileData)

      // Load connection status
      const status = await getConnectionStatus(userId)
      setConnectionStatus(status.status)
      setConnection(status.connection)
      setIsRequester(status.isRequester)

    } catch (error: any) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSendRequest = async () => {
    setActionLoading(true)
    try {
      const { data, error } = await sendConnectionRequest(userId)
      if (error) throw error

      toast.success('Connection request sent!')
      await loadProfile() // Reload to update status
    } catch (error: any) {
      toast.error(error.message || 'Failed to send request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAcceptRequest = async () => {
    if (!connection) return

    setActionLoading(true)
    try {
      const { error } = await acceptConnectionRequest(connection.id)
      if (error) throw error

      toast.success('Connection accepted!')
      await loadProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeclineRequest = async () => {
    if (!connection) return

    setActionLoading(true)
    try {
      const { error } = await declineConnectionRequest(connection.id)
      if (error) throw error

      toast.success('Connection declined')
      await loadProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to decline request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRemoveConnection = async () => {
    if (!connection) return

    if (!confirm('Are you sure you want to remove this connection?')) return

    setActionLoading(true)
    try {
      const { error } = await removeConnection(connection.id)
      if (error) throw error

      toast.success('Connection removed')
      await loadProfile()
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove connection')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMessage = async () => {
    if (connectionStatus !== 'accepted') {
      toast.error('You must be connected to send messages')
      return
    }

    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_a_id.eq.${currentUser.id},participant_b_id.eq.${userId}),and(participant_a_id.eq.${userId},participant_b_id.eq.${currentUser.id})`)
        .maybeSingle()

      if (existing) {
        router.push(`/messages?conversation=${existing.id}`)
        return
      }

      // Create new conversation
      const { data: newConvo, error } = await supabase
        .from('conversations')
        .insert({
          participant_a_id: currentUser.id,
          participant_b_id: userId
        })
        .select()
        .single()

      if (error) throw error

      router.push(`/messages?conversation=${newConvo.id}`)
    } catch (error: any) {
      console.error('Error starting conversation:', error)
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

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!profile) {
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
          {/* Back Button */}
          <Link
            href="/explore"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-primary-600 mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Explore</span>
          </Link>

          {/* Profile Card */}
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-lg">
            {/* Cover Photo */}
            <div className={`h-32 sm:h-48 bg-gradient-to-r ${getUserTypeColor(profile.user_type)}`}></div>

            {/* Profile Info */}
            <div className="px-6 pb-6">
              {/* Avatar */}
              <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br ${getUserTypeColor(profile.user_type)} flex items-center justify-center -mt-12 sm:-mt-16 border-4 border-white shadow-lg mb-4`}>
                <span className="text-3xl sm:text-4xl font-bold text-white">
                  {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>

              {/* Name and Type */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-navy-900 mb-2">
                  {profile.full_name || 'Anonymous User'}
                </h1>
                <div className="flex items-center space-x-2 mb-3">
                  <Briefcase className="h-4 w-4 text-primary-600" />
                  <span className="text-primary-600 font-medium capitalize">
                    {profile.user_type}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mb-6">
                {/* Connection Status Button */}
                {connectionStatus === 'none' && (
                  <button
                    onClick={handleSendRequest}
                    disabled={actionLoading}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <UserPlus className="h-5 w-5" />
                    <span>{actionLoading ? 'Sending...' : 'Connect'}</span>
                  </button>
                )}

                {connectionStatus === 'pending' && isRequester && (
                  <div className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-6 py-3 rounded-lg font-medium">
                    <Clock className="h-5 w-5" />
                    <span>Request Pending</span>
                  </div>
                )}

                {connectionStatus === 'pending' && !isRequester && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleAcceptRequest}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <UserCheck className="h-5 w-5" />
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={handleDeclineRequest}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      <UserX className="h-5 w-5" />
                      <span>Decline</span>
                    </button>
                  </div>
                )}

                {connectionStatus === 'accepted' && (
                  <>
                    <button
                      onClick={handleMessage}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      <MessageCircle className="h-5 w-5" />
                      <span>Send Message</span>
                    </button>
                    <button
                      onClick={handleRemoveConnection}
                      disabled={actionLoading}
                      className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      <UserX className="h-5 w-5" />
                      <span>Remove Connection</span>
                    </button>
                  </>
                )}
              </div>

              {/* Bio */}
              {profile.bio && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-navy-900 mb-2">About</h3>
                  <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
                </div>
              )}

              {/* Details */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {(profile.country || profile.city) && (
                  <div className="flex items-start space-x-3">
                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Location</p>
                      <p className="text-gray-900">
                        {[profile.city, profile.country].filter(Boolean).join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </div>
                )}

                {profile.website_url && (
                  <div className="flex items-start space-x-3">
                    <Globe className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Website</p>
                      <a
                        href={profile.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 hover:underline"
                      >
                        {profile.website_url}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Social Links */}
              {(profile.linkedin_url || profile.twitter_url) && (
                <div>
                  <h3 className="text-lg font-semibold text-navy-900 mb-3">Connect</h3>
                  <div className="flex space-x-3">
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Linkedin className="h-5 w-5" />
                        <span>LinkedIn</span>
                      </a>
                    )}
                    {profile.twitter_url && (
                      <a
                        href={profile.twitter_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 bg-sky-500 text-white px-4 py-2 rounded-lg hover:bg-sky-600 transition-colors"
                      >
                        <Twitter className="h-5 w-5" />
                        <span>Twitter</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

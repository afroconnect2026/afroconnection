'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  TrendingUp,
  Award,
  Building2,
  Rocket,
  Globe,
  Users,
  MessageCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const userTypes = [
  { value: 'all', label: 'All', icon: Users },
  { value: 'entrepreneur', label: 'Entrepreneurs', icon: Rocket },
  { value: 'investor', label: 'Investors', icon: TrendingUp },
  { value: 'professional', label: 'Professionals', icon: Award },
  { value: 'company', label: 'Companies', icon: Building2 },
]

export default function ExplorePage() {
  const [user, setUser] = useState<any>(null)
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      // Honour ?type= from dashboard Quick Actions (e.g. /explore?type=investor).
      // Read from window rather than useSearchParams so no Suspense boundary is needed.
      const typeParam = new URLSearchParams(window.location.search).get('type')
      if (typeParam && userTypes.some((t) => t.value === typeParam)) {
        setSelectedType(typeParam)
      }

      setUser(user)
      // loadProfiles will be called by the second useEffect when user is set
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  const loadProfiles = async (searchTerm = '', userTypeFilter = 'all') => {
    if (!user) return

    // Only select public fields - NOT email or phone (PII protection)
    let query = supabase
      .from('profiles')
      .select('id, full_name, avatar_url, bio, user_type, country, city, website_url, linkedin_url, twitter_url, is_verified, created_at', { count: 'exact' })
      .neq('id', user.id) // Exclude current user
      .eq('is_active', true)

    // Server-side user type filter
    if (userTypeFilter !== 'all') {
      query = query.eq('user_type', userTypeFilter)
    }

    // Server-side search (name, bio, or country) - sanitized to prevent injection
    if (searchTerm) {
      // Sanitize search term: remove special characters that could break PostgREST logic tree
      const safe = searchTerm.replace(/[,()\\.:"']/g, ' ').trim()
      if (safe) {
        query = query.or(`full_name.ilike.%${safe}%,bio.ilike.%${safe}%,country.ilike.%${safe}%`)
      }
    }

    // Pagination
    query = query.range(0, 23).order('created_at', { ascending: false })

    const { data, error, count } = await query

    if (error) {
      console.error('Search failed:', error)
      return
    }

    if (data) {
      setProfiles(data)
      setTotalCount(count || 0)
    }
  }

  // Reload when search or filter changes
  useEffect(() => {
    if (user) {
      loadProfiles(searchQuery, selectedType)
    }
  }, [searchQuery, selectedType, user])

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'entrepreneur': return 'from-primary-500 to-primary-600'
      case 'investor': return 'from-gold-500 to-gold-600'
      case 'professional': return 'from-blue-500 to-blue-600'
      case 'company': return 'from-purple-500 to-purple-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const handleStartConversation = async (otherUserId: string) => {
    try {
      // Check if conversation already exists
      const { data: existing } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(participant_a_id.eq.${user.id},participant_b_id.eq.${otherUserId}),and(participant_a_id.eq.${otherUserId},participant_b_id.eq.${user.id})`)
        .maybeSingle()

      if (existing) {
        // Conversation exists, go to it
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

      toast.success('Dealroom opened!')
      router.push(`/messages?conversation=${newConvo.id}`)
    } catch (error: any) {
      console.error('Error opening dealroom:', error)
      toast.error(error.message || 'Failed to open dealroom')
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

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-2">
              Explore Network
            </h1>
            <p className="text-gray-600">
              Discover and connect with entrepreneurs, investors, and professionals worldwide
            </p>
          </div>

          {/* Search & Filters */}
          <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, location, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
              <Filter className="h-5 w-5 text-gray-400 flex-shrink-0" />
              {userTypes.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => setSelectedType(type.value)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedType === type.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-gray-600">
              Found <span className="font-semibold text-navy-900">{totalCount}</span> {totalCount === 1 ? 'member' : 'members'}
              {totalCount > 24 && <span className="text-sm text-gray-500"> (showing first 24)</span>}
            </p>
          </div>

          {/* Profile Grid */}
          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profiles.map((profile) => (
                <motion.div
                  key={profile.id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg cursor-pointer"
                >
                  {/* Profile Header */}
                  <div className={`h-24 bg-gradient-to-r ${getUserTypeColor(profile.user_type)}`}></div>

                  <div className="px-6 pb-6">
                    {/* Avatar */}
                    <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${getUserTypeColor(profile.user_type)} flex items-center justify-center -mt-10 border-4 border-white shadow-lg mb-4`}>
                      <span className="text-2xl font-bold text-white">
                        {profile.full_name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>

                    {/* Name & Type */}
                    <h3 className="text-xl font-bold text-navy-900 mb-1 truncate">
                      {profile.full_name || 'Anonymous User'}
                    </h3>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-sm text-primary-600 font-medium capitalize">
                        {profile.user_type}
                      </span>
                      {profile.country && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span className="text-sm text-gray-600 flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{profile.country}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {profile.bio || 'No bio provided yet'}
                    </p>

                    {/* Action Button */}
                    <button
                      onClick={() => router.push(`/profile/${profile.id}`)}
                      className="w-full bg-primary-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center justify-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>View Profile</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-12 border border-gray-200 text-center">
              <Globe className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-navy-900 mb-2">No members found</h3>
              <p className="text-gray-600">
                {searchQuery || selectedType !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Be the first to join this amazing network!'}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

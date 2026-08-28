'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Eye,
  Users,
  MessageCircle,
  Target,
  TrendingUp,
  FileText,
  UserPlus,
  Rocket,
  AlertCircle
} from 'lucide-react'
import StatCard from './StatCard'
import QuickActionCard from './QuickActionCard'
import EmptyState from './EmptyState'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

interface EntrepreneurDashboardProps {
  user: any
  profile: any
}

export default function EntrepreneurDashboard({ user, profile }: EntrepreneurDashboardProps) {
  const [stats, setStats] = useState({
    investorViews: 0,
    investorViewsTrend: 0,
    pendingMatches: 0,
    activeConversations: 0,
    readinessScore: 0
  })
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actingOn, setActingOn] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setError(null)

      // Get investor views (last 30 days).
      // Filter on the joined profile with an INNER embed — passing a query builder
      // to .in() is not supported by supabase-js and produces an invalid request.
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: investorViewsCount, error: viewsError } = await supabase
        .from('profile_views')
        .select('*, viewer:profiles!profile_views_viewer_id_fkey!inner(user_type)', {
          count: 'exact',
          head: true
        })
        .eq('viewed_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .eq('viewer.user_type', 'investor')

      if (viewsError) console.error('profile_views query failed:', viewsError)

      // Get pending investor matches (user can be on either side of the match)
      const { count: pendingMatchesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'pending')

      // Get active conversations with investors
      const { count: conversationsCount } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .or(`participant_a_id.eq.${user.id},participant_b_id.eq.${user.id}`)

      // Calculate funding readiness score
      const readiness = calculateReadinessScore(profile)

      // Get top matches. The entrepreneur may be stored as user_a OR user_b,
      // so fetch both sides and pick whichever one is not the current user.
      const { data: matchesData, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          user_a:profiles!matches_user_a_id_fkey(id, full_name, avatar_url, user_type, country),
          user_b:profiles!matches_user_b_id_fkey(id, full_name, avatar_url, user_type, country)
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('match_type', 'investor-founder')
        .neq('status', 'rejected')
        .order('match_score', { ascending: false })
        .limit(5)

      if (matchesError) console.error('matches query failed:', matchesError)

      const normalizedMatches = (matchesData || []).map((m: any) => ({
        ...m,
        investor: m.user_a_id === user.id ? m.user_b : m.user_a
      }))

      setStats({
        investorViews: investorViewsCount || 0,
        investorViewsTrend: 0, // TODO: Calculate vs previous 30 days
        pendingMatches: pendingMatchesCount || 0,
        activeConversations: conversationsCount || 0,
        readinessScore: readiness
      })

      setMatches(normalizedMatches)
    } catch (err) {
      console.error('Error loading dashboard:', err)
      setError('We could not load your dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const calculateReadinessScore = (p: any) => {
    if (!p) return 0

    let score = 0
    const weights = {
      full_name: 10,
      bio: 15,
      country: 10,
      avatar_url: 10,
      is_verified: 20
      // TODO: entrepreneur_profiles fields (startup_stage, industry, pitch_deck_url)
    }

    if (p.full_name) score += weights.full_name
    if (p.bio && p.bio.length > 50) score += weights.bio
    if (p.country) score += weights.country
    if (p.avatar_url) score += weights.avatar_url
    if (p.is_verified) score += weights.is_verified

    return Math.min(100, score)
  }

  const respondToMatch = async (matchId: string, status: 'accepted' | 'rejected') => {
    setActingOn(matchId)
    try {
      const { error: updateError } = await supabase
        .from('matches')
        .update({ status })
        .eq('id', matchId)

      if (updateError) {
        console.error('Failed to update match:', updateError)
        setError('Could not update that match. Please try again.')
        return
      }

      setMatches((prev) => prev.filter((m) => m.id !== matchId))
      setStats((prev) => ({
        ...prev,
        pendingMatches: Math.max(0, prev.pendingMatches - 1)
      }))
    } finally {
      setActingOn(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const dashboardStats = [
    {
      name: 'Investor Views (30d)',
      value: stats.investorViews,
      icon: Eye,
      color: 'text-primary-600',
      trend: stats.investorViewsTrend !== 0 ? {
        value: stats.investorViewsTrend,
        isPositive: stats.investorViewsTrend > 0
      } : undefined
    },
    {
      name: 'Matches Awaiting You',
      value: stats.pendingMatches,
      icon: Users,
      color: 'text-gold-600',
      subtitle: 'Investor matches to review'
    },
    {
      name: 'Active Conversations',
      value: stats.activeConversations,
      icon: MessageCircle,
      color: 'text-blue-600',
      subtitle: 'With potential investors'
    },
    {
      name: 'Funding Readiness',
      value: `${stats.readinessScore}%`,
      icon: Target,
      color: stats.readinessScore >= 80 ? 'text-green-600' : stats.readinessScore >= 50 ? 'text-gold-600' : 'text-red-600',
      subtitle: stats.readinessScore < 80 ? 'Complete your profile' : 'Looking good!'
    }
  ]

  const quickActions = [
    {
      title: 'Find Investors',
      description: 'Discover investors matching your stage and sector',
      href: '/explore?type=investor',
      icon: TrendingUp,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Post Your Raise',
      description: 'Share your fundraising round with the network',
      href: '/opportunities/create',
      icon: Rocket,
      color: 'from-gold-500 to-gold-600'
    },
    {
      title: 'Upload Pitch Deck',
      description: 'Add or update your investor pitch deck',
      href: '/profile',
      icon: FileText,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Find a Mentor',
      description: 'Connect with experienced professionals',
      href: '/explore?type=professional',
      icon: UserPlus,
      color: 'from-purple-500 to-purple-600'
    }
  ]

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={stagger}
    >
      {error && (
        <motion.div variants={fadeIn} className="mb-6">
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <button
              onClick={loadDashboardData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        variants={fadeIn}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {dashboardStats.map((stat) => (
          <StatCard key={stat.name} {...stat} />
        ))}
      </motion.div>

      {/* Funding Readiness Checklist */}
      {profile && stats.readinessScore < 100 && (
        <motion.div variants={fadeIn} className="mb-8">
          <div className="bg-gradient-to-r from-primary-50 to-gold-50 rounded-xl p-6 border border-primary-200">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <Target className="h-8 w-8 text-primary-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  Complete Your Profile to Attract Investors
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Profiles at 100% readiness get 4× more investor views
                </p>
                <div className="space-y-2">
                  {!profile.is_verified && (
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-gold-600" />
                      <span className="text-gray-700">Verify your identity (+20%)</span>
                    </div>
                  )}
                  {(!profile.bio || profile.bio.length < 50) && (
                    <div className="flex items-center space-x-2 text-sm">
                      <AlertCircle className="h-4 w-4 text-gold-600" />
                      <span className="text-gray-700">Add a compelling bio (+15%)</span>
                    </div>
                  )}
                  {/* Add more checklist items based on entrepreneur_profiles */}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div variants={fadeIn} className="mb-8">
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </motion.div>

      {/* Investor Match Feed */}
      <motion.div variants={fadeIn}>
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
          Investor Matches
        </h2>
        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => (
              <div key={match.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">
                        {match.investor?.full_name?.charAt(0) || 'I'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-navy-900 mb-1">
                        {match.investor?.full_name || 'Anonymous Investor'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {match.investor?.country || 'Global'}
                      </p>
                      {match.match_reason && (
                        <p className="text-sm text-gray-700 bg-primary-50 p-3 rounded-lg mb-3">
                          {match.match_reason}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-gold-500 h-2 rounded-full"
                            style={{ width: `${(match.match_score || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {Math.round((match.match_score || 0) * 100)}% fit
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => respondToMatch(match.id, 'accepted')}
                      disabled={actingOn === match.id}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actingOn === match.id ? 'Saving…' : 'Connect'}
                    </button>
                    <button
                      onClick={() => respondToMatch(match.id, 'rejected')}
                      disabled={actingOn === match.id}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Pass
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title="No investor matches yet"
            description="Complete your profile to start getting matched with investors who fit your startup stage and sector"
            actionLabel="Complete Profile"
            actionHref="/profile"
          />
        )}
      </motion.div>
    </motion.div>
  )
}

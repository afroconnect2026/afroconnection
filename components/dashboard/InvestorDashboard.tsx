'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Clock,
  Search,
  Briefcase,
  Star,
  X,
  MessageCircle,
  Filter,
  Award,
  DollarSign,
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

interface InvestorDashboardProps {
  user: any
  profile: any
}

export default function InvestorDashboard({ user, profile }: InvestorDashboardProps) {
  const [stats, setStats] = useState({
    newDeals: 0,
    awaitingReview: 0,
    inDiligence: 0,
    portfolio: 0
  })
  const [deals, setDeals] = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<any[]>([])
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
      // Get new deals matching thesis (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { count: newDealsCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('match_type', 'investor-founder')
        .gte('created_at', sevenDaysAgo.toISOString())

      // Get pending matches awaiting review
      const { count: awaitingCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('status', 'pending')

      // Get active conversations (in diligence)
      const { count: diligenceCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('pipeline_stage', 'in_diligence')

      // Get watchlist count
      const { count: watchlistCount } = await supabase
        .from('saved_items')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('target_type', 'profile')

      // Get top deals. The investor may be stored as user_a OR user_b, so fetch
      // both sides of the match and pick whichever one is not the current user.
      const { data: dealsData, error: dealsError } = await supabase
        .from('matches')
        .select(`
          *,
          user_a:profiles!matches_user_a_id_fkey(id, full_name, avatar_url, user_type, country, bio),
          user_b:profiles!matches_user_b_id_fkey(id, full_name, avatar_url, user_type, country, bio)
        `)
        .or(`user_a_id.eq.${user.id},user_b_id.eq.${user.id}`)
        .eq('match_type', 'investor-founder')
        .eq('status', 'pending')
        .order('match_score', { ascending: false })
        .limit(5)

      if (dealsError) console.error('deals query failed:', dealsError)

      const normalizedDeals = (dealsData || []).map((d: any) => ({
        ...d,
        entrepreneur: d.user_a_id === user.id ? d.user_b : d.user_a
      }))

      // Get watchlist items.
      // saved_items.target_id is polymorphic ('profile' | 'opportunity' | 'match')
      // and therefore has NO foreign key, so PostgREST cannot embed profiles here.
      // Fetch the saves first, then hydrate the profiles in a second query.
      const { data: savedRows, error: savedError } = await supabase
        .from('saved_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_type', 'profile')
        .order('created_at', { ascending: false })
        .limit(5)

      if (savedError) console.error('saved_items query failed:', savedError)

      let watchlistItems: any[] = savedRows || []
      const targetIds = watchlistItems.map((s: any) => s.target_id).filter(Boolean)

      if (targetIds.length > 0) {
        const { data: watchedProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, country, bio')
          .in('id', targetIds)

        const byId = new Map((watchedProfiles || []).map((p: any) => [p.id, p]))
        watchlistItems = watchlistItems.map((s: any) => ({
          ...s,
          profile: byId.get(s.target_id) || null
        }))
      }

      setStats({
        newDeals: newDealsCount || 0,
        awaitingReview: awaitingCount || 0,
        inDiligence: diligenceCount || 0,
        portfolio: watchlistCount || 0
      })

      setDeals(normalizedDeals)
      setWatchlist(watchlistItems)
    } catch (err) {
      console.error('Error loading investor dashboard:', err)
      setError('We could not load your deal flow. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveDeal = async (matchId: string, profileId?: string) => {
    if (!profileId) {
      setError('This profile is unavailable and cannot be saved.')
      return
    }

    setActingOn(matchId)
    try {
      // upsert: saved_items has a UNIQUE (user_id, target_type, target_id)
      // constraint, so a plain insert throws on a second save.
      const { error: saveError } = await supabase
        .from('saved_items')
        .upsert(
          {
            user_id: user.id,
            target_type: 'profile',
            target_id: profileId
          },
          { onConflict: 'user_id,target_type,target_id', ignoreDuplicates: true }
        )

      if (saveError) {
        console.error('Error saving deal:', saveError)
        setError('Could not add that company to your watchlist.')
        return
      }

      await loadDashboardData()
    } finally {
      setActingOn(null)
    }
  }

  const handlePassDeal = async (matchId: string) => {
    setActingOn(matchId)
    try {
      // NOTE: matches.status has a CHECK constraint allowing only
      // 'pending' | 'accepted' | 'rejected' | 'expired'. 'passed' is a
      // pipeline_stage value, NOT a status value.
      const { error: passError } = await supabase
        .from('matches')
        .update({
          status: 'rejected',
          pipeline_stage: 'passed'
        })
        .eq('id', matchId)

      if (passError) {
        console.error('Error passing deal:', passError)
        setError('Could not pass on that deal. Please try again.')
        return
      }

      setDeals((prev) => prev.filter((d) => d.id !== matchId))
      setStats((prev) => ({
        ...prev,
        awaitingReview: Math.max(0, prev.awaitingReview - 1)
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
      name: 'New Deals (7d)',
      value: stats.newDeals,
      icon: TrendingUp,
      color: 'text-primary-600',
      subtitle: 'Matching your thesis'
    },
    {
      name: 'Awaiting Review',
      value: stats.awaitingReview,
      icon: Clock,
      color: 'text-gold-600',
      subtitle: 'Your queue depth'
    },
    {
      name: 'In Diligence',
      value: stats.inDiligence,
      icon: Search,
      color: 'text-blue-600',
      subtitle: 'Active evaluations'
    },
    {
      name: 'Watchlist',
      value: stats.portfolio,
      icon: Star,
      color: 'text-purple-600',
      subtitle: 'Saved companies'
    }
  ]

  const quickActions = [
    {
      title: 'Review Deal Queue',
      description: 'Triage founder matches one by one',
      href: '/deals',
      icon: Briefcase,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Refine Investment Thesis',
      description: 'Update sectors, stages, and ticket size',
      href: '/profile',
      icon: Filter,
      color: 'from-gold-500 to-gold-600'
    },
    {
      title: 'Post Investment',
      description: 'Share an open mandate with founders',
      href: '/opportunities/create',
      icon: DollarSign,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Get Verified',
      description: 'Unlock verified investor badge',
      href: '/settings/verification',
      icon: Award,
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

      {/* Deal Flow Inbox */}
      <motion.div variants={fadeIn} className="mb-8">
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
          Deal Flow Inbox
        </h2>
        {deals.length > 0 ? (
          <div className="space-y-4">
            {deals.map((deal) => (
              <div key={deal.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl font-bold text-white">
                        {deal.entrepreneur?.full_name?.charAt(0) || 'E'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-navy-900 mb-1">
                        {deal.entrepreneur?.full_name || 'Anonymous Entrepreneur'}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {deal.entrepreneur?.country || 'Global'}
                      </p>
                      {deal.entrepreneur?.bio && (
                        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                          {deal.entrepreneur.bio}
                        </p>
                      )}
                      {deal.match_reason && (
                        <p className="text-sm text-gray-700 bg-gold-50 p-3 rounded-lg mb-3">
                          <strong>Why this matches:</strong> {deal.match_reason}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary-500 to-gold-500 h-2 rounded-full"
                            style={{ width: `${(deal.match_score || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {Math.round((deal.match_score || 0) * 100)}% fit
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => handleSaveDeal(deal.id, deal.entrepreneur?.id)}
                      disabled={actingOn === deal.id || !deal.entrepreneur?.id}
                      className="px-4 py-2 bg-gold-600 text-white rounded-lg text-sm font-medium hover:bg-gold-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Star className="h-4 w-4" />
                      <span>{actingOn === deal.id ? 'Saving…' : 'Save'}</span>
                    </button>
                    <button
                      onClick={() => handlePassDeal(deal.id)}
                      disabled={actingOn === deal.id}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="h-4 w-4" />
                      <span>Pass</span>
                    </button>
                    <Link
                      href="/messages"
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center space-x-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span>Message</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No deals in your inbox"
            description="Update your investment thesis in your profile to start getting matched with founders"
            actionLabel="Update Thesis"
            actionHref="/profile"
          />
        )}
      </motion.div>

      {/* Watchlist */}
      {watchlist.length > 0 && (
        <motion.div variants={fadeIn}>
          <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
            Watchlist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {watchlist.map((item: any) => (
              <div key={item.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-gold-300 transition-all">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0">
                    <Star className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-navy-900 mb-1">
                      {item.profile?.full_name || 'Anonymous'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.profile?.country || 'Global'}
                    </p>
                    {item.note && (
                      <p className="text-xs text-gray-500 italic">
                        Note: {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

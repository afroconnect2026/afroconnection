'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  Eye,
  Inbox,
  Clock,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Award,
  Users,
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

interface ProfessionalDashboardProps {
  user: any
  profile: any
}

export default function ProfessionalDashboard({ user, profile }: ProfessionalDashboardProps) {
  const [stats, setStats] = useState({
    profileViews: 0,
    inboundRequests: 0,
    responseRate: 0,
    matchingGigs: 0
  })
  const [gigs, setGigs] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [available, setAvailable] = useState(true)
  const [savingAvailability, setSavingAvailability] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setError(null)
      // Get profile views (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { count: viewsCount } = await supabase
        .from('profile_views')
        .select('*', { count: 'exact', head: true })
        .eq('viewed_id', user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      // Get the user's own applications that have not been decided yet.
      // NOTE: these are OUTBOUND applications the professional submitted,
      // so the stat is labelled "Pending Applications", not "Inbound Requests".
      const { count: requestsCount } = await supabase
        .from('opportunity_applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', user.id)
        .in('status', ['submitted', 'viewed', 'shortlisted', 'interviewing'])

      // Load persisted availability flag
      const { data: professionalProfile } = await supabase
        .from('professional_profiles')
        .select('is_available')
        .eq('user_id', user.id)
        .maybeSingle()

      if (professionalProfile && typeof professionalProfile.is_available === 'boolean') {
        setAvailable(professionalProfile.is_available)
      }

      // Get matching gigs
      const { count: gigsCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .in('type', ['job', 'advisor', 'mentorship'])

      // Get top matching gigs
      const { data: gigsData, error: gigsError } = await supabase
        .from('opportunities')
        .select(`
          *,
          creator:profiles!opportunities_creator_id_fkey(id, full_name, avatar_url, country)
        `)
        .eq('status', 'active')
        .in('type', ['job', 'advisor', 'mentorship'])
        .order('created_at', { ascending: false })
        .limit(5)

      // Get applications
      const { data: applicationsData } = await supabase
        .from('opportunity_applications')
        .select(`
          *,
          opportunity:opportunities(*, creator:profiles!opportunities_creator_id_fkey(full_name))
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)

      setStats({
        profileViews: viewsCount || 0,
        inboundRequests: requestsCount || 0,
        responseRate: 95, // TODO: Calculate from messages
        matchingGigs: gigsCount || 0
      })

      if (gigsError) console.error('opportunities query failed:', gigsError)

      setGigs(gigsData || [])
      setApplications(applicationsData || [])
    } catch (err) {
      console.error('Error loading professional dashboard:', err)
      setError('We could not load your dashboard. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAvailability = async () => {
    const next = !available
    setSavingAvailability(true)
    setAvailable(next) // optimistic

    const { error: updateError } = await supabase
      .from('professional_profiles')
      .update({ is_available: next })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update availability:', updateError)
      setAvailable(!next) // roll back
      setError('Could not update your availability. Please try again.')
    }

    setSavingAvailability(false)
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
      name: 'Profile Views (30d)',
      value: stats.profileViews,
      icon: Eye,
      color: 'text-primary-600'
    },
    {
      name: 'Pending Applications',
      value: stats.inboundRequests,
      icon: Inbox,
      color: 'text-gold-600',
      subtitle: 'Awaiting a decision'
    },
    {
      name: 'Response Rate',
      value: `${stats.responseRate}%`,
      icon: Clock,
      color: stats.responseRate >= 90 ? 'text-green-600' : 'text-gold-600',
      subtitle: 'Keep it high!'
    },
    {
      name: 'Matching Gigs',
      value: stats.matchingGigs,
      icon: Briefcase,
      color: 'text-blue-600',
      subtitle: 'Open opportunities'
    }
  ]

  const quickActions = [
    {
      title: 'Browse Matched Gigs',
      description: 'See opportunities matching your expertise',
      href: '/opportunities',
      icon: Briefcase,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Update Rate & Skills',
      description: 'Keep your services current',
      href: '/profile',
      icon: DollarSign,
      color: 'from-gold-500 to-gold-600'
    },
    {
      title: 'Offer Mentorship',
      description: 'Share your expertise with others',
      href: '/opportunities/create',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Get Endorsed',
      description: 'Build your credibility',
      href: '/profile',
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

      {/* Availability Toggle */}
      <motion.div variants={fadeIn} className="mb-8">
        <div className="bg-white rounded-xl p-6 border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {available ? (
              <ToggleRight className="h-8 w-8 text-green-600" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-400" />
            )}
            <div>
              <h3 className="text-lg font-bold text-navy-900">
                {available ? 'Available for Work' : 'Currently Unavailable'}
              </h3>
              <p className="text-sm text-gray-600">
                {available
                  ? 'Clients can see you\'re open to new opportunities'
                  : 'Your profile is hidden from opportunity searches'}
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={savingAvailability}
            className={`px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              available
                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {savingAvailability
              ? 'Saving…'
              : available
                ? 'Mark Unavailable'
                : 'Mark Available'}
          </button>
        </div>
      </motion.div>

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

      {/* Matched Gigs Feed */}
      <motion.div variants={fadeIn} className="mb-8">
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
          Opportunities Matching Your Expertise
        </h2>
        {gigs.length > 0 ? (
          <div className="space-y-4">
            {gigs.map((gig) => (
              <div key={gig.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium uppercase">
                        {gig.type}
                      </span>
                      {gig.remote_ok && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Remote OK
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-1">
                      {gig.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      Posted by {gig.creator?.full_name || 'Anonymous'} • {gig.creator?.country || 'Global'}
                    </p>
                    {gig.description && (
                      <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                        {gig.description}
                      </p>
                    )}
                    {(gig.budget_min || gig.budget_max) && (
                      <p className="text-sm font-medium text-green-600">
                        Budget: ${gig.budget_min || '?'} - ${gig.budget_max || '?'} {gig.currency || 'USD'}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/opportunities?id=${gig.id}`}
                    className="ml-4 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No gigs matching your expertise yet"
            description="Update your skills and expertise in your profile to get matched with relevant opportunities"
            actionLabel="Update Profile"
            actionHref="/profile"
          />
        )}
      </motion.div>

      {/* Applications */}
      {applications.length > 0 && (
        <motion.div variants={fadeIn}>
          <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
            Your Applications
          </h2>
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Opportunity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applied
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applications.map((app: any) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-navy-900">
                      {app.opportunity?.title || 'Untitled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {app.opportunity?.creator?.full_name || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        app.status === 'hired' ? 'bg-green-100 text-green-800' :
                        app.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'viewed' ? 'bg-gold-100 text-gold-800' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

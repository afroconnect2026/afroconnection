'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'
import {
  UserPlus,
  FileText,
  TrendingUp,
  Handshake,
  Briefcase,
  Users,
  Search,
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

interface CompanyDashboardProps {
  user: any
  profile: any
}

export default function CompanyDashboard({ user, profile }: CompanyDashboardProps) {
  const [stats, setStats] = useState({
    newApplicants: 0,
    activePosts: 0,
    conversionRate: 0,
    partnershipInquiries: 0
  })
  const [applicants, setApplicants] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!user?.id) return
    loadDashboardData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadDashboardData = async () => {
    try {
      setError(null)

      // Get new applicants (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      // Get user's opportunities
      const { data: userOpportunities, error: oppsError } = await supabase
        .from('opportunities')
        .select('id')
        .eq('creator_id', user.id)

      if (oppsError) console.error('opportunities query failed:', oppsError)

      const opportunityIds = (userOpportunities || []).map((o: any) => o.id)

      // Applicant queries only make sense when the company has posted something.
      // .in('opportunity_id', []) matches nothing, so short-circuit instead.
      let newApplicantsCount = 0
      let applicantsData: any[] = []

      if (opportunityIds.length > 0) {
        const { count } = await supabase
          .from('opportunity_applications')
          .select('*', { count: 'exact', head: true })
          .in('opportunity_id', opportunityIds)
          .gte('created_at', sevenDaysAgo.toISOString())
        newApplicantsCount = count || 0

        const { data, error: applicantsError } = await supabase
          .from('opportunity_applications')
          .select(`
            *,
            opportunity:opportunities!opportunity_applications_opportunity_id_fkey(title, type),
            applicant:profiles!opportunity_applications_applicant_id_fkey(id, full_name, avatar_url, country)
          `)
          .in('opportunity_id', opportunityIds)
          .order('created_at', { ascending: false })
          .limit(10)

        if (applicantsError) console.error('applicants query failed:', applicantsError)
        applicantsData = data || []
      }

      // Get active posts
      const { count: activePostsCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id)
        .eq('status', 'active')

      // Get partnership inquiries: applications received on the company's
      // partnership posts (NOT a count of the partnership posts themselves).
      const partnershipPostIds = (userOpportunities || []).length > 0
        ? (
            await supabase
              .from('opportunities')
              .select('id')
              .eq('creator_id', user.id)
              .eq('type', 'partnership')
          ).data?.map((o: any) => o.id) || []
        : []

      let partnershipCount = 0
      if (partnershipPostIds.length > 0) {
        const { count } = await supabase
          .from('opportunity_applications')
          .select('*', { count: 'exact', head: true })
          .in('opportunity_id', partnershipPostIds)
        partnershipCount = count || 0
      }

      // Get active posts with stats
      const { data: postsData, error: postsError } = await supabase
        .from('opportunities')
        .select(`
          *,
          applications:opportunity_applications(count)
        `)
        .eq('creator_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)

      if (postsError) console.error('posts query failed:', postsError)

      // Views → applications conversion across the loaded active posts
      const totalViews = (postsData || []).reduce(
        (sum: number, p: any) => sum + (p.views_count || 0),
        0
      )
      const totalApplications = (postsData || []).reduce(
        (sum: number, p: any) => sum + (p.applications?.[0]?.count || 0),
        0
      )
      const conversionRate = totalViews > 0
        ? Math.round((totalApplications / totalViews) * 100)
        : 0

      setStats({
        newApplicants: newApplicantsCount,
        activePosts: activePostsCount || 0,
        conversionRate,
        partnershipInquiries: partnershipCount
      })

      setApplicants(applicantsData)
      setPosts(postsData || [])
    } catch (err) {
      console.error('Error loading company dashboard:', err)
      setError('We could not load your dashboard. Please try again.')
    } finally {
      setLoading(false)
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
      name: 'New Applicants (7d)',
      value: stats.newApplicants,
      icon: UserPlus,
      color: 'text-primary-600',
      subtitle: 'Across all roles'
    },
    {
      name: 'Active Posts',
      value: stats.activePosts,
      icon: FileText,
      color: 'text-gold-600',
      subtitle: 'Open positions'
    },
    {
      name: 'Views → Applications',
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: 'text-blue-600',
      subtitle: 'Conversion rate'
    },
    {
      name: 'Partnership Inquiries',
      value: stats.partnershipInquiries,
      icon: Handshake,
      color: 'text-purple-600',
      subtitle: 'Collaboration requests'
    }
  ]

  const quickActions = [
    {
      title: 'Post a Role',
      description: 'Hire talent from around the world',
      href: '/opportunities/create',
      icon: Briefcase,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Review Applicants',
      description: 'Manage your hiring pipeline',
      href: '/opportunities/my',
      icon: Users,
      color: 'from-gold-500 to-gold-600'
    },
    {
      title: 'Search Talent',
      description: 'Find professionals and specialists',
      href: '/explore?type=professional',
      icon: Search,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Post a Partnership',
      description: 'Find strategic partners',
      href: '/opportunities/create',
      icon: Handshake,
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

      {/* Active Posts */}
      <motion.div variants={fadeIn} className="mb-8">
        <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
          Active Job Posts
        </h2>
        {posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white rounded-xl p-6 border border-gray-200 hover:border-primary-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium uppercase">
                        {post.type}
                      </span>
                      {post.remote_ok && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          Remote
                        </span>
                      )}
                      <span className="text-xs text-gray-500">
                        Posted {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-navy-900 mb-2">
                      {post.title}
                    </h3>
                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4" />
                        <span>{post.applications?.[0]?.count || 0} applicants</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-4 w-4" />
                        <span>{post.views_count || 0} views</span>
                      </div>
                      {post.expires_at && (
                        <span className="text-gold-600 font-medium">
                          Expires {new Date(post.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/applicants?opportunity=${post.id}`}
                    className="ml-4 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors whitespace-nowrap"
                  >
                    View Applicants
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Briefcase}
            title="No active job posts"
            description="Post your first role to start attracting top talent worldwide"
            actionLabel="Post a Role"
            actionHref="/opportunities/create"
          />
        )}
      </motion.div>

      {/* Recent Applicants */}
      {applicants.length > 0 && (
        <motion.div variants={fadeIn}>
          <h2 className="text-2xl font-display font-bold text-navy-900 mb-6">
            Recent Applicants
          </h2>
          <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Candidate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
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
                {applicants.map((applicant: any) => (
                  <tr key={applicant.id} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">
                            {applicant.applicant?.full_name?.charAt(0) || 'A'}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-navy-900">
                            {applicant.applicant?.full_name || 'Anonymous'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {applicant.opportunity?.title || 'Untitled'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {applicant.applicant?.country || 'Global'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        applicant.status === 'hired' ? 'bg-green-100 text-green-800' :
                        applicant.status === 'shortlisted' ? 'bg-blue-100 text-blue-800' :
                        applicant.status === 'interviewing' ? 'bg-purple-100 text-purple-800' :
                        applicant.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {applicant.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(applicant.created_at).toLocaleDateString()}
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

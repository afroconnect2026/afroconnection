'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import EntrepreneurDashboard from '@/components/dashboard/EntrepreneurDashboard'
import InvestorDashboard from '@/components/dashboard/InvestorDashboard'
import ProfessionalDashboard from '@/components/dashboard/ProfessionalDashboard'
import CompanyDashboard from '@/components/dashboard/CompanyDashboard'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Users,
  MessageCircle,
  Briefcase,
  ArrowRight,
  Sparkles,
  Building2,
  Rocket
} from 'lucide-react'
import Link from 'next/link'

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

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    connections: 0,
    messages: 0,
    opportunities: 0,
    networkSize: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Fetch user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Fetch real stats
      const fetchStats = async () => {
        // Get total network size (excluding current user)
        const { count: networkCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .neq('id', user.id)

        // Get opportunities count (if any)
        const { count: opportunitiesCount } = await supabase
          .from('opportunities')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active')

        setStats({
          connections: 0, // No connections feature yet
          messages: 0, // No messages feature yet
          opportunities: opportunitiesCount || 0,
          networkSize: networkCount || 0
        })
      }

      await fetchStats()
      setLoading(false)
    }

    checkAuth()
  }, [router, supabase])

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  const dashboardStats = [
    { name: 'My Connections', value: stats.connections.toString(), icon: Users, color: 'text-primary-600' },
    { name: 'Unread Messages', value: stats.messages.toString(), icon: MessageCircle, color: 'text-blue-600' },
    { name: 'Active Opportunities', value: stats.opportunities.toString(), icon: Briefcase, color: 'text-gold-600' },
    { name: 'Network Members', value: stats.networkSize.toString(), icon: TrendingUp, color: 'text-green-600' },
  ]

  const quickActions = [
    {
      title: 'Explore Network',
      description: 'Discover entrepreneurs, investors, and professionals',
      href: '/explore',
      icon: Users,
      color: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Find Opportunities',
      description: 'Browse jobs, investments, and partnerships',
      href: '/opportunities',
      icon: Briefcase,
      color: 'from-gold-500 to-gold-600'
    },
    {
      title: 'Complete Profile',
      description: 'Add more details to improve your visibility',
      href: '/profile',
      icon: Rocket,
      color: 'from-blue-500 to-blue-600'
    },
  ]

  const getUserTypeLabel = () => {
    if (!profile?.user_type) return 'Member'
    return profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1)
  }

  // Render type-specific dashboard
  const renderDashboardContent = () => {
    switch (profile?.user_type) {
      case 'entrepreneur':
        return <EntrepreneurDashboard user={user} profile={profile} />

      case 'investor':
        return <InvestorDashboard user={user} profile={profile} />

      case 'professional':
        return <ProfessionalDashboard user={user} profile={profile} />

      case 'company':
        return <CompanyDashboard user={user} profile={profile} />

      default:
        return <EntrepreneurDashboard user={user} profile={profile} />
    }
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="mb-8"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Sparkles className="w-5 h-5 text-gold-500" />
            <span className="text-sm text-gray-600">Welcome back!</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-navy-900">
            {profile?.full_name || user?.email || 'Dashboard'}
          </h1>
          <p className="text-gray-600 mt-1">
            {getUserTypeLabel()} • {profile?.country || 'Global'}
          </p>
        </motion.div>

        {/* Type-Specific Dashboard Content */}
        {renderDashboardContent()}
      </div>
    </AuthenticatedLayout>
  )
}

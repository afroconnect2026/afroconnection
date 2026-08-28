'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import {
  Plus,
  Eye,
  Users as UsersIcon,
  Edit,
  Trash2,
  MoreVertical,
  Briefcase,
  TrendingUp,
  Users,
  GraduationCap,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Opportunity {
  id: string
  title: string
  description: string
  opportunity_type: string
  status: string
  created_at: string
  views_count: number
  applications_count: number
  thumbnail_url?: string
}

export default function MyOpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    closed: 0,
    totalViews: 0,
    totalApplications: 0
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadMyOpportunities()
  }, [])

  const loadMyOpportunities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: opps, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('posted_by', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setOpportunities(opps || [])

      // Calculate stats
      const active = opps?.filter(o => o.status === 'active').length || 0
      const closed = opps?.filter(o => o.status === 'closed').length || 0
      const totalViews = opps?.reduce((sum, o) => sum + (o.views_count || 0), 0) || 0
      const totalApplications = opps?.reduce((sum, o) => sum + (o.applications_count || 0), 0) || 0

      setStats({
        total: opps?.length || 0,
        active,
        closed,
        totalViews,
        totalApplications
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading opportunities:', error)
      toast.error('Failed to load opportunities')
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return

    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Opportunity deleted')
      loadMyOpportunities()
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete')
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('opportunities')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      toast.success(`Opportunity ${newStatus}`)
      loadMyOpportunities()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'job': return Briefcase
      case 'investment': return TrendingUp
      case 'partnership': return Users
      case 'mentorship': return GraduationCap
      default: return Briefcase
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return CheckCircle
      case 'closed': return XCircle
      case 'draft': return Clock
      default: return Clock
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'closed': return 'text-red-600 bg-red-100'
      case 'draft': return 'text-gray-600 bg-gray-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredOpportunities = opportunities.filter(opp => {
    if (filter === 'all') return true
    return opp.status === filter
  })

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="h-9 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-80 animate-pulse"></div>
            </div>
            <div className="h-12 bg-gray-200 rounded w-48 animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* List Skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 flex gap-4">
                <div className="w-48 h-32 bg-gray-200 rounded animate-pulse flex-shrink-0"></div>
                <div className="flex-1 space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Opportunities</h1>
            <p className="text-gray-600 mt-1">Manage your posted opportunities</p>
          </div>
          <button
            onClick={() => router.push('/opportunities/create')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>New Opportunity</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <Briefcase className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{stats.active}</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-gray-600 mt-1">{stats.closed}</p>
              </div>
              <XCircle className="h-10 w-10 text-gray-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-primary-600 mt-1">{stats.totalViews}</p>
              </div>
              <Eye className="h-10 w-10 text-primary-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applications</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{stats.totalApplications}</p>
              </div>
              <UsersIcon className="h-10 w-10 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilter('closed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'closed'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Closed ({stats.closed})
            </button>
            <button
              onClick={() => setFilter('draft')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'draft'
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts
            </button>
          </div>
        </div>

        {/* Opportunities List */}
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No opportunities yet' : `No ${filter} opportunities`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' ? 'Post your first opportunity to get started' : 'Create an opportunity to see it here'}
            </p>
            <button
              onClick={() => router.push('/opportunities/create')}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Post Opportunity
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opportunity) => {
              const Icon = getIcon(opportunity.opportunity_type)
              const StatusIcon = getStatusIcon(opportunity.status)

              return (
                <div
                  key={opportunity.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                >
                  <div className="flex items-start">
                    {/* Thumbnail */}
                    {opportunity.thumbnail_url ? (
                      <div className="relative w-48 h-32 flex-shrink-0 bg-gray-100">
                        <img
                          src={opportunity.thumbnail_url}
                          alt={opportunity.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 left-2 p-2 bg-white/90 backdrop-blur-sm rounded-lg">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-16 h-32 flex-shrink-0 flex items-center justify-center">
                        <div className="p-3 bg-gray-100 rounded-lg">
                          <Icon className="h-6 w-6 text-gray-600" />
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between flex-1 p-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {opportunity.title}
                          </h3>
                          <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(opportunity.status)}`}>
                            <StatusIcon className="h-3 w-3" />
                            <span className="capitalize">{opportunity.status}</span>
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {opportunity.description}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Eye className="h-4 w-4" />
                            <span>{opportunity.views_count || 0} views</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UsersIcon className="h-4 w-4" />
                            <span>{opportunity.applications_count || 0} applications</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4 flex-shrink-0">
                      <button
                        onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => router.push(`/opportunities/${opportunity.id}/applications`)}
                        className="flex items-center space-x-1 px-3 py-1 text-sm text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View Applications"
                      >
                        <UsersIcon className="h-4 w-4" />
                        <span>{opportunity.applications_count || 0}</span>
                      </button>
                      <button
                        onClick={() => router.push(`/opportunities/${opportunity.id}/edit`)}
                        className="p-2 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      {opportunity.status === 'active' ? (
                        <button
                          onClick={() => handleStatusChange(opportunity.id, 'closed')}
                          className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Close"
                        >
                          Close
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(opportunity.id, 'active')}
                          className="px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Activate"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(opportunity.id, opportunity.title)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

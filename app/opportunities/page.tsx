'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import {
  Briefcase,
  TrendingUp,
  Users,
  GraduationCap,
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  Plus,
  Filter,
  Search
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Opportunity {
  id: string
  title: string
  description: string
  opportunity_type: string
  location: string
  is_remote: boolean
  country: string
  job_type?: string
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  investment_amount_min?: number
  investment_amount_max?: number
  equity_offered?: number
  funding_stage?: string
  industry: string
  skills_required?: string[]
  experience_level?: string
  created_at: string
  views_count: number
  applications_count: number
  posted_by: string
  thumbnail_url?: string
  poster?: {
    id: string
    full_name: string
    avatar_url?: string
    user_type?: string
  }
  is_saved?: boolean
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)
      loadOpportunities(user.id)
    }
    initUser()
  }, [])

  const loadOpportunities = async (currentUserId: string) => {
    try {
      // Load opportunities
      const { data: opps, error } = await supabase
        .from('opportunities')
        .select(`
          *,
          poster:profiles!opportunities_posted_by_fkey (
            id,
            full_name,
            avatar_url,
            user_type
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Load user's saves
      const { data: saves } = await supabase
        .from('opportunity_saves')
        .select('opportunity_id')
        .eq('user_id', currentUserId)

      const savedIds = new Set(saves?.map(s => s.opportunity_id) || [])

      const opportunitiesWithSaves = opps?.map(opp => ({
        ...opp,
        poster: Array.isArray(opp.poster) ? opp.poster[0] : opp.poster,
        is_saved: savedIds.has(opp.id)
      })) || []

      setOpportunities(opportunitiesWithSaves)
      setLoading(false)
    } catch (error) {
      console.error('Error loading opportunities:', error)
      toast.error('Failed to load opportunities')
      setLoading(false)
    }
  }

  const handleSave = async (opportunityId: string, isSaved: boolean) => {
    if (!userId) return

    try {
      if (isSaved) {
        // Unsave
        await supabase
          .from('opportunity_saves')
          .delete()
          .eq('opportunity_id', opportunityId)
          .eq('user_id', userId)
      } else {
        // Save
        await supabase
          .from('opportunity_saves')
          .insert({
            opportunity_id: opportunityId,
            user_id: userId
          })
      }

      // Update local state
      setOpportunities(prev =>
        prev.map(opp =>
          opp.id === opportunityId ? { ...opp, is_saved: !isSaved } : opp
        )
      )

      toast.success(isSaved ? 'Removed from saved' : 'Saved!')
    } catch (error) {
      console.error('Error saving opportunity:', error)
      toast.error('Failed to save')
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-blue-100 text-blue-700'
      case 'investment': return 'bg-green-100 text-green-700'
      case 'partnership': return 'bg-purple-100 text-purple-700'
      case 'mentorship': return 'bg-gold-100 text-gold-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const filteredOpportunities = opportunities
    .filter(opp => {
      const matchesFilter = filter === 'all' || opp.opportunity_type === filter
      const matchesSearch = searchQuery === '' ||
        opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opp.industry?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesFilter && matchesSearch
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'most_viewed':
          return (b.views_count || 0) - (a.views_count || 0)
        case 'most_applications':
          return (b.applications_count || 0) - (a.applications_count || 0)
        case 'salary_high':
          if (a.opportunity_type === 'job' && b.opportunity_type === 'job') {
            return (b.salary_max || b.salary_min || 0) - (a.salary_max || a.salary_min || 0)
          }
          return 0
        case 'salary_low':
          if (a.opportunity_type === 'job' && b.opportunity_type === 'job') {
            return (a.salary_min || a.salary_max || 0) - (b.salary_min || b.salary_max || 0)
          }
          return 0
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-9 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-96 animate-pulse"></div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex gap-4">
              <div className="h-10 bg-gray-200 rounded flex-1 max-w-md animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse"></div>
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="flex gap-2 mt-4">
                    <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                  </div>
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
            <h1 className="text-3xl font-bold text-gray-900">Opportunities</h1>
            <p className="text-gray-600 mt-1">
              Discover jobs, investments, partnerships, and mentorship
            </p>
          </div>
          <button
            onClick={() => router.push('/opportunities/create')}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Post Opportunity</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search opportunities..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_applications">Most Applications</option>
                <option value="salary_high">Salary: High to Low</option>
                <option value="salary_low">Salary: Low to High</option>
              </select>
            </div>
          </div>

          {/* Type Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto mt-4">
              <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === 'all'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('job')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === 'job'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Jobs
              </button>
              <button
                onClick={() => setFilter('investment')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === 'investment'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Investments
              </button>
              <button
                onClick={() => setFilter('partnership')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === 'partnership'
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Partnerships
              </button>
            </div>
          </div>
        </div>

        {/* Opportunities Grid */}
        {filteredOpportunities.length === 0 ? (
          <div className="text-center py-12">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No opportunities found</h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || filter !== 'all'
                ? 'Try adjusting your filters'
                : 'Be the first to post an opportunity!'}
            </p>
            {filter === 'all' && !searchQuery && (
              <button
                onClick={() => router.push('/opportunities/create')}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Post Opportunity
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOpportunities.map((opportunity) => {
              const Icon = getIcon(opportunity.opportunity_type)
              return (
                <div
                  key={opportunity.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
                >
                  {/* Thumbnail Image */}
                  {opportunity.thumbnail_url && (
                    <div className="relative h-48 bg-gray-100">
                      <img
                        src={opportunity.thumbnail_url}
                        alt={opportunity.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => handleSave(opportunity.id, opportunity.is_saved || false)}
                          className="bg-white/90 backdrop-blur-sm text-gray-700 hover:text-gold-500 p-2 rounded-full transition-colors shadow-lg"
                        >
                          <Bookmark
                            className={`h-5 w-5 ${opportunity.is_saved ? 'fill-gold-500 text-gold-500' : ''}`}
                          />
                        </button>
                      </div>
                      <div className={`absolute top-2 left-2 p-2 rounded-lg ${getTypeColor(opportunity.opportunity_type)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  )}

                  <div className="p-6">
                    {/* Header (only show if no image) */}
                    {!opportunity.thumbnail_url && (
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-2 rounded-lg ${getTypeColor(opportunity.opportunity_type)}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <button
                          onClick={() => handleSave(opportunity.id, opportunity.is_saved || false)}
                          className="text-gray-400 hover:text-gold-500 transition-colors"
                        >
                          <Bookmark
                            className={`h-5 w-5 ${opportunity.is_saved ? 'fill-gold-500 text-gold-500' : ''}`}
                          />
                        </button>
                      </div>
                    )}

                    {/* Title & Description */}
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {opportunity.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {opportunity.description}
                    </p>

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      {opportunity.location && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span className="truncate">
                            {opportunity.location}
                            {opportunity.is_remote && ' (Remote)'}
                          </span>
                        </div>
                      )}

                      {/* Job Salary */}
                      {opportunity.opportunity_type === 'job' && opportunity.salary_min && (
                        <div className="flex items-center text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>
                            {opportunity.salary_currency} {opportunity.salary_min.toLocaleString()}
                            {opportunity.salary_max && ` - ${opportunity.salary_max.toLocaleString()}`}
                          </span>
                        </div>
                      )}

                      {/* Investment Amount */}
                      {opportunity.opportunity_type === 'investment' && opportunity.investment_amount_min && (
                        <div className="flex items-center text-sm text-gray-500">
                          <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                          <span>
                            ${opportunity.investment_amount_min.toLocaleString()}
                            {opportunity.investment_amount_max && ` - $${opportunity.investment_amount_max.toLocaleString()}`}
                            {opportunity.equity_offered && ` (${opportunity.equity_offered}% equity)`}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>

                    {/* Skills */}
                    {opportunity.skills_required && opportunity.skills_required.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {opportunity.skills_required.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {opportunity.skills_required.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{opportunity.skills_required.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center space-x-2 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">
                          {opportunity.poster?.full_name?.charAt(0) || 'U'}
                        </div>
                        <span className="text-sm text-gray-600 truncate">{opportunity.poster?.full_name}</span>
                      </div>
                      <button
                        onClick={() => router.push(`/opportunities/${opportunity.id}`)}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium whitespace-nowrap ml-2"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
    </AuthenticatedLayout>
  )
}

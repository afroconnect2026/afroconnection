'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import {
  ArrowLeft,
  MapPin,
  DollarSign,
  Clock,
  Bookmark,
  Share2,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  ExternalLink,
  Mail,
  Calendar,
  Briefcase,
  TrendingUp,
  Users,
  GraduationCap,
  FileText
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
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
  application_deadline?: string
  application_url?: string
  application_email?: string
  created_at: string
  views_count: number
  applications_count: number
  posted_by: string
  status: string
  thumbnail_url?: string
  // Job-specific fields
  company_name?: string
  benefits?: string[]
  required_experience_years?: number
  education_required?: string
  team_size?: string
  work_schedule?: string
  // Investment-specific fields
  company_description?: string
  business_model?: string
  current_revenue?: number
  revenue_model?: string
  team_members?: number
  use_of_funds?: string
  looking_for?: string
  traction?: string
  // Partnership-specific fields
  partner_type?: string
  what_we_bring?: string
  what_we_need?: string
  commitment_required?: string
  equity_split?: string
  partnership_duration?: string
  // Mentorship-specific fields
  mentorship_areas?: string[]
  session_format?: string
  session_frequency?: string
  session_duration?: string
  mentor_experience_years?: number
  mentorship_goals?: string
  ideal_mentee?: string
  poster?: {
    id: string
    full_name: string
    avatar_url?: string
    user_type?: string
  }
  is_saved?: boolean
  has_applied?: boolean
  is_owner?: boolean
}

export default function OpportunityDetailPage() {
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()
  const opportunityId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUserId(user.id)
      loadOpportunity(user.id)
      incrementViewCount()
    }
    initUser()
  }, [opportunityId])

  const loadOpportunity = async (currentUserId: string) => {
    try {
      const { data: opp, error } = await supabase
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
        .eq('id', opportunityId)
        .single()

      if (error) throw error

      // Check if saved
      const { data: save } = await supabase
        .from('opportunity_saves')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('user_id', currentUserId)
        .single()

      // Check if applied
      const { data: application } = await supabase
        .from('opportunity_applications')
        .select('id')
        .eq('opportunity_id', opportunityId)
        .eq('applicant_id', currentUserId)
        .single()

      setOpportunity({
        ...opp,
        poster: Array.isArray(opp.poster) ? opp.poster[0] : opp.poster,
        is_saved: !!save,
        has_applied: !!application,
        is_owner: opp.posted_by === currentUserId
      })
      setLoading(false)
    } catch (error) {
      console.error('Error loading opportunity:', error)
      toast.error('Opportunity not found')
      router.push('/opportunities')
    }
  }

  const incrementViewCount = async () => {
    try {
      // Get current count and increment
      const { data } = await supabase
        .from('opportunities')
        .select('views_count')
        .eq('id', opportunityId)
        .single()

      if (data) {
        await supabase
          .from('opportunities')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', opportunityId)
      }
    } catch (error) {
      // Silent fail - view count is not critical
      console.error('Error incrementing view count:', error)
    }
  }

  const handleSave = async () => {
    if (!userId || !opportunity) return

    try {
      if (opportunity.is_saved) {
        await supabase
          .from('opportunity_saves')
          .delete()
          .eq('opportunity_id', opportunityId)
          .eq('user_id', userId)

        setOpportunity(prev => prev ? { ...prev, is_saved: false } : null)
        toast.success('Removed from saved')
      } else {
        await supabase
          .from('opportunity_saves')
          .insert({
            opportunity_id: opportunityId,
            user_id: userId
          })

        setOpportunity(prev => prev ? { ...prev, is_saved: true } : null)
        toast.success('Saved!')
      }
    } catch (error) {
      console.error('Error saving:', error)
      toast.error('Failed to save')
    }
  }

  const handleApply = async () => {
    if (!userId || !opportunity) return

    setApplying(true)
    try {
      const { error } = await supabase
        .from('opportunity_applications')
        .insert({
          opportunity_id: opportunityId,
          applicant_id: userId,
          cover_letter: coverLetter.trim() || null
        })

      if (error) {
        if (error.code === '23505') {
          toast.error('You have already applied to this opportunity')
        } else {
          throw error
        }
        return
      }

      // Update applications count
      await supabase
        .from('opportunities')
        .update({ applications_count: (opportunity.applications_count || 0) + 1 })
        .eq('id', opportunityId)

      setOpportunity(prev => prev ? { ...prev, has_applied: true, applications_count: (prev.applications_count || 0) + 1 } : null)
      setShowApplyModal(false)
      setCoverLetter('')
      toast.success('Application submitted successfully!')
    } catch (error: any) {
      console.error('Error applying:', error)
      toast.error(error.message || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this opportunity?')) return

    try {
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', opportunityId)

      if (error) throw error

      toast.success('Opportunity deleted')
      router.push('/opportunities')
    } catch (error) {
      console.error('Error deleting:', error)
      toast.error('Failed to delete')
    }
  }

  const handleShare = () => {
    const url = `${window.location.origin}/opportunities/${opportunityId}`
    navigator.clipboard.writeText(url)
    toast.success('Link copied to clipboard!')
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

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6 animate-pulse"></div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Header Card Skeleton */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="h-64 bg-gray-200 animate-pulse"></div>
                <div className="p-6 space-y-4">
                  <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                  </div>
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div>
              <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!opportunity) {
    return null
  }

  const Icon = getIcon(opportunity.opportunity_type)

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Opportunities
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Thumbnail Image */}
              {opportunity.thumbnail_url && (
                <div className="relative h-64 bg-gray-100">
                  <img
                    src={opportunity.thumbnail_url}
                    alt={opportunity.title}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute top-4 left-4 p-3 rounded-lg ${getTypeColor(opportunity.opportunity_type)} shadow-lg`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  {!opportunity.thumbnail_url && (
                    <div className={`p-3 rounded-lg ${getTypeColor(opportunity.opportunity_type)}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  )}
                  <div className={`flex items-center space-x-2 ${opportunity.thumbnail_url ? 'w-full justify-end' : ''}`}>
                  <button
                    onClick={handleSave}
                    className="p-2 text-gray-400 hover:text-gold-500 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Bookmark
                      className={`h-5 w-5 ${opportunity.is_saved ? 'fill-gold-500 text-gold-500' : ''}`}
                    />
                  </button>
                  <button
                    onClick={handleShare}
                    className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  {opportunity.is_owner && (
                    <>
                      <button
                        onClick={() => router.push(`/opportunities/${opportunityId}/applications`)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <FileText className="h-5 w-5" />
                        <span className="text-sm font-medium">Applications ({opportunity.applications_count || 0})</span>
                      </button>
                      <button
                        onClick={() => router.push(`/opportunities/${opportunityId}/edit`)}
                        className="p-2 text-gray-400 hover:text-primary-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleDelete}
                        className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">{opportunity.title}</h1>

                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                {opportunity.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>
                      {opportunity.location}
                      {opportunity.is_remote && ' (Remote)'}
                    </span>
                  </div>
                )}
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>{formatDistanceToNow(new Date(opportunity.created_at), { addSuffix: true })}</span>
                </div>
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  <span>{opportunity.views_count} views</span>
                </div>
              </div>

              {/* Salary/Investment Amount */}
              {opportunity.opportunity_type === 'job' && opportunity.salary_min && (
                <div className="flex items-center text-lg font-semibold text-gray-900 mb-4">
                  <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                  <span>
                    {opportunity.salary_currency} {opportunity.salary_min.toLocaleString()}
                    {opportunity.salary_max && ` - ${opportunity.salary_max.toLocaleString()}`}
                    <span className="text-sm text-gray-500 ml-2">per year</span>
                  </span>
                </div>
              )}

              {opportunity.opportunity_type === 'investment' && opportunity.investment_amount_min && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-lg font-semibold text-gray-900">
                    <DollarSign className="h-5 w-5 mr-1 text-green-600" />
                    <span>
                      ${opportunity.investment_amount_min.toLocaleString()}
                      {opportunity.investment_amount_max && ` - $${opportunity.investment_amount_max.toLocaleString()}`}
                    </span>
                  </div>
                  {opportunity.equity_offered && (
                    <p className="text-sm text-gray-600 ml-6">
                      {opportunity.equity_offered}% equity offered
                    </p>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getTypeColor(opportunity.opportunity_type)}`}>
                  {opportunity.opportunity_type}
                </span>
                {opportunity.job_type && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 capitalize">
                    {opportunity.job_type.replace('-', ' ')}
                  </span>
                )}
                {opportunity.funding_stage && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 capitalize">
                    {opportunity.funding_stage.replace('-', ' ')}
                  </span>
                )}
                {opportunity.experience_level && (
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700 capitalize">
                    {opportunity.experience_level} Level
                  </span>
                )}
              </div>
            </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 whitespace-pre-wrap">{opportunity.description}</p>
              </div>
            </div>

            {/* Skills Required */}
            {opportunity.skills_required && opportunity.skills_required.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Skills Required</h2>
                <div className="flex flex-wrap gap-2">
                  {opportunity.skills_required.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Type-Specific Details */}
            {opportunity.opportunity_type === 'job' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunity.company_name && (
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-gray-900 font-medium">{opportunity.company_name}</p>
                    </div>
                  )}
                  {opportunity.job_type && (
                    <div>
                      <p className="text-sm text-gray-500">Job Type</p>
                      <p className="text-gray-900 font-medium capitalize">{opportunity.job_type}</p>
                    </div>
                  )}
                  {opportunity.required_experience_years !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Required Experience</p>
                      <p className="text-gray-900 font-medium">{opportunity.required_experience_years} years</p>
                    </div>
                  )}
                  {opportunity.education_required && (
                    <div>
                      <p className="text-sm text-gray-500">Education Required</p>
                      <p className="text-gray-900 font-medium">{opportunity.education_required}</p>
                    </div>
                  )}
                  {opportunity.team_size && (
                    <div>
                      <p className="text-sm text-gray-500">Team Size</p>
                      <p className="text-gray-900 font-medium">{opportunity.team_size}</p>
                    </div>
                  )}
                  {opportunity.work_schedule && (
                    <div>
                      <p className="text-sm text-gray-500">Work Schedule</p>
                      <p className="text-gray-900 font-medium">{opportunity.work_schedule}</p>
                    </div>
                  )}
                </div>
                {opportunity.benefits && opportunity.benefits.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Benefits</p>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.benefits.map((benefit, index) => (
                        <span
                          key={index}
                          className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm"
                        >
                          {benefit}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {opportunity.opportunity_type === 'investment' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Investment Details</h2>
                {opportunity.company_description && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Company Description</p>
                    <p className="text-gray-900">{opportunity.company_description}</p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunity.business_model && (
                    <div>
                      <p className="text-sm text-gray-500">Business Model</p>
                      <p className="text-gray-900 font-medium">{opportunity.business_model}</p>
                    </div>
                  )}
                  {opportunity.revenue_model && (
                    <div>
                      <p className="text-sm text-gray-500">Revenue Model</p>
                      <p className="text-gray-900 font-medium">{opportunity.revenue_model}</p>
                    </div>
                  )}
                  {opportunity.current_revenue !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Current Revenue</p>
                      <p className="text-gray-900 font-medium">${opportunity.current_revenue.toLocaleString()}</p>
                    </div>
                  )}
                  {opportunity.team_members !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Team Size</p>
                      <p className="text-gray-900 font-medium">{opportunity.team_members} members</p>
                    </div>
                  )}
                  {opportunity.funding_stage && (
                    <div>
                      <p className="text-sm text-gray-500">Funding Stage</p>
                      <p className="text-gray-900 font-medium capitalize">{opportunity.funding_stage.replace('_', ' ')}</p>
                    </div>
                  )}
                  {opportunity.looking_for && (
                    <div>
                      <p className="text-sm text-gray-500">Looking For</p>
                      <p className="text-gray-900 font-medium">{opportunity.looking_for}</p>
                    </div>
                  )}
                </div>
                {opportunity.use_of_funds && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Use of Funds</p>
                    <p className="text-gray-900">{opportunity.use_of_funds}</p>
                  </div>
                )}
                {opportunity.traction && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Traction</p>
                    <p className="text-gray-900">{opportunity.traction}</p>
                  </div>
                )}
              </div>
            )}

            {opportunity.opportunity_type === 'partnership' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Partnership Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunity.partner_type && (
                    <div>
                      <p className="text-sm text-gray-500">Partner Type</p>
                      <p className="text-gray-900 font-medium capitalize">{opportunity.partner_type}</p>
                    </div>
                  )}
                  {opportunity.commitment_required && (
                    <div>
                      <p className="text-sm text-gray-500">Commitment Required</p>
                      <p className="text-gray-900 font-medium">{opportunity.commitment_required}</p>
                    </div>
                  )}
                  {opportunity.equity_split && (
                    <div>
                      <p className="text-sm text-gray-500">Equity Split</p>
                      <p className="text-gray-900 font-medium">{opportunity.equity_split}</p>
                    </div>
                  )}
                  {opportunity.partnership_duration && (
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="text-gray-900 font-medium">{opportunity.partnership_duration}</p>
                    </div>
                  )}
                </div>
                {opportunity.what_we_bring && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">What We Bring</p>
                    <p className="text-gray-900">{opportunity.what_we_bring}</p>
                  </div>
                )}
                {opportunity.what_we_need && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">What We Need</p>
                    <p className="text-gray-900">{opportunity.what_we_need}</p>
                  </div>
                )}
              </div>
            )}

            {opportunity.opportunity_type === 'mentorship' && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Mentorship Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {opportunity.session_format && (
                    <div>
                      <p className="text-sm text-gray-500">Session Format</p>
                      <p className="text-gray-900 font-medium capitalize">{opportunity.session_format}</p>
                    </div>
                  )}
                  {opportunity.session_frequency && (
                    <div>
                      <p className="text-sm text-gray-500">Session Frequency</p>
                      <p className="text-gray-900 font-medium capitalize">{opportunity.session_frequency}</p>
                    </div>
                  )}
                  {opportunity.session_duration && (
                    <div>
                      <p className="text-sm text-gray-500">Session Duration</p>
                      <p className="text-gray-900 font-medium">{opportunity.session_duration}</p>
                    </div>
                  )}
                  {opportunity.mentor_experience_years !== undefined && (
                    <div>
                      <p className="text-sm text-gray-500">Mentor Experience</p>
                      <p className="text-gray-900 font-medium">{opportunity.mentor_experience_years} years</p>
                    </div>
                  )}
                </div>
                {opportunity.mentorship_areas && opportunity.mentorship_areas.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Mentorship Areas</p>
                    <div className="flex flex-wrap gap-2">
                      {opportunity.mentorship_areas.map((area, index) => (
                        <span
                          key={index}
                          className="bg-gold-100 text-gold-700 px-3 py-1 rounded-full text-sm"
                        >
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {opportunity.mentorship_goals && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Mentorship Goals</p>
                    <p className="text-gray-900">{opportunity.mentorship_goals}</p>
                  </div>
                )}
                {opportunity.ideal_mentee && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Ideal Mentee</p>
                    <p className="text-gray-900">{opportunity.ideal_mentee}</p>
                  </div>
                )}
              </div>
            )}

            {/* General Additional Details */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunity.industry && (
                  <div>
                    <p className="text-sm text-gray-500">Industry</p>
                    <p className="text-gray-900 font-medium">{opportunity.industry}</p>
                  </div>
                )}
                {opportunity.country && (
                  <div>
                    <p className="text-sm text-gray-500">Country</p>
                    <p className="text-gray-900 font-medium">{opportunity.country}</p>
                  </div>
                )}
                {opportunity.application_deadline && (
                  <div>
                    <p className="text-sm text-gray-500">Application Deadline</p>
                    <p className="text-gray-900 font-medium">
                      {format(new Date(opportunity.application_deadline), 'MMMM d, yyyy')}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Posted</p>
                  <p className="text-gray-900 font-medium">
                    {format(new Date(opportunity.created_at), 'MMMM d, yyyy')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Apply Card */}
            {!opportunity.is_owner && (
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
                {opportunity.has_applied ? (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Already Applied</h3>
                    <p className="text-sm text-gray-600">
                      You've already submitted an application for this opportunity.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                    >
                      Apply Now
                    </button>

                    {opportunity.application_url && (
                      <a
                        href={opportunity.application_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center space-x-2 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Apply Externally</span>
                      </a>
                    )}

                    {opportunity.application_email && (
                      <a
                        href={`mailto:${opportunity.application_email}?subject=Application for ${opportunity.title}`}
                        className="w-full flex items-center justify-center space-x-2 border-2 border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Email Application</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Posted By */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Posted By</h3>
              <div className="flex items-center space-x-3">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600">
                  {opportunity.poster?.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{opportunity.poster?.full_name}</p>
                  {opportunity.poster?.user_type && (
                    <p className="text-sm text-gray-500 capitalize">{opportunity.poster.user_type}</p>
                  )}
                </div>
              </div>
              {!opportunity.is_owner && (
                <button
                  onClick={() => router.push(`/messages?user=${opportunity.posted_by}`)}
                  className="w-full mt-4 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  Send Message
                </button>
              )}
            </div>

            {/* Stats (for owners) */}
            {opportunity.is_owner && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Views</span>
                    <span className="font-semibold text-gray-900">{opportunity.views_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Applications</span>
                    <span className="font-semibold text-gray-900">{opportunity.applications_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`font-semibold capitalize ${opportunity.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                      {opportunity.status}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-lg w-full p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Apply for {opportunity.title}</h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Letter (Optional)
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  rows={6}
                  placeholder="Tell them why you're a great fit..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  disabled={applying}
                  className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {applying ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

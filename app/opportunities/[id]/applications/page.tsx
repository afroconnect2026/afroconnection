'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { ArrowLeft, Mail, Phone, FileText, Calendar, User, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Application {
  id: string
  cover_letter: string
  resume_url?: string
  status: string
  created_at: string
  applicant: {
    id: string
    full_name: string
    email: string
    phone_number?: string
    avatar_url?: string
    user_type?: string
  }
}

interface Opportunity {
  id: string
  title: string
  opportunity_type: string
  status: string
  posted_by: string
}

export default function ApplicationsManagementPage() {
  const [loading, setLoading] = useState(true)
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null)
  const [applications, setApplications] = useState<Application[]>([])
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Load opportunity
      const { data: opp, error: oppError } = await supabase
        .from('opportunities')
        .select('id, title, opportunity_type, status, posted_by')
        .eq('id', params.id)
        .single()

      if (oppError) throw oppError

      // Check ownership
      if (opp.posted_by !== user.id) {
        toast.error('You do not have permission to view these applications')
        router.push('/opportunities')
        return
      }

      setOpportunity(opp)

      // Load applications
      const { data: apps, error: appsError } = await supabase
        .from('opportunity_applications')
        .select(`
          id,
          cover_letter,
          resume_url,
          status,
          created_at,
          applicant:profiles!opportunity_applications_applicant_id_fkey (
            id,
            full_name,
            email,
            phone_number,
            avatar_url,
            user_type
          )
        `)
        .eq('opportunity_id', params.id)
        .order('created_at', { ascending: false })

      if (appsError) throw appsError

      const applicationsWithApplicant = apps?.map(app => ({
        ...app,
        applicant: Array.isArray(app.applicant) ? app.applicant[0] : app.applicant
      })) || []

      setApplications(applicationsWithApplicant)
      setLoading(false)
    } catch (error) {
      console.error('Error loading applications:', error)
      toast.error('Failed to load applications')
      setLoading(false)
    }
  }

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('opportunity_applications')
        .update({ status })
        .eq('id', applicationId)

      if (error) throw error

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.id === applicationId ? { ...app, status } : app
        )
      )

      toast.success(`Application ${status}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-700 border-red-200'
      default:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return CheckCircle
      case 'rejected':
        return XCircle
      default:
        return Clock
    }
  }

  const filteredApplications = applications.filter(app => {
    if (filter === 'all') return true
    return app.status === filter
  })

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    accepted: applications.filter(a => a.status === 'accepted').length,
    rejected: applications.filter(a => a.status === 'rejected').length
  }

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-9 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded w-80 animate-pulse"></div>
          </div>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse"></div>
              </div>
            ))}
          </div>

          {/* Applications Skeleton */}
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 rounded-full bg-gray-200 animate-pulse"></div>
                    <div>
                      <div className="h-6 bg-gray-200 rounded w-40 mb-2 animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded-full w-24 animate-pulse"></div>
                </div>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  if (!opportunity) {
    return (
      <AuthenticatedLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Opportunity not found</p>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push(`/opportunities/${params.id}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Opportunity
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-600 mt-1">{opportunity.title}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-yellow-200 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-700">Pending</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-green-200 bg-green-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700">Accepted</p>
                <p className="text-2xl font-bold text-green-900">{stats.accepted}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6 border border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700">Rejected</p>
                <p className="text-2xl font-bold text-red-900">{stats.rejected}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'pending'
                  ? 'bg-yellow-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pending ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('accepted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'accepted'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Accepted ({stats.accepted})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                filter === 'rejected'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejected ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-500">
              {filter === 'all'
                ? 'Applications will appear here when people apply'
                : `No ${filter} applications`}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application) => {
              const StatusIcon = getStatusIcon(application.status)
              return (
                <div
                  key={application.id}
                  className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-lg font-medium text-primary-700">
                        {application.applicant?.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.applicant?.full_name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Applied {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getStatusColor(application.status)}`}>
                      <StatusIcon className="h-4 w-4" />
                      <span className="text-sm font-medium capitalize">{application.status}</span>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {application.applicant?.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        <a
                          href={`mailto:${application.applicant.email}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {application.applicant.email}
                        </a>
                      </div>
                    )}
                    {application.applicant?.phone_number && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        <a
                          href={`tel:${application.applicant.phone_number}`}
                          className="text-primary-600 hover:text-primary-700"
                        >
                          {application.applicant.phone_number}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Cover Letter</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                      {application.cover_letter}
                    </p>
                  </div>

                  {/* Resume */}
                  {application.resume_url && (
                    <div className="mb-4">
                      <a
                        href={application.resume_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Resume
                      </a>
                    </div>
                  )}

                  {/* Actions */}
                  {application.status === 'pending' && (
                    <div className="flex items-center space-x-3 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'accepted')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(application.id, 'rejected')}
                        className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

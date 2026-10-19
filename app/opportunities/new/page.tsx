'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import { Briefcase, Loader2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const opportunityTypes = [
  { value: 'job', label: 'Job Opening' },
  { value: 'funding', label: 'Funding Opportunity' },
  { value: 'advisor', label: 'Advisor/Board Position' },
  { value: 'partnership', label: 'Partnership' }
]

export default function NewOpportunityPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    type: 'job',
    description: '',
    requirements: '',
    location: '',
    compensation: '',
    deadline: ''
  })

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      setUser(user)
      setLoading(false)
    }
    checkAuth()
  }, [router, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.title || !formData.description) {
      toast.error('Title and description are required')
      return
    }

    setSubmitting(true)
    try {
      // Create opportunity with PENDING status (pre-approval)
      const { error } = await supabase
        .from('opportunities')
        .insert({
          creator_id: user.id,
          title: formData.title,
          type: formData.type,
          description: formData.description,
          requirements: formData.requirements || null,
          location: formData.location || null,
          compensation: formData.compensation || null,
          deadline: formData.deadline || null,
          status: 'active',
          moderation_status: 'pending' // PRE-APPROVAL: Requires admin approval
        })

      if (error) throw error

      toast.success('Opportunity submitted! Awaiting admin approval.')
      router.push('/opportunities')
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to create opportunity')
    } finally {
      setSubmitting(false)
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy-900">Post an Opportunity</h1>
                <p className="text-gray-600">Share a job, funding, or partnership opportunity</p>
              </div>
            </div>

            {/* Pre-approval Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Your post will be reviewed before publishing</p>
                  <p className="text-blue-800">All opportunities are reviewed by our team to ensure quality. You'll be notified once approved (typically within 24 hours).</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Opportunity Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Senior Software Engineer, Series A Funding, Strategic Partnership"
                required
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              >
                {opportunityTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={8}
                placeholder="Describe the opportunity in detail. What are you offering? What makes this opportunity exciting?"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Be specific and detailed to attract the right candidates/partners</p>
            </div>

            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requirements
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                rows={5}
                placeholder="Skills, experience, qualifications, or criteria needed..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., Remote, Nairobi, Kenya, Pan-African"
              />
            </div>

            {/* Compensation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compensation / Budget
              </label>
              <input
                type="text"
                value={formData.compensation}
                onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., $80,000 - $120,000/year, $2M Series A"
              />
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4 border-t">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit for Review</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

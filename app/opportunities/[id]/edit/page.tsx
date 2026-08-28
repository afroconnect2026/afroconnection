'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { ArrowLeft, Briefcase, TrendingUp, Users, GraduationCap, Upload, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EditOpportunityPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [opportunityType, setOpportunityType] = useState<string>('job')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [currentThumbnail, setCurrentThumbnail] = useState<string>('')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    is_remote: false,
    country: '',
    industry: '',
    skills_required: '',
    experience_level: '',
    job_type: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    investment_amount_min: '',
    investment_amount_max: '',
    equity_offered: '',
    funding_stage: '',
    application_email: '',
    application_url: '',
    application_deadline: '',
    status: 'active'
  })

  const router = useRouter()
  const params = useParams()
  const opportunityId = params.id as string
  const supabase = createClient()

  useEffect(() => {
    loadOpportunity()
  }, [opportunityId])

  const loadOpportunity = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: opp, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', opportunityId)
        .single()

      if (error) throw error

      // Check ownership
      if (opp.posted_by !== user.id) {
        toast.error('You can only edit your own opportunities')
        router.push(`/opportunities/${opportunityId}`)
        return
      }

      setOpportunityType(opp.opportunity_type)
      setCurrentThumbnail(opp.thumbnail_url || '')
      setFormData({
        title: opp.title || '',
        description: opp.description || '',
        location: opp.location || '',
        is_remote: opp.is_remote || false,
        country: opp.country || '',
        industry: opp.industry || '',
        skills_required: opp.skills_required?.join(', ') || '',
        experience_level: opp.experience_level || '',
        job_type: opp.job_type || '',
        salary_min: opp.salary_min?.toString() || '',
        salary_max: opp.salary_max?.toString() || '',
        salary_currency: opp.salary_currency || 'USD',
        investment_amount_min: opp.investment_amount_min?.toString() || '',
        investment_amount_max: opp.investment_amount_max?.toString() || '',
        equity_offered: opp.equity_offered?.toString() || '',
        funding_stage: opp.funding_stage || '',
        application_email: opp.application_email || '',
        application_url: opp.application_url || '',
        application_deadline: opp.application_deadline ? opp.application_deadline.split('T')[0] : '',
        status: opp.status || 'active'
      })

      setLoading(false)
    } catch (error) {
      console.error('Error loading opportunity:', error)
      toast.error('Failed to load opportunity')
      router.push('/opportunities')
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const skillsArray = formData.skills_required
        ? formData.skills_required.split(',').map(s => s.trim()).filter(s => s)
        : []

      const opportunityData: any = {
        title: formData.title,
        description: formData.description,
        opportunity_type: opportunityType,
        location: formData.location || null,
        is_remote: formData.is_remote,
        country: formData.country || null,
        industry: formData.industry || null,
        skills_required: skillsArray.length > 0 ? skillsArray : null,
        experience_level: formData.experience_level || null,
        application_email: formData.application_email || null,
        application_url: formData.application_url || null,
        application_deadline: formData.application_deadline || null,
        status: formData.status
      }

      if (opportunityType === 'job') {
        opportunityData.job_type = formData.job_type || null
        opportunityData.salary_min = formData.salary_min ? parseInt(formData.salary_min) : null
        opportunityData.salary_max = formData.salary_max ? parseInt(formData.salary_max) : null
        opportunityData.salary_currency = formData.salary_currency
      } else if (opportunityType === 'investment') {
        opportunityData.investment_amount_min = formData.investment_amount_min ? parseInt(formData.investment_amount_min) : null
        opportunityData.investment_amount_max = formData.investment_amount_max ? parseInt(formData.investment_amount_max) : null
        opportunityData.equity_offered = formData.equity_offered ? parseFloat(formData.equity_offered) : null
        opportunityData.funding_stage = formData.funding_stage || null
      }

      // Upload new image if selected
      if (imageFile) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const fileExt = imageFile.name.split('.').pop()
          const fileName = `${Date.now()}.${fileExt}`
          const filePath = `${user.id}/${fileName}`

          const { error: uploadError } = await supabase.storage
            .from('opportunity-images')
            .upload(filePath, imageFile)

          if (uploadError) throw uploadError

          const { data: { publicUrl } } = supabase.storage
            .from('opportunity-images')
            .getPublicUrl(filePath)

          opportunityData.thumbnail_url = publicUrl
        }
      }

      const { error } = await supabase
        .from('opportunities')
        .update(opportunityData)
        .eq('id', opportunityId)

      if (error) throw error

      toast.success('Opportunity updated successfully!')
      router.push(`/opportunities/${opportunityId}`)
    } catch (error: any) {
      console.error('Error updating opportunity:', error)
      toast.error(error.message || 'Failed to update opportunity')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
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
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Opportunity</h1>
          <p className="text-gray-600 mt-1">Update your opportunity details</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Thumbnail Image */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thumbnail Image (Optional)</h2>
            <div className="space-y-4">
              {(imagePreview || currentThumbnail) && (
                <div className="relative inline-block">
                  <img
                    src={imagePreview || currentThumbnail}
                    alt="Preview"
                    className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-gray-200"
                  />
                  {imagePreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
              <div>
                <label className="flex items-center justify-center w-full max-w-md h-32 px-4 transition bg-white border-2 border-gray-300 border-dashed rounded-lg appearance-none cursor-pointer hover:border-gray-400 focus:outline-none">
                  <span className="flex items-center space-x-2">
                    <Upload className="w-6 h-6 text-gray-600" />
                    <span className="font-medium text-gray-600">
                      {imagePreview || currentThumbnail ? 'Change image' : 'Click to upload image'}
                    </span>
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="mt-2 text-sm text-gray-500">PNG, JPG up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Opportunity Type */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Opportunity Type</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { value: 'job', label: 'Job', icon: Briefcase, color: 'blue' },
                { value: 'investment', label: 'Investment', icon: TrendingUp, color: 'green' },
                { value: 'partnership', label: 'Partnership', icon: Users, color: 'purple' },
                { value: 'mentorship', label: 'Mentorship', icon: GraduationCap, color: 'gold' }
              ].map((type) => {
                const Icon = type.icon
                const isSelected = opportunityType === type.value
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setOpportunityType(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? `border-${type.color}-600 bg-${type.color}-50`
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? `text-${type.color}-600` : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? `text-${type.color}-700` : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                  <input
                    type="text"
                    name="industry"
                    value={formData.industry}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select level</option>
                    <option value="entry">Entry Level</option>
                    <option value="mid">Mid Level</option>
                    <option value="senior">Senior Level</option>
                    <option value="executive">Executive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills Required</label>
                <input
                  type="text"
                  name="skills_required"
                  value={formData.skills_required}
                  onChange={handleChange}
                  placeholder="e.g., React, Node.js, TypeScript (comma separated)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="closed">Closed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_remote"
                  checked={formData.is_remote}
                  onChange={handleChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  This is a remote opportunity
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City/Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Job-specific fields */}
          {opportunityType === 'job' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select type</option>
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                    <input
                      type="number"
                      name="salary_min"
                      value={formData.salary_min}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary</label>
                    <input
                      type="number"
                      name="salary_max"
                      value={formData.salary_max}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                    <select
                      name="salary_currency"
                      value={formData.salary_currency}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="KES">KES</option>
                      <option value="NGN">NGN</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Investment-specific fields */}
          {opportunityType === 'investment' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Details</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Min Investment</label>
                    <input
                      type="number"
                      name="investment_amount_min"
                      value={formData.investment_amount_min}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Investment</label>
                    <input
                      type="number"
                      name="investment_amount_max"
                      value={formData.investment_amount_max}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Equity Offered (%)</label>
                    <input
                      type="number"
                      name="equity_offered"
                      value={formData.equity_offered}
                      onChange={handleChange}
                      step="0.1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Funding Stage</label>
                    <select
                      name="funding_stage"
                      value={formData.funding_stage}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select stage</option>
                      <option value="pre-seed">Pre-seed</option>
                      <option value="seed">Seed</option>
                      <option value="series-a">Series A</option>
                      <option value="series-b">Series B</option>
                      <option value="series-c">Series C+</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Application Details */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Email</label>
                  <input
                    type="email"
                    name="application_email"
                    value={formData.application_email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application URL</label>
                  <input
                    type="url"
                    name="application_url"
                    value={formData.application_url}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                <input
                  type="date"
                  name="application_deadline"
                  value={formData.application_deadline}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  )
}

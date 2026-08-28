'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { ArrowLeft, Briefcase, TrendingUp, Users, GraduationCap } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CreateOpportunityPage() {
  const [loading, setLoading] = useState(false)
  const [opportunityType, setOpportunityType] = useState<string>('job')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [formData, setFormData] = useState({
    // Common
    title: '',
    description: '',
    location: '',
    is_remote: false,
    country: '',
    industry: '',
    skills_required: '',
    application_email: '',
    application_url: '',
    application_deadline: '',

    // Job
    company_name: '',
    job_type: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'USD',
    benefits: '',
    required_experience_years: '',
    education_required: '',
    team_size: '',
    work_schedule: '',

    // Investment
    company_description: '',
    business_model: '',
    current_revenue: '',
    revenue_model: '',
    team_members: '',
    use_of_funds: '',
    looking_for: '',
    traction: '',
    investment_amount_min: '',
    investment_amount_max: '',
    equity_offered: '',
    funding_stage: '',

    // Partnership
    partner_type: '',
    what_we_bring: '',
    what_we_need: '',
    commitment_required: '',
    equity_split: '',
    partnership_duration: '',

    // Mentorship
    mentorship_areas: '',
    session_format: '',
    session_frequency: '',
    session_duration: '',
    mentor_experience_years: '',
    mentorship_goals: '',
    ideal_mentee: ''
  })

  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const skillsArray = formData.skills_required
        ? formData.skills_required.split(',').map(s => s.trim()).filter(s => s)
        : []
      const benefitsArray = formData.benefits
        ? formData.benefits.split(',').map(s => s.trim()).filter(s => s)
        : []
      const mentorshipAreasArray = formData.mentorship_areas
        ? formData.mentorship_areas.split(',').map(s => s.trim()).filter(s => s)
        : []

      // Upload image if selected
      let thumbnailUrl = null
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('opportunity-images')
          .upload(filePath, imageFile)

        if (uploadError) {
          console.error('Image upload error:', uploadError)
          toast.error('Failed to upload image')
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('opportunity-images')
            .getPublicUrl(filePath)
          thumbnailUrl = publicUrl
        }
      }

      const opportunityData: any = {
        posted_by: user.id,
        title: formData.title,
        description: formData.description,
        opportunity_type: opportunityType,
        location: formData.location || null,
        is_remote: formData.is_remote,
        country: formData.country || null,
        industry: formData.industry || null,
        skills_required: skillsArray.length > 0 ? skillsArray : null,
        application_email: formData.application_email || null,
        application_url: formData.application_url || null,
        application_deadline: formData.application_deadline || null,
        thumbnail_url: thumbnailUrl,
        status: 'active'
      }

      if (opportunityType === 'job') {
        opportunityData.company_name = formData.company_name || null
        opportunityData.job_type = formData.job_type || null
        opportunityData.salary_min = formData.salary_min ? parseInt(formData.salary_min) : null
        opportunityData.salary_max = formData.salary_max ? parseInt(formData.salary_max) : null
        opportunityData.salary_currency = formData.salary_currency
        opportunityData.benefits = benefitsArray.length > 0 ? benefitsArray : null
        opportunityData.required_experience_years = formData.required_experience_years ? parseInt(formData.required_experience_years) : null
        opportunityData.education_required = formData.education_required || null
        opportunityData.team_size = formData.team_size || null
        opportunityData.work_schedule = formData.work_schedule || null
      } else if (opportunityType === 'investment') {
        opportunityData.company_name = formData.company_name || null
        opportunityData.company_description = formData.company_description || null
        opportunityData.business_model = formData.business_model || null
        opportunityData.current_revenue = formData.current_revenue ? parseInt(formData.current_revenue) : null
        opportunityData.revenue_model = formData.revenue_model || null
        opportunityData.team_members = formData.team_members ? parseInt(formData.team_members) : null
        opportunityData.use_of_funds = formData.use_of_funds || null
        opportunityData.looking_for = formData.looking_for || null
        opportunityData.traction = formData.traction || null
        opportunityData.investment_amount_min = formData.investment_amount_min ? parseInt(formData.investment_amount_min) : null
        opportunityData.investment_amount_max = formData.investment_amount_max ? parseInt(formData.investment_amount_max) : null
        opportunityData.equity_offered = formData.equity_offered ? parseFloat(formData.equity_offered) : null
        opportunityData.funding_stage = formData.funding_stage || null
      } else if (opportunityType === 'partnership') {
        opportunityData.partner_type = formData.partner_type || null
        opportunityData.what_we_bring = formData.what_we_bring || null
        opportunityData.what_we_need = formData.what_we_need || null
        opportunityData.commitment_required = formData.commitment_required || null
        opportunityData.equity_split = formData.equity_split || null
        opportunityData.partnership_duration = formData.partnership_duration || null
      } else if (opportunityType === 'mentorship') {
        opportunityData.mentorship_areas = mentorshipAreasArray.length > 0 ? mentorshipAreasArray : null
        opportunityData.session_format = formData.session_format || null
        opportunityData.session_frequency = formData.session_frequency || null
        opportunityData.session_duration = formData.session_duration || null
        opportunityData.mentor_experience_years = formData.mentor_experience_years ? parseInt(formData.mentor_experience_years) : null
        opportunityData.mentorship_goals = formData.mentorship_goals || null
        opportunityData.ideal_mentee = formData.ideal_mentee || null
      }

      const { data, error } = await supabase
        .from('opportunities')
        .insert(opportunityData)
        .select()
        .single()

      if (error) throw error

      toast.success('Opportunity posted successfully!')
      router.push(`/opportunities/${data.id}`)
    } catch (error: any) {
      console.error('Error creating opportunity:', error)
      toast.error(error.message || 'Failed to create opportunity')
    } finally {
      setLoading(false)
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setImageFile(null)
    setImagePreview('')
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
          <h1 className="text-3xl font-bold text-gray-900">Post an Opportunity</h1>
          <p className="text-gray-600 mt-1">Share a job, investment, partnership, or mentorship opportunity</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Opportunity Type Selector */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Type</h2>
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
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? 'text-primary-600' : 'text-gray-400'}`} />
                    <p className={`text-sm font-medium ${isSelected ? 'text-primary-700' : 'text-gray-700'}`}>
                      {type.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thumbnail Image (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">Add an image to make your opportunity stand out</p>

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-primary-600 font-medium">Click to upload image</span>
                  <span className="text-sm text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</span>
                </label>
              </div>
            )}
          </div>

          {/* JOB FORM */}
          {opportunityType === 'job' && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Acme Corp"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Senior Software Engineer"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Describe the role, responsibilities, and what makes this opportunity exciting..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Job Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="job_type"
                        value={formData.job_type}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select type</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="contract">Contract</option>
                        <option value="internship">Internship</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Experience <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="required_experience_years"
                        value={formData.required_experience_years}
                        onChange={handleChange}
                        required
                        placeholder="Years"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary</label>
                      <input
                        type="number"
                        name="salary_min"
                        value={formData.salary_min}
                        onChange={handleChange}
                        placeholder="50000"
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
                        placeholder="80000"
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                    <input
                      type="text"
                      name="benefits"
                      value={formData.benefits}
                      onChange={handleChange}
                      placeholder="e.g., Health Insurance, Equity, Remote Work, Vacation (comma separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate benefits with commas</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Education Required</label>
                      <select
                        name="education_required"
                        value={formData.education_required}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select</option>
                        <option value="high-school">High School</option>
                        <option value="bachelors">Bachelor's Degree</option>
                        <option value="masters">Master's Degree</option>
                        <option value="phd">PhD</option>
                        <option value="none">No Formal Education Required</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                      <input
                        type="text"
                        name="team_size"
                        value={formData.team_size}
                        onChange={handleChange}
                        placeholder="e.g., 5-10 people"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Schedule</label>
                      <select
                        name="work_schedule"
                        value={formData.work_schedule}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select</option>
                        <option value="9-5">9-5 (Standard)</option>
                        <option value="flexible">Flexible Hours</option>
                        <option value="shifts">Shift Work</option>
                        <option value="async">Async (Remote)</option>
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
                      placeholder="e.g., React, Node.js, TypeScript, AWS (comma separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g., Technology, Finance, Healthcare"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* INVESTMENT FORM */}
          {opportunityType === 'investment' && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Investment Opportunity</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="company_name"
                        value={formData.company_name}
                        onChange={handleChange}
                        required
                        placeholder="Your company name"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Opportunity Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        required
                        placeholder="e.g., Seed Round for AI SaaS Platform"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="company_description"
                      value={formData.company_description}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="Brief overview of your company..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What You're Building <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Describe what you're building, the problem you're solving, and your vision..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Business Model <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="business_model"
                        value={formData.business_model}
                        onChange={handleChange}
                        required
                        placeholder="e.g., SaaS Subscription"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Industry <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        required
                        placeholder="e.g., FinTech, HealthTech"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Revenue</label>
                      <input
                        type="number"
                        name="current_revenue"
                        value={formData.current_revenue}
                        onChange={handleChange}
                        placeholder="Annual revenue (if any)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Revenue Model</label>
                      <input
                        type="text"
                        name="revenue_model"
                        value={formData.revenue_model}
                        onChange={handleChange}
                        placeholder="e.g., Monthly subscriptions"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Size</label>
                    <input
                      type="number"
                      name="team_members"
                      value={formData.team_members}
                      onChange={handleChange}
                      placeholder="Number of team members"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Funding Stage <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="funding_stage"
                        value={formData.funding_stage}
                        onChange={handleChange}
                        required
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

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Equity Offered (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="equity_offered"
                        value={formData.equity_offered}
                        onChange={handleChange}
                        required
                        step="0.1"
                        placeholder="e.g., 10"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Investment Seeking (Min)</label>
                      <input
                        type="number"
                        name="investment_amount_min"
                        value={formData.investment_amount_min}
                        onChange={handleChange}
                        placeholder="50000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Investment Seeking (Max)</label>
                      <input
                        type="number"
                        name="investment_amount_max"
                        value={formData.investment_amount_max}
                        onChange={handleChange}
                        placeholder="200000"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Use of Funds <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="use_of_funds"
                      value={formData.use_of_funds}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="What will you use the investment for? (e.g., Product development, Marketing, Hiring)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Traction</label>
                    <textarea
                      name="traction"
                      value={formData.traction}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Share your metrics: users, revenue, growth rate, key milestones..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">What Kind of Investor Are You Looking For?</label>
                    <input
                      type="text"
                      name="looking_for"
                      value={formData.looking_for}
                      onChange={handleChange}
                      placeholder="e.g., Strategic investor with industry experience"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* PARTNERSHIP FORM */}
          {opportunityType === 'partnership' && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Partnership Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partnership Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Looking for Technical Co-founder"
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
                      placeholder="Describe the partnership opportunity, what you're building together..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Partner Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="partner_type"
                      value={formData.partner_type}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">Select type</option>
                      <option value="co-founder">Co-founder</option>
                      <option value="business-partner">Business Partner</option>
                      <option value="strategic-partner">Strategic Partner</option>
                      <option value="technical-partner">Technical Partner</option>
                      <option value="marketing-partner">Marketing Partner</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What We Bring to the Table <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="what_we_bring"
                      value={formData.what_we_bring}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="What do you bring? (e.g., Idea, Initial funding, Industry connections, MVP)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      What We Need from Partner <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="what_we_need"
                      value={formData.what_we_need}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="What are you looking for? (e.g., Technical expertise, Sales experience, Capital)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      name="industry"
                      value={formData.industry}
                      onChange={handleChange}
                      placeholder="e.g., E-commerce, HealthTech"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Skills Required</label>
                    <input
                      type="text"
                      name="skills_required"
                      value={formData.skills_required}
                      onChange={handleChange}
                      placeholder="e.g., Full-stack development, Marketing, Sales (comma separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Commitment Required <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="commitment_required"
                        value={formData.commitment_required}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select commitment</option>
                        <option value="full-time">Full-time</option>
                        <option value="part-time">Part-time</option>
                        <option value="project-based">Project-based</option>
                        <option value="flexible">Flexible</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Equity Split</label>
                      <input
                        type="text"
                        name="equity_split"
                        value={formData.equity_split}
                        onChange={handleChange}
                        placeholder="e.g., 50/50, To be discussed"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Partnership Duration</label>
                    <input
                      type="text"
                      name="partnership_duration"
                      value={formData.partnership_duration}
                      onChange={handleChange}
                      placeholder="e.g., Long-term, 6 months, Project duration"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* MENTORSHIP FORM */}
          {opportunityType === 'mentorship' && (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Mentorship Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentorship Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Marketing Mentor for Early-stage Startups"
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
                      placeholder="Describe your mentorship approach, experience, and what mentees will learn..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentorship Areas <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="mentorship_areas"
                      value={formData.mentorship_areas}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Marketing, Fundraising, Product Development (comma separated)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Separate areas with commas</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Format <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="session_format"
                        value={formData.session_format}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select format</option>
                        <option value="1-on-1">1-on-1</option>
                        <option value="group">Group</option>
                        <option value="online">Online</option>
                        <option value="in-person">In-person</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Session Frequency <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="session_frequency"
                        value={formData.session_frequency}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select frequency</option>
                        <option value="weekly">Weekly</option>
                        <option value="bi-weekly">Bi-weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="on-demand">On-demand</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Session Duration</label>
                      <select
                        name="session_duration"
                        value={formData.session_duration}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      >
                        <option value="">Select duration</option>
                        <option value="30min">30 minutes</option>
                        <option value="1hr">1 hour</option>
                        <option value="1.5hr">1.5 hours</option>
                        <option value="2hr">2 hours</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Experience (Years) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="mentor_experience_years"
                        value={formData.mentor_experience_years}
                        onChange={handleChange}
                        required
                        placeholder="Years of experience"
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mentorship Goals <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="mentorship_goals"
                      value={formData.mentorship_goals}
                      onChange={handleChange}
                      required
                      rows={3}
                      placeholder="What will mentees achieve? (e.g., Launch their first product, Raise funding, Build a marketing strategy)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ideal Mentee</label>
                    <textarea
                      name="ideal_mentee"
                      value={formData.ideal_mentee}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Describe your ideal mentee (e.g., Early-stage founders, Career switchers, etc.)"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Location (Common for all) */}
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
                    placeholder="e.g., Nairobi, Lagos"
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
                    placeholder="e.g., Kenya, Nigeria"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Application Details (Common for all) */}
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
                    placeholder="contact@company.com"
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
                    placeholder="https://company.com/apply"
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
              disabled={loading}
              className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Posting...' : 'Post Opportunity'}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  )
}

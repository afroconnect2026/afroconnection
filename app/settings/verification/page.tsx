'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Linkedin,
  FileText,
  Globe,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Paperclip,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  ALLOWED_DOC_TYPES,
  MAX_DOC_SIZE,
  VERIFICATION_BUCKET,
  VerificationDocument
} from '@/lib/verification'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function VerificationPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [verificationRequest, setVerificationRequest] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState<VerificationDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Form state
  const [formData, setFormData] = useState({
    linkedin_url: '',
    company_registration_number: '',
    website_url: '',
    additional_notes: ''
  })

  const router = useRouter()
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

      setUser(user)

      // Get profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setProfile(profileData)

      // Check if user already has a verification request
      const { data: requestData } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (requestData) {
        setVerificationRequest(requestData)
        setDocuments(Array.isArray(requestData.documents) ? requestData.documents : [])
        setFormData({
          linkedin_url: requestData.linkedin_url || '',
          company_registration_number: requestData.company_registration || '',
          website_url: requestData.website_url || '',
          additional_notes: requestData.notes || ''
        })
      } else {
        // Pre-fill with existing profile data
        setFormData({
          linkedin_url: profileData?.linkedin_url || '',
          company_registration_number: '',
          website_url: profileData?.website_url || '',
          additional_notes: ''
        })
      }
    } catch (error: any) {
      console.error('Error loading verification data:', error)
      toast.error('Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !user) return
    setUploading(true)
    const added: VerificationDocument[] = []
    try {
      for (const file of Array.from(files)) {
        if (!ALLOWED_DOC_TYPES.includes(file.type)) {
          toast.error(`${file.name}: only PDF, JPG, PNG or WEBP files are accepted`)
          continue
        }
        if (file.size > MAX_DOC_SIZE) {
          toast.error(`${file.name}: file is larger than 10 MB`)
          continue
        }
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80)
        const path = `${user.id}/${Date.now()}-${safeName}`
        const { error } = await supabase.storage.from(VERIFICATION_BUCKET).upload(path, file, {
          contentType: file.type,
          upsert: false,
        })
        if (error) {
          const msg = /bucket not found/i.test(error.message)
            ? 'Document uploads are not enabled yet. Please contact support or use the fields below.'
            : `${file.name}: ${error.message}`
          toast.error(msg)
          if (/bucket not found/i.test(error.message)) break
          continue
        }
        added.push({ path, name: file.name, type: file.type, size: file.size, uploaded_at: new Date().toISOString() })
      }
      if (added.length) {
        setDocuments((prev) => [...prev, ...added])
        toast.success(`${added.length} document${added.length > 1 ? 's' : ''} attached - remember to submit`)
      }
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const removeDocument = async (doc: VerificationDocument) => {
    setDocuments((prev) => prev.filter((d) => d.path !== doc.path))
    // Best effort: remove the file only if it was never part of a submitted request
    const submitted = Array.isArray(verificationRequest?.documents)
      ? verificationRequest.documents.some((d: any) => d.path === doc.path)
      : false
    if (!submitted) {
      await supabase.storage.from(VERIFICATION_BUCKET).remove([doc.path])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.linkedin_url && !formData.company_registration_number && !formData.website_url && documents.length === 0) {
      toast.error('Please provide at least one verification document')
      return
    }

    setSubmitting(true)
    try {
      // Create or update verification request (server-side function handles
      // insert vs. resubmission and notifies the moderation team)
      const base = {
        p_linkedin_url: formData.linkedin_url || null,
        p_company_registration: formData.company_registration_number || null,
        p_website_url: formData.website_url || null,
        p_notes: formData.additional_notes || null
      }
      let { error } = await supabase.rpc('submit_verification_request', { ...base, p_documents: documents })

      // Older database without document support: retry without documents
      if (error?.code === 'PGRST202' && documents.length === 0) {
        ;({ error } = await supabase.rpc('submit_verification_request', base))
      }

      if (error) {
        if (error.code === 'PGRST202') {
          throw new Error('Verification is temporarily unavailable. Please try again later.')
        }
        throw error
      }

      const wasResubmission = verificationRequest && verificationRequest.status !== 'pending'
      toast.success(
        verificationRequest?.status === 'pending'
          ? 'Verification request updated'
          : wasResubmission
          ? 'Resubmitted! Our team has been notified and will review it again.'
          : 'Verification request submitted! Our team has been notified.'
      )
      await loadData() // Reload to show updated status
    } catch (error: any) {
      console.error('Submit error:', error)
      toast.error(error.message || 'Failed to submit verification request')
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

  // User is already verified
  if (profile?.is_verified) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl p-8 border-2 border-green-200"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-center text-navy-900 mb-2">
              You're Verified! 🎉
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Your account has been verified by our team. Your verified badge is now visible on your profile.
            </p>
            <div className="flex items-center justify-center space-x-2 bg-white px-6 py-3 rounded-lg border border-green-200 w-fit mx-auto">
              <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100" />
              <span className="font-semibold text-navy-900">Verified Account</span>
            </div>
          </motion.div>
        </div>
      </AuthenticatedLayout>
    )
  }

  // Show status if request exists
  const getStatusBadge = () => {
    // An old approved request whose badge was later removed: treat as a fresh start
    if (!verificationRequest || verificationRequest.status === 'approved') return null

    const statusConfig: any = {
      pending: {
        icon: Clock,
        text: 'Pending Review',
        color: 'bg-yellow-100 text-yellow-800 border-yellow-300'
      },
      approved: {
        icon: CheckCircle,
        text: 'Approved',
        color: 'bg-green-100 text-green-800 border-green-300'
      },
      rejected: {
        icon: XCircle,
        text: 'Rejected',
        color: 'bg-red-100 text-red-800 border-red-300'
      },
      info_needed: {
        icon: AlertCircle,
        text: 'More Information Needed',
        color: 'bg-blue-100 text-blue-800 border-blue-300'
      }
    }

    const config = statusConfig[verificationRequest.status] || statusConfig.pending
    const Icon = config.icon

    return (
      <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border-2 ${config.color} font-semibold`}>
        <Icon className="w-5 h-5" />
        <span>{config.text}</span>
      </div>
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
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-navy-900">Get Verified</h1>
                <p className="text-gray-600">Earn a verified badge to build trust</p>
              </div>
            </div>

            {/* Current Status */}
            {verificationRequest && (
              <div className="mb-6">
                {getStatusBadge()}
                {verificationRequest.status === 'rejected' && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-900">Rejection Reason:</p>
                        <p className="text-red-700 text-sm">{verificationRequest.rejection_reason || 'No reason provided.'}</p>
                        <p className="text-red-600 text-sm mt-2">Update your information below and click Resubmit.</p>
                      </div>
                    </div>
                  </div>
                )}
                {verificationRequest.status === 'info_needed' && (
                  <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-semibold text-blue-900">Our team needs more information</p>
                        {verificationRequest.rejection_reason && (
                          <p className="text-blue-800 text-sm mt-1 whitespace-pre-line">{verificationRequest.rejection_reason}</p>
                        )}
                        {Array.isArray(verificationRequest.requested_documents) && verificationRequest.requested_documents.length > 0 && (
                          <>
                            <p className="text-blue-900 text-sm font-medium mt-3">Please provide:</p>
                            <ul className="list-disc list-inside text-sm text-blue-800 mt-1 space-y-0.5">
                              {verificationRequest.requested_documents.map((d: string) => (
                                <li key={d}>{d}</li>
                              ))}
                            </ul>
                          </>
                        )}
                        <p className="text-blue-700 text-sm mt-3">
                          Upload the documents below (or update your links), then click Resubmit.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {verificationRequest.status === 'pending' && (
                  <p className="mt-3 text-sm text-gray-600">
                    Submitted {new Date(verificationRequest.updated_at || verificationRequest.created_at).toLocaleDateString()}.
                    You can still add documents or edit your details while it is under review.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Benefits */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 mb-8 border border-blue-100">
            <h3 className="font-bold text-navy-900 mb-4">Why Get Verified?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-navy-900">Build Trust</p>
                  <p className="text-sm text-gray-600">Show you're a legitimate professional</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-navy-900">Higher Visibility</p>
                  <p className="text-sm text-gray-600">Rank higher in search results</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-navy-900">More Connections</p>
                  <p className="text-sm text-gray-600">Users prefer verified accounts</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-navy-900">Stand Out</p>
                  <p className="text-sm text-gray-600">Get the blue verified badge</p>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-navy-900 mb-6">Submit Verification Request</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* LinkedIn URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Linkedin className="w-4 h-4 text-blue-600" />
                  <span>LinkedIn Profile URL</span>
                  <span className="text-xs text-gray-500">(Recommended)</span>
                </label>
                <input
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://linkedin.com/in/yourprofile"
                />
                <p className="text-xs text-gray-500 mt-1">Your professional LinkedIn profile helps verify your identity</p>
              </div>

              {/* Company Registration Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-primary-600" />
                  <span>Company Registration Number</span>
                  <span className="text-xs text-gray-500">(For Companies)</span>
                </label>
                <input
                  type="text"
                  value={formData.company_registration_number}
                  onChange={(e) => setFormData({ ...formData, company_registration_number: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="e.g., 123456789"
                />
                <p className="text-xs text-gray-500 mt-1">Official business registration number from your country</p>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <span>Company/Portfolio Website</span>
                  <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="https://yourcompany.com"
                />
                <p className="text-xs text-gray-500 mt-1">Your professional or company website</p>
              </div>

              {/* Document Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center space-x-2">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <span>Supporting Documents</span>
                  <span className="text-xs text-gray-500">(ID, registration certificate, etc. - PDF/JPG/PNG, max 10 MB)</span>
                </label>
                {documents.length > 0 && (
                  <ul className="mb-3 divide-y divide-gray-100 border border-gray-200 rounded-lg">
                    {documents.map((doc) => (
                      <li key={doc.path} className="flex items-center justify-between px-4 py-2 text-sm">
                        <span className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <span className="truncate">{doc.name}</span>
                          {doc.size ? <span className="text-xs text-gray-400">({Math.round(doc.size / 1024)} KB)</span> : null}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          aria-label={`Remove ${doc.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFiles(e.target.files)}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full border-2 border-dashed border-gray-300 rounded-lg py-4 text-sm text-gray-600 hover:border-primary-400 hover:text-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? 'Uploading...' : 'Upload documents'}
                </button>
                <p className="text-xs text-gray-500 mt-1">Documents are private and only visible to you and the AfroConnect verification team.</p>
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                  <span className="text-xs text-gray-500 ml-2">(Optional)</span>
                </label>
                <textarea
                  value={formData.additional_notes}
                  onChange={(e) => setFormData({ ...formData, additional_notes: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={4}
                  placeholder="Any additional information that can help verify your identity (awards, press mentions, portfolio links, etc.)"
                />
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {verificationRequest?.status === 'pending'
                    ? 'Your request is under review'
                    : 'Review typically takes 1-3 business days'}
                </p>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="bg-primary-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>
                        {!verificationRequest || verificationRequest.status === 'approved'
                          ? 'Submit Request'
                          : verificationRequest.status === 'pending'
                          ? 'Update Request'
                          : 'Resubmit for Review'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">Verification Tips:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Provide at least one verification document (LinkedIn highly recommended)</li>
                  <li>Ensure your LinkedIn profile is complete and matches your AfroConnect profile</li>
                  <li>For companies, provide official registration number</li>
                  <li>Be patient - our team reviews each request carefully</li>
                </ul>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

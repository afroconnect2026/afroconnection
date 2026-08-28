'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Plus,
  Upload,
  Trash2,
  X,
  AlertCircle,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  Download,
  Eye,
  EyeOff
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const materialTypes = [
  { value: 'slides', label: 'Slides/Presentation', icon: FileText },
  { value: 'recording', label: 'Recording/Video', icon: Video },
  { value: 'resource', label: 'Resource/Document', icon: File },
  { value: 'other', label: 'Other', icon: File }
]

const getFileType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (['pdf'].includes(ext || '')) return 'pdf'
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext || '')) return 'video'
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) return 'image'
  if (['doc', 'docx', 'txt', 'ppt', 'pptx'].includes(ext || '')) return 'document'
  return 'other'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default function ManageMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    material_type: 'resource',
    is_public: false,
    file: null as File | null
  })

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, params.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, organizer_id')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to manage materials for this event')
      }

      setEvent(eventData)

      const { data: materialsData } = await supabase
        .from('event_materials')
        .select('*')
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })

      setMaterials(materialsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      material_type: 'resource',
      is_public: false,
      file: null
    })
    setShowForm(false)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        setError('File must be less than 50MB')
        return
      }
      setFormData({ ...formData, file })
      if (!formData.title) {
        setFormData({ ...formData, file, title: file.name })
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim() || !formData.file) {
      setError('Title and file are required')
      return
    }

    try {
      setSaving(true)
      setUploading(true)
      setError(null)

      // Upload file to storage
      const fileExt = formData.file.name.split('.').pop()
      const fileName = `material-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `events/${params.id}/materials/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-uploads')
        .upload(filePath, formData.file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('public-uploads')
        .getPublicUrl(filePath)

      // Save material record
      const { error: insertError } = await supabase
        .from('event_materials')
        .insert({
          event_id: params.id,
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          file_url: publicUrl,
          file_name: formData.file.name,
          file_size: formData.file.size,
          file_type: getFileType(formData.file.name),
          material_type: formData.material_type,
          uploaded_by: user.id,
          is_public: formData.is_public
        })

      if (insertError) throw insertError

      await loadData()
      resetForm()
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload material')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this material? This action cannot be undone.')) return

    try {
      setDeleting(id)
      const { error } = await supabase
        .from('event_materials')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setDeleting(null)
    }
  }

  const togglePublic = async (id: string, currentValue: boolean) => {
    try {
      const { error } = await supabase
        .from('event_materials')
        .update({ is_public: !currentValue })
        .eq('id', id)

      if (error) throw error
      await loadData()
    } catch (err: any) {
      setError(err.message)
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

  if (error && !event) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href={`/events/${params.id}`} className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg">
            Back to Event
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Header */}
          <div className="mb-8">
            <Link href={`/events/${params.id}`} className="inline-flex items-center gap-2 text-primary-600 mb-4">
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-900">Manage Materials</h1>
                <p className="text-gray-600 mt-2">{event?.title}</p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <Plus className="h-5 w-5" />
                Upload Material
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && event && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Upload Form Modal */}
          {showForm && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">Upload Material</h2>
                  <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-lg">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium mb-2">File *</label>
                    <label className="flex flex-col items-center justify-center gap-2 px-6 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 cursor-pointer transition-colors">
                      <input
                        type="file"
                        onChange={handleFileChange}
                        className="hidden"
                        required
                      />
                      <Upload className="h-8 w-8 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {formData.file ? formData.file.name : 'Click to upload (Max 50MB)'}
                      </span>
                      {formData.file && (
                        <span className="text-xs text-gray-500">
                          {formatFileSize(formData.file.size)}
                        </span>
                      )}
                    </label>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="e.g., Event Presentation Slides"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border rounded-lg"
                      placeholder="Brief description of this material..."
                    />
                  </div>

                  {/* Material Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Material Type</label>
                    <select
                      value={formData.material_type}
                      onChange={(e) => setFormData({ ...formData, material_type: e.target.value })}
                      className="w-full px-4 py-3 border rounded-lg"
                    >
                      {materialTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Public Toggle */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="w-5 h-5 text-primary-600 rounded"
                    />
                    <label htmlFor="is_public" className="text-sm">
                      <span className="font-medium">Make public</span>
                      <p className="text-gray-600">Anyone can view (not just attendees)</p>
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                    >
                      <Upload className="h-5 w-5" />
                      {uploading ? 'Uploading...' : 'Upload Material'}
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}

          {/* Materials List */}
          {materials.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">No materials yet</h3>
              <p className="text-gray-600 mb-6">Upload slides, recordings, or resources for attendees</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg"
              >
                <Plus className="h-5 w-5" />
                Upload First Material
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => {
                const TypeIcon = materialTypes.find(t => t.value === material.material_type)?.icon || File

                return (
                  <div key={material.id} className="bg-white rounded-xl p-6 border hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <TypeIcon className="h-6 w-6 text-primary-600" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-bold text-navy-900 mb-1">{material.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>{material.file_name}</span>
                              <span>•</span>
                              <span>{formatFileSize(material.file_size)}</span>
                              <span>•</span>
                              <span>{material.download_count} downloads</span>
                            </div>
                          </div>
                        </div>

                        {material.description && (
                          <p className="text-sm text-gray-700 mb-3">{material.description}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {materialTypes.find(t => t.value === material.material_type)?.label}
                          </span>
                          <button
                            onClick={() => togglePublic(material.id, material.is_public)}
                            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                              material.is_public
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {material.is_public ? (
                              <>
                                <Eye className="h-3 w-3" />
                                Public
                              </>
                            ) : (
                              <>
                                <EyeOff className="h-3 w-3" />
                                Attendees Only
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <a
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </a>
                          <button
                            onClick={() => handleDelete(material.id)}
                            disabled={deleting === material.id}
                            className="flex items-center gap-1 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </button>
                        </div>

                        <div className="text-xs text-gray-500 mt-3">
                          Uploaded {new Date(material.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

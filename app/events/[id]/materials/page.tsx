'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  FileText,
  Video,
  Image as ImageIcon,
  File,
  AlertCircle,
  Lock,
  Filter
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const materialTypes = [
  { value: 'all', label: 'All Materials', icon: File },
  { value: 'slides', label: 'Slides/Presentation', icon: FileText },
  { value: 'recording', label: 'Recording/Video', icon: Video },
  { value: 'resource', label: 'Resource/Document', icon: File },
  { value: 'other', label: 'Other', icon: File }
]

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export default function EventMaterialsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [materials, setMaterials] = useState<any[]>([])
  const [filteredMaterials, setFilteredMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [rsvp, setRsvp] = useState<any>(null)
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, params.id])

  useEffect(() => {
    if (filterType === 'all') {
      setFilteredMaterials(materials)
    } else {
      setFilteredMaterials(materials.filter(m => m.material_type === filterType))
    }
  }, [filterType, materials])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('id, title, start_date, end_date')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      setEvent(eventData)

      // Check if user RSVP'd
      const { data: rsvpData } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('event_id', params.id)
        .eq('user_id', user.id)
        .maybeSingle()

      setRsvp(rsvpData)

      // Load materials
      const { data: materialsData, error: materialsError } = await supabase
        .from('event_materials')
        .select('*')
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })

      if (materialsError) throw materialsError
      setMaterials(materialsData || [])
      setFilteredMaterials(materialsData || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (material: any) => {
    try {
      // Increment download count
      await supabase.rpc('increment_material_download_count', {
        material_id: material.id
      })

      // Open file in new tab
      window.open(material.file_url, '_blank')
    } catch (err: any) {
      console.error('Download error:', err)
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

  if (error) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <p className="text-gray-700">{error}</p>
            <Link
              href="/events"
              className="mt-4 inline-block text-primary-600 hover:text-primary-700"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  // Check if user has access
  const hasAccess = rsvp || materials.some(m => m.is_public)

  if (!hasAccess) {
    return (
      <AuthenticatedLayout>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Lock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h2>
          <p className="text-gray-600 mb-6">
            You need to RSVP to this event to access materials
          </p>
          <Link
            href={`/events/${params.id}`}
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            View Event & RSVP
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
            <Link
              href={`/events/${params.id}`}
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 mb-4"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <h1 className="text-3xl font-bold text-navy-900">Event Materials</h1>
            <p className="text-gray-600 mt-2">{event?.title}</p>
            <p className="text-sm text-gray-500 mt-1">
              Download slides, recordings, and resources from this event
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl p-4 border mb-6">
            <div className="flex items-center gap-2 overflow-x-auto">
              {materialTypes.map((type) => {
                const Icon = type.icon
                const count = type.value === 'all'
                  ? materials.length
                  : materials.filter(m => m.material_type === type.value).length

                return (
                  <button
                    key={type.value}
                    onClick={() => setFilterType(type.value)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      filterType === type.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                    {count > 0 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        filterType === type.value
                          ? 'bg-white/20 text-white'
                          : 'bg-gray-200 text-gray-700'
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Materials List */}
          {filteredMaterials.length === 0 ? (
            <div className="bg-white rounded-xl p-12 border text-center">
              <File className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">
                {filterType === 'all' ? 'No materials available yet' : 'No materials of this type'}
              </h3>
              <p className="text-gray-600">
                {filterType === 'all'
                  ? 'The organizer hasn\'t uploaded any materials yet'
                  : 'Try selecting a different category'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMaterials.map((material) => {
                const TypeIcon = materialTypes.find(t => t.value === material.material_type)?.icon || File

                return (
                  <motion.div
                    key={material.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl p-6 border hover:shadow-lg transition-shadow"
                  >
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
                              {material.download_count > 0 && (
                                <>
                                  <span>•</span>
                                  <span>{material.download_count} downloads</span>
                                </>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownload(material)}
                            className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                          >
                            <Download className="h-5 w-5" />
                            Download
                          </button>
                        </div>

                        {material.description && (
                          <p className="text-sm text-gray-700 mb-3">{material.description}</p>
                        )}

                        <div className="flex items-center gap-2">
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {materialTypes.find(t => t.value === material.material_type)?.label}
                          </span>
                          {material.is_public && (
                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Public
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 mt-3">
                          Uploaded {new Date(material.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

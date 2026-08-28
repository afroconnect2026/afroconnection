'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle,
  Video,
  Clock
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.05
    }
  }
}

export default function MyEventsPage() {
  const router = useRouter()
  const supabase = createClient()

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'draft'>('all')
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    totalViews: 0,
    upcomingEvents: 0
  })

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filter])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEvents = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('events')
        .select('*')
        .eq('organizer_id', user.id)

      // Apply filters
      const now = new Date().toISOString()
      if (filter === 'upcoming') {
        query = query.eq('status', 'published').gte('start_date', now)
      } else if (filter === 'past') {
        query = query.eq('status', 'published').lt('start_date', now)
      } else if (filter === 'draft') {
        query = query.eq('status', 'draft')
      }

      query = query.order('start_date', { ascending: filter === 'past' ? false : true })

      const { data, error } = await query

      if (error) throw error

      setEvents(data || [])

      // Calculate stats
      if (filter === 'all') {
        const totalAttendees = (data || []).reduce((sum: number, e: any) => sum + (e.rsvp_count || 0), 0)
        const totalViews = (data || []).reduce((sum: number, e: any) => sum + (e.views_count || 0), 0)
        const upcomingEvents = (data || []).filter((e: any) =>
          e.status === 'published' && new Date(e.start_date) >= new Date()
        ).length

        setStats({
          totalEvents: data?.length || 0,
          totalAttendees,
          totalViews,
          upcomingEvents
        })
      }
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${eventTitle}"? This action cannot be undone.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)

      if (error) throw error

      await loadEvents()
    } catch (err: any) {
      console.error('Error deleting event:', err)
      alert(err.message || 'Failed to delete event')
    }
  }

  const renderEventCard = (event: any) => {
    const startDate = new Date(event.start_date)
    const isPast = startDate < new Date()
    const isDraft = event.status === 'draft'

    return (
      <motion.div
        key={event.id}
        variants={fadeIn}
        className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
      >
        <div className="flex flex-col sm:flex-row">
          {/* Cover Image */}
          <div className="relative w-full sm:w-48 h-48 sm:h-auto bg-gradient-to-br from-primary-500 to-primary-600 flex-shrink-0">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="h-12 w-12 text-white opacity-30" />
              </div>
            )}
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              {isDraft && (
                <span className="px-3 py-1 bg-gray-500 text-white rounded-full text-xs font-bold">
                  DRAFT
                </span>
              )}
              {isPast && !isDraft && (
                <span className="px-3 py-1 bg-gray-600 text-white rounded-full text-xs font-bold">
                  PAST
                </span>
              )}
              {!isPast && !isDraft && (
                <span className="px-3 py-1 bg-green-500 text-white rounded-full text-xs font-bold">
                  LIVE
                </span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-navy-900 mb-2 line-clamp-1">
                  {event.title}
                </h3>
                <div className="flex items-center gap-2 mb-3">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium uppercase">
                    {event.event_type}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                    {event.format}
                  </span>
                </div>
              </div>
            </div>

            {/* Event Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-primary-600 flex-shrink-0" />
                <span>
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div className="flex items-center text-sm text-gray-700">
                {event.format === 'virtual' ? (
                  <Video className="h-4 w-4 mr-2 text-blue-600 flex-shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 mr-2 text-red-600 flex-shrink-0" />
                )}
                <span className="line-clamp-1">
                  {event.format === 'virtual'
                    ? 'Online Event'
                    : event.format === 'hybrid'
                    ? `${event.city || 'TBD'} + Online`
                    : `${event.city || 'TBD'}${event.country ? `, ${event.country}` : ''}`}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-green-600" />
                <span className="font-medium">{event.rsvp_count || 0}</span>
                <span>attending</span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="font-medium">{event.views_count || 0}</span>
                <span>views</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Link
                href={`/events/${event.id}`}
                className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium text-center hover:bg-primary-700 transition-colors text-sm"
              >
                View Event
              </Link>
              {!isPast && (
                <Link
                  href={`/events/${event.id}/attendees`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Attendees
                </Link>
              )}
              <Link
                href={`/events/${event.id}/edit`}
                className="p-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Edit className="h-5 w-5" />
              </Link>
              <button
                onClick={() => handleDelete(event.id, event.title)}
                className="p-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  const renderSkeleton = () => (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse">
      <div className="flex flex-col sm:flex-row">
        <div className="w-full sm:w-48 h-48 bg-gray-200"></div>
        <div className="flex-1 p-6 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
            <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-navy-900 mb-2">
                My Events
              </h1>
              <p className="text-gray-600">
                Manage your hosted events and track attendance
              </p>
            </div>
            <Link
              href="/events/create"
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Event
            </Link>
          </div>

          {/* Stats Cards */}
          {filter === 'all' && (
            <motion.div
              variants={fadeIn}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            >
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Events</span>
                  <Calendar className="h-5 w-5 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-navy-900">{stats.totalEvents}</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Attendees</span>
                  <Users className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-navy-900">{stats.totalAttendees}</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Total Views</span>
                  <Eye className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-navy-900">{stats.totalViews}</div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-600">Upcoming</span>
                  <Clock className="h-5 w-5 text-gold-600" />
                </div>
                <div className="text-3xl font-bold text-navy-900">{stats.upcomingEvents}</div>
              </div>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div variants={fadeIn} className="flex gap-4 mb-8">
            {[
              { value: 'all', label: 'All Events' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'past', label: 'Past' },
              { value: 'draft', label: 'Drafts' }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value as any)}
                className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                  filter === tab.value
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Events List */}
          {loading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i}>{renderSkeleton()}</div>
              ))}
            </div>
          ) : events.length > 0 ? (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-6"
            >
              {events.map(renderEventCard)}
            </motion.div>
          ) : (
            <div className="text-center py-16">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                No {filter !== 'all' && filter} events found
              </h3>
              <p className="text-gray-600 mb-6">
                {filter === 'draft'
                  ? 'You haven\'t saved any event drafts yet'
                  : filter === 'upcoming'
                  ? 'You don\'t have any upcoming events scheduled'
                  : filter === 'past'
                  ? 'You haven\'t hosted any past events yet'
                  : 'Start by creating your first event'}
              </p>
              <Link
                href="/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Event
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

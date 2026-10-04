'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CheckCircle, XCircle, Eye } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import Link from 'next/link'

export default function AdminEventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchEvents()
  }, [filter])

  const fetchEvents = async () => {
    try {
      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!creator_id(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.eq('moderation_status', 'pending')
      } else if (filter === 'approved') {
        query = query.eq('moderation_status', 'approved')
      } else if (filter === 'rejected') {
        query = query.eq('moderation_status', 'rejected')
      }

      const { data, error } = await query

      if (error) throw error
      setEvents(data || [])
      setLoading(false)
    } catch (error) {
      console.error('Error fetching events:', error)
      setLoading(false)
    }
  }

  const handleModerate = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: adminData } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!adminData) return

      await supabase
        .from('events')
        .update({
          moderation_status: status,
          moderated_by: adminData.id,
          moderated_at: new Date().toISOString()
        })
        .eq('id', id)

      await supabase.from('admin_activity_log').insert({
        admin_id: adminData.id,
        action: status === 'approved' ? 'approve_content' : 'reject_content',
        target_type: 'event',
        target_id: id
      })

      fetchEvents()
    } catch (error) {
      console.error('Error moderating event:', error)
    }
  }

  const pendingCount = events.filter(e => e.moderation_status === 'pending').length

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-600 mt-1">Moderate platform events</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-50 px-4 py-2 rounded-lg">
            <span className="text-yellow-900 font-semibold">
              {pendingCount} Pending Review
            </span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1 flex gap-1">
        {['all', 'pending', 'approved', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-lg font-medium ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  by {event.organizer?.full_name} • {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.moderation_status === 'approved' ? 'bg-green-100 text-green-700' :
                event.moderation_status === 'rejected' ? 'bg-red-100 text-red-700' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {event.moderation_status}
              </span>
            </div>

            <p className="text-gray-700 mb-4">{event.description?.slice(0, 200)}...</p>

            <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {format(new Date(event.start_date), 'MMM dd, yyyy')}
              </div>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                {event.event_type}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {event.location}
              </span>
            </div>

            {event.moderation_status === 'pending' && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleModerate(event.id, 'approved')}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleModerate(event.id, 'rejected')}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <Link
                  href={`/events/${event.id}`}
                  target="_blank"
                  className="flex items-center justify-center border-2 border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50"
                >
                  <Eye className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

      {events.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center text-gray-500">
          No {filter} events
        </div>
      )}
    </div>
  )
}

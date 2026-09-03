'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Calendar,
  Clock,
  Eye,
  MapPin,
  UserPlus,
} from 'lucide-react'
import PublicNav from '@/components/marketing/PublicNav'
import PublicFooter from '@/components/marketing/PublicFooter'
import { createClient } from '@/lib/supabase/client'
import { SAMPLE_EVENTS } from '@/lib/marketing/content'

interface PublicEvent {
  id: string
  title: string
  description: string | null
  event_type: string | null
  start_date: string | null
  location: string | null
  cover_image_url?: string | null
  isSample?: boolean
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function EventsBrowsePage() {
  const [events, setEvents] = useState<PublicEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const load = async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, description, event_type, start_date, location, cover_image_url')
        .order('start_date', { ascending: false })
        .limit(12)

      if (cancelled) return

      const liveEvents = (data as PublicEvent[] | null) ?? []
      setEvents(liveEvents.length > 0 ? liveEvents : SAMPLE_EVENTS)
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-primary-900">
      <PublicNav active="/events/browse" />

      {/* Hero */}
      <section className="pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-4"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6">
              <Eye className="w-4 h-4 text-gold-500" />
              <span className="text-white text-sm font-medium">
                Public preview — no account needed
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6">
              Events{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
                Happening Now
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Roundtables, clinics and summits where members meet in person and online. Create a
              free account to RSVP and check in.
            </p>

            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 bg-gradient-gold text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Free Account to RSVP</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white/5 border border-white/10 rounded-2xl h-96 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event, i) => {
                const date = formatDate(event.start_date)
                const ended = event.start_date
                  ? new Date(event.start_date) < new Date()
                  : false

                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-gold-500/50 transition-all group flex flex-col"
                  >
                    {/* Cover Image */}
                    {event.cover_image_url ? (
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.cover_image_url}
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        {event.event_type && (
                          <div className="absolute top-3 right-3 bg-gold-500 text-navy-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {event.event_type}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative h-48 bg-gradient-to-br from-primary-700 to-navy-900 flex items-center justify-center">
                        <Calendar className="w-12 h-12 text-white/30" />
                        {event.event_type && (
                          <div className="absolute top-3 right-3 bg-gold-500 text-navy-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            {event.event_type}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-6 flex flex-col flex-1">
                      {event.isSample && (
                        <span className="self-start text-[10px] uppercase tracking-wide text-gray-400 border border-white/15 rounded-full px-2 py-0.5 mb-3">
                          Sample event
                        </span>
                      )}

                      <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 group-hover:text-gold-400 transition-colors">
                        {event.title}
                      </h3>

                      {event.description && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2 leading-relaxed flex-1">
                          {event.description}
                        </p>
                      )}

                      <div className="space-y-2 mb-4">
                        {date && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <Calendar className="w-4 h-4 text-primary-400 shrink-0" />
                            <span>{date}</span>
                          </div>
                        )}
                        {event.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <MapPin className="w-4 h-4 text-primary-400 shrink-0" />
                            <span className="line-clamp-1">{event.location}</span>
                          </div>
                        )}
                        {ended && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="w-4 h-4 shrink-0" />
                            <span>Event ended</span>
                          </div>
                        )}
                      </div>

                      {!event.isSample ? (
                        <Link
                          href="/auth/register"
                          className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 font-semibold text-sm group/link"
                        >
                          Sign up to RSVP
                          <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                        </Link>
                      ) : (
                        <span className="text-gray-500 text-sm italic">
                          Example event
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}

          {!loading && events.length === 0 && (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-white mb-2">No Events Yet</h3>
              <p className="text-gray-400 mb-6">
                Check back soon for upcoming roundtables, clinics and summits.
              </p>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 font-semibold"
              >
                Create an account to get notified
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/5 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-6">
            Want to RSVP and Check In?
          </h2>
          <p className="text-lg sm:text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            Create a free account to register for events, network with attendees, and get matched
            with the right people at each event.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="bg-gradient-gold text-navy-900 px-10 py-5 rounded-xl font-bold text-lg hover:shadow-2xl hover:shadow-gold-500/50 transition-all flex items-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Create Free Account</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/preview"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/40 text-white px-8 py-5 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
            >
              Browse More Opportunities
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

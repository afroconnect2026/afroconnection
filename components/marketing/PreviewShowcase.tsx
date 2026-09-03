'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Award,
  Calendar,
  Clock,
  Eye,
  Lock,
  MapPin,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import {
  ANONYMISED_DEALS,
  SAMPLE_EVENTS,
  SAMPLE_MATCHES,
  SAMPLE_OPPORTUNITIES,
  SUCCESS_STORIES,
} from '@/lib/marketing/content'

interface PreviewEvent {
  id: string
  title: string
  description: string | null
  event_type: string | null
  start_date: string | null
  location: string | null
  cover_image_url?: string | null
  isSample?: boolean
}

interface PreviewOpportunity {
  id: string
  title: string
  description: string | null
  opportunity_type: string | null
  application_deadline?: string | null
  location: string | null
  thumbnail_url?: string | null
  isSample?: boolean
}

interface PreviewShowcaseProps {
  /**
   * `landing` renders the two live feeds only (events + opportunities).
   * `full` adds anonymised deals, sample matches and member outcomes.
   */
  variant?: 'landing' | 'full'
  limit?: number
}

function formatDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PreviewShowcase({
  variant = 'landing',
  limit = 4,
}: PreviewShowcaseProps) {
  const [events, setEvents] = useState<PreviewEvent[]>([])
  const [opportunities, setOpportunities] = useState<PreviewOpportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const load = async () => {
      const [eventsResult, oppsResult] = await Promise.all([
        supabase
          .from('events')
          .select(
            'id, title, description, event_type, start_date, location, cover_image_url'
          )
          .order('start_date', { ascending: false })
          .limit(limit),
        supabase
          .from('opportunities')
          .select(
            'id, title, description, opportunity_type, application_deadline, location, thumbnail_url'
          )
          .order('created_at', { ascending: false })
          .limit(limit),
      ])

      if (cancelled) return

      const liveEvents = (eventsResult.data as PreviewEvent[] | null) ?? []
      const liveOpps = (oppsResult.data as PreviewOpportunity[] | null) ?? []

      // Visitors should never see an empty platform — fall back to samples.
      setEvents(liveEvents.length > 0 ? liveEvents : SAMPLE_EVENTS.slice(0, limit))
      setOpportunities(
        liveOpps.length > 0 ? liveOpps : SAMPLE_OPPORTUNITIES.slice(0, limit)
      )
      setLoading(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [limit])

  const skeletons = Array.from({ length: limit })

  return (
    <>
      {/* ---------------------------------------------------------- */}
      {/* Events preview                                             */}
      {/* ---------------------------------------------------------- */}
      <section id="preview-events" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                <Eye className="w-3.5 h-3.5 text-gold-500" />
                <span className="text-white text-xs font-medium">
                  Public preview — no account needed
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
                Events happening now
              </h2>
              <p className="text-base sm:text-lg text-gray-300">
                Roundtables, clinics and summits where members meet in person and online.
              </p>
            </div>
            <Link
              href="/events"
              className="hidden md:inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 transition-colors font-medium shrink-0"
            >
              Browse all events
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? skeletons.map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-2xl h-64 animate-pulse"
                  />
                ))
              : events.map((event, i) => {
                  const date = formatDate(event.start_date)
                  const ended = event.start_date
                    ? new Date(event.start_date) < new Date()
                    : false

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      viewport={{ once: true }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-gold-500/50 transition-all group flex flex-col"
                    >
                      {event.cover_image_url ? (
                        <div className="relative h-44 overflow-hidden">
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
                        <div className="relative h-44 bg-gradient-to-br from-primary-700 to-navy-900 flex items-center justify-center">
                          <Calendar className="w-10 h-10 text-white/40" />
                          {event.event_type && (
                            <div className="absolute top-3 right-3 bg-gold-500 text-navy-900 px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {event.event_type}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-1">
                        {event.isSample && (
                          <span className="self-start text-[10px] uppercase tracking-wide text-gray-400 border border-white/15 rounded-full px-2 py-0.5 mb-3">
                            Sample listing
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-gold-500 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {event.description}
                        </p>
                        <div className="space-y-2 text-sm text-gray-300 mb-4">
                          {date && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-primary-500" />
                              <span>{date}</span>
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary-500" />
                              <span className="line-clamp-1">{event.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-auto pt-4 border-t border-white/10">
                          {ended ? (
                            <span className="text-gray-500 font-medium text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Event ended
                            </span>
                          ) : event.isSample ? (
                            <Link
                              href="/auth/register"
                              className="text-gold-500 hover:text-gold-400 font-medium text-sm inline-flex items-center gap-2"
                            >
                              Sign up to see real events
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          ) : (
                            <Link
                              href={`/events/${event.id}`}
                              className="text-gold-500 hover:text-gold-400 font-medium text-sm inline-flex items-center gap-2 group/link"
                            >
                              View full details
                              <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
          </div>

          <Link
            href="/events"
            className="md:hidden flex items-center justify-center gap-2 text-gold-500 hover:text-gold-400 transition-colors font-medium mt-8"
          >
            Browse all events
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- */}
      {/* Opportunities preview                                      */}
      {/* ---------------------------------------------------------- */}
      <section
        id="preview-opportunities"
        className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white/5 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
                Featured opportunities
              </h2>
              <p className="text-base sm:text-lg text-gray-300">
                Investment, partnerships, mentorship and roles — posted by verified members.
              </p>
            </div>
            <Link
              href="/auth/register?role=opportunities"
              className="hidden md:inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 transition-colors font-medium shrink-0"
            >
              Sign up to see all opportunities
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {loading
              ? skeletons.map((_, i) => (
                  <div
                    key={i}
                    className="bg-white/5 border border-white/10 rounded-2xl h-64 animate-pulse"
                  />
                ))
              : opportunities.map((opp, i) => {
                  const deadline = formatDate(opp.application_deadline)
                  const closed = opp.application_deadline
                    ? new Date(opp.application_deadline) < new Date()
                    : false

                  return (
                    <motion.div
                      key={opp.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 }}
                      viewport={{ once: true }}
                      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 hover:border-gold-500/50 transition-all group flex flex-col"
                    >
                      {opp.thumbnail_url ? (
                        <div className="relative h-44 overflow-hidden">
                          <img
                            src={opp.thumbnail_url}
                            alt={opp.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          {opp.opportunity_type && (
                            <div className="absolute top-3 right-3 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {opp.opportunity_type}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="relative h-44 bg-gradient-to-br from-navy-900 to-primary-900 flex items-center justify-center">
                          <TrendingUp className="w-10 h-10 text-white/40" />
                          {opp.opportunity_type && (
                            <div className="absolute top-3 right-3 bg-primary-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                              {opp.opportunity_type}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="p-6 flex flex-col flex-1">
                        {opp.isSample && (
                          <span className="self-start text-[10px] uppercase tracking-wide text-gray-400 border border-white/15 rounded-full px-2 py-0.5 mb-3">
                            Sample listing
                          </span>
                        )}
                        <h3 className="text-lg font-bold text-white mb-3 line-clamp-2 group-hover:text-gold-500 transition-colors">
                          {opp.title}
                        </h3>
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {opp.description}
                        </p>
                        <div className="space-y-2 text-sm text-gray-300 mb-4">
                          {deadline && (
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-primary-500" />
                              <span>Deadline: {deadline}</span>
                            </div>
                          )}
                          {opp.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-primary-500" />
                              <span className="line-clamp-1">{opp.location}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-auto pt-4 border-t border-white/10">
                          {closed ? (
                            <span className="text-gray-500 font-medium text-sm flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Applications closed
                            </span>
                          ) : (
                            <Link
                              href="/auth/register?role=opportunities"
                              className="text-gold-500 hover:text-gold-400 font-medium text-sm inline-flex items-center gap-2 group/link"
                            >
                              <Lock className="h-3.5 w-3.5" />
                              Sign up to view full details
                              <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
          </div>

          <Link
            href="/auth/register?role=opportunities"
            className="md:hidden flex items-center justify-center gap-2 text-gold-500 hover:text-gold-400 transition-colors font-medium mt-8"
          >
            Sign up to see all opportunities
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>

      {variant === 'full' && (
        <>
          {/* ------------------------------------------------------ */}
          {/* Anonymised investment opportunities                    */}
          {/* ------------------------------------------------------ */}
          <section id="preview-deals" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-3">
                  Live investment opportunities
                </h2>
                <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
                  Anonymised for member privacy. Company names, founders and full metrics
                  unlock when you join as a verified investor.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {ANONYMISED_DEALS.map((deal, i) => (
                  <motion.div
                    key={deal.headline}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-2xl p-6 hover:border-gold-500/50 transition-all flex flex-col"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <span className="bg-gold-500/20 text-gold-400 text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full">
                        {deal.stage}
                      </span>
                      <span className="text-gray-400 text-[11px] uppercase tracking-wide">
                        {deal.sector}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-white mb-4 leading-snug">
                      {deal.headline}
                    </h3>

                    <dl className="space-y-2 text-sm mb-4">
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-400">Raising</dt>
                        <dd className="text-white font-semibold">{deal.raising}</dd>
                      </div>
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-400">Region</dt>
                        <dd className="text-white text-right">{deal.location}</dd>
                      </div>
                    </dl>

                    <p className="text-gray-300 text-xs border-t border-white/10 pt-3 mb-4">
                      {deal.traction}
                    </p>

                    <Link
                      href="/auth/register?role=investor"
                      className="mt-auto inline-flex items-center gap-2 text-gold-500 hover:text-gold-400 font-semibold text-sm"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Unlock full details
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ */}
          {/* Example matches                                        */}
          {/* ------------------------------------------------------ */}
          <section
            id="preview-matches"
            className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 bg-white/5 backdrop-blur-sm"
          >
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-gold-500" />
                  <span className="text-white text-xs font-medium">
                    Examples of potential matches
                  </span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                  The introductions we would make for you
                </h2>
                <p className="text-gray-300">
                  Build a profile and these become real people you can message.
                </p>
              </div>

              <div className="space-y-4">
                {SAMPLE_MATCHES.map((match, i) => (
                  <motion.div
                    key={match.reason}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    viewport={{ once: true }}
                    className="grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center bg-navy-900/40 border border-white/10 rounded-2xl p-6"
                  >
                    <div className="text-sm text-gray-200">{match.personA}</div>
                    <div className="flex md:flex-col items-center gap-2 justify-self-start md:justify-self-center">
                      <div className="w-16 h-16 rounded-full border-4 border-gold-500/70 flex items-center justify-center bg-navy-900">
                        <span className="text-gold-500 font-bold text-lg">{match.score}%</span>
                      </div>
                      <span className="text-[11px] uppercase tracking-wide text-gray-500">
                        Compatibility
                      </span>
                    </div>
                    <div className="text-sm text-gray-200 md:text-right">{match.personB}</div>
                    <p className="md:col-span-3 text-xs text-gray-400 border-t border-white/10 pt-3">
                      <span className="text-primary-400 font-semibold">Why: </span>
                      {match.reason}
                    </p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* ------------------------------------------------------ */}
          {/* Member outcomes                                        */}
          {/* ------------------------------------------------------ */}
          <section id="preview-stories" className="py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl sm:text-4xl font-display font-bold text-white mb-3">
                  Member success stories
                </h2>
                <p className="text-gray-300 max-w-2xl mx-auto">
                  Aggregated and anonymised outcomes from the network. Members control what
                  is shared publicly.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {SUCCESS_STORIES.map((story, i) => (
                  <motion.div
                    key={story.outcome}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="bg-white/5 border border-white/10 rounded-2xl p-7 hover:border-gold-500/40 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-5 h-5 text-gold-500" />
                      <span className="text-gold-400 text-xs font-bold uppercase tracking-wide">
                        {story.tag}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                      {story.outcome}
                    </h3>
                    <p className="text-gray-300 text-sm leading-relaxed">{story.detail}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        </>
      )}
    </>
  )
}

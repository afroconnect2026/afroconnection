'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Users,
  TrendingUp,
  DollarSign,
  CheckCircle,
  Star,
  Globe,
  Clock,
  Award,
  Bookmark,
  UserPlus,
  AlertCircle,
  BarChart3,
  Eye
} from 'lucide-react'
import Link from 'next/link'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function EventAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Analytics Data
  const [rsvpStats, setRsvpStats] = useState({ going: 0, interested: 0, maybe: 0 })
  const [ticketStats, setTicketStats] = useState<any[]>([])
  const [checkInRate, setCheckInRate] = useState(0)
  const [reviewStats, setReviewStats] = useState({ count: 0, average: 0, wouldRecommend: 0 })
  const [demographics, setDemographics] = useState<any[]>([])
  const [waitlistStats, setWaitlistStats] = useState({ total: 0, converted: 0 })
  const [socialStats, setSocialStats] = useState({ saves: 0, networking: 0, certificates: 0 })
  const [rsvpTrend, setRsvpTrend] = useState<any[]>([])

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, params.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load event and verify organizer
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError
      if (eventData.organizer_id !== user.id) {
        throw new Error('You are not authorized to view analytics for this event')
      }

      setEvent(eventData)

      // Load RSVP Stats
      const { data: rsvps } = await supabase
        .from('event_rsvps')
        .select('status, checked_in, created_at')
        .eq('event_id', params.id)

      const going = rsvps?.filter(r => r.status === 'going').length || 0
      const interested = rsvps?.filter(r => r.status === 'interested').length || 0
      const maybe = rsvps?.filter(r => r.status === 'maybe').length || 0
      const checkedIn = rsvps?.filter(r => r.checked_in).length || 0

      setRsvpStats({ going, interested, maybe })
      setCheckInRate(going > 0 ? Math.round((checkedIn / going) * 100) : 0)

      // RSVP Trend (last 7 days)
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const trendData = rsvps
        ?.filter(r => new Date(r.created_at) >= sevenDaysAgo)
        .reduce((acc: any, rsvp) => {
          const date = new Date(rsvp.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {})

      setRsvpTrend(Object.entries(trendData || {}).map(([date, count]) => ({ date, count })))

      // Load Ticket Stats
      const { data: ticketTypes } = await supabase
        .from('event_ticket_types')
        .select('*')
        .eq('event_id', params.id)
        .order('price', { ascending: true })

      setTicketStats(ticketTypes || [])

      // Load Review Stats
      const { data: reviews } = await supabase
        .from('event_reviews')
        .select('rating, would_recommend')
        .eq('event_id', params.id)

      const reviewCount = reviews?.length || 0
      const avgRating = reviewCount > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / reviewCount
        : 0
      const wouldRecommendCount = reviews?.filter(r => r.would_recommend).length || 0
      const wouldRecommendPercent = reviewCount > 0
        ? Math.round((wouldRecommendCount / reviewCount) * 100)
        : 0

      setReviewStats({
        count: reviewCount,
        average: Math.round(avgRating * 10) / 10,
        wouldRecommend: wouldRecommendPercent
      })

      // Load Demographics (Countries)
      const { data: attendeeProfiles } = await supabase
        .from('event_rsvps')
        .select(`
          user:profiles!event_rsvps_user_id_fkey(country)
        `)
        .eq('event_id', params.id)
        .eq('status', 'going')

      const countryCounts = attendeeProfiles?.reduce((acc: any, item: any) => {
        const country = item.user?.country || 'Unknown'
        acc[country] = (acc[country] || 0) + 1
        return acc
      }, {})

      const topCountries = Object.entries(countryCounts || {})
        .map(([country, count]) => ({ country, count }))
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 5)

      setDemographics(topCountries)

      // Load Waitlist Stats
      const { data: waitlist } = await supabase
        .from('event_waitlist')
        .select('*')
        .eq('event_id', params.id)

      const waitlistTotal = waitlist?.length || 0
      const waitlistConverted = waitlist?.filter(w => w.notified).length || 0

      setWaitlistStats({ total: waitlistTotal, converted: waitlistConverted })

      // Load Social Stats
      const { data: saves } = await supabase
        .from('saved_events')
        .select('id')
        .eq('event_id', params.id)

      const { data: networking } = await supabase
        .from('event_networking')
        .select('id')
        .eq('event_id', params.id)

      const { data: certificates } = await supabase
        .from('event_certificates')
        .select('id')
        .eq('event_id', params.id)

      setSocialStats({
        saves: saves?.length || 0,
        networking: networking?.length || 0,
        certificates: certificates?.length || 0
      })

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
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

  const totalRsvps = rsvpStats.going + rsvpStats.interested + rsvpStats.maybe
  const conversionRate = event.views_count > 0
    ? Math.round((totalRsvps / event.views_count) * 100)
    : 0

  const totalRevenue = ticketStats.reduce((sum, ticket) =>
    sum + (ticket.price * ticket.quantity_sold), 0
  )

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <motion.div initial="hidden" animate="visible" variants={fadeIn}>
          {/* Header */}
          <div className="mb-8">
            <Link href={`/events/${params.id}`} className="inline-flex items-center gap-2 text-primary-600 mb-4">
              <ArrowLeft className="h-5 w-5" />
              Back to Event
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-navy-900 flex items-center gap-3">
                  <BarChart3 className="h-8 w-8 text-primary-600" />
                  Event Analytics
                </h1>
                <p className="text-gray-600 mt-2">{event?.title}</p>
              </div>
            </div>
          </div>

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total RSVPs */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-600" />
                <span className="text-3xl font-bold text-blue-900">{totalRsvps}</span>
              </div>
              <h3 className="text-sm font-medium text-blue-800">Total RSVPs</h3>
              <p className="text-xs text-blue-600 mt-1">
                {rsvpStats.going} going • {rsvpStats.interested} interested
              </p>
            </div>

            {/* Views */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <Eye className="h-8 w-8 text-purple-600" />
                <span className="text-3xl font-bold text-purple-900">{event.views_count || 0}</span>
              </div>
              <h3 className="text-sm font-medium text-purple-800">Total Views</h3>
              <p className="text-xs text-purple-600 mt-1">
                {conversionRate}% conversion rate
              </p>
            </div>

            {/* Check-in Rate */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <span className="text-3xl font-bold text-green-900">{checkInRate}%</span>
              </div>
              <h3 className="text-sm font-medium text-green-800">Check-in Rate</h3>
              <p className="text-xs text-green-600 mt-1">
                Actual attendance
              </p>
            </div>

            {/* Revenue */}
            <div className="bg-gradient-to-br from-gold-50 to-amber-100 rounded-xl p-6 border border-gold-200">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-gold-700" />
                <span className="text-3xl font-bold text-gold-900">${totalRevenue}</span>
              </div>
              <h3 className="text-sm font-medium text-gold-800">Total Revenue</h3>
              <p className="text-xs text-gold-600 mt-1">
                From ticket sales
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Registration Trend */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-600" />
                Registration Trend (Last 7 Days)
              </h3>
              {rsvpTrend.length > 0 ? (
                <div className="space-y-2">
                  {rsvpTrend.map((item: any, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-16">{item.date}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary-500 to-primary-600 h-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.min((item.count / Math.max(...rsvpTrend.map((t: any) => t.count))) * 100, 100)}%` }}
                        >
                          <span className="text-xs font-medium text-white">{item.count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No registrations in the last 7 days</p>
              )}
            </div>

            {/* Ticket Sales Breakdown */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Ticket Sales Breakdown
              </h3>
              {ticketStats.length > 0 ? (
                <div className="space-y-3">
                  {ticketStats.map((ticket) => {
                    const soldPercent = ticket.quantity_total > 0
                      ? Math.round((ticket.quantity_sold / ticket.quantity_total) * 100)
                      : 0
                    return (
                      <div key={ticket.id} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{ticket.name}</span>
                          <span className="text-gray-600">
                            {ticket.quantity_sold} / {ticket.quantity_total || '∞'} sold
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-green-500 h-full"
                            style={{ width: `${soldPercent}%` }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>${ticket.price} each</span>
                          <span className="font-medium text-green-700">
                            ${ticket.price * ticket.quantity_sold} revenue
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No ticket types configured</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Review Stats */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Reviews & Ratings
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{reviewStats.average}</div>
                  <div className="text-xs text-gray-600 mt-1">Avg Rating</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= reviewStats.average ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{reviewStats.count}</div>
                  <div className="text-xs text-gray-600 mt-1">Total Reviews</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{reviewStats.wouldRecommend}%</div>
                  <div className="text-xs text-gray-600 mt-1">Would Recommend</div>
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div className="bg-white rounded-xl p-6 border">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-600" />
                Top Countries
              </h3>
              {demographics.length > 0 ? (
                <div className="space-y-2">
                  {demographics.map((item: any, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{index + 1}.</span>
                        <span className="font-medium text-gray-900">{item.country}</span>
                      </div>
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {item.count} {item.count === 1 ? 'attendee' : 'attendees'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No demographic data yet</p>
              )}
            </div>
          </div>

          {/* Social Engagement */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 border">
              <div className="flex items-center gap-3 mb-2">
                <Bookmark className="h-6 w-6 text-amber-600" />
                <span className="text-2xl font-bold text-gray-900">{socialStats.saves}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700">Event Saves</h3>
              <p className="text-xs text-gray-500 mt-1">Users bookmarked this event</p>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <div className="flex items-center gap-3 mb-2">
                <UserPlus className="h-6 w-6 text-blue-600" />
                <span className="text-2xl font-bold text-gray-900">{socialStats.networking}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700">Connections Made</h3>
              <p className="text-xs text-gray-500 mt-1">Networking requests sent</p>
            </div>

            <div className="bg-white rounded-xl p-6 border">
              <div className="flex items-center gap-3 mb-2">
                <Award className="h-6 w-6 text-gold-600" />
                <span className="text-2xl font-bold text-gray-900">{socialStats.certificates}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-700">Certificates Issued</h3>
              <p className="text-xs text-gray-500 mt-1">Attendees downloaded certificates</p>
            </div>
          </div>

          {/* Waitlist */}
          {waitlistStats.total > 0 && (
            <div className="bg-white rounded-xl p-6 border mt-6">
              <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-600" />
                Waitlist Performance
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-orange-600">{waitlistStats.total}</div>
                  <div className="text-sm text-gray-600 mt-1">Total on Waitlist</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-green-600">{waitlistStats.converted}</div>
                  <div className="text-sm text-gray-600 mt-1">Notified / Converted</div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AuthenticatedLayout>
  )
}

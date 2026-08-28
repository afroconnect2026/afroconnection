'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Video,
  DollarSign,
  Globe,
  Edit,
  Trash2,
  CheckCircle,
  Star,
  AlertCircle,
  Share2,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Download,
  MessageSquare,
  Linkedin,
  Twitter,
  Link as LinkIcon,
  HelpCircle,
  Facebook,
  Mail,
  Copy,
  Ticket,
  QrCode,
  X,
  UserCheck
} from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamic import for QR code to avoid SSR issues
const QRCodeSVG = dynamic(() => import('qrcode.react').then(mod => mod.QRCodeSVG), {
  ssr: false,
  loading: () => <div className="w-48 h-48 bg-gray-100 animate-pulse rounded-lg"></div>
})
import Link from 'next/link'
import Image from 'next/image'

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

export default function EventDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [event, setEvent] = useState<any>(null)
  const [rsvp, setRsvp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [rsvping, setRsvping] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [speakers, setSpeakers] = useState<any[]>([])
  const [schedule, setSchedule] = useState<any[]>([])
  const [faqs, setFaqs] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [averageRating, setAverageRating] = useState<number>(0)
  const [ticketTypes, setTicketTypes] = useState<any[]>([])
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [waitlistEntry, setWaitlistEntry] = useState<any>(null)
  const [joiningWaitlist, setJoiningWaitlist] = useState(false)
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState(true)
  const [submittingReview, setSubmittingReview] = useState(false)
  const [showQRTicket, setShowQRTicket] = useState(false)
  const [certificate, setCertificate] = useState<any>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [generatingCertificate, setGeneratingCertificate] = useState(false)

  const qrCodeRef = useRef<HTMLDivElement>(null)
  const certificateRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEvent()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params.id])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEvent = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(
            id,
            full_name,
            avatar_url,
            country,
            bio
          )
        `)
        .eq('id', params.id)
        .single()

      if (eventError) throw eventError

      setEvent(eventData)

      // Increment view count
      await supabase
        .from('events')
        .update({ views_count: (eventData.views_count || 0) + 1 })
        .eq('id', params.id)

      // Check if user has RSVP'd
      if (user) {
        const { data: rsvpData } = await supabase
          .from('event_rsvps')
          .select('*')
          .eq('event_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()

        setRsvp(rsvpData)

        // Check if event is saved
        const { data: savedData } = await supabase
          .from('saved_events')
          .select('id')
          .eq('event_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()

        setIsSaved(!!savedData)

        // Check if user is on waitlist
        const { data: waitlistData } = await supabase
          .from('event_waitlist')
          .select('*')
          .eq('event_id', params.id)
          .eq('user_id', user.id)
          .maybeSingle()

        setWaitlistEntry(waitlistData)

        // Check if user has certificate (only if checked in)
        if (rsvpData?.checked_in) {
          const { data: certData } = await supabase
            .from('event_certificates')
            .select('*')
            .eq('event_id', params.id)
            .eq('user_id', user.id)
            .maybeSingle()

          setCertificate(certData)
        }
      }

      // Load ticket types
      const { data: ticketTypesData } = await supabase
        .from('event_ticket_types')
        .select('*')
        .eq('event_id', params.id)
        .eq('is_active', true)
        .order('price', { ascending: true })
      setTicketTypes(ticketTypesData || [])

      // Auto-select first available ticket type
      if (ticketTypesData && ticketTypesData.length > 0) {
        const availableTicket = ticketTypesData.find(
          (t: any) => !t.quantity_total || t.quantity_sold < t.quantity_total
        )
        if (availableTicket) {
          setSelectedTicketType(availableTicket.id)
        }
      }

      // Load speakers
      const { data: speakersData } = await supabase
        .from('event_speakers')
        .select('*')
        .eq('event_id', params.id)
        .order('order_index', { ascending: true })
      setSpeakers(speakersData || [])

      // Load schedule
      const { data: scheduleData } = await supabase
        .from('event_schedule')
        .select('*')
        .eq('event_id', params.id)
        .order('start_time', { ascending: true })
      setSchedule(scheduleData || [])

      // Load FAQs
      const { data: faqsData } = await supabase
        .from('event_faqs')
        .select('*')
        .eq('event_id', params.id)
        .order('order_index', { ascending: true })
      setFaqs(faqsData || [])

      // Load reviews with user profiles
      const { data: reviewsData } = await supabase
        .from('event_reviews')
        .select(`
          *,
          user:profiles!event_reviews_user_id_fkey(
            full_name,
            avatar_url,
            country
          )
        `)
        .eq('event_id', params.id)
        .order('created_at', { ascending: false })
      setReviews(reviewsData || [])

      // Calculate average rating
      if (reviewsData && reviewsData.length > 0) {
        const avg = reviewsData.reduce((sum, r) => sum + r.rating, 0) / reviewsData.length
        setAverageRating(avg)
      } else {
        setAverageRating(0)
      }
    } catch (err: any) {
      console.error('Error loading event:', err)
      setError(err.message || 'Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleRSVP = async (status: 'going' | 'interested') => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setRsvping(true)
      setError(null)

      // Check capacity
      if (event.max_attendees && event.rsvp_count >= event.max_attendees && status === 'going') {
        throw new Error('This event is at full capacity')
      }

      if (rsvp) {
        // Update existing RSVP
        const { data, error } = await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('id', rsvp.id)
          .select()
          .single()

        if (error) throw error
        setRsvp(data)
      } else {
        // Create new RSVP
        const { data, error } = await supabase
          .from('event_rsvps')
          .insert({
            event_id: params.id,
            user_id: user.id,
            status
          })
          .select()
          .single()

        if (error) throw error
        setRsvp(data)
      }

      // Reload event to get updated RSVP count
      await loadEvent()
    } catch (err: any) {
      console.error('Error updating RSVP:', err)
      setError(err.message || 'Failed to update RSVP')
    } finally {
      setRsvping(false)
    }
  }

  const handleCancelRSVP = async () => {
    if (!rsvp) return

    try {
      setRsvping(true)
      setError(null)

      const { error } = await supabase
        .from('event_rsvps')
        .delete()
        .eq('id', rsvp.id)

      if (error) throw error

      setRsvp(null)
      await loadEvent()
    } catch (err: any) {
      console.error('Error canceling RSVP:', err)
      setError(err.message || 'Failed to cancel RSVP')
    } finally {
      setRsvping(false)
    }
  }

  const handleToggleSave = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setSaving(true)
      setError(null)

      if (isSaved) {
        // Unsave event
        const { error } = await supabase
          .from('saved_events')
          .delete()
          .eq('event_id', params.id)
          .eq('user_id', user.id)

        if (error) throw error
        setIsSaved(false)
      } else {
        // Save event
        const { error } = await supabase
          .from('saved_events')
          .insert({
            event_id: params.id,
            user_id: user.id
          })

        if (error) throw error
        setIsSaved(true)
      }
    } catch (err: any) {
      console.error('Error toggling save:', err)
      setError(err.message || 'Failed to save event')
    } finally {
      setSaving(false)
    }
  }

  const handleAddToCalendar = () => {
    if (!event) return

    // Format dates for iCalendar
    const formatICSDate = (date: string) => {
      return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    // Build location string
    let location = ''
    if (event.format === 'virtual') {
      location = 'Virtual Event'
    } else if (event.format === 'hybrid') {
      location = `${event.city || 'TBD'}, ${event.country || ''} + Online`
    } else {
      location = `${event.venue_name || ''}, ${event.city || ''}, ${event.country || ''}`.trim()
    }

    // Generate .ics file content
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AfroConnect//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${event.id}@afroconnect.com
DTSTAMP:${formatICSDate(new Date().toISOString())}
DTSTART:${formatICSDate(event.start_date)}
DTEND:${formatICSDate(event.end_date)}
SUMMARY:${event.title}
DESCRIPTION:${event.description?.replace(/\n/g, '\\n') || ''}
LOCATION:${location}
URL:${window.location.href}
STATUS:CONFIRMED
ORGANIZER;CN=${event.organizer?.full_name || 'AfroConnect'}
END:VEVENT
END:VCALENDAR`

    // Create blob and download
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = window.URL.createObjectURL(blob)
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  }

  const handleShareTwitter = () => {
    if (!event) return
    const text = `Check out this event: ${event.title}`
    const url = window.location.href
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
  }

  const handleShareFacebook = () => {
    if (!event) return
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
  }

  const handleShareLinkedIn = () => {
    if (!event) return
    const url = window.location.href
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank')
  }

  const handleShareEmail = () => {
    if (!event) return
    const subject = `Check out: ${event.title}`
    const body = `I thought you might be interested in this event:\n\n${event.title}\n\n${window.location.href}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  }

  const handleJoinWaitlist = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setJoiningWaitlist(true)
      setError(null)

      const { error } = await supabase
        .from('event_waitlist')
        .insert({
          event_id: params.id,
          user_id: user.id
        })

      if (error) throw error

      await loadEvent()
    } catch (err: any) {
      console.error('Error joining waitlist:', err)
      setError(err.message || 'Failed to join waitlist')
    } finally {
      setJoiningWaitlist(false)
    }
  }

  const handleLeaveWaitlist = async () => {
    try {
      setJoiningWaitlist(true)
      setError(null)

      const { error } = await supabase
        .from('event_waitlist')
        .delete()
        .eq('event_id', params.id)
        .eq('user_id', user.id)

      if (error) throw error

      setWaitlistEntry(null)
    } catch (err: any) {
      console.error('Error leaving waitlist:', err)
      setError(err.message || 'Failed to leave waitlist')
    } finally {
      setJoiningWaitlist(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    try {
      setSubmittingReview(true)
      setError(null)

      const { error } = await supabase
        .from('event_reviews')
        .insert({
          event_id: params.id,
          user_id: user.id,
          rating: reviewRating,
          review_text: reviewText.trim() || null,
          would_recommend: wouldRecommend
        })

      if (error) throw error

      // Reset form
      setShowReviewForm(false)
      setReviewRating(5)
      setReviewText('')
      setWouldRecommend(true)

      // Reload event to show new review
      await loadEvent()
    } catch (err: any) {
      console.error('Error submitting review:', err)
      setError(err.message || 'Failed to submit review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleDownloadQRCode = () => {
    if (!qrCodeRef.current || !rsvp || !event) return

    try {
      // Find the SVG element
      const svg = qrCodeRef.current.querySelector('svg')
      if (!svg) return

      // Create a canvas
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Set canvas size
      const svgSize = 200
      canvas.width = svgSize
      canvas.height = svgSize

      // Convert SVG to data URL
      const svgData = new XMLSerializer().serializeToString(svg)
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      // Load image and draw to canvas
      const img = new window.Image()
      img.onload = () => {
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)

        // Convert to download
        canvas.toBlob((blob) => {
          if (!blob) return
          const downloadUrl = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.download = `${event.title.replace(/[^a-z0-9]/gi, '-')}-ticket-qr.png`
          link.href = downloadUrl
          link.click()
          URL.revokeObjectURL(downloadUrl)
        }, 'image/png')
      }
      img.src = url
    } catch (err) {
      console.error('Error downloading QR code:', err)
      setError('Failed to download QR code')
    }
  }

  const handleGenerateCertificate = async () => {
    if (!user || !rsvp?.checked_in) return

    try {
      setGeneratingCertificate(true)
      setError(null)

      // Check if certificate already exists
      if (certificate) {
        setShowCertificate(true)
        return
      }

      // Create new certificate
      const { data: newCert, error: certError } = await supabase
        .from('event_certificates')
        .insert({
          event_id: params.id,
          user_id: user.id,
          rsvp_id: rsvp.id,
          certificate_number: '' // Will be auto-generated by trigger
        })
        .select()
        .single()

      if (certError) throw certError

      setCertificate(newCert)
      setShowCertificate(true)
    } catch (err: any) {
      console.error('Error generating certificate:', err)
      setError(err.message || 'Failed to generate certificate')
    } finally {
      setGeneratingCertificate(false)
    }
  }

  const handleDownloadCertificatePDF = async () => {
    if (!certificateRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save(`${event.title.replace(/[^a-z0-9]/gi, '-')}-certificate.pdf`)
    } catch (err) {
      console.error('Error downloading PDF:', err)
      setError('Failed to download PDF')
    }
  }

  const handleDownloadCertificateImage = async () => {
    if (!certificateRef.current) return

    try {
      const html2canvas = (await import('html2canvas')).default

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false
      })

      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = `${event.title.replace(/[^a-z0-9]/gi, '-')}-certificate.png`
        link.href = url
        link.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    } catch (err) {
      console.error('Error downloading image:', err)
      setError('Failed to download image')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', params.id)

      if (error) throw error

      router.push('/events')
    } catch (err: any) {
      console.error('Error deleting event:', err)
      setError(err.message || 'Failed to delete event')
      setDeleting(false)
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/events"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Back to Events
          </Link>
        </div>
      </AuthenticatedLayout>
    )
  }

  const isOrganizer = user?.id === event?.organizer_id
  const startDate = new Date(event.start_date)
  const endDate = new Date(event.end_date)
  const isPast = endDate < new Date()
  const spotsLeft = event.max_attendees ? event.max_attendees - (event.rsvp_count || 0) : null

  return (
    <AuthenticatedLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeIn}
        >
          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800 flex-1">{error}</p>
            </div>
          )}

          {/* Cover Image */}
          <div className="relative h-96 rounded-xl overflow-hidden mb-8 bg-gradient-to-br from-primary-500 to-primary-600">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="h-32 w-32 text-white opacity-30" />
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-6 left-6 flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-primary-700 rounded-full text-sm font-bold uppercase shadow-lg">
                {event.event_type}
              </span>
              <span className="px-4 py-2 bg-white/90 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium shadow-lg">
                {event.format}
              </span>
              {event.is_free && (
                <span className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-bold shadow-lg">
                  FREE
                </span>
              )}
              {isPast && (
                <span className="px-4 py-2 bg-gray-500 text-white rounded-full text-sm font-medium shadow-lg">
                  Past Event
                </span>
              )}
            </div>

            {/* Organizer Actions */}
            {isOrganizer && (
              <div className="absolute top-6 right-6 flex gap-2">
                <Link
                  href={`/events/${event.id}/edit`}
                  className="p-3 bg-white/90 backdrop-blur-sm text-navy-900 rounded-lg hover:bg-white transition-colors shadow-lg"
                >
                  <Edit className="h-5 w-5" />
                </Link>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-3 bg-red-500/90 backdrop-blur-sm text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg disabled:opacity-50"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Title & Description */}
              <div>
                <h1 className="text-4xl font-display font-bold text-navy-900 mb-4">
                  {event.title}
                </h1>
                <p className="text-lg text-gray-700 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>

              {/* Event Details */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h2 className="text-xl font-bold text-navy-900 mb-4">Event Details</h2>
                <div className="space-y-4">
                  {/* Date & Time */}
                  <div className="flex items-start gap-3">
                    <Calendar className="h-6 w-6 text-primary-600 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-medium text-navy-900">
                        {startDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-sm text-gray-600">
                        {startDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                        {' - '}
                        {endDate.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                        {' '}({event.timezone})
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-3">
                    {event.format === 'virtual' ? (
                      <Video className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
                    ) : (
                      <MapPin className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
                    )}
                    <div className="flex-1">
                      {event.format === 'virtual' && (
                        <>
                          <div className="font-medium text-navy-900">Virtual Event</div>
                          {rsvp?.status === 'going' && event.virtual_link && (
                            <a
                              href={event.virtual_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-1"
                            >
                              Join Event <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </>
                      )}
                      {event.format === 'in-person' && (
                        <>
                          {event.venue_name && (
                            <div className="font-medium text-navy-900">{event.venue_name}</div>
                          )}
                          <div className="text-sm text-gray-600">
                            {event.address && <div>{event.address}</div>}
                            <div>
                              {event.city}
                              {event.country && `, ${event.country}`}
                            </div>
                          </div>
                        </>
                      )}
                      {event.format === 'hybrid' && (
                        <>
                          <div className="font-medium text-navy-900">Hybrid Event</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.city}
                              {event.country && `, ${event.country}`}
                            </div>
                            {rsvp?.status === 'going' && event.virtual_link && (
                              <a
                                href={event.virtual_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 mt-1"
                              >
                                <Video className="h-4 w-4" />
                                Join Online <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="flex items-start gap-3">
                    <Users className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                    <div>
                      <div className="font-medium text-navy-900">
                        {event.rsvp_count || 0} attending
                      </div>
                      {spotsLeft !== null && (
                        <div className="text-sm text-gray-600">
                          {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Event is full'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  {!event.is_free && (
                    <div className="flex items-start gap-3">
                      <DollarSign className="h-6 w-6 text-gold-600 flex-shrink-0 mt-1" />
                      <div>
                        <div className="font-medium text-navy-900">
                          {event.currency} ${event.ticket_price}
                        </div>
                        <div className="text-sm text-gray-600">Per ticket</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-navy-900 mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag: string) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Speakers Section */}
              {speakers.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-navy-900 mb-6">Speakers</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {speakers.map((speaker) => (
                      <div key={speaker.id} className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                          {speaker.photo_url ? (
                            <Image
                              src={speaker.photo_url}
                              alt={speaker.name}
                              width={64}
                              height={64}
                              className="rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-bold text-white">
                              {speaker.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-navy-900">{speaker.name}</h3>
                          {speaker.title && (
                            <p className="text-sm text-gray-600">{speaker.title}</p>
                          )}
                          {speaker.company && (
                            <p className="text-sm text-primary-600">{speaker.company}</p>
                          )}
                          {speaker.bio && (
                            <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                              {speaker.bio}
                            </p>
                          )}
                          <div className="flex gap-2 mt-2">
                            {speaker.linkedin_url && (
                              <a
                                href={speaker.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700"
                              >
                                <Linkedin className="h-4 w-4" />
                              </a>
                            )}
                            {speaker.twitter_url && (
                              <a
                                href={speaker.twitter_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-500"
                              >
                                <Twitter className="h-4 w-4" />
                              </a>
                            )}
                            {speaker.website_url && (
                              <a
                                href={speaker.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-700"
                              >
                                <LinkIcon className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Schedule */}
              {schedule.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-navy-900 mb-6">Event Schedule</h2>
                  <div className="space-y-4">
                    {schedule.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-primary-600"></div>
                          {index < schedule.length - 1 && (
                            <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-sm font-medium text-primary-600">
                                  {new Date(item.start_time).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                  {' - '}
                                  {new Date(item.end_time).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {item.session_type && (
                                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium uppercase">
                                    {item.session_type}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-bold text-navy-900 mb-1">{item.title}</h3>
                              {item.description && (
                                <p className="text-sm text-gray-700 mb-2">{item.description}</p>
                              )}
                              {item.speaker_name && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Speaker:</span> {item.speaker_name}
                                </p>
                              )}
                              {item.location && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Location:</span> {item.location}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FAQs */}
              {faqs.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-navy-900 mb-6 flex items-center gap-2">
                    <HelpCircle className="h-6 w-6" />
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {faqs.map((faq) => (
                      <div key={faq.id} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <h3 className="font-bold text-navy-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-700">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews & Ratings */}
              {reviews.length > 0 && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-navy-900">Reviews</h2>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-5 w-5 ${
                              star <= Math.round(averageRating)
                                ? 'text-gold-500 fill-gold-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-navy-900">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-gray-600">
                        ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {review.user?.full_name?.charAt(0) || 'A'}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <h4 className="font-bold text-navy-900">
                                  {review.user?.full_name || 'Anonymous'}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {review.user?.country || 'Unknown'} •{' '}
                                  {new Date(review.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= review.rating
                                        ? 'text-gold-500 fill-gold-500'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            {review.review_text && (
                              <p className="text-gray-700">{review.review_text}</p>
                            )}
                            {review.would_recommend !== null && (
                              <p className="text-sm text-gray-600 mt-2">
                                {review.would_recommend ? '✓ Would recommend' : '✗ Would not recommend'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Write a Review (Past events only, for attendees who haven't reviewed) */}
              {isPast && rsvp?.status === 'going' && !reviews.find(r => r.user_id === user?.id) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h2 className="text-2xl font-bold text-navy-900 mb-6">Write a Review</h2>

                  {!showReviewForm ? (
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
                    >
                      Share Your Experience
                    </button>
                  ) : (
                    <div className="space-y-4">
                      {/* Star Rating */}
                      <div>
                        <label className="block text-sm font-medium text-navy-900 mb-2">
                          Rating <span className="text-red-600">*</span>
                        </label>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setReviewRating(star)}
                              className="focus:outline-none transition-transform hover:scale-110"
                            >
                              <Star
                                className={`h-8 w-8 ${
                                  star <= reviewRating
                                    ? 'text-gold-500 fill-gold-500'
                                    : 'text-gray-300 hover:text-gold-400'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Review Text */}
                      <div>
                        <label className="block text-sm font-medium text-navy-900 mb-2">
                          Your Review (Optional)
                        </label>
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Share your thoughts about this event..."
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        />
                      </div>

                      {/* Would Recommend */}
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="would-recommend"
                          checked={wouldRecommend}
                          onChange={(e) => setWouldRecommend(e.target.checked)}
                          className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <label htmlFor="would-recommend" className="text-sm font-medium text-navy-900 cursor-pointer">
                          I would recommend this event
                        </label>
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-3">
                        <button
                          onClick={handleSubmitReview}
                          disabled={submittingReview}
                          className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                        <button
                          onClick={() => setShowReviewForm(false)}
                          disabled={submittingReview}
                          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* RSVP Card */}
              {!isPast && (
                <div className="bg-white rounded-xl p-6 border border-gray-200 sticky top-8">
                  <h3 className="text-xl font-bold text-navy-900 mb-4">
                    {ticketTypes.length > 0 ? 'Select Ticket' : 'RSVP'}
                  </h3>

                  {/* Ticket Types Selection */}
                  {ticketTypes.length > 0 && !rsvp && (
                    <div className="space-y-3 mb-6">
                      {ticketTypes.map((ticket) => {
                        const isSoldOut = ticket.quantity_total && ticket.quantity_sold >= ticket.quantity_total
                        const spotsLeft = ticket.quantity_total ? ticket.quantity_total - ticket.quantity_sold : null
                        const isSelected = selectedTicketType === ticket.id

                        return (
                          <div
                            key={ticket.id}
                            onClick={() => !isSoldOut && setSelectedTicketType(ticket.id)}
                            className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-primary-600 bg-primary-50'
                                : isSoldOut
                                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                : 'border-gray-200 hover:border-primary-400'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-navy-900">{ticket.name}</h4>
                                {ticket.description && (
                                  <p className="text-sm text-gray-600 mt-1">{ticket.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-3">
                                <div className="font-bold text-navy-900">
                                  {ticket.price > 0 ? (
                                    <>{ticket.currency} ${ticket.price}</>
                                  ) : (
                                    'FREE'
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Benefits */}
                            {ticket.benefits && ticket.benefits.length > 0 && (
                              <ul className="text-sm text-gray-700 space-y-1 mt-2">
                                {ticket.benefits.map((benefit: string, idx: number) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                    <span>{benefit}</span>
                                  </li>
                                ))}
                              </ul>
                            )}

                            {/* Availability */}
                            <div className="mt-2 text-sm">
                              {isSoldOut ? (
                                <span className="text-red-600 font-medium">Sold Out</span>
                              ) : spotsLeft !== null && spotsLeft <= 10 ? (
                                <span className="text-orange-600 font-medium">
                                  Only {spotsLeft} left!
                                </span>
                              ) : spotsLeft !== null ? (
                                <span className="text-gray-600">{spotsLeft} available</span>
                              ) : (
                                <span className="text-gray-600">Unlimited availability</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {rsvp ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-green-900">
                            You're {rsvp.status === 'going' ? 'attending' : 'interested'}
                          </div>
                          <div className="text-sm text-green-700">
                            We'll send you reminders
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {rsvp.status === 'interested' && (
                          <button
                            onClick={() => handleRSVP('going')}
                            disabled={rsvping || (spotsLeft !== null && spotsLeft === 0)}
                            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {rsvping ? 'Updating...' : 'Change to Attending'}
                          </button>
                        )}
                        {rsvp.status === 'going' && (
                          <button
                            onClick={() => handleRSVP('interested')}
                            disabled={rsvping}
                            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                          >
                            {rsvping ? 'Updating...' : 'Change to Interested'}
                          </button>
                        )}
                        <button
                          onClick={handleCancelRSVP}
                          disabled={rsvping}
                          className="w-full px-6 py-3 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {rsvping ? 'Canceling...' : 'Cancel RSVP'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <button
                        onClick={() => handleRSVP('going')}
                        disabled={rsvping || (spotsLeft !== null && spotsLeft === 0)}
                        className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {rsvping ? 'Processing...' : spotsLeft === 0 ? 'Event Full' : 'I\'m Attending'}
                      </button>
                      <button
                        onClick={() => handleRSVP('interested')}
                        disabled={rsvping}
                        className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        {rsvping ? 'Processing...' : 'I\'m Interested'}
                      </button>

                      {/* Waitlist when event is full */}
                      {spotsLeft === 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          {waitlistEntry ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                                <Clock className="h-6 w-6 text-orange-600 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-orange-900">
                                    You're on the waitlist
                                  </div>
                                  <div className="text-sm text-orange-700">
                                    Position #{waitlistEntry.position}
                                  </div>
                                  <div className="text-xs text-orange-600 mt-1">
                                    We'll notify you if a spot opens
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={handleLeaveWaitlist}
                                disabled={joiningWaitlist}
                                className="w-full px-6 py-2 border border-orange-300 text-orange-600 rounded-lg text-sm font-medium hover:bg-orange-50 transition-colors disabled:opacity-50"
                              >
                                {joiningWaitlist ? 'Leaving...' : 'Leave Waitlist'}
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800 text-center">
                                  Event is full. Join the waitlist to be notified if spots open up!
                                </p>
                              </div>
                              <button
                                onClick={handleJoinWaitlist}
                                disabled={joiningWaitlist}
                                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50"
                              >
                                {joiningWaitlist ? 'Joining...' : 'Join Waitlist'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Organizer Card */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4">Organizer</h3>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-white">
                      {event.organizer?.full_name?.charAt(0) || 'O'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-navy-900">
                      {event.organizer?.full_name || 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {event.organizer?.country || 'Global'}
                    </div>
                    {event.organizer?.bio && (
                      <p className="text-sm text-gray-700 mt-2 line-clamp-3">
                        {event.organizer.bio}
                      </p>
                    )}
                  </div>
                </div>
                {isOrganizer && (
                  <>
                    <Link
                      href={`/events/${event.id}/attendees`}
                      className="mt-4 block w-full px-6 py-3 bg-gold-600 text-white rounded-lg font-medium text-center hover:bg-gold-700 transition-colors"
                    >
                      Manage Attendees
                    </Link>
                    <Link
                      href={`/events/${event.id}/manage-speakers`}
                      className="mt-2 block w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-medium text-center hover:bg-purple-700 transition-colors"
                    >
                      Manage Speakers
                    </Link>
                    <Link
                      href={`/events/${event.id}/manage-schedule`}
                      className="mt-2 block w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium text-center hover:bg-blue-700 transition-colors"
                    >
                      Manage Schedule
                    </Link>
                    <Link
                      href={`/events/${event.id}/analytics`}
                      className="mt-2 block w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium text-center hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg"
                    >
                      📊 View Analytics
                    </Link>
                    <Link
                      href={`/events/${event.id}/manage-materials`}
                      className="mt-2 block w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-medium text-center hover:bg-orange-700 transition-colors"
                    >
                      Manage Materials
                    </Link>
                    <Link
                      href={`/events/${event.id}/manage-promo-codes`}
                      className="mt-2 block w-full px-6 py-3 bg-pink-600 text-white rounded-lg font-medium text-center hover:bg-pink-700 transition-colors"
                    >
                      🎟️ Manage Promo Codes
                    </Link>
                    <Link
                      href={`/events/${event.id}/manage-reminders`}
                      className="mt-2 block w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium text-center hover:bg-indigo-700 transition-colors"
                    >
                      📧 Email Reminders
                    </Link>
                  </>
                )}
              </div>

              {/* Networking - View Attendees */}
              {rsvp?.status === 'going' && (
                <div className="space-y-2">
                  <Link
                    href={`/events/${event.id}/networking`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Users className="h-5 w-5" />
                    View Attendees & Network
                  </Link>
                  <Link
                    href={`/events/${event.id}/connections`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    <UserCheck className="h-5 w-5" />
                    My Connections
                  </Link>
                  <Link
                    href={`/events/${event.id}/materials`}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors"
                  >
                    <Download className="h-5 w-5" />
                    Event Materials
                  </Link>
                </div>
              )}

              {/* QR Code Ticket */}
              {rsvp?.status === 'going' && !isPast && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    My Ticket
                  </h3>
                  <button
                    onClick={() => setShowQRTicket(true)}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    <QrCode className="h-5 w-5" />
                    Show QR Code
                  </button>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    Present this QR code at check-in
                  </p>
                </div>
              )}

              {/* Certificate of Attendance */}
              {rsvp?.checked_in && isPast && (
                <div className="bg-gradient-to-br from-gold-50 to-amber-50 rounded-xl p-6 border-2 border-gold-300">
                  <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-gold-600" />
                    Certificate Available
                  </h3>
                  <button
                    onClick={handleGenerateCertificate}
                    disabled={generatingCertificate}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gold-600 to-amber-600 text-white rounded-lg font-medium hover:from-gold-700 hover:to-amber-700 transition-all shadow-lg disabled:opacity-50"
                  >
                    <Download className="h-5 w-5" />
                    {generatingCertificate ? 'Generating...' : 'Download Certificate'}
                  </button>
                  <p className="text-xs text-gray-700 mt-3 text-center font-medium">
                    🎓 You attended this event! Get your certificate.
                  </p>
                </div>
              )}

              {/* Save/Bookmark */}
              <button
                onClick={handleToggleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  isSaved
                    ? 'bg-gold-50 border-2 border-gold-500 text-gold-700 hover:bg-gold-100'
                    : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {isSaved ? (
                  <>
                    <BookmarkCheck className="h-5 w-5" />
                    {saving ? 'Removing...' : 'Saved'}
                  </>
                ) : (
                  <>
                    <Bookmark className="h-5 w-5" />
                    {saving ? 'Saving...' : 'Save Event'}
                  </>
                )}
              </button>

              {/* Add to Calendar */}
              <button
                onClick={handleAddToCalendar}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                Add to Calendar
              </button>

              {/* Share Event */}
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold text-navy-900 mb-4 flex items-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share Event
                </h3>

                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all mb-3 ${
                    linkCopied
                      ? 'bg-green-50 border-2 border-green-500 text-green-700'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copy Link
                    </>
                  )}
                </button>

                {/* Social Media Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleShareTwitter}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-400 text-white rounded-lg font-medium hover:bg-blue-500 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </button>
                  <button
                    onClick={handleShareFacebook}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </button>
                  <button
                    onClick={handleShareLinkedIn}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 text-white rounded-lg font-medium hover:bg-blue-800 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </button>
                  <button
                    onClick={handleShareEmail}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* QR Code Ticket Modal */}
        {showQRTicket && rsvp && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Your Ticket</h2>
                <button
                  onClick={() => setShowQRTicket(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="text-center">
                {/* Event Info */}
                <div className="mb-6">
                  <h3 className="font-bold text-lg text-navy-900 mb-2">{event.title}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(event.start_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(event.start_date).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                {/* QR Code */}
                <div
                  ref={qrCodeRef}
                  className="bg-white p-6 rounded-xl border-4 border-dashed border-gray-300 inline-block mb-6"
                >
                  <QRCodeSVG
                    value={JSON.stringify({
                      rsvp_id: rsvp.id,
                      event_id: event.id,
                      user_id: user.id,
                      timestamp: new Date().toISOString()
                    })}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>

                {/* Download Button */}
                <button
                  onClick={handleDownloadQRCode}
                  className="mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors mx-auto"
                >
                  <Download className="h-5 w-5" />
                  Download QR Code
                </button>

                {/* Attendee Info */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="text-sm">
                    <p className="text-gray-600 mb-1">Attendee</p>
                    <p className="font-bold text-navy-900">{user?.email}</p>
                  </div>
                  <div className="text-sm mt-3">
                    <p className="text-gray-600 mb-1">Status</p>
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      <CheckCircle className="h-3 w-3" />
                      {rsvp.checked_in ? 'Checked In' : 'Confirmed'}
                    </span>
                  </div>
                </div>

                {/* Instructions */}
                <p className="text-xs text-gray-500">
                  Present this QR code to event staff for check-in
                </p>
              </div>
            </motion.div>
          </div>
        )}

        {/* Certificate Modal */}
        {showCertificate && certificate && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Your Certificate</h2>
                <button
                  onClick={() => setShowCertificate(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              {/* Certificate Design */}
              <div ref={certificateRef} className="bg-white p-12 border-8 border-double border-gold-500 rounded-lg relative overflow-hidden">
                {/* Decorative Corner Elements */}
                <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-gold-400 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-gold-400 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-gold-400 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-gold-400 rounded-br-lg"></div>

                <div className="text-center space-y-6 relative z-10">
                  {/* Header */}
                  <div className="mb-8">
                    <h1 className="text-5xl font-serif font-bold text-navy-900 mb-2">AfroConnect</h1>
                    <div className="w-24 h-1 bg-gradient-to-r from-gold-400 via-gold-600 to-gold-400 mx-auto"></div>
                  </div>

                  {/* Title */}
                  <h2 className="text-3xl font-serif font-bold text-gray-800 mb-8">
                    Certificate of Attendance
                  </h2>

                  {/* Certificate Body */}
                  <div className="space-y-6 max-w-2xl mx-auto">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      This is to certify that
                    </p>

                    <p className="text-4xl font-serif font-bold text-navy-900 py-4 border-b-2 border-gold-400">
                      {user?.user_metadata?.full_name || user?.email}
                    </p>

                    <p className="text-lg text-gray-700 leading-relaxed">
                      has successfully attended
                    </p>

                    <p className="text-3xl font-serif font-bold text-primary-700 py-4">
                      {event.title}
                    </p>

                    <p className="text-lg text-gray-700">
                      held on{' '}
                      <span className="font-semibold">
                        {new Date(event.start_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </p>

                    {event.location && (
                      <p className="text-md text-gray-600">
                        at {event.location}
                      </p>
                    )}
                  </div>

                  {/* Signature Section */}
                  <div className="mt-12 pt-8 border-t border-gray-300">
                    <div className="flex justify-between items-end max-w-2xl mx-auto">
                      <div className="text-left">
                        <div className="mb-2">
                          <p className="text-sm text-gray-500">Date Issued</p>
                          <p className="font-semibold text-gray-800">
                            {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="border-t-2 border-gray-800 w-48 mb-2"></div>
                        <p className="font-semibold text-gray-800">{event.organizer?.full_name || 'Event Organizer'}</p>
                        <p className="text-sm text-gray-600">Event Organizer</p>
                      </div>
                    </div>
                  </div>

                  {/* Certificate Number */}
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-mono">
                      Certificate No: {certificate.certificate_number}
                    </p>
                  </div>
                </div>
              </div>

              {/* Download Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleDownloadCertificatePDF}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  Download as PDF
                </button>
                <button
                  onClick={handleDownloadCertificateImage}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="h-5 w-5" />
                  Download as Image
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Share your achievement on LinkedIn or social media!
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

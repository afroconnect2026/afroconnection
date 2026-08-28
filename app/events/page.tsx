'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import { motion } from 'framer-motion'
import {
  Calendar,
  MapPin,
  Users,
  Search,
  Filter,
  Clock,
  Video,
  Building2,
  Zap,
  Globe,
  Plus,
  X,
  Grid3x3,
  ChevronLeft,
  ChevronRight
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

function EventsPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || '')
  const [selectedFormat, setSelectedFormat] = useState<string>(searchParams.get('format') || '')
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || '')
  const [timeFilter, setTimeFilter] = useState<'upcoming' | 'past'>('upcoming')
  const [showFilters, setShowFilters] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)

  // View mode
  const [viewMode, setViewMode] = useState<'grid' | 'calendar'>('grid')
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  const eventTypes = [
    { value: 'conference', label: 'Conference', icon: Building2 },
    { value: 'meetup', label: 'Meetup', icon: Users },
    { value: 'webinar', label: 'Webinar', icon: Video },
    { value: 'workshop', label: 'Workshop', icon: Zap },
    { value: 'networking', label: 'Networking', icon: Globe }
  ]

  const formatOptions = [
    { value: 'in-person', label: 'In-Person', icon: MapPin },
    { value: 'virtual', label: 'Virtual', icon: Video },
    { value: 'hybrid', label: 'Hybrid', icon: Globe }
  ]

  useEffect(() => {
    loadUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadEvents()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedType, selectedFormat, selectedCity, timeFilter, dateFrom, dateTo, priceMin, priceMax, freeOnly])

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadEvents = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('events')
        .select(`
          *,
          organizer:profiles!events_organizer_id_fkey(id, full_name, avatar_url, country)
        `)
        .eq('status', 'published')

      // Type filter
      if (selectedType) {
        query = query.eq('event_type', selectedType)
      }

      // Format filter
      if (selectedFormat) {
        query = query.eq('format', selectedFormat)
      }

      // City filter
      if (selectedCity) {
        query = query.ilike('city', `%${selectedCity}%`)
      }

      // Free events only filter
      if (freeOnly) {
        query = query.eq('is_free', true)
      }

      // Date range filter
      if (dateFrom) {
        query = query.gte('start_date', new Date(dateFrom).toISOString())
      }
      if (dateTo) {
        query = query.lte('start_date', new Date(dateTo).toISOString())
      }

      // Time filter (if no custom date range)
      if (!dateFrom && !dateTo) {
        const now = new Date().toISOString()
        if (timeFilter === 'upcoming') {
          query = query.gte('start_date', now)
          query = query.order('start_date', { ascending: true })
        } else {
          query = query.lt('start_date', now)
          query = query.order('start_date', { ascending: false })
        }
      } else {
        query = query.order('start_date', { ascending: true })
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading events:', error)
        return
      }

      // Apply search and price filters on client side
      let filteredData = data || []

      // Search filter
      if (searchQuery.trim()) {
        const lowerQuery = searchQuery.toLowerCase()
        filteredData = filteredData.filter(
          (event: any) =>
            event.title?.toLowerCase().includes(lowerQuery) ||
            event.description?.toLowerCase().includes(lowerQuery) ||
            event.city?.toLowerCase().includes(lowerQuery) ||
            event.country?.toLowerCase().includes(lowerQuery)
        )
      }

      // Price range filter
      if (priceMin || priceMax) {
        filteredData = filteredData.filter((event: any) => {
          if (event.is_free) return false // Exclude free events when price filter is active
          const price = parseFloat(event.ticket_price) || 0
          const min = priceMin ? parseFloat(priceMin) : 0
          const max = priceMax ? parseFloat(priceMax) : Infinity
          return price >= min && price <= max
        })
      }

      setEvents(filteredData)
    } catch (err) {
      console.error('Error loading events:', err)
    } finally {
      setLoading(false)
    }
  }

  const clearFilters = () => {
    setSelectedType('')
    setSelectedFormat('')
    setSelectedCity('')
    setSearchQuery('')
    setDateFrom('')
    setDateTo('')
    setPriceMin('')
    setPriceMax('')
    setFreeOnly(false)
    router.push('/events')
  }

  const hasActiveFilters = selectedType || selectedFormat || selectedCity || searchQuery || dateFrom || dateTo || priceMin || priceMax || freeOnly

  const renderEventCard = (event: any) => {
    const startDate = new Date(event.start_date)
    const isMultiDay = new Date(event.end_date).toDateString() !== startDate.toDateString()

    return (
      <motion.div
        key={event.id}
        variants={fadeIn}
        className="bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all group"
      >
        <Link href={`/events/${event.id}`}>
          {/* Cover Image */}
          <div className="relative h-48 bg-gradient-to-br from-primary-500 to-primary-600 overflow-hidden">
            {event.cover_image_url ? (
              <Image
                src={event.cover_image_url}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Calendar className="h-16 w-16 text-white opacity-30" />
              </div>
            )}
            {/* Date Badge */}
            <div className="absolute top-4 left-4 bg-white rounded-lg p-3 text-center shadow-lg">
              <div className="text-2xl font-bold text-navy-900">
                {startDate.getDate()}
              </div>
              <div className="text-xs font-medium text-gray-600 uppercase">
                {startDate.toLocaleString('default', { month: 'short' })}
              </div>
            </div>
            {/* Featured Badge */}
            {event.is_featured && (
              <div className="absolute top-4 right-4 bg-gold-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                Featured
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Type & Format Badges */}
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium uppercase">
                {event.event_type}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                {event.format}
              </span>
              {event.is_free && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
                  FREE
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-navy-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
              {event.title}
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {event.description}
            </p>

            {/* Event Details */}
            <div className="space-y-2 mb-4">
              {/* Date & Time */}
              <div className="flex items-center text-sm text-gray-700">
                <Clock className="h-4 w-4 mr-2 text-primary-600 flex-shrink-0" />
                <span>
                  {startDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                  {' • '}
                  {startDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit'
                  })}
                  {isMultiDay && (
                    <span className="text-gray-500 ml-1">(Multi-day)</span>
                  )}
                </span>
              </div>

              {/* Location */}
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

              {/* Attendees */}
              <div className="flex items-center text-sm text-gray-700">
                <Users className="h-4 w-4 mr-2 text-green-600 flex-shrink-0" />
                <span>
                  {event.rsvp_count || 0} attending
                  {event.max_attendees && ` • ${event.max_attendees - (event.rsvp_count || 0)} spots left`}
                </span>
              </div>
            </div>

            {/* Organizer */}
            <div className="flex items-center pt-4 border-t border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-white">
                  {event.organizer?.full_name?.charAt(0) || 'O'}
                </span>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {event.organizer?.full_name || 'Anonymous'}
                </p>
                <p className="text-xs text-gray-500">
                  Organizer
                </p>
              </div>
              {!event.is_free && (
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">
                    ${event.ticket_price}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.currency || 'USD'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Link>
      </motion.div>
    )
  }

  const renderSkeleton = () => (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 animate-pulse">
      <div className="h-48 bg-gray-200"></div>
      <div className="p-6 space-y-4">
        <div className="flex gap-2">
          <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
          <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
        </div>
        <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>
  )

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start_date)
      return (
        eventDate.getFullYear() === date.getFullYear() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getDate() === date.getDate()
      )
    })
  }

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth)
    const days = []
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square"></div>)
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dayEvents = getEventsForDate(date)
      const isToday =
        date.toDateString() === new Date().toDateString()
      const isSelected =
        selectedDate && date.toDateString() === selectedDate.toDateString()

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(date)}
          className={`aspect-square p-2 rounded-lg border transition-all ${
            isSelected
              ? 'bg-primary-600 text-white border-primary-600'
              : isToday
              ? 'bg-primary-50 border-primary-300 text-primary-700'
              : dayEvents.length > 0
              ? 'bg-green-50 border-green-200 hover:border-green-300'
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <div className="text-sm font-medium">{day}</div>
          {dayEvents.length > 0 && (
            <div className="flex justify-center gap-0.5 mt-1">
              {dayEvents.slice(0, 3).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1 h-1 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-primary-600'
                  }`}
                ></div>
              ))}
            </div>
          )}
        </button>
      )
    }

    return (
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-navy-900">
            {currentMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => changeMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {dayNames.map(name => (
            <div
              key={name}
              className="text-center text-sm font-medium text-gray-600"
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-2">{days}</div>

        {/* Selected date events */}
        {selectedDate && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-navy-900 mb-4">
              Events on{' '}
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </h3>
            {getEventsForDate(selectedDate).length > 0 ? (
              <div className="space-y-3">
                {getEventsForDate(selectedDate).map(event => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-navy-900 mb-1">
                          {event.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(event.start_date).toLocaleTimeString(
                              'en-US',
                              { hour: 'numeric', minute: '2-digit' }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.format}
                          </span>
                        </div>
                      </div>
                      {!event.is_free && (
                        <div className="text-right">
                          <p className="text-sm font-bold text-green-600">
                            ${event.ticket_price}
                          </p>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                No events on this date
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold text-navy-900 mb-2">
              Events & Networking
            </h1>
            <p className="text-gray-600">
              Connect, learn, and grow with Africa's tech community
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

        {/* Time Tabs & View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setTimeFilter('upcoming')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                timeFilter === 'upcoming'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
              }`}
            >
              Upcoming Events
            </button>
            <button
              onClick={() => setTimeFilter('past')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                timeFilter === 'past'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-primary-300'
              }`}
            >
              Past Events
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3x3 className="h-4 w-4" />
              Grid
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-navy-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          {/* Search Bar */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events by title, location, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
              {hasActiveFilters && !showFilters && (
                <span className="bg-white text-primary-600 rounded-full w-5 h-5 text-xs font-bold flex items-center justify-center">
                  !
                </span>
              )}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
              >
                <X className="h-5 w-5" />
                Clear
              </button>
            )}
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-4 border-t border-gray-200 space-y-4"
            >
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {eventTypes.map((type) => {
                    const Icon = type.icon
                    return (
                      <button
                        key={type.value}
                        onClick={() =>
                          setSelectedType(selectedType === type.value ? '' : type.value)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          selectedType === type.value
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {type.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Format
                </label>
                <div className="flex flex-wrap gap-2">
                  {formatOptions.map((format) => {
                    const Icon = format.icon
                    return (
                      <button
                        key={format.value}
                        onClick={() =>
                          setSelectedFormat(selectedFormat === format.value ? '' : format.value)
                        }
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                          selectedFormat === format.value
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {format.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  placeholder="e.g., Nairobi, Lagos, Cape Town..."
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="From"
                    />
                  </div>
                  <div>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (USD)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <input
                      type="number"
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      placeholder="Min"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      placeholder="Max"
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Free Events Only */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="free-only"
                  checked={freeOnly}
                  onChange={(e) => setFreeOnly(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="free-only" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Show free events only
                </label>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i}>{renderSkeleton()}</div>
            ))}
          </div>
        ) : viewMode === 'calendar' ? (
          renderCalendar()
        ) : events.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {events.map(renderEventCard)}
          </motion.div>
        ) : (
          <div className="text-center py-16">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No {timeFilter} events found
            </h3>
            <p className="text-gray-600 mb-6">
              {hasActiveFilters
                ? 'Try adjusting your filters to see more events'
                : timeFilter === 'upcoming'
                ? 'Be the first to create an event for the community'
                : 'Check back later for past events'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <Link
                href="/events/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Event
              </Link>
            )}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  )
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    }>
      <EventsPageContent />
    </Suspense>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

export const NOTIFICATION_ICONS: { [key: string]: string } = {
  message: '💬',
  application: '📝',
  opportunity: '💼',
  connection: '🤝',
  event: '📅',
  verification: '✅',
  admin_verification: '🛡️',
  admin_opportunity: '💼',
  admin_event: '📅',
  admin_report: '🚩',
  report: '🚩'
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()
  const [supabase] = useState(() => createClient())

  const loadNotifications = useCallback(async (uid: string) => {
    try {
      const [{ data: notifs, error }, { count }] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', uid)
          .order('created_at', { ascending: false })
          .limit(10),
        // true unread total (not just among the latest 10)
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', uid)
          .eq('read', false)
      ])
      if (error) throw error
      setNotifications(notifs || [])
      setUnreadCount(count ?? (notifs || []).filter(n => !n.read).length)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null
    let cancelled = false

    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || cancelled) {
        setLoading(false)
        return
      }
      setUserId(user.id)
      loadNotifications(user.id)

      // Real-time: subscribe to this user's new notifications.
      // (Previously the filter interpolated a Promise, so it never matched.)
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const n = payload.new as Notification
            setNotifications(prev => [n, ...prev.filter(p => p.id !== n.id)].slice(0, 10))
            setUnreadCount(prev => prev + 1)
            toast(n.title, { icon: NOTIFICATION_ICONS[n.type] || '🔔' })
          }
        )
        .subscribe()
    }
    init()

    return () => {
      cancelled = true
      if (channel) supabase.removeChannel(channel)
    }
  }, [supabase, loadNotifications])

  // Refresh when the tab regains focus (covers environments without realtime)
  useEffect(() => {
    if (!userId) return
    const onFocus = () => loadNotifications(userId)
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [userId, loadNotifications])

  const markAsRead = async (notificationId: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
    if (error) {
      console.error('Error marking notification as read:', error)
      return
    }
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    if (!userId) return
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    if (error) {
      toast.error('Failed to mark notifications as read')
      return
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    setShowDropdown(false)
    if (notification.link) {
      router.push(notification.link)
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <button
        onClick={() => {
          const next = !showDropdown
          setShowDropdown(next)
          if (next && userId) loadNotifications(userId)
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        aria-label={`Notifications${unreadCount ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          ></div>

          {/* Dropdown Content */}
          <div className="absolute right-0 mt-2 w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-[500px] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-gray-600 hover:text-gray-900 flex items-center gap-1"
                  >
                    <CheckCheck className="h-4 w-4" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => {
                    router.push('/notifications')
                    setShowDropdown(false)
                  }}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  View All
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                <div>
                  {notifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {NOTIFICATION_ICONS[notification.type] || '🔔'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.read ? 'font-semibold' : 'font-medium'} text-gray-900 mb-1`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

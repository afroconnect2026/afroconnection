'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCircle, FileText, Calendar, Flag, HelpCircle, CheckCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'
import { useAdminCounts } from '@/components/admin/AdminContext'
import { can } from '@/lib/admin'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}

export default function AdminNotificationBell({ admin }: { admin: any }) {
  const { counts, refresh } = useAdminCounts()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const loadNotifications = useCallback(async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', admin.id)
      .order('created_at', { ascending: false })
      .limit(15)
    if (error) {
      console.error('Error loading admin notifications:', error)
      return
    }
    setNotifications(data || [])
  }, [admin.id, supabase])

  useEffect(() => {
    loadNotifications()

    // Real-time: new notifications for this admin (requires notifications in the
    // supabase_realtime publication - see sql/VERIFICATION-NOTIFICATIONS-FIX.sql)
    const channel = supabase
      .channel(`admin-notifications-${admin.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${admin.id}` },
        (payload) => {
          const n = payload.new as Notification
          setNotifications((prev) => [n, ...prev.filter((p) => p.id !== n.id)].slice(0, 15))
          toast(n.title, { icon: '🔔' })
          refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [admin.id, supabase, loadNotifications, refresh])

  const role = admin?.role
  const items = [
    can(role, 'verify') && {
      label: 'Verification requests',
      count: counts.verifications,
      href: '/admin/verifications',
      icon: CheckCircle,
    },
    can(role, 'verify') && counts.verifications_info > 0 && {
      label: 'Waiting on user (info requested)',
      count: counts.verifications_info,
      href: '/admin/verifications?status=info_needed',
      icon: HelpCircle,
      muted: true,
    },
    can(role, 'moderate') && {
      label: 'Opportunities to review',
      count: counts.opportunities,
      href: '/admin/opportunities',
      icon: FileText,
    },
    can(role, 'moderate') && {
      label: 'Events to review',
      count: counts.events,
      href: '/admin/events',
      icon: Calendar,
    },
    can(role, 'reports') && {
      label: 'Open reports',
      count: counts.reports,
      href: '/admin/reports',
      icon: Flag,
    },
  ].filter(Boolean) as { label: string; count: number; href: string; icon: any; muted?: boolean }[]

  const actionable = items.filter((i) => !i.muted).reduce((sum, i) => sum + (i.count || 0), 0)
  const unread = notifications.filter((n) => !n.read).length
  const badge = actionable || unread

  const go = async (href: string, notification?: Notification) => {
    if (notification && !notification.read) {
      await supabase.from('notifications').update({ read: true }).eq('id', notification.id)
      setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
    }
    setOpen(false)
    router.push(href)
  }

  const markAllRead = async () => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', admin.id)
      .eq('read', false)
    if (error) {
      toast.error('Failed to mark notifications as read')
      return
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          const next = !open
          setOpen(next)
          if (next) {
            refresh()
            loadNotifications()
          }
        }}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notifications${badge ? ` (${badge})` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-96 max-h-[560px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Needs attention</h3>
            </div>
            <div className="py-1 border-b border-gray-200">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.href}
                    onClick={() => go(item.href)}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 text-left"
                  >
                    <span className={`flex items-center gap-3 text-sm ${item.muted ? 'text-gray-500' : 'text-gray-800'}`}>
                      <Icon className="w-4 h-4 text-gray-400" />
                      {item.label}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        item.count > 0 && !item.muted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {item.count}
                    </span>
                  </button>
                )
              })}
              {items.length === 0 && <p className="px-4 py-3 text-sm text-gray-500">Nothing for your role to review.</p>}
            </div>

            <div className="px-4 py-2 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 text-sm">Recent notifications</h3>
              {unread > 0 && (
                <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              )}
            </div>
            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <p className="px-4 pb-4 text-sm text-gray-500">No notifications yet.</p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => go(n.link || '/admin/dashboard', n)}
                    className={`w-full text-left px-4 py-3 border-t border-gray-100 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}
                  >
                    <p className={`text-sm text-gray-900 ${!n.read ? 'font-semibold' : ''}`}>{n.title}</p>
                    <p className="text-xs text-gray-600 line-clamp-2">{n.message}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

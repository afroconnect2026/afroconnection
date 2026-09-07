'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import SocialLinks from '@/components/marketing/SocialLinks'
import {
  Home,
  LayoutDashboard,
  Search,
  MessageCircle,
  Briefcase,
  Calendar,
  User,
  Users,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

interface AuthenticatedLayoutProps {
  children: ReactNode
}

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Explore', href: '/explore', icon: Search },
  { name: 'Connections', href: '/connections', icon: Users },
  { name: 'Dealroom', href: '/messages', icon: MessageCircle },
  { name: 'Opportunities', href: '/opportunities', icon: Briefcase },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    let cleanup: (() => void) | undefined

    const initUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        loadUnreadCount(user.id)
        cleanup = subscribeToMessages(user.id)
      }
    }
    initUser()

    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  const loadUnreadCount = async (currentUserId: string) => {
    try {
      // Count unread messages where current user is the receiver
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', currentUserId)
        .eq('read', false)

      if (error) throw error

      setUnreadCount(count || 0)
    } catch (error) {
      console.error('Error loading unread count:', error)
      setUnreadCount(0)
    }
  }

  const subscribeToMessages = (currentUserId: string) => {
    // Remove any existing channel first
    const existingChannel = supabase.getChannels().find(ch => ch.topic === 'realtime:new-messages')
    if (existingChannel) {
      supabase.removeChannel(existingChannel)
    }

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          // Only notify if message is from someone else
          if (payload.new.sender_id !== currentUserId) {
            // Get sender info
            const { data: sender } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', payload.new.sender_id)
              .single()

            // Show toast notification
            toast.success(`New message from ${sender?.full_name || 'Someone'}`, {
              duration: 4000,
              icon: '💬'
            })

            // Reload unread count
            loadUnreadCount(currentUserId)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>

              {/* Logo */}
              <div className="ml-2 md:ml-0">
                <Logo href="/dashboard" size="sm" showText={true} />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navigation.slice(0, 7).map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const showBadge = item.name === 'Dealroom' && unreadCount > 0
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`relative flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <NotificationBell />

              <Link
                href="/profile"
                className="hidden md:flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg"
              >
                <User className="h-5 w-5" />
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-lg text-sm font-medium"
              >
                <LogOut className="h-5 w-5" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="md:hidden fixed inset-0 z-40 bg-white pt-16"
          >
            <nav className="p-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                const showBadge = item.name === 'Dealroom' && unreadCount > 0
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`relative flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium ${
                      isActive
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-6 w-6" />
                    <span>{item.name}</span>
                    {showBadge && (
                      <span className="absolute top-2 left-8 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="pt-16 min-h-screen">
        {children}
      </main>

      {/* App Footer */}
      <footer className="border-t border-gray-200 bg-white py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
            <Link href="/about" className="text-gray-600 hover:text-primary-600 transition-colors">
              About &amp; Team
            </Link>
            <Link href="/support" className="text-gray-600 hover:text-primary-600 transition-colors">
              Support
            </Link>
            <Link
              href="/legal/privacy"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/legal/terms"
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              Terms
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Follow us</span>
            <SocialLinks variant="ghost" size="sm" />
          </div>
        </div>
        <p className="max-w-7xl mx-auto text-center md:text-left text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} AfroConnect. Connecting Africa to Opportunity.
        </p>
      </footer>
    </div>
  )
}

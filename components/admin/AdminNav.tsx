'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  FileText,
  Calendar,
  Flag,
  BarChart3,
  Settings,
  Shield,
  Sparkles,
  Activity
} from 'lucide-react'
import { useAdminCounts } from '@/components/admin/AdminContext'

interface AdminNavProps {
  admin: any
}

export default function AdminNav({ admin }: AdminNavProps) {
  const pathname = usePathname()
  const { counts } = useAdminCounts()
  const badges: Record<string, number> = {
    '/admin/verifications': counts.verifications,
    '/admin/opportunities': counts.opportunities,
    '/admin/events': counts.events,
    '/admin/reports': counts.reports,
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'moderator', 'support', 'analytics']
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
      roles: ['super_admin', 'moderator', 'support']
    },
    {
      name: 'Staff',
      href: '/admin/staff',
      icon: Shield,
      roles: ['super_admin']
    },
    {
      name: 'Verifications',
      href: '/admin/verifications',
      icon: CheckCircle,
      roles: ['super_admin', 'moderator']
    },
    {
      name: 'Opportunities',
      href: '/admin/opportunities',
      icon: FileText,
      roles: ['super_admin', 'moderator']
    },
    {
      name: 'Events',
      href: '/admin/events',
      icon: Calendar,
      roles: ['super_admin', 'moderator']
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: Flag,
      roles: ['super_admin', 'moderator', 'support']
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: BarChart3,
      roles: ['super_admin', 'analytics']
    },
    {
      name: 'AI Usage',
      href: '/admin/ai-usage',
      icon: Activity,
      roles: ['super_admin', 'analytics']
    },
    {
      name: 'AI Matches',
      href: '/admin/ai-matches',
      icon: Sparkles,
      roles: ['super_admin', 'analytics']
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: Settings,
      roles: ['super_admin']
    },
  ]

  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(admin?.role)
  )

  return (
    <nav className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-4">
        {/* Role Badge */}
        <div className="mb-6 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              {admin?.role?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            const badge = badges[item.href] || 0

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <span className="flex-1">{item.name}</span>
                {badge > 0 && (
                  <span className="text-xs font-bold bg-red-500 text-white rounded-full px-2 py-0.5">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}

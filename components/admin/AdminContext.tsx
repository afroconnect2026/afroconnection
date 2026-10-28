'use client'

import { createContext, useContext } from 'react'

export interface AdminUser {
  id: string
  email: string
  full_name: string
  role: 'super_admin' | 'moderator' | 'support' | 'analytics'
  is_active: boolean
}

export const AdminContext = createContext<AdminUser | null>(null)

export function useAdmin() {
  return useContext(AdminContext)
}

/** Items waiting for admin action (drives the header bell and nav badges). */
export interface AdminPendingCounts {
  verifications: number
  verifications_info: number
  opportunities: number
  events: number
  reports: number
}

export const EMPTY_COUNTS: AdminPendingCounts = {
  verifications: 0,
  verifications_info: 0,
  opportunities: 0,
  events: 0,
  reports: 0,
}

export const AdminCountsContext = createContext<{
  counts: AdminPendingCounts
  refresh: () => void
}>({ counts: EMPTY_COUNTS, refresh: () => {} })

export function useAdminCounts() {
  return useContext(AdminCountsContext)
}

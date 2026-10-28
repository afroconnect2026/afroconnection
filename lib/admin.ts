import { createClient } from '@/lib/supabase/client'

export const MIGRATION_HINT =
  'Database update missing: run sql/PRODUCTION-ADMIN-FIX.sql in the Supabase SQL Editor.'

/** Turn a Supabase/PostgREST error into a readable message. */
export function describeError(error: any): string {
  if (!error) return 'Unknown error'
  // PGRST202 = function not found -> migration not applied
  if (error.code === 'PGRST202' || /could not find the function/i.test(error.message || '')) {
    return MIGRATION_HINT
  }
  return error.message || error.details || String(error)
}

/**
 * Call a Supabase RPC and throw a readable Error on failure.
 * All admin write operations go through SECURITY DEFINER functions that
 * check the caller's admin role server-side.
 */
export async function rpc<T = any>(fn: string, params?: Record<string, any>): Promise<T> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc(fn, params || {})
  if (error) {
    console.error(`RPC ${fn} failed:`, error)
    throw new Error(describeError(error))
  }
  return data as T
}

export type AdminRole = 'super_admin' | 'moderator' | 'support' | 'analytics'

export const ROLE_PERMISSIONS = {
  verify: ['super_admin', 'moderator'],
  moderate: ['super_admin', 'moderator'],
  reports: ['super_admin', 'moderator', 'support'],
  ban: ['super_admin', 'moderator'],
  deleteUser: ['super_admin'],
  staff: ['super_admin'],
} as const

export function can(role: string | undefined, action: keyof typeof ROLE_PERMISSIONS) {
  return !!role && (ROLE_PERMISSIONS[action] as readonly string[]).includes(role)
}

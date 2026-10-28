import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Supabase auth redirect target (OAuth sign-in, password-reset links, email confirmation).
 * Exchanges the one-time ?code= for a session cookie, then forwards to ?next= (relative paths only).
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const nextParam = url.searchParams.get('next') || '/dashboard'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      const fail = new URL('/auth/login', url.origin)
      fail.searchParams.set('error', error.message)
      return NextResponse.redirect(fail)
    }
  }

  return NextResponse.redirect(new URL(next, url.origin))
}

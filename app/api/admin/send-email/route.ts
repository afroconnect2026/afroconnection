import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Admin -> user email.
 *
 * Sends through Resend (https://resend.com) when RESEND_API_KEY is set.
 * Without it, responds 501 { configured: false } and the admin UI falls back
 * to opening the admin's own mail client (mailto:) with the message prefilled.
 *
 * Env:
 *   RESEND_API_KEY   - Resend API key
 *   EMAIL_FROM       - verified sender, e.g. "AfroConnect <no-reply@yourdomain.com>"
 */
export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: isAdmin } = await supabase.rpc('is_admin')
  if (!isAdmin) {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const subject = String(body?.subject || '').trim().slice(0, 200)
  const message = String(body?.message || '').trim().slice(0, 10000)
  const userId = body?.userId ? String(body.userId) : null
  if (!subject || !message) {
    return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })
  }

  // Resolve the recipient server-side so admins can only email real users
  let to: string | null = null
  if (userId) {
    const { data, error } = await supabase.rpc('admin_get_user', { p_user_id: userId })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    to = (data as any)?.profile?.email || null
  }
  if (!to) {
    return NextResponse.json({ error: 'Recipient email not found' }, { status: 404 })
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM || 'AfroConnect <onboarding@resend.dev>'
  if (!apiKey) {
    return NextResponse.json(
      { configured: false, to, error: 'Email provider not configured (set RESEND_API_KEY)' },
      { status: 501 }
    )
  }

  const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;color:#1f2937">
${escapeHtml(message).replace(/\n/g, '<br/>')}
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="font-size:12px;color:#6b7280">Sent by the AfroConnect team.</p>
</div>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: [to], subject, text: message, html }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    console.error('Resend error:', res.status, detail)
    return NextResponse.json({ error: 'Email provider rejected the message' }, { status: 502 })
  }

  await supabase.from('admin_activity_log').insert({
    admin_id: user.id,
    action: 'send_email',
    target_type: 'user',
    target_id: userId,
    details: { subject },
  })

  return NextResponse.json({ sent: true, to })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

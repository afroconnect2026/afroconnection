export type EmailResult = 'sent' | 'mailto'

/**
 * Email a user as an admin.
 * Uses /api/admin/send-email (Resend). If no provider is configured, opens the
 * admin's mail client with the message prefilled so the email can still go out.
 */
export async function sendUserEmail(opts: {
  userId: string
  email?: string | null
  subject: string
  message: string
}): Promise<EmailResult> {
  const res = await fetch('/api/admin/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: opts.userId, subject: opts.subject, message: opts.message }),
  })

  if (res.ok) return 'sent'

  const data = await res.json().catch(() => ({} as any))
  if (res.status === 501 && data?.configured === false) {
    const to = data.to || opts.email
    if (!to) throw new Error('This user has no email address')
    openMailto(to, opts.subject, opts.message)
    return 'mailto'
  }
  throw new Error(data?.error || `Email failed (${res.status})`)
}

export function openMailto(to: string, subject: string, body: string) {
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

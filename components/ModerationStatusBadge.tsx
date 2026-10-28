import { Clock, XCircle } from 'lucide-react'

/**
 * Shows the admin review state of a user's own opportunity/event.
 * Renders nothing once content is approved.
 */
export default function ModerationStatusBadge({
  status,
  notes,
  showNotes = false
}: {
  status?: string | null
  notes?: string | null
  showNotes?: boolean
}) {
  if (!status || status === 'approved') return null

  if (status === 'pending') {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"
        title="Waiting for admin approval - not visible to others yet"
      >
        <Clock className="h-3 w-3" />
        Pending review
      </span>
    )
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
        title={notes || 'Not approved by moderators'}
      >
        <XCircle className="h-3 w-3" />
        Not approved
      </span>
      {showNotes && notes && <span className="text-xs text-red-700">Reason: {notes}. Edit to resubmit.</span>}
    </span>
  )
}

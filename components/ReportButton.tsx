'use client'

import { useState } from 'react'
import { Flag, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@/lib/supabase/client'

interface ReportButtonProps {
  contentType: 'user' | 'opportunity' | 'event'
  contentId: string
  /** The user responsible for the content (profile owner, poster, organizer) */
  reportedUserId?: string | null
  label?: string
  className?: string
}

const REPORT_TYPES = [
  { value: 'spam', label: 'Spam or misleading', severity: 'low' },
  { value: 'scam', label: 'Scam or fraud', severity: 'high' },
  { value: 'fake_profile', label: 'Fake profile / impersonation', severity: 'high' },
  { value: 'harassment', label: 'Harassment or hate speech', severity: 'high' },
  { value: 'inappropriate', label: 'Inappropriate content', severity: 'medium' },
  { value: 'other', label: 'Something else', severity: 'medium' }
]

export default function ReportButton({
  contentType,
  contentId,
  reportedUserId,
  label = 'Report',
  className = ''
}: ReportButtonProps) {
  const [open, setOpen] = useState(false)
  const [reportType, setReportType] = useState('spam')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (reportType === 'other' && !description.trim()) {
      toast.error('Please describe the problem')
      return
    }

    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to report content')
        return
      }
      if (reportedUserId && reportedUserId === user.id) {
        toast.error("You can't report your own content")
        return
      }

      const type = REPORT_TYPES.find((t) => t.value === reportType)
      const { error } = await supabase.from('content_reports').insert({
        reporter_id: user.id,
        reported_user_id: reportedUserId || (contentType === 'user' ? contentId : null),
        reported_content_type: contentType,
        reported_content_id: contentId,
        report_type: reportType,
        description: description.trim() || type?.label,
        severity: type?.severity || 'medium',
        status: 'pending'
      })
      if (error) throw error

      toast.success('Thanks - our moderation team will review this report.')
      setOpen(false)
      setDescription('')
      setReportType('spam')
    } catch (error: any) {
      console.error('Report error:', error)
      toast.error(error.message || 'Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors'
        }
        title={`Report this ${contentType}`}
      >
        <Flag className="w-4 h-4" />
        <span>{label}</span>
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Report {contentType}</h2>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                {REPORT_TYPES.map((t) => (
                  <label key={t.value} className="flex items-center gap-3 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="report_type"
                      value={t.value}
                      checked={reportType === t.value}
                      onChange={() => setReportType(t.value)}
                    />
                    {t.label}
                  </label>
                ))}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500"
                placeholder="Add details to help our team (optional)"
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 text-sm text-gray-700">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

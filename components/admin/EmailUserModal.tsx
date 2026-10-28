'use client'

import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendUserEmail } from '@/lib/email'

interface EmailUserModalProps {
  userId: string
  userName?: string | null
  email?: string | null
  defaultSubject?: string
  defaultMessage?: string
  onClose: () => void
}

export default function EmailUserModal({
  userId,
  userName,
  email,
  defaultSubject = '',
  defaultMessage = '',
  onClose,
}: EmailUserModalProps) {
  const [subject, setSubject] = useState(defaultSubject)
  const [message, setMessage] = useState(
    defaultMessage || `Hi ${userName?.split(' ')[0] || 'there'},\n\n\n\nBest regards,\nThe AfroConnect Team`
  )
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error('Subject and message are required')
      return
    }
    setSending(true)
    try {
      const result = await sendUserEmail({ userId, email, subject: subject.trim(), message: message.trim() })
      toast.success(result === 'sent' ? `Email sent to ${email || 'user'}` : 'Opened your email app with the message ready to send')
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-lg text-left whitespace-normal" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Email {userName || 'user'}
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {email && <p className="text-sm text-gray-500 mb-4">To: {email}</p>}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {sending ? 'Sending...' : 'Send Email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

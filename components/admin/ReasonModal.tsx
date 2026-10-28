'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ReasonModalProps {
  title: string
  description?: string
  label?: string
  placeholder?: string
  confirmLabel: string
  confirmClassName?: string
  required?: boolean
  busy?: boolean
  onConfirm: (text: string) => void
  onClose: () => void
}

/** In-page replacement for window.prompt() (which is blocked in some browsers / installed PWAs). */
export default function ReasonModal({
  title,
  description,
  label = 'Reason',
  placeholder,
  confirmLabel,
  confirmClassName = 'bg-red-600 hover:bg-red-700',
  required = true,
  busy = false,
  onConfirm,
  onClose,
}: ReasonModalProps) {
  const [text, setText] = useState('')
  const [touched, setTouched] = useState(false)
  const invalid = required && !text.trim()

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
        {description && <p className="text-sm text-gray-600 mb-4">{description}</p>}
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => setTouched(true)}
          rows={4}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        {touched && invalid && <p className="text-xs text-red-600 mt-1">This field is required</p>}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => {
              setTouched(true)
              if (!invalid) onConfirm(text.trim())
            }}
            disabled={busy}
            className={`flex-1 px-4 py-2 text-white rounded-lg disabled:opacity-50 ${confirmClassName}`}
          >
            {busy ? 'Saving...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

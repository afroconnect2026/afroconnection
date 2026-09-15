'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Loader2 } from 'lucide-react'

interface ConversationStartersProps {
  otherUserId: string
  onSelectStarter: (starter: string) => void
}

export default function ConversationStarters({ otherUserId, onSelectStarter }: ConversationStartersProps) {
  const [starters, setStarters] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchStarters = async () => {
      try {
        const response = await fetch('/api/ai/conversation-starters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otherUserId })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate starters')
        }

        setStarters(data.starters || [])
      } catch (err: any) {
        console.error('Error fetching conversation starters:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStarters()
  }, [otherUserId])

  if (dismissed) return null
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4">
        <div className="flex items-center space-x-2 text-purple-700">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Generating conversation starters...</span>
        </div>
      </div>
    )
  }

  if (error || starters.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-purple-600" />
            <h3 className="text-sm font-semibold text-purple-900">AI Conversation Starters</h3>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-purple-600 hover:text-purple-800"
          >
            Dismiss
          </button>
        </div>

        <div className="space-y-2">
          {starters.map((starter, index) => (
            <motion.button
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => {
                onSelectStarter(starter)
                setDismissed(true)
              }}
              className="w-full text-left px-3 py-2 bg-white border border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors group"
            >
              <p className="text-sm text-gray-700 group-hover:text-purple-900">
                "{starter}"
              </p>
            </motion.button>
          ))}
        </div>

        <p className="text-xs text-purple-600 mt-3 text-center">
          Click any starter to use it, or type your own message below
        </p>
      </motion.div>
    </AnimatePresence>
  )
}

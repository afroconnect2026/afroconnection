'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface SmartRecommendationBadgeProps {
  userId: string
  userProfile: {
    full_name: string
    bio: string
    user_type: string
    industry?: string
    country?: string
  }
  currentUserProfile?: {
    bio: string
    user_type: string
    industry?: string
    country?: string
  }
  compact?: boolean
}

export default function SmartRecommendationBadge({ userId, userProfile, currentUserProfile, compact = true }: SmartRecommendationBadgeProps) {
  const [analysis, setAnalysis] = useState<{
    score: number
    reasons: string[]
    recommendation: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const [analyzed, setAnalyzed] = useState(false)

  const analyzeMatch = async () => {
    if (analyzed) {
      setExpanded(!expanded)
      return
    }

    // If no current user profile provided, don't analyze
    if (!currentUserProfile) {
      setError('Profile data not available')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/recommend-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: userId,
          currentUserProfile: currentUserProfile,
          targetUserProfile: userProfile
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze match')
      }

      setAnalysis({
        score: data.score || 0,
        reasons: data.reasons || [],
        recommendation: data.recommendation || ''
      })
      setAnalyzed(true)
      setExpanded(true)
    } catch (err: any) {
      console.error('Error analyzing user match:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-300'
    if (score >= 60) return 'bg-blue-100 text-blue-800 border-blue-300'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  if (error) return null

  return (
    <div className="mt-2">
      {!analyzed ? (
        <button
          onClick={analyzeMatch}
          disabled={loading}
          className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-full text-xs font-medium text-purple-700 hover:from-purple-100 hover:to-blue-100 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3 w-3" />
              <span>AI Match</span>
            </>
          )}
        </button>
      ) : analysis && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-2"
        >
          {/* Match Score Badge */}
          <button
            onClick={() => setExpanded(!expanded)}
            className={`inline-flex items-center space-x-2 px-3 py-1 border rounded-full text-xs font-semibold ${getScoreColor(analysis.score)} transition-all`}
          >
            <Sparkles className="h-3 w-3" />
            <span>{analysis.score}% Match</span>
            {expanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>

          {/* Expanded Details */}
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm"
            >
              <div className="space-y-2">
                {/* Recommendation */}
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Why connect:</p>
                  <p className="text-xs text-gray-600">{analysis.recommendation}</p>
                </div>

                {/* Reasons */}
                {analysis.reasons.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Key synergies:</p>
                    <ul className="space-y-1">
                      {analysis.reasons.map((reason, index) => (
                        <li key={index} className="text-xs text-gray-600 flex items-start">
                          <span className="text-purple-600 mr-1">•</span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  )
}

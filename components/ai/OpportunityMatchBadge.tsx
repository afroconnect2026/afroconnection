'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, AlertCircle, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

interface OpportunityMatchBadgeProps {
  opportunityId: string
  compact?: boolean
}

export default function OpportunityMatchBadge({
  opportunityId,
  compact = false
}: OpportunityMatchBadgeProps) {
  const [loading, setLoading] = useState(false)
  const [matchData, setMatchData] = useState<{
    score: number
    reasons: string[]
    missingSkills: string[]
    recommendation: string
  } | null>(null)
  const [expanded, setExpanded] = useState(false)

  const analyzeMatch = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/analyze-opportunity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ opportunityId })
      })

      const data = await response.json()

      if (response.ok) {
        setMatchData({
          score: data.score,
          reasons: data.reasons,
          missingSkills: data.missingSkills,
          recommendation: data.recommendation
        })
      }
    } catch (error) {
      console.error('Match analysis error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-green-500 to-emerald-600'
    if (score >= 60) return 'from-blue-500 to-cyan-600'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-gray-400 to-gray-500'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    if (score >= 40) return 'Fair Match'
    return 'Low Match'
  }

  if (compact && !matchData) {
    return (
      <button
        onClick={analyzeMatch}
        disabled={loading}
        className="flex items-center space-x-1 text-xs text-purple-600 hover:text-purple-700 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Sparkles className="h-3 w-3" />
        )}
        <span>{loading ? 'Analyzing...' : 'AI Match'}</span>
      </button>
    )
  }

  if (!matchData) {
    return (
      <button
        onClick={analyzeMatch}
        disabled={loading}
        className="flex items-center space-x-2 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 text-purple-700 px-3 py-2 rounded-lg hover:from-purple-100 hover:to-blue-100 transition-all text-sm disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing match...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Check AI Match</span>
          </>
        )}
      </button>
    )
  }

  return (
    <div className="space-y-3">
      {/* Match Score Badge */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="inline-block"
      >
        <button
          onClick={() => setExpanded(!expanded)}
          className={`flex items-center space-x-2 bg-gradient-to-r ${getScoreColor(matchData.score)} text-white px-4 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all`}
        >
          <TrendingUp className="h-4 w-4" />
          <span className="font-bold">{matchData.score}% Match</span>
          <span className="text-xs opacity-90">• {getScoreLabel(matchData.score)}</span>
        </button>
      </motion.div>

      {/* Expanded Details */}
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-white border border-purple-200 rounded-lg p-4 space-y-3 shadow-md"
        >
          {/* Why it matches */}
          {matchData.reasons.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-navy-900 mb-2 flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                <span>Why you match:</span>
              </h4>
              <ul className="space-y-1">
                {matchData.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start space-x-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing skills */}
          {matchData.missingSkills.length > 0 && (
            <div>
              <h4 className="font-semibold text-sm text-navy-900 mb-2 flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <span>Skills to develop:</span>
              </h4>
              <div className="flex flex-wrap gap-2">
                {matchData.missingSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="bg-orange-50 text-orange-700 text-xs px-2 py-1 rounded-full border border-orange-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommendation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900 font-medium">
              💡 {matchData.recommendation}
            </p>
          </div>
        </motion.div>
      )}
    </div>
  )
}

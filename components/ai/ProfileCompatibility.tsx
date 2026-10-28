'use client'

import { useEffect, useState } from 'react'

interface CompatibilityAnalysis {
  matchScore: number
  matchStrength: 'weak' | 'moderate' | 'strong'
  commonInterests: string[]
  complementarySkills: {
    theyCanHelpYou: string[]
    youCanHelpThem: string[]
  }
  collaborationOpportunities: string[]
  recommendation: 'connect' | 'maybe' | 'skip'
  reasoning: string
}

interface ProfileCompatibilityProps {
  currentUserId: string
  targetUserId: string
  targetUserName?: string
}

export default function ProfileCompatibility({
  currentUserId,
  targetUserId,
  targetUserName = 'this person',
}: ProfileCompatibilityProps) {
  const [analysis, setAnalysis] = useState<CompatibilityAnalysis | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCompatibility() {
      if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
        setLoading(false)
        return
      }

      try {
        const response = await fetch('/api/ai/profile-compatibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUserId, targetUserId }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch compatibility analysis')
        }

        const data = await response.json()
        setAnalysis(data.analysis)
      } catch (err) {
        console.error('Compatibility analysis error:', err)
        setError('Failed to analyze compatibility')
      } finally {
        setLoading(false)
      }
    }

    fetchCompatibility()
  }, [currentUserId, targetUserId])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
          <div>
            <h3 className="font-semibold text-gray-900">🤖 AI Match Analysis</h3>
            <p className="text-sm text-gray-600">Analyzing profile compatibility...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return null
  }

  const getMatchIcon = (score: number) => {
    if (score >= 70) return '🟢'
    if (score >= 40) return '🟡'
    return '🔴'
  }

  const getMatchColor = (score: number) => {
    if (score >= 70) return 'from-green-50 to-emerald-50 border-green-200'
    if (score >= 40) return 'from-yellow-50 to-orange-50 border-yellow-200'
    return 'from-red-50 to-pink-50 border-red-200'
  }

  const getRecommendationBadge = (rec: string) => {
    if (rec === 'connect') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
          ✅ Highly Compatible - Connect Now
        </span>
      )
    }
    if (rec === 'maybe') {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-medium">
          🤔 Moderate Match - Worth Exploring
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-medium">
        ℹ️ Limited Match
      </span>
    )
  }

  return (
    <div className={`bg-gradient-to-r ${getMatchColor(analysis.matchScore)} rounded-lg p-6 border shadow-sm`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            🤖 AI Match Analysis
          </h3>
          <p className="text-sm text-gray-600">{analysis.reasoning}</p>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{getMatchIcon(analysis.matchScore)}</span>
            <span className="text-4xl font-bold text-gray-900">{analysis.matchScore}%</span>
          </div>
          <p className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {analysis.matchStrength} Match
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mb-4">
        {getRecommendationBadge(analysis.recommendation)}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Common Interests */}
        {analysis.commonInterests.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>📊</span> Common Interests
            </h4>
            <ul className="space-y-1">
              {analysis.commonInterests.map((interest, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-blue-600">•</span>
                  <span>{interest}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* How They Can Help You */}
        {analysis.complementarySkills.theyCanHelpYou.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🎯</span> How {targetUserName} Can Help You
            </h4>
            <ul className="space-y-1">
              {analysis.complementarySkills.theyCanHelpYou.map((skill, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* How You Can Help Them */}
        {analysis.complementarySkills.youCanHelpThem.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>🤝</span> How You Can Help {targetUserName}
            </h4>
            <ul className="space-y-1">
              {analysis.complementarySkills.youCanHelpThem.map((skill, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-purple-600">✓</span>
                  <span>{skill}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Collaboration Opportunities */}
        {analysis.collaborationOpportunities.length > 0 && (
          <div className="bg-white/60 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <span>💼</span> Collaboration Opportunities
            </h4>
            <ul className="space-y-1">
              {analysis.collaborationOpportunities.map((opportunity, i) => (
                <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-orange-600">→</span>
                  <span>{opportunity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          AI-powered analysis based on profile information • Updated every hour
        </p>
      </div>
    </div>
  )
}

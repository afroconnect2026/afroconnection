'use client'

import { useEffect, useState } from 'react'

interface MatchBadgeProps {
  currentUserId: string
  targetUserId: string
  compact?: boolean
}

export default function MatchBadge({ currentUserId, targetUserId, compact = false }: MatchBadgeProps) {
  const [matchScore, setMatchScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMatchScore() {
      try {
        const response = await fetch('/api/ai/profile-compatibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ currentUserId, targetUserId }),
        })

        if (response.ok) {
          const data = await response.json()
          setMatchScore(data.analysis.matchScore)
        }
      } catch (error) {
        console.error('Failed to fetch match score:', error)
      } finally {
        setLoading(false)
      }
    }

    if (currentUserId && targetUserId && currentUserId !== targetUserId) {
      fetchMatchScore()
    } else {
      setLoading(false)
    }
  }, [currentUserId, targetUserId])

  if (loading) {
    if (compact) {
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs text-gray-500">
          <div className="w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
          <span>Analyzing...</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Analyzing match...</span>
      </div>
    )
  }

  if (matchScore === null) {
    return null
  }

  const getMatchColor = (score: number) => {
    if (score >= 70) return 'text-green-700 bg-green-50 border-green-200'
    if (score >= 40) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    return 'text-red-700 bg-red-50 border-red-200'
  }

  const getMatchIcon = (score: number) => {
    if (score >= 70) return '🟢'
    if (score >= 40) return '🟡'
    return '🔴'
  }

  const getMatchLabel = (score: number) => {
    if (score >= 90) return 'Exceptional'
    if (score >= 70) return 'Strong'
    if (score >= 50) return 'Good'
    if (score >= 30) return 'Moderate'
    return 'Weak'
  }

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getMatchColor(matchScore)}`}>
        <span>{getMatchIcon(matchScore)}</span>
        <span>{matchScore}% Match</span>
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${getMatchColor(matchScore)}`}>
      <span className="text-base">{getMatchIcon(matchScore)}</span>
      <div className="flex items-center gap-2">
        <span className="font-bold">{matchScore}%</span>
        <span>{getMatchLabel(matchScore)} Match</span>
      </div>
    </div>
  )
}

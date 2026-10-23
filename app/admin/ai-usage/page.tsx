'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, TrendingUp, DollarSign, Users, Zap, Activity, Info } from 'lucide-react'
import { format } from 'date-fns'

export default function AIUsagePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBioEnhancements: 0,
    totalMatches: 0,
    totalOpportunityAnalyses: 0,
    totalConversationStarters: 0,
    activeUsers: 0,
    estimatedCost: 0
  })
  const supabase = createClient()

  useEffect(() => {
    fetchAIStats()
  }, [])

  const fetchAIStats = async () => {
    try {
      // In a real implementation, you would track AI API calls in a dedicated table
      // For now, we'll show the structure and calculate estimates based on user activity

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get users who have enhanced bios (indicator of AI usage)
      const { count: bioCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('bio', 'is', null) // Users with bios (potential AI enhancement)

      // Get total users for Smart Match potential
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Get opportunities (for AI analysis feature)
      const { count: oppCount } = await supabase
        .from('opportunities')
        .select('*', { count: 'exact', head: true })

      // Estimate costs (GPT-4o-mini pricing: ~$0.15 per 1M input tokens, ~$0.60 per 1M output tokens)
      // Average AI call: ~500 input tokens, ~200 output tokens
      // Cost per call: ~$0.0002
      const estimatedBioCalls = bioCount || 0
      const estimatedMatchCalls = Math.floor((userCount || 0) * 0.3) // Assume 30% used Smart Match
      const estimatedOppCalls = Math.floor((oppCount || 0) * 0.2) // Assume 20% used AI analysis

      const totalCalls = estimatedBioCalls + estimatedMatchCalls + estimatedOppCalls
      const estimatedCost = totalCalls * 0.0002

      setStats({
        totalBioEnhancements: estimatedBioCalls,
        totalMatches: estimatedMatchCalls,
        totalOpportunityAnalyses: estimatedOppCalls,
        totalConversationStarters: Math.floor(estimatedMatchCalls * 0.5),
        activeUsers: userCount || 0,
        estimatedCost: estimatedCost
      })
    } catch (error) {
      console.error('Error fetching AI stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  const aiFeatures = [
    {
      name: 'Bio Enhancement',
      count: stats.totalBioEnhancements,
      icon: Sparkles,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      description: 'Users who enhanced their profile bio with AI'
    },
    {
      name: 'Smart Match',
      count: stats.totalMatches,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      description: 'AI-powered user matching requests'
    },
    {
      name: 'Opportunity Analysis',
      count: stats.totalOpportunityAnalyses,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      description: 'AI opportunity match analyses'
    },
    {
      name: 'Conversation Starters',
      count: stats.totalConversationStarters,
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      description: 'AI-generated conversation openers'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Usage Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor AI feature usage and costs across the platform</p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">About AI Analytics</p>
            <p className="text-blue-800">These are estimated metrics based on user activity. To track precise API calls and costs, implement an AI usage logging table that records each API request with timestamp, user, feature type, tokens used, and cost.</p>
          </div>
        </div>
      </div>

      {/* Cost Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <Activity className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Estimated AI Costs</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.estimatedCost.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-2">Total estimated spend on OpenAI</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <TrendingUp className="w-6 h-6 text-blue-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total AI Requests</h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.totalBioEnhancements + stats.totalMatches + stats.totalOpportunityAnalyses + stats.totalConversationStarters}
          </p>
          <p className="text-xs text-gray-500 mt-2">Across all AI features</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-yellow-50 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <Activity className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Active Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
          <p className="text-xs text-gray-500 mt-2">Total platform users</p>
        </div>
      </div>

      {/* Feature Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">AI Feature Usage Breakdown</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.name} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 ${feature.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${feature.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{feature.count}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.name}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">📊 Implement Precise AI Tracking</h3>
        <p className="text-sm text-gray-700 mb-4">
          For accurate AI usage analytics, create an <code className="bg-gray-200 px-2 py-1 rounded">ai_usage_log</code> table:
        </p>
        <div className="bg-white border border-gray-300 rounded p-4 font-mono text-xs overflow-x-auto">
          <pre>{`CREATE TABLE ai_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  feature TEXT NOT NULL, -- 'bio_enhancement', 'smart_match', 'opportunity_analysis', 'conversation_starters'
  request_tokens INT,
  response_tokens INT,
  estimated_cost NUMERIC(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Then log each API call:
INSERT INTO ai_usage_log (user_id, feature, request_tokens, response_tokens, estimated_cost)
VALUES (user_id, 'smart_match', 450, 180, 0.000195);`}</pre>
        </div>
      </div>
    </div>
  )
}

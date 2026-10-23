'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sparkles, Users, TrendingUp, Filter, Search, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

export default function AIMatchesPage() {
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      // Get all active users to show potential matches
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, user_type, bio, industry, country, city, skills, company_name, created_at, is_verified')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(user => {
    // Filter by user type
    if (filterType !== 'all' && user.user_type !== filterType) {
      return false
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        user.full_name?.toLowerCase().includes(query) ||
        user.bio?.toLowerCase().includes(query) ||
        user.industry?.toLowerCase().includes(query) ||
        user.country?.toLowerCase().includes(query)
      )
    }

    return true
  })

  const getUserTypeColor = (type: string) => {
    switch (type) {
      case 'entrepreneur': return 'bg-primary-100 text-primary-700'
      case 'investor': return 'bg-gold-100 text-gold-700'
      case 'professional': return 'bg-blue-100 text-blue-700'
      case 'company': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">AI Matches Overview</h1>
        </div>
        <p className="text-gray-600">View all users and their AI matching potential</p>
      </div>

      {/* Info Banner */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Sparkles className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-purple-900">
            <p className="font-semibold mb-1">About AI Matching</p>
            <p className="text-purple-800">
              When users click "AI Match" on the Explore page, our AI analyzes their profile against other users to suggest compatible connections.
              This page shows all users and their matching potential. To see actual match history, implement an <code className="bg-purple-200 px-2 py-1 rounded">ai_match_log</code> table that records each match request, score, and reasons.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-gray-400" />
            <span className="text-xs font-medium text-gray-500">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-primary-400" />
            <span className="text-xs font-medium text-gray-500">Entrepreneurs</span>
          </div>
          <p className="text-2xl font-bold text-primary-600">
            {users.filter(u => u.user_type === 'entrepreneur').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <TrendingUp className="w-5 h-5 text-gold-400" />
            <span className="text-xs font-medium text-gray-500">Investors</span>
          </div>
          <p className="text-2xl font-bold text-gold-600">
            {users.filter(u => u.user_type === 'investor').length}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span className="text-xs font-medium text-gray-500">Professionals</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.user_type === 'professional').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, bio, industry, location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          {/* User Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All User Types</option>
              <option value="entrepreneur">Entrepreneurs</option>
              <option value="investor">Investors</option>
              <option value="professional">Professionals</option>
              <option value="company">Companies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">
            Users ({filteredUsers.length})
          </h2>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredUsers.map((user) => (
            <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-semibold text-gray-900">{user.full_name || 'Anonymous'}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUserTypeColor(user.user_type)}`}>
                      {user.user_type}
                    </span>
                    {user.is_verified && (
                      <span className="text-blue-600 text-xs">✓ Verified</span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {user.bio || 'No bio provided'}
                  </p>

                  <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                    {user.industry && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {user.industry}
                      </span>
                    )}
                    {user.country && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        📍 {user.country}
                      </span>
                    )}
                    {user.skills && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        Skills: {user.skills}
                      </span>
                    )}
                    <span className="text-gray-400">
                      Joined {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/profile/${user.id}`}
                  target="_blank"
                  className="ml-4 flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Profile</span>
                </Link>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              No users found matching your filters
            </div>
          )}
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-bold text-gray-900 mb-3">📊 Track Actual Match History</h3>
        <p className="text-sm text-gray-700 mb-4">
          To see who matched with whom and their match scores, create an <code className="bg-gray-200 px-2 py-1 rounded">ai_match_log</code> table:
        </p>
        <div className="bg-white border border-gray-300 rounded p-4 font-mono text-xs overflow-x-auto">
          <pre>{`CREATE TABLE ai_match_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  matched_user_id UUID REFERENCES profiles(id),
  match_score INT, -- 0-100
  match_reasons TEXT[], -- Array of reasons
  recommendation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Then log each match request from the AI API
-- And query this table to show actual match history`}</pre>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Conversation {
  id: string
  participant_a_id: string
  participant_b_id: string
  created_at: string
  updated_at: string
  participant_a?: {
    id: string
    full_name: string
    avatar_url?: string
    user_type?: string
  }
  participant_b?: {
    id: string
    full_name: string
    avatar_url?: string
    user_type?: string
  }
  lastMessage?: {
    content: string
    created_at: string
    sender_id: string
  }
  unread_count?: number
}

interface ConversationsListProps {
  userId: string
  selectedConversationId: string | null
  onSelectConversation: (id: string) => void
}

export default function ConversationsList({
  userId,
  selectedConversationId,
  onSelectConversation
}: ConversationsListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadConversations()

    // Subscribe to new messages to update conversation list
    const messagesChannel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages'
        },
        () => {
          // Reload conversations when any message is sent
          loadConversations()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations'
        },
        () => {
          // Reload when conversations are updated
          loadConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(messagesChannel)
    }
  }, [userId])

  const loadConversations = async () => {
    try {
      // Load conversations where user is participant
      const { data: convos, error } = await supabase
        .from('conversations')
        .select(`
          id,
          participant_a_id,
          participant_b_id,
          created_at,
          updated_at
        `)
        .or(`participant_a_id.eq.${userId},participant_b_id.eq.${userId}`)
        .order('updated_at', { ascending: false })

      if (error) throw error

      if (!convos || convos.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Get unique participant IDs
      const participantIds = new Set<string>()
      convos.forEach(convo => {
        if (convo.participant_a_id !== userId) participantIds.add(convo.participant_a_id)
        if (convo.participant_b_id !== userId) participantIds.add(convo.participant_b_id)
      })

      // Load participant profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, user_type')
        .in('id', Array.from(participantIds))

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Load last message for each conversation
      const conversationsWithData = await Promise.all(
        convos.map(async (convo) => {
          // Get last message
          const { data: messages } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', convo.id)
            .order('created_at', { ascending: false })
            .limit(1)

          // Get unread count
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', convo.id)
            .eq('receiver_id', userId)
            .eq('read', false)

          const otherParticipantId = convo.participant_a_id === userId
            ? convo.participant_b_id
            : convo.participant_a_id

          return {
            ...convo,
            participant_a: profilesMap.get(convo.participant_a_id),
            participant_b: profilesMap.get(convo.participant_b_id),
            lastMessage: messages?.[0],
            unread_count: count || 0
          }
        })
      )

      setConversations(conversationsWithData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading conversations:', error)
      setLoading(false)
    }
  }

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participant_a_id === userId
      ? conversation.participant_b
      : conversation.participant_a
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 text-gray-400">
        <div className="text-center">
          <User className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">No conversations yet</p>
          <p className="text-xs mt-1">Start connecting with others!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {conversations.map((conversation) => {
        const otherParticipant = getOtherParticipant(conversation)
        const isSelected = conversation.id === selectedConversationId

        return (
          <button
            key={conversation.id}
            onClick={() => onSelectConversation(conversation.id)}
            className={`w-full p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left ${
              isSelected ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {otherParticipant?.avatar_url ? (
                  <img
                    src={otherParticipant.avatar_url}
                    alt={otherParticipant.full_name}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {otherParticipant?.full_name || 'Unknown User'}
                  </h3>
                  {conversation.lastMessage && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatDistanceToNow(new Date(conversation.lastMessage.created_at), { addSuffix: true })}
                    </span>
                  )}
                </div>
                {otherParticipant?.user_type && (
                  <p className="text-xs text-gray-500 capitalize mb-1">
                    {otherParticipant.user_type}
                  </p>
                )}
                {conversation.lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {conversation.lastMessage.sender_id === userId && 'You: '}
                    {conversation.lastMessage.content}
                  </p>
                )}
              </div>

              {/* Unread badge */}
              {(conversation.unread_count || 0) > 0 && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-white text-xs font-bold">
                    {conversation.unread_count || 0}
                  </span>
                </div>
              )}
            </div>
          </button>
        )
      })}
    </div>
  )
}

'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import AuthenticatedLayout from '@/components/AuthenticatedLayout'
import ConversationsList from '@/components/messages/ConversationsList'
import ChatInterface from '@/components/messages/ChatInterface'
import { MessageCircle } from 'lucide-react'

function MessagesPageContent() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      setUser(user)

      // Check for conversation ID in URL
      const conversationId = searchParams.get('conversation')
      if (conversationId) {
        setSelectedConversationId(conversationId)
      }

      setLoading(false)
    }

    checkAuth()
  }, [router, supabase, searchParams])

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: 'calc(100vh - 180px)' }}>
          <div className="flex h-full">
            {/* Conversations Sidebar */}
            <div className="w-full md:w-80 border-r border-gray-200 flex flex-col">
              <div className="p-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-navy-900 flex items-center space-x-2">
                  <MessageCircle className="h-6 w-6 text-primary-600" />
                  <span>Messages</span>
                </h1>
              </div>
              <ConversationsList
                userId={user.id}
                selectedConversationId={selectedConversationId}
                onSelectConversation={setSelectedConversationId}
              />
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
              {selectedConversationId ? (
                <ChatInterface
                  conversationId={selectedConversationId}
                  currentUserId={user.id}
                />
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">Select a conversation to start messaging</p>
                    <p className="text-sm mt-2">Choose from your conversations on the left</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <AuthenticatedLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </AuthenticatedLayout>
    }>
      <MessagesPageContent />
    </Suspense>
  )
}

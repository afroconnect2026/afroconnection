'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, User, Download, Image as ImageIcon, File as FileIcon, Paperclip, X } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface Attachment {
  id: string
  file_name: string
  file_type: string
  file_size: number
  file_url: string
  is_image: boolean
  thumbnail_url?: string
}

interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  attachments?: Attachment[]
}

interface ChatInterfaceProps {
  conversationId: string
  currentUserId: string
}

export default function ChatInterface({ conversationId, currentUserId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [newMessage, setNewMessage] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [otherUser, setOtherUser] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    loadMessages()
    loadOtherUser()
    loadCurrentUser()
    markMessagesAsRead()

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          // Load sender info for new message
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', payload.new.sender_id)
            .single()

          // Load attachments for new message
          const { data: attachments } = await supabase
            .from('message_attachments')
            .select('*')
            .eq('message_id', payload.new.id)

          const newMsg = {
            ...payload.new,
            sender,
            attachments: attachments || []
          } as Message

          // Replace optimistic message or add new message
          setMessages((prev) => {
            // Check if real message already exists
            const exists = prev.find(m => m.id === newMsg.id)
            if (exists) return prev

            // Remove optimistic message if this is from current user
            if (newMsg.sender_id === currentUserId) {
              const withoutOptimistic = prev.filter(m => !m.id.toString().startsWith('temp-'))
              return [...withoutOptimistic, newMsg]
            }

            return [...prev, newMsg]
          })
          scrollToBottom()

          // Mark as read if from other user
          if (payload.new.receiver_id === currentUserId) {
            await supabase
              .from('messages')
              .update({ read: true, read_at: new Date().toISOString() })
              .eq('id', payload.new.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const markMessagesAsRead = async () => {
    try {
      // Mark all unread messages in this conversation as read
      await supabase
        .from('messages')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .eq('receiver_id', currentUserId)
        .eq('read', false)
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          created_at
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      if (!data || data.length === 0) {
        setMessages([])
        setLoading(false)
        return
      }

      // Load sender profiles
      const senderIds = [...new Set(data.map(m => m.sender_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('id', senderIds)

      const profilesMap = new Map(profiles?.map(p => [p.id, p]) || [])

      // Load attachments for all messages
      const messageIds = data.map(m => m.id)
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds)

      const attachmentsMap = new Map<string, Attachment[]>()
      attachments?.forEach(att => {
        if (!attachmentsMap.has(att.message_id)) {
          attachmentsMap.set(att.message_id, [])
        }
        attachmentsMap.get(att.message_id)?.push(att)
      })

      const messagesWithSenders = data.map(msg => ({
        ...msg,
        sender: profilesMap.get(msg.sender_id),
        attachments: attachmentsMap.get(msg.id) || []
      }))

      setMessages(messagesWithSenders)
      setLoading(false)
    } catch (error) {
      console.error('Error loading messages:', error)
      setLoading(false)
    }
  }

  const loadOtherUser = async () => {
    try {
      // Get conversation to find other user
      const { data: conversation } = await supabase
        .from('conversations')
        .select('participant_a_id, participant_b_id')
        .eq('id', conversationId)
        .single()

      if (!conversation) return

      const otherUserId = conversation.participant_a_id === currentUserId
        ? conversation.participant_b_id
        : conversation.participant_a_id

      const { data: user } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, user_type')
        .eq('id', otherUserId)
        .single()

      setOtherUser(user)
    } catch (error) {
      console.error('Error loading other user:', error)
    }
  }

  const loadCurrentUser = async () => {
    try {
      const { data: user } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', currentUserId)
        .single()

      setCurrentUser(user)
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()

    // If files selected, upload them instead
    if (selectedFiles.length > 0) {
      await handleFilesSelected(selectedFiles)
      return
    }

    if (!newMessage.trim() || sending || !otherUser) return

    setSending(true)
    const messageText = newMessage.trim()

    // Create optimistic message (show immediately in UI)
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content: messageText,
      created_at: new Date().toISOString(),
      sender: currentUser || {
        id: currentUserId,
        full_name: 'You',
        avatar_url: undefined
      },
      attachments: []
    }

    // Add to UI immediately
    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    scrollToBottom()

    try {
      // Save to database in background
      const { error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: otherUser.id,
          content: messageText,
          read: false
        })

      if (error) throw error

      // Update conversation updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)
    } catch (error: any) {
      console.error('Error sending message:', error)
      toast.error(error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    const fileArray = Array.from(files)
    const maxFiles = 5
    const maxSize = 10 * 1024 * 1024 // 10MB

    // Validate files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain']

    const validFiles = fileArray.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name} is not a supported file type`)
        return false
      }
      return true
    }).slice(0, maxFiles)

    if (validFiles.length > 0) {
      const currentTotal = selectedFiles.length + validFiles.length
      if (currentTotal > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`)
      }
      setSelectedFiles(prev => [...prev, ...validFiles].slice(0, maxFiles))
    }

    // Reset input
    if (e.target) e.target.value = ''
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleFilesSelected = async (files: File[]) => {
    if (!otherUser || uploading) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create message first
      const messageContent = newMessage.trim() || `Sent ${files.length} file${files.length > 1 ? 's' : ''}`
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUserId,
          receiver_id: otherUser.id,
          content: messageContent,
          read: false
        })
        .select()
        .single()

      if (messageError) throw messageError

      // Upload files
      const uploadedAttachments: Array<{
        id: string
        file_name: string
        file_type: string
        file_size: number
        file_url: string
        is_image: boolean
      }> = []
      const failedFiles: string[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const fileExt = file.name.split('.').pop()
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `${currentUserId}/${fileName}`

        try {
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from('message-attachments')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('message-attachments')
            .getPublicUrl(filePath)

          // Save attachment record
          const { error: attachmentError } = await supabase
            .from('message_attachments')
            .insert({
              message_id: messageData.id,
              uploaded_by: currentUserId,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              file_url: publicUrl,
              is_image: file.type.startsWith('image/')
            })

          if (attachmentError) throw attachmentError

          uploadedAttachments.push({
            id: crypto.randomUUID(),
            file_name: file.name,
            file_type: file.type,
            file_size: file.size,
            file_url: publicUrl,
            is_image: file.type.startsWith('image/')
          })
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          failedFiles.push(file.name)
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      }

      // Show upload results
      if (failedFiles.length > 0) {
        toast.error(`Failed to upload: ${failedFiles.join(', ')}`)
      }

      // Add message with attachments to local state immediately
      const { data: sender } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', currentUserId)
        .single()

      setMessages(prev => [...prev, {
        ...messageData,
        sender,
        attachments: uploadedAttachments
      }])
      scrollToBottom()

      // Update conversation
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId)

      setNewMessage('')
      setSelectedFiles([])
      toast.success(`${uploadedAttachments.length} file${uploadedAttachments.length > 1 ? 's' : ''} sent!`)
    } catch (error: any) {
      console.error('Error uploading files:', error)
      toast.error(error.message || 'Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      {otherUser && (
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center space-x-3">
            {otherUser.avatar_url ? (
              <img
                src={otherUser.avatar_url}
                alt={otherUser.full_name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-5 w-5 text-gray-500" />
              </div>
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{otherUser.full_name}</h2>
              {otherUser.user_type && (
                <p className="text-sm text-gray-500 capitalize">{otherUser.user_type}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isMe = message.sender_id === currentUserId

              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[70%] ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}>
                    {/* Avatar */}
                    {!isMe && (
                      message.sender?.avatar_url ? (
                        <img
                          src={message.sender.avatar_url}
                          alt={message.sender.full_name}
                          className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-gray-500" />
                        </div>
                      )
                    )}

                    {/* Message Bubble */}
                    <div>
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isMe
                            ? 'bg-primary-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

                        {/* Attachments */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment) => (
                              <div key={attachment.id}>
                                {attachment.is_image ? (
                                  // Image attachment - show inline
                                  <a
                                    href={attachment.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block"
                                  >
                                    <img
                                      src={attachment.file_url}
                                      alt={attachment.file_name}
                                      className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                      loading="lazy"
                                    />
                                  </a>
                                ) : (
                                  // File attachment - show download link
                                  <a
                                    href={attachment.file_url}
                                    download={attachment.file_name}
                                    className={`flex items-center space-x-2 p-2 rounded-lg border transition-colors ${
                                      isMe
                                        ? 'bg-primary-700 border-primary-500 hover:bg-primary-800'
                                        : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                                    }`}
                                  >
                                    <FileIcon className="h-4 w-4" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium truncate">{attachment.file_name || 'File'}</p>
                                      <p className="text-xs opacity-75">
                                        {attachment.file_size ? (attachment.file_size / 1024).toFixed(1) : '0'} KB
                                      </p>
                                    </div>
                                    <Download className="h-4 w-4 flex-shrink-0" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {format(new Date(message.created_at), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
        {/* Selected Files Preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file) => (
              <div
                key={file.name}
                className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 text-sm"
              >
                <FileIcon className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 truncate max-w-[150px]">{file.name}</span>
                <button
                  onClick={() => setSelectedFiles(files => files.filter(f => f !== file))}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Text Input */}
        <form onSubmit={handleSend}>
          <div className="flex items-center space-x-2">
            {/* Attachment Button */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-gray-500 hover:text-primary-600 p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <Paperclip className="h-5 w-5" />
            </button>

            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={sending || uploading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || uploading}
              className="bg-primary-600 text-white p-3 rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

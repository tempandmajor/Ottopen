'use client'

import { Navigation } from '@/src/components/navigation'
import { ProtectedRoute } from '@/src/components/auth/protected-route'
import { Button } from '@/src/components/ui/button'
import { Card, CardContent, CardHeader } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import {
  Search,
  Send,
  MoreHorizontal,
  Phone,
  Video,
  Info,
  Smile,
  Paperclip,
  Image as ImageIcon,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '@/src/contexts/auth-context'
import { dbService } from '@/src/lib/database'
import type { User, Message, Conversation } from '@/src/lib/supabase'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function Messages() {
  const { user } = useAuth()
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevMessagesLengthRef = useRef(messages.length)

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations()
    }
  }, [user])

  // Load messages when conversation is selected (ID-based to prevent infinite loops)
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
      markMessagesAsRead(selectedConversationId)
    }
  }, [selectedConversationId])

  // Auto-scroll to bottom only when new messages are added (not on every render)
  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom()
    }
    prevMessagesLengthRef.current = messages.length
  }, [messages])

  // Real-time message subscriptions
  useEffect(() => {
    if (!selectedConversationId) return

    const supabase = dbService.getSupabaseClient()

    // Subscribe to new messages in the selected conversation
    const messagesChannel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        payload => {
          const newMessage = payload.new as Message
          // Only add message if it's not already in the list (avoid duplicates)
          setMessages(prev => {
            const exists = prev.some(m => m.id === newMessage.id)
            return exists ? prev : [...prev, newMessage]
          })
        }
      )
      .subscribe()

    // Subscribe to conversation updates (for last_message, updated_at)
    const conversationChannel = supabase
      .channel(`conversation:${selectedConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${selectedConversationId}`,
        },
        payload => {
          // Update conversation in list
          setConversations(prev =>
            prev.map(c => (c.id === selectedConversationId ? (payload.new as Conversation) : c))
          )
        }
      )
      .subscribe()

    // Cleanup subscriptions when conversation changes or component unmounts
    return () => {
      messagesChannel.unsubscribe()
      conversationChannel.unsubscribe()
    }
  }, [selectedConversationId, user])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadConversations = async () => {
    try {
      setLoading(true)
      if (user) {
        const convs = await dbService.getConversations(user.id)
        setConversations(convs)
      }
    } catch (error) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  const loadMessages = async (conversationId: string) => {
    try {
      const msgs = await dbService.getMessages(conversationId)
      setMessages(msgs)
    } catch (error) {
      toast.error('Failed to load messages')
    }
  }

  const markMessagesAsRead = async (conversationId: string) => {
    if (user) {
      await dbService.markMessagesAsRead(conversationId, user.id)
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedConversationId) return

    const selectedConv = conversations.find(c => c.id === selectedConversationId)
    if (!selectedConv) return

    const otherUser = selectedConv.user1_id === user.id ? selectedConv.user2 : selectedConv.user1
    if (!otherUser) return

    try {
      setSendingMessage(true)

      const message = await dbService.sendMessage({
        sender_id: user.id,
        receiver_id: otherUser.id,
        content: newMessage.trim(),
        conversation_id: selectedConv.id,
      })

      if (message) {
        setMessages(prev => [...prev, message])
        setNewMessage('')
        // Removed annoying toast - message appearing in chat is enough feedback
      } else {
        toast.error('Failed to send message')
      }
    } catch (error) {
      toast.error('Failed to send message')
    } finally {
      setSendingMessage(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getOtherUser = (conv: Conversation): User | null => {
    if (!user) return null
    return conv.user1_id === user.id ? conv.user2 || null : conv.user1 || null
  }

  // Memoize filtered conversations to prevent unnecessary recalculations
  const filteredConversations = useMemo(() => {
    return conversations.filter(conv => {
      const otherUser = getOtherUser(conv)
      if (!otherUser) return false

      const searchLower = searchQuery.toLowerCase()
      return (
        otherUser.display_name.toLowerCase().includes(searchLower) ||
        otherUser.username.toLowerCase().includes(searchLower)
      )
    })
  }, [conversations, searchQuery, user])

  const selectedConv = conversations.find(c => c.id === selectedConversationId)
  const selectedOtherUser = selectedConv ? getOtherUser(selectedConv) : null

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />

        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
              {/* Conversations List */}
              <div className="lg:col-span-1">
                <Card className="h-full card-bg card-shadow border-literary-border">
                  <CardHeader className="p-4 sm:p-6 border-b border-literary-border">
                    <div className="flex items-center justify-between">
                      <h2 className="font-serif text-lg sm:text-xl font-semibold">Messages</h2>
                      <Button variant="ghost" size="sm" className="p-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="relative mt-4">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search messages..."
                        className="pl-10 border-literary-border"
                      />
                    </div>
                  </CardHeader>

                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      {loading ? (
                        <div className="text-center py-8">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                          <p className="mt-2 text-sm text-muted-foreground">
                            Loading conversations...
                          </p>
                        </div>
                      ) : filteredConversations.length > 0 ? (
                        filteredConversations.map((conv, index) => {
                          const otherUser = getOtherUser(conv)
                          if (!otherUser) return null

                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversationId(conv.id)}
                              className={`w-full p-3 rounded-lg text-left transition-colors hover:bg-literary-subtle ${
                                selectedConversationId === conv.id ? 'bg-literary-subtle' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="relative">
                                  <Avatar className="h-10 w-10">
                                    <AvatarImage
                                      src={otherUser.avatar_url}
                                      alt={otherUser.display_name}
                                    />
                                    <AvatarFallback className="bg-muted text-foreground font-medium text-sm">
                                      {otherUser.display_name
                                        .split(' ')
                                        .map(n => n[0])
                                        .join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-medium text-sm truncate">
                                      {otherUser.display_name}
                                    </h3>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-muted-foreground">
                                        {new Date(conv.updated_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-muted-foreground line-clamp-2">
                                    {conv.last_message?.content || 'No messages yet'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          )
                        })
                      ) : (
                        <div className="text-center py-8">
                          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground mb-2">No conversations yet</p>
                          <Link href="/authors" className="text-primary hover:underline text-sm">
                            Find writers to connect with
                          </Link>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </div>

              {/* Chat Interface */}
              <div className="lg:col-span-3">
                <Card className="h-full card-bg card-shadow border-literary-border flex flex-col">
                  {selectedOtherUser ? (
                    <>
                      {/* Chat Header */}
                      <CardHeader className="p-4 sm:p-6 border-b border-literary-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={selectedOtherUser.avatar_url}
                                  alt={selectedOtherUser.display_name}
                                />
                                <AvatarFallback className="bg-muted text-foreground font-medium">
                                  {selectedOtherUser.display_name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            <div>
                              <h3 className="font-medium">{selectedOtherUser.display_name}</h3>
                              <p className="text-xs text-muted-foreground">
                                @{selectedOtherUser.username}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              onClick={() => toast('Voice calls are not available yet')}
                            >
                              <Phone className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              onClick={() => toast('Video calls are not available yet')}
                            >
                              <Video className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2" asChild>
                              <Link href={`/profile/${selectedOtherUser.username}`}>
                                <Info className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                        <p className="text-muted-foreground">
                          Choose a conversation to start messaging
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedOtherUser && (
                    <>
                      {/* Messages */}
                      <ScrollArea className="flex-1 p-4 sm:p-6">
                        <div className="space-y-4">
                          {messages.length > 0 ? (
                            messages.map(message => {
                              const isOwn = message.sender_id === user?.id
                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'}`}>
                                    <div
                                      className={`p-3 rounded-2xl ${
                                        isOwn
                                          ? 'bg-primary text-primary-foreground ml-2'
                                          : 'bg-muted text-foreground mr-2'
                                      }`}
                                    >
                                      <p className="text-sm leading-relaxed">{message.content}</p>
                                    </div>
                                    <p
                                      className={`text-xs text-muted-foreground mt-1 ${
                                        isOwn ? 'text-right' : 'text-left'
                                      }`}
                                    >
                                      {new Date(message.created_at).toLocaleTimeString()}
                                    </p>
                                  </div>

                                  {!isOwn && (
                                    <Avatar className="h-6 w-6 order-1 mr-2 mt-auto">
                                      <AvatarImage
                                        src={selectedOtherUser.avatar_url}
                                        alt={selectedOtherUser.display_name}
                                      />
                                      <AvatarFallback className="bg-muted text-foreground text-xs">
                                        {selectedOtherUser.display_name
                                          .split(' ')
                                          .map(n => n[0])
                                          .join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                              )
                            })
                          ) : (
                            <div className="text-center py-8">
                              <p className="text-muted-foreground">
                                No messages yet. Start the conversation!
                              </p>
                            </div>
                          )}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Message Input */}
                      <div className="p-4 sm:p-6 border-t border-literary-border">
                        <div className="flex items-end space-x-2">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              onClick={() => toast('File attachments will be available soon')}
                            >
                              <Paperclip className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              onClick={() => toast('Image sharing will be available soon')}
                            >
                              <ImageIcon className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="flex-1 relative">
                            <Input
                              value={newMessage}
                              onChange={e => setNewMessage(e.target.value)}
                              onKeyPress={handleKeyPress}
                              placeholder="Type a message..."
                              className="pr-12 border-literary-border min-h-[40px]"
                              disabled={sendingMessage}
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1"
                              onClick={() => toast('Emoji picker will be available soon')}
                            >
                              <Smile className="h-4 w-4" />
                            </Button>
                          </div>

                          <Button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim() || sendingMessage}
                            size="sm"
                            className="p-2"
                          >
                            {sendingMessage ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

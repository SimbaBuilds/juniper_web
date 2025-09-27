'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/utils/supabase/client'
import { Loader2, Play, Trash2, Copy } from 'lucide-react'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  created_at: string
  message_count?: number
}

interface ConversationHistoryProps {
  onContinueChat: (messages: Message[], conversationId?: string) => void
}

export function ConversationHistory({ onContinueChat }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      // Load conversations from the past month
      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      // Load conversations from both chat and voice_chat types with message count
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select(`
          id, 
          title, 
          created_at,
          messages(count)
        `)
        .eq('user_id', user.id)
        .in('conversation_type', ['chat', 'voice_chat'])
        .gte('created_at', oneMonthAgo.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading conversations:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      const formattedConversations = conversations?.map(conv => ({
        id: conv.id,
        title: conv.title || 'Untitled Conversation',
        created_at: conv.created_at,
        message_count: conv.messages?.[0]?.count || 0
      })) || []

      setConversations(formattedConversations)
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversation history')
    } finally {
      setIsLoading(false)
    }
  }

  const continueConversation = async (conversationId: string) => {
    try {
      const supabase = createClient()
      const { data: messages, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const formattedMessages: Message[] = messages?.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
        timestamp: new Date(msg.created_at).getTime()
      })) || []

      onContinueChat(formattedMessages, conversationId)
    } catch (error) {
      console.error('Error loading messages for continue:', error)
      toast.error('Failed to load conversation messages')
    }
  }

  const copyConversation = async (conversationId: string) => {
    try {
      const supabase = createClient()
      const { data: messages, error } = await supabase
        .from('messages')
        .select('role, content, created_at')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })

      if (error) throw error

      const conversationText = messages?.map(msg => {
        const time = new Date(msg.created_at).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
        const role = msg.role === 'user' ? 'You' : 'Assistant'
        return `[${time}] ${role}: ${msg.content}`
      }).join('\n\n') || ''

      await navigator.clipboard.writeText(conversationText)
      toast.success('Copied to Clipboard')
    } catch (error) {
      console.error('Error copying conversation:', error)
      toast.error('Failed to copy conversation')
    }
  }

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return

    try {
      const supabase = createClient()
      
      // Delete messages first
      await supabase
        .from('messages')
        .delete()
        .eq('conversation_id', conversationId)
      
      // Then delete conversation
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId)

      if (error) throw error

      setConversations(prev => prev.filter(c => c.id !== conversationId))
      toast.success('Conversation deleted successfully')
    } catch (error) {
      console.error('Error deleting conversation:', error)
      toast.error('Failed to delete conversation')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
  }

  return (
    <div className="w-full lg:w-80 bg-muted/30 border-r flex flex-col h-full border lg:rounded-l-lg">
      <div className="p-3 lg:p-4 border-b">
        <h2 className="font-semibold text-lg">Chat History</h2>
        <p className="text-sm text-muted-foreground">Past month conversations</p>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center p-4">
          <div>
            <p className="text-muted-foreground">No conversations found</p>
            <p className="text-sm text-muted-foreground mt-1">Start chatting to see your history here</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="p-2 lg:p-2 pb-6">
            {conversations.map((conversation) => (
              <div key={conversation.id} className="mb-2 p-3 rounded-lg hover:bg-muted/50 border">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-sm" title={conversation.title}>
                      {conversation.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(conversation.created_at)}
                      </p>
                      {conversation.message_count && (
                        <span className="text-xs text-muted-foreground">
                          • {conversation.message_count} messages
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs flex-1"
                    onClick={() => continueConversation(conversation.id)}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Continue
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => copyConversation(conversation.id)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2"
                    onClick={() => deleteConversation(conversation.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { createClient } from '@/lib/utils/supabase/client'
import { Loader2, Play, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { ChatMessage } from './ChatMessage'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Conversation {
  id: string
  title: string
  created_at: string
  messages?: Message[]
  isExpanded?: boolean
  isLoading?: boolean
}

interface ConversationHistoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onContinueChat: (messages: Message[]) => void
}

export function ConversationHistory({ open, onOpenChange, onContinueChat }: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadConversations()
    }
  }, [open])

  const loadConversations = async () => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      // Load conversations from the last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .eq('conversation_type', 'chat')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setConversations(conversations || [])
    } catch (error) {
      console.error('Error loading conversations:', error)
      toast.error('Failed to load conversation history')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleConversation = async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId)
    if (!conversation) return

    if (conversation.isExpanded) {
      // Collapse
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, isExpanded: false, messages: undefined } : c
      ))
    } else {
      // Expand and load messages
      setConversations(prev => prev.map(c => 
        c.id === conversationId ? { ...c, isExpanded: true, isLoading: true } : c
      ))

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

        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, messages: formattedMessages, isLoading: false } : c
        ))
      } catch (error) {
        console.error('Error loading messages:', error)
        toast.error('Failed to load messages')
        setConversations(prev => prev.map(c => 
          c.id === conversationId ? { ...c, isExpanded: false, isLoading: false } : c
        ))
      }
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Conversation History</DialogTitle>
          <DialogDescription>
            Your conversations from the past 7 days
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            No conversations found
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="space-y-2 p-4">
              {conversations.map((conversation) => (
                <div key={conversation.id} className="border rounded-lg overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <button
                      onClick={() => toggleConversation(conversation.id)}
                      className="flex-1 text-left"
                    >
                      <h3 className="font-semibold truncate">{conversation.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(conversation.created_at)}
                      </p>
                    </button>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteConversation(conversation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      {conversation.messages && conversation.messages.length > 0 && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onContinueChat(conversation.messages!)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => toggleConversation(conversation.id)}
                      >
                        {conversation.isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {conversation.isExpanded && (
                    <div className="border-t p-4 bg-muted/50">
                      {conversation.isLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : conversation.messages ? (
                        <ScrollArea className="h-[300px]">
                          <div className="space-y-4">
                            {conversation.messages.map((message, index) => (
                              <ChatMessage key={index} message={message} />
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          No messages found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Send, Plus, Copy, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { ChatMessage } from './components/ChatMessage'
import { ConversationHistory } from './components/ConversationHistory'
import { createClient } from '@/lib/utils/supabase/client'
import { useRequestStatusPolling } from '@/hooks/useRequestStatusPolling'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const AUTO_CLEAR_DELAY = 10 * 60 * 1000 // 10 minutes

export default function ChatPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRequestInProgress, setIsRequestInProgress] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Define final states that should stop polling and clear tracking
  const finalStates = ['completed', 'failed', 'cancelled'];
  
  // Define all active states where cancel button should be shown
  const activeStates = ['pending', 'thinking', 'searching', 'processing', 'configuring', 
                        'retrieving', 'storing', 'integrating', 'pinging'];

  // Helper function to get status message
  const getStatusMessage = (status: string | null): string => {
    switch (status) {
      case 'pending':
        return 'Starting request...';
      case 'thinking':
        return 'Thinking...';
      case 'searching':
        return 'Searching...';
      case 'processing':
        return 'Processing...';
      case 'configuring':
        return 'Configuring...';
      case 'retrieving':
        return 'Retrieving...';
      case 'storing':
        return 'Storing...';
      case 'integrating':
        return 'Integrating... This can take up to 2 minutes.';
      case 'pinging':
        return 'Pinging... This can take a few moments.';
      case 'failed':
        return 'Request failed';
      case 'cancelled':
        return 'Request cancelled';
      default:
        return 'Processing...';
    }
  };

  // Integrate polling hook
  const { status: polledStatus } = useRequestStatusPolling({
    requestId: currentRequestId,
    onStatusChange: (status) => {
 
      setRequestStatus(status)
      if (finalStates.includes(status)) {
        console.log('[CHAT] Request reached final state, clearing tracking:', {
          requestId: currentRequestId,
          finalStatus: status
        })
        // Clear request tracking immediately
        setCurrentRequestId(null)
        setIsLoading(false)
        setIsRequestInProgress(false)
        setRequestStatus(null)
        abortControllerRef.current = null
      }
    }
  })

  // Debug logging for cancel button display - only log when relevant values change
  useEffect(() => {
    if (isLoading || isRequestInProgress || currentRequestId || requestStatus) {
      console.log('[CHAT] Cancel button display conditions:', {
        isLoading,
        isRequestInProgress,
        currentRequestId,
        requestStatus,
        isActiveState: requestStatus ? activeStates.includes(requestStatus) : false,
        shouldShowCancelButton: isRequestInProgress,
        timestamp: new Date().toISOString()
      })
    }
  }, [isLoading, isRequestInProgress, currentRequestId, requestStatus])

  // Get current user on mount
  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      }
    }
    getUser()
  }, [])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // Auto-clear functionality
  const resetAutoRefreshTimer = useCallback(() => {
    if (autoRefreshTimerRef.current) {
      clearTimeout(autoRefreshTimerRef.current)
    }
    
    if (messages.length > 0) {
      autoRefreshTimerRef.current = setTimeout(() => {
        handleClearChat(true)
      }, AUTO_CLEAR_DELAY)
    }
  }, [messages.length])

  useEffect(() => {
    resetAutoRefreshTimer()
    return () => {
      if (autoRefreshTimerRef.current) {
        clearTimeout(autoRefreshTimerRef.current)
      }
    }
  }, [messages, resetAutoRefreshTimer])

  const handleCancelRequest = async () => {
    console.log('[CHAT] Cancel request initiated:', {
      currentRequestId,
      currentStatus: requestStatus,
      hasAbortController: !!abortControllerRef.current
    })
    
    if (!currentRequestId) {
      console.log('[CHAT] No request ID to cancel')
      return
    }

    try {
      // Cancel via API
      const response = await fetch('/api/chat/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: currentRequestId,
        }),
      })

      if (response.ok) {
        console.log('[CHAT] Cancel API request successful')
        
        // Also abort the HTTP request
        if (abortControllerRef.current) {
          console.log('[CHAT] Aborting HTTP request')
          abortControllerRef.current.abort()
        }
        
        setCurrentRequestId(null)
        setIsLoading(false)
        setIsRequestInProgress(false)
        setRequestStatus(null)
        abortControllerRef.current = null
        
        toast.success('Request cancelled successfully')
      } else {
        const errorData = await response.json()
        console.error('[CHAT] Cancel API request failed:', errorData)
        toast.error(errorData.error || 'Failed to cancel request')
      }
    } catch (error) {
      console.error('[CHAT] Error cancelling request:', error)
      toast.error('Failed to cancel request')
    }
  }

  const handleSendMessage = async () => {
    const trimmedMessage = inputValue.trim()
    if (!trimmedMessage || isLoading) return

    console.log('[CHAT] Starting to send message:', {
      messageLength: trimmedMessage.length,
      currentIsLoading: isLoading,
      currentRequestId,
      currentStatus: requestStatus
    })

    const userMessage: Message = {
      role: 'user',
      content: trimmedMessage,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    setIsRequestInProgress(true)
    setRequestStatus('pending') // Set initial status

    console.log('[CHAT] Message state updated, creating AbortController')

    // Generate request ID immediately (like React Native does)
    const requestId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setCurrentRequestId(requestId)
    console.log('[CHAT] Generated request ID:', requestId)

    // Create AbortController for this request
    abortControllerRef.current = new AbortController()

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          history: [...messages, userMessage],
          request_id: requestId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      console.log('[CHAT] Request completed successfully with request ID:', requestId)
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Don't clear request tracking here - let polling handle it
      console.log('[CHAT] Request completed, response received. Polling will handle cleanup.')
      // The polling hook will clear everything when it detects a final state
      
    } catch (error) {
      // Check if error was due to cancellation
      if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        console.log('Request was cancelled by user')
        return // Don't show error toast for user-initiated cancellation
      }
      
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
      
      // Clear request tracking on error
      setCurrentRequestId(null)
      setRequestStatus(null)
      setIsLoading(false)
      setIsRequestInProgress(false)
      abortControllerRef.current = null
    }
  }

  const handleClearChat = async (isAutoRefresh = false) => {
    if (messages.length === 0) return

    try {
      // Save conversation to database
      if (user) {
        const supabase = createClient()
        // Create conversation
        const { data: conversation, error: convError } = await supabase
          .from('conversations')
          .insert({
            user_id: user.id,
            title: messages[0]?.content.substring(0, 100) || 'Untitled',
            conversation_type: 'chat',
            status: 'completed',
            metadata: {}
          })
          .select()
          .single()

        console.log('Conversation save result:', { conversation, convError })

        if (!convError && conversation) {
          // Save messages
          const messagesToSave = messages.map(msg => ({
            conversation_id: conversation.id,
            user_id: user.id,
            role: msg.role,
            content: msg.content,
            metadata: {},
            created_at: new Date(msg.timestamp).toISOString()
          }))

          const { data: savedMessages, error: msgError } = await supabase.from('messages').insert(messagesToSave)
          console.log('Messages save result:', { savedMessages, msgError })
        }
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
    }

    // Clear messages
    setMessages([])
    
    if (!isAutoRefresh) {
      toast.success('Chat cleared. Your conversation has been saved.')
    }
  }

  const handleCopyChat = () => {
    if (messages.length === 0) {
      toast.error('There are no messages to copy.')
      return
    }

    const chatText = messages.map(msg => {
      const time = new Date(msg.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
      const role = msg.role === 'user' ? 'You' : 'Assistant'
      return `[${time}] ${role}: ${msg.content}`
    }).join('\n\n')

    navigator.clipboard.writeText(chatText)
    toast.success('Chat conversation copied to clipboard.')
  }

  const handleContinueChat = (loadedMessages: Message[]) => {
    setMessages(loadedMessages)
    toast.success('Previous conversation has been loaded.')
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] overflow-hidden bg-background mb-4 border rounded-lg">
      <ConversationHistory onContinueChat={handleContinueChat} />
      
      <div className="flex-1 flex flex-col min-h-0 border-l">
        <div className="flex justify-between items-center p-4 border-b flex-shrink-0 bg-background">
          <h1 className="text-2xl font-bold">Chat with Juniper</h1>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleCopyChat}
              disabled={messages.length === 0}
              title="Copy chat"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleClearChat(false)}
              disabled={messages.length === 0}
              title="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 pb-8 min-h-0 bg-background">
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground mt-8">
            </div>
          ) : (
            <div>
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{getStatusMessage(requestStatus || (isLoading ? 'pending' : null))}</span>
                  {isRequestInProgress && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancelRequest}
                      className="text-xs h-6 px-2 ml-2"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t flex-shrink-0 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="flex gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type a message..."
              maxLength={2000}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-xs text-muted-foreground mt-1 text-right">
            {inputValue.length}/2000
          </div>
        </div>
      </div>
    </div>
  )
}
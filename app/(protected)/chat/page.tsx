'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Send, Plus, Copy, Loader2, X, Smartphone, ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ChatMessage } from './components/ChatMessage'
import { ConversationHistory } from './components/ConversationHistory'
import { ImageUpload } from './components/ImageUpload'
import { createClient } from '@/lib/utils/supabase/client'
import { useRequestStatusPolling } from '@/hooks/useRequestStatusPolling'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  imageUrl?: string
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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [showOnboardingMessage, setShowOnboardingMessage] = useState(false)
  const [hasCheckedForNewUser, setHasCheckedForNewUser] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Define final states that should stop polling and clear tracking
  const finalStates = ['completed', 'failed', 'cancelled'];
  
  // Define all active states where cancel button should be shown
  const activeStates = ['pending', 'thinking', 'searching', 'processing', 'configuring', 
                        'retrieving', 'storing', 'integrating', 'pinging', 'automating'];

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
      case 'automating':
        return 'Automating... This can take a few moments.';
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

  // Function to check if user is new (no conversation history)
  const checkForNewUser = async (userId: string) => {
    if (hasCheckedForNewUser) return
    
    try {
      // Check database for conversations
      const supabase = createClient()
      const { data: conversations, error } = await supabase
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .limit(1)
      
      if (error) {
        console.error('Error checking conversation history:', error)
        return
      }
      
      // If no conversations found, show onboarding message
      if (!conversations || conversations.length === 0) {
        setShowOnboardingMessage(true)
      }
      
      setHasCheckedForNewUser(true)
    } catch (error) {
      console.error('Error in checkForNewUser:', error)
      setHasCheckedForNewUser(true)
    }
  }

  // Get current user on mount
  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        checkForNewUser(user.id)
      }
    }
    getUser()
  }, [])

  // Function to get proper service display name
  const getServiceDisplayName = (serviceName: string): string => {
    const serviceMap: Record<string, string> = {
      'google-calendar': 'Google Calendar',
      'google-docs': 'Google Docs', 
      'google-sheets': 'Google Sheets',
      'google-meet': 'Google Meet',
      'microsoft-excel': 'Microsoft Excel',
      'microsoft-word': 'Microsoft Word',
      'microsoft-outlook-calendar': 'Microsoft Outlook Calendar',
      'outlook-calendar': 'Microsoft Outlook Calendar',
      'microsoft-outlook-mail': 'Microsoft Outlook Mail',
      'outlook-mail': 'Microsoft Outlook Mail',
      'microsoft-teams': 'Microsoft Teams',
      'notion': 'Notion',
      'slack': 'Slack',
      'gmail': 'Gmail',
      'fitbit': 'Fitbit',
      'textbelt': 'Textbelt',
    };
    
    return serviceMap[serviceName] || serviceName;
  };

  // Auto-send integration completion message when redirected from OAuth callback
  useEffect(() => {
    async function handleIntegrationCompletion() {
      if (!user) return

      const urlParams = new URLSearchParams(window.location.search)
      const integrationCompleted = urlParams.get('integration_completed')
      const serviceName = urlParams.get('service_name')

      if (integrationCompleted && serviceName) {
        const displayName = getServiceDisplayName(serviceName)
        console.log(`Auto-sending completion message for ${displayName} (${serviceName})`)
        
        // Clear URL params to prevent duplicate sends
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete('integration_completed')
        newUrl.searchParams.delete('service_name')
        window.history.replaceState({}, '', newUrl.toString())

        // Send completion message using the normal chat API
        const completionMessage = `Let's complete the integration for ${displayName}`
        const requestId = `integration-completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        
        // Add user message first (like normal chat flow)
        const userMessage: Message = {
          role: 'user',
          content: completionMessage,
          timestamp: Date.now()
        }
        
        setMessages(prev => [...prev, userMessage])
        
        try {
          setIsLoading(true)
          setIsRequestInProgress(true)
          setRequestStatus('pending')
          setCurrentRequestId(requestId)

          // Create AbortController for this request (like normal chat)
          abortControllerRef.current = new AbortController()

          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              message: completionMessage,
              history: [...messages, userMessage],
              request_id: requestId,
              integration_in_progress: true,
              service_name: serviceName,
            }),
            signal: abortControllerRef.current.signal,
          })

          if (!response.ok) {
            throw new Error('Failed to send completion message')
          }

          const data = await response.json()
          
          const assistantMessage: Message = {
            role: 'assistant',
            content: data.response,
            timestamp: Date.now()
          }

          setMessages(prev => [...prev, assistantMessage])
          toast.success(`${displayName} integration completed successfully!`)
          
          // Don't clear request tracking here - let polling handle it like normal chat
          console.log('[CHAT] Integration completion request completed, response received. Polling will handle cleanup.')
          
        } catch (error) {
          // Check if error was due to cancellation
          if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
            console.log('Integration completion request was cancelled by user')
            return // Don't show error toast for user-initiated cancellation
          }
          
          console.error('Error sending integration completion message:', error)
          toast.error(`Failed to complete ${displayName} integration. Please try again.`)
          
          // Clear request tracking on error
          setCurrentRequestId(null)
          setRequestStatus(null)
          setIsLoading(false)
          setIsRequestInProgress(false)
          abortControllerRef.current = null
        }
      }
    }

    handleIntegrationCompletion()
  }, [user, messages])

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
    if ((!trimmedMessage && !selectedImageUrl) || isLoading) return

    console.log('[CHAT] Starting to send message:', {
      messageLength: trimmedMessage.length,
      currentIsLoading: isLoading,
      currentRequestId,
      currentStatus: requestStatus
    })

    const userMessage: Message = {
      role: 'user',
      content: trimmedMessage || '',
      timestamp: Date.now(),
      imageUrl: selectedImageUrl || undefined
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setSelectedImageUrl(null) // Clear selected image
    
    // Hide onboarding message when user sends first message
    setShowOnboardingMessage(false)
    
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
          message: trimmedMessage || '',
          imageUrl: selectedImageUrl,
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
    <div className="space-y-4">
      <div className="flex h-[calc(100vh-13rem)] overflow-hidden bg-background border rounded-lg">
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
                {showOnboardingMessage && (
                  <div className="max-w-2xl mx-auto text-left">
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-sm">🤖</span>
                        </div>
                        <div className="flex-1">
                          <div className="prose prose-sm max-w-none">
                            <p className="mb-3">
                              <strong>Welcome to Juniper! 🎉</strong>
                            </p>
                            <p className="mb-3">
                            Hi there! I'm Juniper. We're honored to be part of your journey toward greater wellbeing and productivity. Together with my specialized agent team, we can help optimize your daily life - from tracking your health metrics to drafting and sending emails in your unique voice.
                            </p>
                            <p className="mb-0">
                              What would you like to get started with today? If you aren't sure, starting with an integration is a great way to learn about what we can accomplish together.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
            {/* Selected Image Preview */}
            {selectedImageUrl && (
              <div className="relative inline-block mb-2">
                <img
                  src={selectedImageUrl}
                  alt="Selected image"
                  className="max-w-32 max-h-32 rounded-lg border border-border object-cover"
                />
                <button
                  onClick={() => setSelectedImageUrl(null)}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90 transition-colors"
                  title="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="flex gap-2"
            >
              {/* Image Upload Button - now inline */}
              {user && (
                <ImageUpload
                  userId={user.id}
                  onImageSelected={setSelectedImageUrl}
                  onImageRemoved={() => setSelectedImageUrl(null)}
                  disabled={isLoading}
                  compact={true}
                  hasSelectedImage={!!selectedImageUrl}
                />
              )}
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
                disabled={(!inputValue.trim() && !selectedImageUrl) || isLoading}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {!selectedImageUrl && 'JPEG, PNG • Max 10MB'}
              </span>
              <span className="text-xs text-muted-foreground">
                {inputValue.length}/2000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Tip:</span> Our mobile apps include voice options with Android featuring always-on wake phrase detection.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
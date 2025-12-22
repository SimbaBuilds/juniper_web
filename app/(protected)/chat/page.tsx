'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Send, Plus, Copy, Loader2, X, Smartphone, ImageIcon, Menu } from 'lucide-react'
import { toast } from 'sonner'
import { ChatMessage } from './components/ChatMessage'
import { ConversationHistory } from './components/ConversationHistory'
import { ImageUpload } from './components/ImageUpload'
import { createClient } from '@/lib/utils/supabase/client'
import { useRequestStatusPolling } from '@/hooks/useRequestStatusPolling'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  imageUrl?: string
}

const AUTO_CLEAR_DELAY = 30 * 60 * 1000 // 10 minutes
const MINIMUM_LOADING_TIME = 2000 // 2 seconds minimum loading display

export default function ChatPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRequestInProgress, setIsRequestInProgress] = useState(false)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<string | null>(null)

  // Track previous states for change detection
  const previousRequestStatusRef = useRef<string | null>(null)
  const previousIsLoadingRef = useRef<boolean>(false)
  const previousRequestIdRef = useRef<string | null>(null)
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [showOnboardingMessage, setShowOnboardingMessage] = useState(false)
  const [hasCheckedForNewUser, setHasCheckedForNewUser] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const autoRefreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const loadingStartTimeRef = useRef<number | null>(null)
  const minimumLoadingTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pollingAbortControllerRef = useRef<AbortController | null>(null)

  // Define final states that should stop polling and clear tracking
  const finalStates = ['completed', 'failed', 'cancelled'];
  
  // Define all active states where cancel button should be shown
  const activeStates = ['pending', 'thinking', 'searching', 'processing', 'configuring',
                        'retrieving', 'storing', 'integrating', 'pinging', 'automating', 'caring'];

  // Function to clear UI state with minimum display time
  const clearUIWithMinimumTime = () => {
    const loadingStartTime = loadingStartTimeRef.current;
    const currentTime = Date.now();

    console.log('[CHAT] clearUIWithMinimumTime called:', {
      loadingStartTime,
      currentTime,
      hasLoadingStartTime: !!loadingStartTime,
      timestamp: new Date().toISOString()
    });

    // If no loading start time recorded, assume loading just started
    // and enforce full minimum display time
    if (!loadingStartTime) {
      console.log('[CHAT] No loading start time recorded, enforcing full minimum display time:', {
        minimumTime: MINIMUM_LOADING_TIME,
        timestamp: new Date().toISOString()
      });

      // Clear any existing timer
      if (minimumLoadingTimerRef.current) {
        clearTimeout(minimumLoadingTimerRef.current);
      }

      minimumLoadingTimerRef.current = setTimeout(() => {
        console.log('[CHAT] Minimum loading time timeout executed (no start time case):', {
          delayUsed: MINIMUM_LOADING_TIME,
          timestamp: new Date().toISOString()
        });
        setCurrentRequestId(null)
        setIsLoading(false)
        setIsRequestInProgress(false)
        setRequestStatus(null)
        abortControllerRef.current = null
        previousRequestStatusRef.current = null
        previousIsLoadingRef.current = false
        previousRequestIdRef.current = null
        // Clean up refs
        loadingStartTimeRef.current = null
        minimumLoadingTimerRef.current = null
      }, MINIMUM_LOADING_TIME);
      return;
    }

    const elapsedTime = currentTime - loadingStartTime;
    const remainingTime = Math.max(0, MINIMUM_LOADING_TIME - elapsedTime);

    if (remainingTime > 0) {
      console.log('[CHAT] Delaying UI clear for minimum display time:', {
        elapsedTime,
        remainingTime,
        timestamp: new Date().toISOString()
      });

      // Clear any existing timer
      if (minimumLoadingTimerRef.current) {
        clearTimeout(minimumLoadingTimerRef.current);
      }

      minimumLoadingTimerRef.current = setTimeout(() => {
        console.log('[CHAT] Minimum loading time timeout executed (remaining time case):', {
          delayUsed: remainingTime,
          timestamp: new Date().toISOString()
        });
        setCurrentRequestId(null)
        setIsLoading(false)
        setIsRequestInProgress(false)
        setRequestStatus(null)
        abortControllerRef.current = null
        previousRequestStatusRef.current = null
        previousIsLoadingRef.current = false
        previousRequestIdRef.current = null
        // Clean up refs
        loadingStartTimeRef.current = null
        minimumLoadingTimerRef.current = null
      }, remainingTime);
    } else {
      // Minimum time already elapsed, clear immediately
      console.log('[CHAT] Minimum time already elapsed, clearing immediately:', {
        elapsedTime,
        timestamp: new Date().toISOString()
      });
      setCurrentRequestId(null)
      setIsLoading(false)
      setIsRequestInProgress(false)
      setRequestStatus(null)
      abortControllerRef.current = null
      previousRequestStatusRef.current = null
      previousIsLoadingRef.current = false
      previousRequestIdRef.current = null
      // Clean up refs
      loadingStartTimeRef.current = null
      minimumLoadingTimerRef.current = null
    }
  };

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
      case 'caring':
        return 'Caring... This can take a few moments.';
      default:
        return 'Processing...';
    }
  };

  // Create abort controller for new polling session
  if (!pollingAbortControllerRef.current && currentRequestId) {
    pollingAbortControllerRef.current = new AbortController();
  }

  // Integrate polling hook
  const { status: polledStatus } = useRequestStatusPolling({
    requestId: currentRequestId,
    abortSignal: pollingAbortControllerRef.current?.signal,
    onStatusChange: (status, pollingRequestId) => {
      // Debug: Always log status changes to see what's happening
      console.log('[CHAT] Status change received:', {
        currentRequestId,
        pollingRequestId,
        status,
        isLoading,
        isRequestInProgress,
        timestamp: new Date().toISOString()
      });

      console.log('[CHAT] Processing status change:', {
        requestId: currentRequestId,
        newStatus: status,
        previousStatus: previousRequestStatusRef.current,
        timestamp: new Date().toISOString()
      });

      // Log only status changes
      if (status !== previousRequestStatusRef.current) {
        previousRequestStatusRef.current = status;
      }

      setRequestStatus(status)
      if (finalStates.includes(status)) {
        console.log('[CHAT] Request reached final state, clearing UI tracking:', {
          requestId: pollingRequestId,
          finalStatus: status,
          timestamp: new Date().toISOString()
        });
        clearUIWithMinimumTime();
      }
    }
  })

  // Log loading state changes only
  useEffect(() => {
    if (isLoading !== previousIsLoadingRef.current) {
      console.log('[CHAT] Loading state changed:', {
        previousIsLoading: previousIsLoadingRef.current,
        newIsLoading: isLoading,
        currentRequestId,
        requestStatus,
        timestamp: new Date().toISOString()
      });
      previousIsLoadingRef.current = isLoading;
    }
  }, [isLoading, currentRequestId, requestStatus])

  // Log request ID changes only
  useEffect(() => {
    if (currentRequestId !== previousRequestIdRef.current) {
      console.log('[CHAT] Request ID changed:', {
        previousRequestId: previousRequestIdRef.current,
        newRequestId: currentRequestId,
        timestamp: new Date().toISOString()
      });
      previousRequestIdRef.current = currentRequestId;
    }
  }, [currentRequestId])

  // Function to create a new conversation
  const createConversation = async (userId: string, firstMessage: string): Promise<string | null> => {
    try {
      const supabase = createClient()
      const { data: conversation, error } = await supabase
        .from('conversations')
        .insert({
          user_id: userId,
          title: firstMessage.substring(0, 100) || 'Untitled',
          conversation_type: 'chat',
          status: 'active',
          metadata: {}
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating conversation:', error)
        return null
      }

      return conversation.id
    } catch (error) {
      console.error('Error in createConversation:', error)
      return null
    }
  }

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
              conversation_id: conversationId,
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

          // Update response_fetched to true since the assistant message is now displayed
          try {
            const supabase = createClient()
            await supabase
              .from('requests')
              .update({
                response_fetched: true,
                updated_at: new Date().toISOString()
              })
              .eq('request_id', requestId)
            console.log('[CHAT] Updated response_fetched to true for integration completion request:', requestId)
          } catch (error) {
            console.error('[CHAT] Error updating response_fetched for integration completion:', error)
          }

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
    if ((!trimmedMessage && !selectedImageUrl) || isLoading || !user) return

    // console.log('[CHAT] Starting to send message:', {
    //   messageLength: trimmedMessage.length,
    //   currentIsLoading: isLoading,
    //   currentRequestId,
    //   currentStatus: requestStatus,
    //   conversationId
    // })

    // Create conversation if this is the first message
    let currentConversationId = conversationId
    if (!currentConversationId && user) {
      // console.log('[CHAT] Creating new conversation for first message')
      currentConversationId = await createConversation(user.id, trimmedMessage || 'Image message')
      if (currentConversationId) {
        setConversationId(currentConversationId)
        // console.log('[CHAT] Created conversation with ID:', currentConversationId)
      } else {
        // console.error('[CHAT] Failed to create conversation')
        toast.error('Failed to create conversation. Please try again.')
        return
      }
    }

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

    // Abort any existing polling to ensure only one active request
    if (pollingAbortControllerRef.current) {
      pollingAbortControllerRef.current.abort();
      pollingAbortControllerRef.current = null;
    }

    // Clear any existing minimum loading timer
    if (minimumLoadingTimerRef.current) {
      clearTimeout(minimumLoadingTimerRef.current);
      minimumLoadingTimerRef.current = null;
    }

    // Generate request ID immediately (like React Native does)
    const requestId = `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setCurrentRequestId(requestId)

    // Record loading start time for minimum display time
    const loadingStartTime = Date.now();
    loadingStartTimeRef.current = loadingStartTime;
    console.log('[CHAT] Loading start time recorded:', {
      requestId,
      loadingStartTime,
      timestamp: new Date().toISOString()
    });

    console.log('[CHAT] Starting new request:', {
      requestId,
      messageLength: trimmedMessage.length,
      hasImage: !!selectedImageUrl,
      conversationId: currentConversationId,
      timestamp: new Date().toISOString()
    })

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
          conversation_id: currentConversationId,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()

      console.log('[CHAT] Request completed successfully:', {
        requestId,
        responseLength: data.response?.length || 0,
        timestamp: new Date().toISOString()
      })

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Update response_fetched to true since the assistant message is now displayed
      try {
        const supabase = createClient()
        await supabase
          .from('requests')
          .update({
            response_fetched: true,
            updated_at: new Date().toISOString()
          })
          .eq('request_id', requestId)
        // console.log('[CHAT] Updated response_fetched to true for request:', requestId)
      } catch (error) {
        console.error('[CHAT] Error updating response_fetched:', error)
      }

      // Don't clear request tracking here - let polling handle it
      // console.log('[CHAT] Request completed, response received. Polling will handle cleanup.')
      // The polling hook will clear everything when it detects a final state
      
    } catch (error) {
      // Check if error was due to cancellation
      if (error instanceof Error && (error.name === 'AbortError' || error.message?.includes('aborted'))) {
        console.log('[CHAT] Request was cancelled by user:', {
          requestId,
          timestamp: new Date().toISOString()
        })
        return // Don't show error toast for user-initiated cancellation
      }

      console.error('[CHAT] Request failed:', {
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      })
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
    console.log('[CHAT] New chat button pressed:', {
      is_auto_refresh: isAutoRefresh,
      current_conversation_id: conversationId,
      message_count: messages.length,
      user_id: user?.id?.substring(0, 8) + '...' || 'unknown',
      timestamp: new Date().toISOString()
    });

    if (messages.length === 0) {
      console.log('[CHAT] No messages to save, clearing chat state only');
      setMessages([])
      setConversationId(null)
      return;
    }

    try {
      // Save messages to existing conversation if one exists
      if (user && conversationId) {
        console.log('[CHAT] Saving messages to conversation:', {
          conversation_id: conversationId,
          message_count: messages.length,
          user_id: user.id.substring(0, 8) + '...',
          timestamp: new Date().toISOString()
        });

        const supabase = createClient()

        // Update conversation status to completed
        const { error: convUpdateError } = await supabase
          .from('conversations')
          .update({ status: 'completed' })
          .eq('id', conversationId)

        console.log('[CHAT] Conversation status update result:', {
          conversation_id: conversationId,
          error: convUpdateError?.message || null,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('[CHAT] Error saving conversation during clear:', {
        conversation_id: conversationId,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }

    // Clear messages and conversation state
    console.log('[CHAT] Clearing chat state:', {
      previous_conversation_id: conversationId,
      cleared_message_count: messages.length,
      timestamp: new Date().toISOString()
    });

    setMessages([])
    setConversationId(null)

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
    toast.success('Copied to Clipboard')
  }

  const handleContinueChat = (loadedMessages: Message[], loadedConversationId?: string) => {
    setMessages(loadedMessages)
    if (loadedConversationId) {
      setConversationId(loadedConversationId)
    }
    toast.success('Previous conversation has been loaded.')
  }

  return (
    <div className="space-y-4">
      <div className="flex h-[calc(100vh-13rem)] md:h-[calc(100vh-13rem)] overflow-hidden bg-background border rounded-lg">
        {/* Conversation History - Hidden on mobile */}
        <div className="hidden lg:block">
          <ConversationHistory onContinueChat={handleContinueChat} />
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 lg:border-l">
          <div className="flex justify-between items-center p-3 md:p-4 border-b flex-shrink-0 bg-background">
            <div className="flex items-center gap-2">
              {/* Mobile conversation history trigger */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    title="Conversation history"
                  >
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0">
                  <SheetHeader className="p-4">
                    <SheetTitle>Chat History</SheetTitle>
                  </SheetHeader>
                  <div className="h-full">
                    <ConversationHistory onContinueChat={handleContinueChat} />
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="text-xl md:text-2xl font-bold">Chat with Juniper</h1>
            </div>
            <div className="flex gap-1 md:gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyChat}
                disabled={messages.length === 0}
                title="Copy chat"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <Copy className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleClearChat(false)}
                disabled={messages.length === 0}
                title="New chat"
                className="h-8 w-8 md:h-10 md:w-10"
              >
                <Plus className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </div>
          </div>

          <ScrollArea ref={scrollAreaRef} className="flex-1 p-2 md:p-4 pb-8 min-h-0 bg-background">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground mt-8">
                {showOnboardingMessage && (
                  <div className="max-w-2xl mx-auto text-left px-2">
                    <div className="bg-muted/50 rounded-lg p-3 md:p-4 mb-4">
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
                            Hi there! I'm Juniper, and I am honored to be part of your wellness and creative journey. My agent team and I can help out in multiple areas - from providing insights based on your health metrics and medical records to sending emails in your unique voice.  One cool feature is our automations workflow.  You can ask me “give me a weekly wellness report and analysis every Sunday at 8pm” and I will set that automation for you that you or I can edit any time.  It also works across productivity services: “Let me know whenever the new project budget is mentioned in Slack”.                            </p>
                            <p className="mb-0">
                              What would you like to get started with today?
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

          <div className="p-2 md:p-4 border-t flex-shrink-0 bg-background">
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
              className="flex gap-1 md:gap-2"
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
                disabled={false}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={(!inputValue.trim() && !selectedImageUrl) || isLoading}
                size="icon"
                className="h-9 w-9 md:h-10 md:w-10"
              >
                <Send className="h-3 w-3 md:h-4 md:w-4" />
              </Button>
            </form>
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-muted-foreground">
                {inputValue.length}/2000
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tip Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 md:p-4">
        <div className="flex items-start space-x-2 md:space-x-3">
          <div className="flex-shrink-0">
            <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="text-xs md:text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium"></span> Unlock voice options and wearable integrations with our mobile apps! {" "}
              <a
                href="https://apps.apple.com/us/app/juniperai/id6749830751"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
              >
                Download on App Store
              </a>
              {" | "}
              <a
                href="/support"
                className="text-blue-700 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 font-medium underline"
              >
                Google Play (Closed Testing)
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
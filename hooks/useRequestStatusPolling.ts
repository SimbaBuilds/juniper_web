import { useState, useEffect, useRef } from 'react';
import { createClient } from '../lib/utils/supabase/client';

export interface UseRequestStatusPollingOptions {
  requestId: string | null;
  intervalMs?: number;
  onStatusChange?: (status: string, requestId: string) => void;
}

export interface UseRequestStatusPollingReturn {
  status: string | null;
  userMessage: string | null;
  totalTurns: number | null;
  error: string | null;
  isPolling: boolean;
}

export const useRequestStatusPolling = (
  options: UseRequestStatusPollingOptions
): UseRequestStatusPollingReturn => {
  const { requestId, intervalMs = 5000, onStatusChange } = options;

  const [status, setStatus] = useState<string | null>(null);
  const [userMessage, setUserMessage] = useState<string | null>(null);
  const [totalTurns, setTotalTurns] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Track previous status for change detection
  const previousStatusRef = useRef<string | null>(null);
  const hasLoggedFinalStateRef = useRef<boolean>(false);
  const hasSeenNonFinalStatusRef = useRef<boolean>(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLogRef = useRef<number>(0);
  const POLLING_LOG_THROTTLE_MS = 10000; // Log polling every 10 seconds max

  // Final states that should stop polling
  const finalStates = ['completed', 'failed', 'cancelled'];

  useEffect(() => {
    
    if (!requestId) {
      setStatus(null);
      setUserMessage(null);
      setTotalTurns(null);
      setError(null);
      setIsPolling(false);
      previousStatusRef.current = null;
      hasLoggedFinalStateRef.current = false;
      hasSeenNonFinalStatusRef.current = false;
      return;
    }

    const startPolling = async () => {
      console.log('[POLLING_HOOK] Starting polling for request:', {
        request_id: requestId,
        interval_ms: intervalMs,
        timestamp: new Date().toISOString()
      });
      
      // Reset final state logging flag for new request
      hasLoggedFinalStateRef.current = false;
      hasSeenNonFinalStatusRef.current = false;
      setIsPolling(true);

      // Add 2 second delay before starting to poll to let backend create the request record
      await new Promise(resolve => setTimeout(resolve, 2000));

        const pollStatus = async () => {
          try {
            // Throttled logging for polling operations
            const now = Date.now();
            const shouldLog = now - lastLogRef.current > POLLING_LOG_THROTTLE_MS;

            if (shouldLog) {
              // console.log('[POLLING_HOOK] Polling request status:', {
              //   request_id: requestId,
              //   polling_interval: intervalMs,
              //   timestamp: new Date().toISOString()
              // });
              lastLogRef.current = now;
            }

            const supabase = createClient();

            const { data, error } = await supabase
              .from('requests')
              .select('status, user_message, total_turns, conversation_id')
              .eq('request_id', requestId)
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                // No rows returned - request not found, continue polling
                if (shouldLog) {
                  // console.log('[POLLING_HOOK] Request not found during polling:', {
                  //   request_id: requestId,
                  //   timestamp: new Date().toISOString()
                  // });
                }
                return;
              }
              console.error('[POLLING_HOOK] Error polling request status:', {
                request_id: requestId,
                error: error.message,
                code: error.code,
                timestamp: new Date().toISOString()
              });
              throw error;
            }

            const currentStatus = data?.status;
            const currentUserMessage = data?.user_message;
            const currentTotalTurns = data?.total_turns;
            const conversationId = data?.conversation_id;

            if (currentStatus) {
              // Track if we've seen any non-final status
              if (!finalStates.includes(currentStatus)) {
                hasSeenNonFinalStatusRef.current = true;
              }
              
              // Log only when status actually changes
              if (currentStatus !== previousStatusRef.current) {
                const isFirstPoll = previousStatusRef.current === null;
                console.log('[POLLING_HOOK] Status changed:', {
                  request_id: requestId,
                  previous_status: previousStatusRef.current,
                  new_status: currentStatus,
                  user_message: currentUserMessage,
                  total_turns: currentTotalTurns,
                  is_first_poll: isFirstPoll,
                  already_completed_on_first_poll: isFirstPoll && finalStates.includes(currentStatus),
                  timestamp: new Date().toISOString()
                });
                previousStatusRef.current = currentStatus;
              }

              setStatus(currentStatus);
              setUserMessage(currentUserMessage || null);
              setTotalTurns(currentTotalTurns || null);
              setError(null);

              // Call status change callback if provided
              if (onStatusChange) {
                onStatusChange(currentStatus, requestId);
              }

              // Stop polling when request reaches a final state
              if (finalStates.includes(currentStatus)) {
                // Only log final state once to prevent duplicate logs during cleanup
                if (!hasLoggedFinalStateRef.current) {
                  // If we never saw a non-final status, the request was already complete when we started polling
                  const wasAlreadyComplete = !hasSeenNonFinalStatusRef.current;
                  
                  console.log('[POLLING_HOOK] Stopping polling - final state reached:', {
                    request_id: requestId,
                    final_status: currentStatus,
                    total_turns: currentTotalTurns,
                    was_already_complete_on_first_poll: wasAlreadyComplete,
                    note: wasAlreadyComplete ? 'Request completed before polling started (within 2s delay)' : 'Request completed during polling',
                    timestamp: new Date().toISOString()
                  });
                  hasLoggedFinalStateRef.current = true;
                }

                if (intervalRef.current) {
                  clearInterval(intervalRef.current);
                  intervalRef.current = null;
                }
                setIsPolling(false);
              }
            }
          } catch (err) {
            console.error('[POLLING_HOOK] Polling failed:', {
              request_id: requestId,
              error: err instanceof Error ? err.message : 'Unknown error',
              timestamp: new Date().toISOString()
            });
            setError(err instanceof Error ? err.message : 'Failed to fetch request status');
            setIsPolling(false);
          }
        };

        // Initial poll
        await pollStatus();

        // Set up interval for subsequent polls
        intervalRef.current = setInterval(pollStatus, intervalMs);
      };

    // Start the polling process
    startPolling();

    // Cleanup on unmount or when requestId changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPolling(false);
      hasLoggedFinalStateRef.current = false;
      hasSeenNonFinalStatusRef.current = false;
    };
  }, [requestId, intervalMs, onStatusChange]);

  return {
    status,
    userMessage,
    totalTurns,
    error,
    isPolling
  };
};
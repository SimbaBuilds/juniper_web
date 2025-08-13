import { useState, useEffect, useRef } from 'react';
import { createClient } from '../lib/utils/supabase/client';

export interface UseRequestStatusPollingOptions {
  requestId: string | null;
  intervalMs?: number;
  onStatusChange?: (status: string) => void;
}

export interface UseRequestStatusPollingReturn {
  status: string | null;
  error: string | null;
  isPolling: boolean;
}

export const useRequestStatusPolling = (
  options: UseRequestStatusPollingOptions
): UseRequestStatusPollingReturn => {
  const { requestId, intervalMs = 5000, onStatusChange } = options;
  
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Final states that should stop polling
  const finalStates = ['completed', 'failed', 'cancelled'];

  useEffect(() => {
    console.log('[POLLING] useEffect triggered with requestId:', requestId);
    
    if (!requestId) {
      console.log('[POLLING] No requestId, clearing status and stopping polling');
      setStatus(null);
      setError(null);
      setIsPolling(false);
      return;
    }

    console.log('[POLLING] Starting polling for requestId:', requestId);
    setIsPolling(true);

    const pollStatus = async () => {
      try {
        console.log('[POLLING] Polling status for requestId:', requestId);
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from('requests')
          .select('status')
          .eq('request_id', requestId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned - request not found, continue polling
            console.log('[POLLING] Request not found in database, continuing to poll...');
            return;
          }
          throw error;
        }

        const currentStatus = data?.status;
        console.log('[POLLING] Received status:', currentStatus, 'for requestId:', requestId);
        
        if (currentStatus) {
          setStatus(currentStatus);
          setError(null);
          
          // Call status change callback if provided
          if (onStatusChange) {
            console.log('[POLLING] Calling onStatusChange with status:', currentStatus);
            onStatusChange(currentStatus);
          }

          // Stop polling when request reaches a final state
          if (finalStates.includes(currentStatus)) {
            console.log('[POLLING] Final status reached:', currentStatus, 'stopping polling');
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
              console.log('[POLLING] Polling interval cleared');
            }
            setIsPolling(false);
          }
        }
      } catch (err) {
        console.error('[POLLING] Error polling status for requestId:', requestId, 'error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch request status');
        setIsPolling(false);
      }
    };

    // Initial poll
    console.log('[POLLING] Starting initial poll');
    pollStatus();

    // Set up interval for subsequent polls
    console.log('[POLLING] Setting up polling interval:', intervalMs, 'ms');
    intervalRef.current = setInterval(pollStatus, intervalMs);

    // Cleanup on unmount or when requestId changes
    return () => {
      console.log('[POLLING] Cleaning up polling for requestId:', requestId);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        console.log('[POLLING] Polling interval cleared in cleanup');
      }
      setIsPolling(false);
    };
  }, [requestId, intervalMs, onStatusChange]);

  return {
    status,
    error,
    isPolling
  };
};
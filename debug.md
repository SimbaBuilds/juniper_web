CHAT] Message state updated, creating AbortController
useRequestStatusPolling.ts:31 [POLLING] useEffect triggered with requestId: null
useRequestStatusPolling.ts:34 [POLLING] No requestId, clearing status and stopping polling
page.tsx:100 [CHAT] Cancel button display conditions: {isLoading: true, isRequestInProgress: true, currentRequestId: null, requestStatus: 'pending', isActiveState: true, …}
page.tsx:157 [CHAT] Cancel request initiated: {currentRequestId: null, currentStatus: 'pending', hasAbortController: true}
page.tsx:164 [CHAT] No request ID to cancel
page.tsx:256 [CHAT] Received request ID from API: {requestId: 'web-1755118873402-dx7xj4xw8', currentStatus: null, willStartPolling: true}
page.tsx:274 [CHAT] Request completed, response received. Polling will handle cleanup.
useRequestStatusPolling.ts:31 [POLLING] useEffect triggered with requestId: web-1755118873402-dx7xj4xw8
useRequestStatusPolling.ts:41 [POLLING] Starting polling for requestId: web-1755118873402-dx7xj4xw8
useRequestStatusPolling.ts:96 [POLLING] Starting initial poll
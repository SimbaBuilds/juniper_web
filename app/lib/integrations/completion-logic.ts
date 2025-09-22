import { serverRequestService } from '@/lib/services/requestService';

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://juniper-python-backend.onrender.com';

export interface CompletionResult {
  success: boolean;
  response?: string;
  timestamp?: number;
  integration_in_progress?: boolean;
  request_id?: string;
  error?: string;
}

export async function sendCompletionMessageDirect(
  serviceName: string, 
  userId: string, 
  supabase: any
): Promise<CompletionResult> {
  let requestId: string | undefined;

  try {
    console.log(`Processing completion message for ${serviceName} to user ${userId}`);

    // Get session for backend authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      console.error('No valid session for completion message authentication');
      return {
        success: false,
        error: 'No valid session token'
      };
    }

    // Get user profile for settings
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('general_instructions, base_language_model, timezone')
      .eq('id', userId)
      .single();

    // Generate request ID for tracking
    requestId = `integration-completion-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('Integration completion request ID:', requestId);

    const message = `Let's complete the integration for ${serviceName}`;

    // Create request record in database
    try {
      await serverRequestService.createRequest(userId, {
        request_id: requestId,
        request_type: 'integration_completion',
        status: 'pending',
        metadata: {
          message: message,
          integration_in_progress: true,
          service_name: serviceName,
          timestamp: Date.now()
        }
      });
    } catch (requestError) {
      console.error('Failed to create completion request record:', requestError);
      return {
        success: false,
        error: 'Failed to create request record'
      };
    }

    // Update request status to processing
    try {
      await serverRequestService.updateRequestStatus(requestId, 'processing');
    } catch (updateError) {
      console.error('Failed to update completion request status to processing:', updateError);
    }

    // Prepare request for Python backend (matching backend ChatRequest model)
    const chatRequest = {
      message: message,
      timestamp: Date.now(),
      history: [], // No history for completion messages
      preferences: {
        general_instructions: profile?.general_instructions || '',
        base_language_model: profile?.base_language_model || 'gpt-4',
        timezone: profile?.timezone || 'UTC'
      },
      request_id: requestId,
      integration_in_progress: true, // Key flag for completion messages
      service_name: serviceName
    };

    // Call Python backend using FormData format (matching main chat endpoint)
    const formData = new FormData();
    formData.append('json_data', JSON.stringify(chatRequest));

    console.log(`Sending integration completion message for ${serviceName} to backend`);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python backend error for completion message:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      });
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Integration completion message sent successfully:', {
      hasResponse: !!data.response,
      responseLength: data.response?.length,
      timestamp: data.timestamp,
      integrationInProgress: data.integration_in_progress
    });

    // Update request status to completed
    try {
      await serverRequestService.updateRequestStatus(requestId, 'completed', {
        response: data.response,
        backend_timestamp: data.timestamp,
        completion_successful: true
      });
    } catch (updateError) {
      console.error('Failed to update completion request status to completed:', updateError);
    }

    console.log(`=== INTEGRATION COMPLETION SUCCESS for ${serviceName} ===`);
    return {
      success: true,
      response: data.response,
      timestamp: data.timestamp,
      integration_in_progress: data.integration_in_progress || true,
      request_id: requestId,
    };

  } catch (error) {
    console.error(`=== INTEGRATION COMPLETION FAILED ===`);
    console.error('Integration completion error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Update request status to failed if we have a requestId in scope
    if (typeof requestId !== 'undefined') {
      try {
        await serverRequestService.updateRequestStatus(requestId, 'failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          error_timestamp: Date.now()
        });
      } catch (updateError) {
        console.error('Failed to update completion request status to failed:', updateError);
      }
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
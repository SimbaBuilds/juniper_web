import { createClient } from '../utils/supabase/client';
import { createSupabaseAppServerClient } from '../utils/supabase/server';
import { Request, CancellationRequest } from '../tables';

export interface CreateRequestData {
  request_id: string;
  request_type: string;
  status: string;
  metadata?: Record<string, any>;
  image_url?: string;
  conversation_id?: string;
  network_success?: boolean;
}

export interface RequestService {
  // Request management
  createRequest(userId: string, requestData: CreateRequestData): Promise<Request>;
  getRequestStatus(requestId: string): Promise<string | null>;
  updateRequestStatus(requestId: string, status: string, metadata?: Record<string, any>): Promise<Request>;
  updateNetworkSuccess(requestId: string, networkSuccess: boolean): Promise<Request>;
  updateResponseFetched(requestId: string, responseFetched: boolean): Promise<Request>;

  // Cancellation management
  createCancellationRequest(userId: string, requestId: string): Promise<CancellationRequest>;
  isCancellationRequested(requestId: string): Promise<boolean>;
}

class RequestServiceImpl implements RequestService {
  private lastPollingLog: Map<string, number> = new Map();
  private readonly POLLING_LOG_THROTTLE_MS = 5000; // Log polling every 5 seconds max per request_id

  /**
   * Create a new request record in the database
   */
  async createRequest(userId: string, requestData: CreateRequestData): Promise<Request> {
    const supabase = createClient();

    const requestRecord = {
      user_id: userId,
      request_id: requestData.request_id,
      request_type: requestData.request_type,
      status: requestData.status,
      metadata: requestData.metadata || {},
      image_url: requestData.image_url,
      conversation_id: requestData.conversation_id,
      network_success: requestData.network_success,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[REQUEST_SERVICE] Creating request record:', {
      request_id: requestData.request_id,
      request_type: requestData.request_type,
      status: requestData.status,
      conversation_id: requestData.conversation_id,
      has_image: !!requestData.image_url,
      user_id: userId.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('requests')
      .insert(requestRecord)
      .select()
      .single();

    if (error) {
      console.error('[REQUEST_SERVICE] Error creating request:', {
        request_id: requestData.request_id,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('[REQUEST_SERVICE] Request record created successfully:', {
      request_id: requestData.request_id,
      database_id: data.id,
      conversation_id: data.conversation_id,
      timestamp: new Date().toISOString()
    });

    return data;
  }

  /**
   * Get the current status of a request
   */
  async getRequestStatus(requestId: string): Promise<string | null> {
    const supabase = createClient();

    // Throttled logging for polling operations
    const now = Date.now();
    const lastLog = this.lastPollingLog.get(requestId) || 0;
    const shouldLog = now - lastLog > this.POLLING_LOG_THROTTLE_MS;

    if (shouldLog) {
      console.log('[REQUEST_SERVICE] Polling request status:', {
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
      this.lastPollingLog.set(requestId, now);
    }

    const { data, error } = await supabase
      .from('requests')
      .select('status, conversation_id')
      .eq('request_id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - request not found
        if (shouldLog) {
          console.log('[REQUEST_SERVICE] Request not found during polling:', {
            request_id: requestId,
            timestamp: new Date().toISOString()
          });
        }
        return null;
      }
      console.error('[REQUEST_SERVICE] Error polling request status:', {
        request_id: requestId,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    if (shouldLog) {
      console.log('[REQUEST_SERVICE] Status polling result:', {
        request_id: requestId,
        status: data?.status,
        conversation_id: data?.conversation_id,
        timestamp: new Date().toISOString()
      });
    }

    return data?.status || null;
  }

  /**
   * Update the status of an existing request
   */
  async updateRequestStatus(
    requestId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<Request> {
    const supabase = createClient();

    console.log('[REQUEST_SERVICE] Updating request status:', {
      request_id: requestId,
      old_status: 'unknown',
      new_status: status,
      has_metadata: !!metadata,
      timestamp: new Date().toISOString()
    });

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[REQUEST_SERVICE] Error updating request status:', {
        request_id: requestId,
        attempted_status: status,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('[REQUEST_SERVICE] Request status updated successfully:', {
      request_id: requestId,
      new_status: data.status,
      conversation_id: data.conversation_id,
      database_id: data.id,
      timestamp: new Date().toISOString()
    });

    return data;
  }

  /**
   * Update the network_success field of a request
   */
  async updateNetworkSuccess(requestId: string, networkSuccess: boolean): Promise<Request> {
    const supabase = createClient();

    const updateData = {
      network_success: networkSuccess,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating network success:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update the response_fetched field of a request
   */
  async updateResponseFetched(requestId: string, responseFetched: boolean): Promise<Request> {
    const supabase = createClient();

    console.log('[REQUEST_SERVICE] Updating response_fetched:', {
      request_id: requestId,
      response_fetched: responseFetched,
      timestamp: new Date().toISOString()
    });

    const updateData = {
      response_fetched: responseFetched,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[REQUEST_SERVICE] Error updating response_fetched:', {
        request_id: requestId,
        attempted_value: responseFetched,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('[REQUEST_SERVICE] Response_fetched updated successfully:', {
      request_id: requestId,
      response_fetched: data.response_fetched,
      conversation_id: data.conversation_id,
      database_id: data.id,
      timestamp: new Date().toISOString()
    });

    return data;
  }

  /**
   * Create a cancellation request
   */
  async createCancellationRequest(userId: string, requestId: string): Promise<CancellationRequest> {
    const supabase = createClient();

    const cancellationRecord = {
      user_id: userId,
      request_id: requestId,
      request_type: 'chat',
      status: 'pending',
      metadata: { cancelled_at: new Date().toISOString() },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cancellation_requests')
      .insert(cancellationRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating cancellation request:', error);
      throw error;
    }

    return data;
  }

  /**
   * Check if a cancellation has been requested for a specific request
   */
  async isCancellationRequested(requestId: string): Promise<boolean> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('cancellation_requests')
      .select('id')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .limit(1);

    if (error) {
      console.error('Error checking cancellation request:', error);
      throw error;
    }

    return (data?.length || 0) > 0;
  }
}

// Server-side version for API routes
export class ServerRequestService implements RequestService {
  private lastPollingLog: Map<string, number> = new Map();
  private readonly POLLING_LOG_THROTTLE_MS = 5000; // Log polling every 5 seconds max per request_id

  async createRequest(userId: string, requestData: CreateRequestData): Promise<Request> {
    const supabase = await createSupabaseAppServerClient();

    const requestRecord = {
      user_id: userId,
      request_id: requestData.request_id,
      request_type: requestData.request_type,
      status: requestData.status,
      metadata: requestData.metadata || {},
      image_url: requestData.image_url,
      conversation_id: requestData.conversation_id,
      network_success: requestData.network_success,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    console.log('[SERVER_REQUEST_SERVICE] Creating request record:', {
      request_id: requestData.request_id,
      request_type: requestData.request_type,
      status: requestData.status,
      conversation_id: requestData.conversation_id,
      has_image: !!requestData.image_url,
      user_id: userId.substring(0, 8) + '...',
      timestamp: new Date().toISOString()
    });

    const { data, error } = await supabase
      .from('requests')
      .insert(requestRecord)
      .select()
      .single();

    if (error) {
      console.error('[SERVER_REQUEST_SERVICE] Error creating request:', {
        request_id: requestData.request_id,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('[SERVER_REQUEST_SERVICE] Request record created successfully:', {
      request_id: requestData.request_id,
      database_id: data.id,
      conversation_id: data.conversation_id,
      timestamp: new Date().toISOString()
    });

    return data;
  }

  async getRequestStatus(requestId: string): Promise<string | null> {
    const supabase = await createSupabaseAppServerClient();

    // Throttled logging for polling operations
    const now = Date.now();
    const lastLog = this.lastPollingLog.get(requestId) || 0;
    const shouldLog = now - lastLog > this.POLLING_LOG_THROTTLE_MS;

    if (shouldLog) {
      console.log('[SERVER_REQUEST_SERVICE] Polling request status:', {
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
      this.lastPollingLog.set(requestId, now);
    }

    const { data, error } = await supabase
      .from('requests')
      .select('status, conversation_id')
      .eq('request_id', requestId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        if (shouldLog) {
          console.log('[SERVER_REQUEST_SERVICE] Request not found during polling:', {
            request_id: requestId,
            timestamp: new Date().toISOString()
          });
        }
        return null;
      }
      console.error('[SERVER_REQUEST_SERVICE] Error polling request status:', {
        request_id: requestId,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    if (shouldLog) {
      console.log('[SERVER_REQUEST_SERVICE] Status polling result:', {
        request_id: requestId,
        status: data?.status,
        conversation_id: data?.conversation_id,
        timestamp: new Date().toISOString()
      });
    }

    return data?.status || null;
  }

  async updateRequestStatus(
    requestId: string,
    status: string,
    metadata?: Record<string, any>
  ): Promise<Request> {
    const supabase = await createSupabaseAppServerClient();

    console.log('[SERVER_REQUEST_SERVICE] Updating request status:', {
      request_id: requestId,
      old_status: 'unknown',
      new_status: status,
      has_metadata: !!metadata,
      timestamp: new Date().toISOString()
    });

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (metadata) {
      updateData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[SERVER_REQUEST_SERVICE] Error updating request status:', {
        request_id: requestId,
        attempted_status: status,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('[SERVER_REQUEST_SERVICE] Request status updated successfully:', {
      request_id: requestId,
      new_status: data.status,
      conversation_id: data.conversation_id,
      database_id: data.id,
      timestamp: new Date().toISOString()
    });

    return data;
  }

  async updateNetworkSuccess(requestId: string, networkSuccess: boolean): Promise<Request> {
    const supabase = await createSupabaseAppServerClient();

    const updateData = {
      network_success: networkSuccess,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) {
      console.error('Error updating network success:', error);
      throw error;
    }

    return data;
  }

  async updateResponseFetched(requestId: string, responseFetched: boolean): Promise<Request> {
    const supabase = await createSupabaseAppServerClient();

    console.log('[SERVER_REQUEST_SERVICE] Updating response_fetched:', {
      request_id: requestId,
      response_fetched: responseFetched,
      timestamp: new Date().toISOString()
    });

    const updateData = {
      response_fetched: responseFetched,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('requests')
      .update(updateData)
      .eq('request_id', requestId)
      .select()
      .single();

    if (error) {
      console.error('[SERVER_REQUEST_SERVICE] Error updating response_fetched:', {
        request_id: requestId,
        attempted_value: responseFetched,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString()
      });
      throw error;
    }

    console.log('[SERVER_REQUEST_SERVICE] Response_fetched updated successfully:', {
      request_id: requestId,
      response_fetched: data.response_fetched,
      conversation_id: data.conversation_id,
      database_id: data.id,
      timestamp: new Date().toISOString()
    });

    return data;
  }

  async createCancellationRequest(userId: string, requestId: string): Promise<CancellationRequest> {
    const supabase = await createSupabaseAppServerClient();

    const cancellationRecord = {
      user_id: userId,
      request_id: requestId,
      request_type: 'chat',
      status: 'pending',
      metadata: { cancelled_at: new Date().toISOString() },
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('cancellation_requests')
      .insert(cancellationRecord)
      .select()
      .single();

    if (error) {
      console.error('Error creating cancellation request:', error);
      throw error;
    }

    return data;
  }

  async isCancellationRequested(requestId: string): Promise<boolean> {
    const supabase = await createSupabaseAppServerClient();

    const { data, error } = await supabase
      .from('cancellation_requests')
      .select('id')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .limit(1);

    if (error) {
      console.error('Error checking cancellation request:', error);
      throw error;
    }

    return (data?.length || 0) > 0;
  }
}

// Export singleton instances
export const requestService = new RequestServiceImpl();
export const serverRequestService = new ServerRequestService();
export type UserProfile = {
    id: string;
    display_name?: string;
    deepgram_enabled: boolean;
    base_language_model: string;
    general_instructions: string;
    wake_word: string;
    wake_word_sensitivity: number;
    wake_word_detection_enabled: boolean;
    selected_deepgram_voice: string;
    timezone: string;
    preferences: Record<string, any>;
    // XAI LiveSearch settings
    xai_live_search_enabled?: boolean;
    xai_live_search_safe_search?: boolean;
    created_at: Date;
    updated_at: Date;
  };
  
  export const userProfileFields = [
    'id', 'display_name', 'deepgram_enabled', 'base_language_model', 'general_instructions',
    'wake_word', 'wake_word_sensitivity', 'wake_word_detection_enabled', 'selected_deepgram_voice', 'timezone', 'preferences', 
    'xai_live_search_enabled', 'xai_live_search_safe_search',
    'created_at', 'updated_at'
  ] as const;
  export type UserProfileField = (typeof userProfileFields)[number];
  
  export type Conversation = {
    id: string;
    user_id: string;
    title?: string;
    summary?: string;
    conversation_type: string;
    status: string;
    metadata: Record<string, any>;
    created_at: Date;
    updated_at: Date;
  };
  
  export const conversationFields = [
    'id', 'user_id', 'title', 'summary', 'conversation_type', 
    'status', 'metadata', 'created_at', 'updated_at'
  ] as const;
  export type ConversationField = (typeof conversationFields)[number];
  
  export type Message = {
    id: string;
    conversation_id: string;
    user_id: string;
    role: string;
    content: string;
    audio_url?: string;
    transcription_confidence?: number;
    tool_calls?: Record<string, any>;
    metadata: Record<string, any>;
    created_at: Date;
  };
  
  export const messageFields = [
    'id', 'conversation_id', 'user_id', 'role', 'content', 'audio_url',
    'transcription_confidence', 'tool_calls', 'metadata', 'created_at'
  ] as const;
  export type MessageField = (typeof messageFields)[number];
  
  export type Memory = {
    id: string;
    user_id: string;
    memory_type: string;
    category?: string;
    title: string;
    content: string;
    tags: string[];
    importance_score: number;
    embedding?: number[];
    decay_factor: number;
    auto_committed: boolean;
    source_conversation_id?: string;
    last_accessed: Date;
    created_at: Date;
    updated_at: Date;
  };
  
  export const memoryFields = [
    'id', 'user_id', 'memory_type', 'category', 'title', 'content',
    'importance_score', 'embedding', 'decay_factor', 'auto_committed',
    'source_conversation_id', 'last_accessed', 'created_at', 'updated_at'
  ] as const;
  export type MemoryField = (typeof memoryFields)[number];

  
  
  export type UserHabit = {
    id: string;
    user_id: string;
    habit_type: string;
    pattern: string;
    frequency_data: Record<string, any>;
    confidence_score: number;
    suggested_automation?: string;
    automation_approved: boolean;
    last_observed: Date;
    created_at: Date;
  };
  
  export const userHabitFields = [
    'id', 'user_id', 'habit_type', 'pattern', 'frequency_data',
    'confidence_score', 'suggested_automation', 'automation_approved',
    'last_observed', 'created_at'
  ] as const;
  export type UserHabitField = (typeof userHabitFields)[number];
  
  export type Automation = {
    id: string;
    user_id: string;
    name: string;
    trigger_conditions: Record<string, any>;
    actions: Record<string, any>;
    is_active: boolean;
    execution_count: number;
    last_executed?: Date;
    notes?: string;
    created_at: Date;
  };
  
  export const automationFields = [
    'id', 'user_id', 'name', 'trigger_conditions', 'actions',
    'is_active', 'execution_count', 'last_executed', 'notes', 'created_at'
  ] as const;
  export type AutomationField = (typeof automationFields)[number];
  
  
  export type ConfigForm = {
    id: string;
    service_id: string;
    json: Record<string, any>;
    setup_instructions?: string;
    updated_at: Date;
  };

  export const configFormFields = [
    'id', 'service_id', 'json', 'setup_instructions', 'updated_at'
  ] as const;
  export type ConfigFormField = (typeof configFormFields)[number];
  
  export type Integration = {
    id: string;
    user_id: string;
    service_id: string; // points to service id instead of service_name
    notes?: string;
    is_active: boolean;
    status?: string; // pending, in_progress, active, inactive, failed
    last_used?: Date;
    created_at: Date;
    // OAuth fields (for calendar and email integrations)
    access_token?: string;
    refresh_token?: string;
    expires_at?: Date;
    // Email specific fields
    email_address?: string;
    // Notion specific fields
    bot_id?: string;
    workspace_name?: string;
    workspace_icon?: string;
    workspace_id?: string;
    owner_info?: Record<string, any>;
    duplicated_template_id?: string;
    // Common sync fields
    last_sync?: Date;
    updated_at?: Date;
    client_id?: string;
    client_secret_id?: string;
    client_secret_value?: string;
  };
  
  export const integrationFields = [
    'id', 'user_id', 'service_id', 'notes', 'is_active', 'status', 'last_used', 'created_at',
    'access_token', 'refresh_token', 'expires_at', 'email_address',
    'bot_id', 'workspace_name', 'workspace_icon', 'workspace_id', 'owner_info', 'duplicated_template_id',
    'last_sync', 'updated_at', 'client_id', 'client_secret_id', 'client_secret_value'
  ] as const;
  export type IntegrationField = (typeof integrationFields)[number];

  export type Service = {
    id: string;
    created_at: Date;
    service_name: string;
    num_users: number;
    config_form_id?: string; // Foreign key to ConfigForm.id
    auth_script?: string;
    tools?: string[];
    integration_method?: string; // e.g. OAuth, External App, Internal App etc.
  };

  export const serviceFields = [
    'id', 'created_at', 'service_name', 'num_users', 'config_form_id',
    'auth_script', 'tools', 'integration_method'
  ] as const;
  export type ServiceField = (typeof serviceFields)[number];

  export type Action = {
    id: string;
    service_id: string;
    name: string;
    description: string;
    parameters: Record<string, any>;  // JSON schema for input parameters
    returns: Record<string, any>;     // JSON schema for output format
    example: Record<string, any>;     // Example usage
    run_script: string;               // Executable Python script/logic
    endpoint_url?: string;            // API endpoint if applicable
    http_method?: string;             // GET, POST, etc.
    auth_required: boolean;           // Whether authentication is needed
    category?: string;                // e.g., "communication", "storage", "analytics"
    version: string;                  // Tool version
    is_active: boolean;               // Whether tool is available for use
    execution_timeout: number;        // Timeout in seconds
    rate_limit?: number;              // Max executions per minute
    created_at: Date;
    updated_at?: Date;
  };

  export const actionFields = [
    'id', 'service_id', 'name', 'description', 'parameters',
    'returns', 'example', 'run_script', 'endpoint_url', 'http_method',
    'auth_required', 'category', 'version', 'is_active', 'execution_timeout',
    'rate_limit', 'created_at', 'updated_at'
  ] as const;
  export type ActionField = (typeof actionFields)[number];

  export type CancellationRequest = {
    id: string;
    user_id: string;
    request_id: string;          // Unique identifier for the request to cancel
    request_type: string;        // Type of request (chat, integration, etc.)
    status: string;              // pending, processed, expired
    metadata: Record<string, any>; // Additional cancellation context
    created_at: Date;
    processed_at?: Date;
  };

  export const cancellationRequestFields = [
    'id', 'user_id', 'request_id', 'request_type', 'status',
    'metadata', 'created_at', 'processed_at'
  ] as const;
  export type CancellationRequestField = (typeof cancellationRequestFields)[number];

  export type IntegrationBuildState = {
    id: string;
    user_id: string;
    service_name: string;
    completed_steps: string[];      // List of completed step names
    current_status: string;         // not_started, in_progress, form_ready, auth_ready, completed, failed
    state_data: Record<string, any>; // Additional state information
    created_at: Date;
    last_updated: Date;
    updated_by?: string;
  };

  export const integrationBuildStateFields = [
    'id', 'user_id', 'service_name', 'completed_steps', 'current_status',
    'state_data', 'created_at', 'last_updated', 'updated_by'
  ] as const;
  export type IntegrationBuildStateField = (typeof integrationBuildStateFields)[number];




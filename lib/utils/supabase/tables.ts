export type SystemIntegration = 'perplexity' | 'textbelt' | 'xai_live_search';

export type EnabledSystemIntegrations = Record<SystemIntegration, boolean>;

export type UserProfile = {
    id: string;
    display_name?: string;
    name?: string;
    location?: string;
    education?: string;
    profession?: string;
    language?: string;
    deepgram_enabled: boolean;
    base_language_model: string;
    general_instructions: string;
    wake_word: string;
    wake_word_sensitivity: number;
    wake_word_detection_enabled: boolean;
    selected_deepgram_voice: string;
    timezone: string;
    // Integration enablement flags
    enabled_system_integrations: EnabledSystemIntegrations;

    // Usage tracking
    requests_today: number;
    requests_week: number;
    requests_month: number;
    // Service-specific usage tracking (monthly only)
    perplexity_usage_month: number;
    textbelt_usage_month: number;
    xai_ls_usage_month: number;
    created_at: Date;
    updated_at: Date;
    ubp_current: number;
    ubp_max: number;
    // Subscription fields
    subscription_tier?: string;
    subscription_status?: string;
    subscription_current_period_end?: string;
    subscription_cancel_at_period_end?: boolean;
  };
  
  export const userProfileFields = [
    'id', 'display_name', 'name', 'location', 'education', 'profession', 'language', 'deepgram_enabled', 'base_language_model', 'general_instructions',
    'wake_word', 'wake_word_sensitivity', 'wake_word_detection_enabled', 'selected_deepgram_voice', 'timezone', 'preferences', 
    'user_tags', 'enabled_system_integrations',
    'requests_today', 'requests_week', 'requests_month', 
    'perplexity_usage_month', 'textbelt_usage_month', 'xai_ls_usage_month',
    'ubp_current', 'ubp_max',
    'subscription_tier', 'subscription_status', 'subscription_current_period_end', 'subscription_cancel_at_period_end',
    'created_at', 'updated_at'
  ] as const;
  export type UserProfileField = (typeof userProfileFields)[number];
  
  interface ConversationMetadata {
    [key: string]: string | number | boolean | null;
  }

  export type Conversation = {
    id: string;
    user_id: string;
    title?: string;
    summary?: string;
    conversation_type: string;
    status: string;
    metadata: ConversationMetadata;
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
    tool_calls?: Record<string, string | number | boolean | null>;
    metadata: Record<string, string | number | boolean | null>;
    created_at: Date;
  };
  
  export const messageFields = [
    'id', 'conversation_id', 'user_id', 'role', 'content', 'audio_url',
    'transcription_confidence', 'tool_calls', 'metadata', 'created_at'
  ] as const;
  export type MessageField = (typeof messageFields)[number];
  
  export type Resource = {
    id: string;
    user_id: string;
    title: string;
    content: string;
    instructions?: string; // Instructions for how to use or interpret this resource
    type: string; // New field: type of resource (memory, document, file, link, note, reference)
    relevance_score: number;
    embedding?: number[];
    decay_factor: number;
    auto_committed: boolean;
    source_conversation_id?: string;
    // New optional fields for different resource types
    blob?: Uint8Array; // For binary data storage
    path?: string; // For file path references
    url?: string; // For URL references
    // Foreign key columns for tags (up to 5 tags per resource)
    tag_1_id?: string; // Foreign key to Tag.id
    tag_2_id?: string; // Foreign key to Tag.id
    tag_3_id?: string; // Foreign key to Tag.id
    tag_4_id?: string; // Foreign key to Tag.id
    tag_5_id?: string; // Foreign key to Tag.id
    last_accessed: Date;
    created_at: Date;
    updated_at: Date;
  };
  
  export const resourceFields = [
    'id', 'user_id', 'title', 'content', 'instructions', 'type',
    'relevance_score', 'embedding', 'decay_factor', 'auto_committed',
    'source_conversation_id', 'blob', 'path', 'url',
    'tag_1_id', 'tag_2_id', 'tag_3_id', 'tag_4_id', 'tag_5_id',
    'last_accessed', 'created_at', 'updated_at'
  ] as const;
  export type ResourceField = (typeof resourceFields)[number];


  export type TagType = 'general' | 'service' | 'service_type' | 'user_created' | 'service_tool';

  export type Tag = {
    id: string;
    name: string;
    type: TagType;
    user_id?: string; // Optional for user created tags
    created_at: Date;
    integration_script_id?: string; // FK to IntegrationScript.id
};

  export const tagFields = [
    'id', 'name', 'type', 'user_id', 'created_at', 'integration_script_id'
  ] as const;
  export type TagField = (typeof tagFields)[number];
  
  export type Automation = {
    id: string;
    user_id: string;
    name: string;
    trigger_conditions: Record<string, string | number | boolean | null>;
    actions: Record<string, string | number | boolean | null>;
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
    scope?: string; // OAuth scopes (space-separated string)
    // API key authentication (alternative to OAuth)
    api_key?: string;
    // Email specific fields
    email_address?: string;
    // Notion specific fields
    bot_id?: string;
    workspace_name?: string;
    workspace_icon?: string;
    workspace_id?: string;
    owner_info?: Record<string, string | number | boolean | null>;
    duplicated_template_id?: string;
    // Common sync fields
    last_sync?: Date;
    updated_at?: Date;
    client_id?: string;
    client_secret_id?: string;
    client_secret_value?: string;
    configuration?: Record<string, string | number | boolean | null>; // New field for integration configuration
  };
  
  export const integrationFields = [
    'id', 'user_id', 'service_id', 'notes', 'is_active', 'status', 'last_used', 'created_at',
    'access_token', 'refresh_token', 'expires_at', 'scope', 'api_key', 'email_address',
    'bot_id', 'workspace_name', 'workspace_icon', 'workspace_id', 'owner_info', 'duplicated_template_id',
    'last_sync', 'updated_at', 'client_id', 'client_secret_id', 'client_secret_value',
    'configuration' // New field
  ] as const;
  export type IntegrationField = (typeof integrationFields)[number];

  export type Service = {
    id: string;
    created_at: Date;
    service_name: string;
    num_users: number;
    config_form_id?: string; // Foreign key to ConfigForm.id
    refresh_script?: string;
    tools?: string[];
    integration_method?: string; // e.g. OAuth, External App, Internal App etc.
    description?: string; // Detailed description of the service and its capabilities
    type: string; // New field: type of service (user, system)
    // Foreign key columns for tags (up to 5 tags per service)
    tag_1_id?: string; // Foreign key to Tag.id
    tag_2_id?: string; // Foreign key to Tag.id
    tag_3_id?: string; // Foreign key to Tag.id
    tag_4_id?: string; // Foreign key to Tag.id
    tag_5_id?: string; // Foreign key to Tag.id
    public: boolean;
    // Interaction tracking
    interactions_day: number;
    interactions_week: number;
    interactions_month: number;
  };

  export const serviceFields = [
    'id', 'created_at', 'service_name', 'num_users', 'config_form_id',
    'refresh_script', 'tools', 'integration_method',
    'description', 'type', 'tag_1_id', 'tag_2_id', 'tag_3_id', 'tag_4_id', 'tag_5_id',
    'interactions_day', 'interactions_week', 'interactions_month', 'public'
  ] as const;
  export type ServiceField = (typeof serviceFields)[number];

  export type ServiceTool = {
    id: string;
    service_id: string;
    name: string;
    display_name?: string;
    description?: string;
    parameters?: Record<string, string | number | boolean | null>;  // JSON schema for input parameters
    returns?: Record<string, string | number | boolean | null>;     // JSON schema for output format
    example?: Record<string, string | number | boolean | null>;     // Example usage
    run_script?: string;               // Executable Python script/logic
    endpoint_url?: string;            // API endpoint if applicable
    http_method?: string;             // GET, POST, etc.
    auth_required?: boolean;           // Whether authentication is needed
    category?: string;                // e.g., "communication", "storage", "analytics"
    version?: string;                  // Tool version
    is_active?: boolean;               // Whether tool is available for use
    execution_timeout?: number;        // Timeout in seconds
    rate_limit?: number;              // Max executions per minute
    tag_id?: string;                   // Foreign key to Tag.id
    required_intelligence?: number;    // Intelligence level required (1=basic, 2=standard, 3=high, 4=maximum)
    // Foreign key columns for resources (up to 5 resources per service tool)
    resource_1_id?: string;           // Foreign key to Resource.id
    resource_2_id?: string;           // Foreign key to Resource.id
    resource_3_id?: string;           // Foreign key to Resource.id
    resource_4_id?: string;           // Foreign key to Resource.id
    resource_5_id?: string;           // Foreign key to Resource.id
    created_at?: Date;
    updated_at?: Date;
  };

  export const serviceToolFields = [
    'id', 'service_id', 'name', 'display_name', 'description', 'parameters',
    'returns', 'example', 'run_script', 'endpoint_url', 'http_method',
    'auth_required', 'category', 'version', 'is_active', 'execution_timeout',
    'rate_limit', 'tag_id', 'resource_1_id', 'resource_2_id', 'resource_3_id', 'resource_4_id', 'resource_5_id',
    'created_at', 'updated_at', 'required_intelligence'
  ] as const;
  export type ServiceToolField = (typeof serviceToolFields)[number];

  export type CancellationRequest = {
    id: string;
    user_id: string;
    request_id: string;          // Unique identifier for the request to cancel
    request_type: string;        // Type of request (chat, integration, etc.)
    status: string;              // pending, processed, expired
    metadata: Record<string, string | number | boolean | null>; // Additional cancellation context
    created_at: Date;
    processed_at?: Date;
  };

  export const cancellationRequestFields = [
    'id', 'user_id', 'request_id', 'request_type', 'status',
    'metadata', 'created_at', 'processed_at'
  ] as const;
  export type CancellationRequestField = (typeof cancellationRequestFields)[number];

  export type IntegrationSetupToken = {
    id: string;
    user_id: string;
    integration_id: string;
    service_name: string;
    token: string;
    expires_at: Date;
    is_used: boolean;
    created_at: Date;
    updated_at: Date;
  };

  export const integrationSetupTokenFields = [
    'id', 'user_id', 'integration_id', 'service_name', 'token', 'expires_at', 'is_used', 'created_at', 'updated_at'
  ] as const;
  export type IntegrationSetupTokenField = (typeof integrationSetupTokenFields)[number];

  export type EmbeddingJob = {
    id: string;
    resource_id: string;
    user_id: string;
    content: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error_message?: string;
    created_at: Date;
    updated_at: Date;
    completed_at?: Date;
  };

  export const embeddingJobFields = [
    'id', 'resource_id', 'user_id', 'content', 'status', 'error_message', 'created_at', 'updated_at', 'completed_at'
  ] as const;
  export type EmbeddingJobField = (typeof embeddingJobFields)[number];

  export type DecayLog = {
    id: string;
    resource_id: string;
    old_relevance_score: number;
    new_relevance_score: number;
    time_since_last_access: number; // Days since last access
    decay_constant: number;
    decay_factor: number;
    decay_applied: number; // Amount of decay applied
    created_at: Date;
  };

  export const decayLogFields = [
    'id', 'resource_id', 'old_relevance_score', 'new_relevance_score',
    'time_since_last_access', 'decay_constant', 'decay_factor', 
    'decay_applied', 'created_at'
  ] as const;
  export type DecayLogField = (typeof decayLogFields)[number];

  export type IntegrationScript = {
    script: string;
    created_at: Date;
};

  export const integrationScriptFields = [
    'script', 'created_at'
  ] as const;
  export type IntegrationScriptField = (typeof integrationScriptFields)[number];

  export type Request = {
    id: string;
    user_id: string;
    request_id: string;              // Unique identifier for tracking this specific request
    request_type: string;            // Type of request (chat, integration, etc.)
    status: string;                  // pending, processing, completed, failed, cancelled
    metadata: Record<string, string | number | boolean | null>;   // Additional request context and data
    image_url?: string;              // Optional image URL for chat requests with image attachments
    created_at: Date;
    updated_at: Date;
  };

  export const requestFields = [
    'id', 'user_id', 'request_id', 'request_type', 'status',
    'metadata', 'image_url', 'created_at', 'updated_at'
  ] as const;
  export type RequestField = (typeof requestFields)[number];

  export type HotPhrase = {
    id: string;
    user_id: string;
    phrase: string;                    // "send a text", "check my calendar"
    service_name: string;              // "Textbelt", "Google Calendar" 
    tool_name: string;                 // "send_text", "get_events"
    description: string;               // For display in UI
    is_built_in: boolean;             // Built-ins can't be deleted
    is_active: boolean;               // Enable/disable toggle
    execution_count: number;          // Usage tracking
    last_used?: Date;                 // Last execution time
    created_at: Date;
    updated_at: Date;
  };

  export const hotPhraseFields = [
    'id', 'user_id', 'phrase', 'service_name', 'tool_name', 
    'description', 'is_built_in', 'is_active', 'execution_count',
    'last_used', 'created_at', 'updated_at'
  ] as const;
  export type HotPhraseField = (typeof hotPhraseFields)[number];




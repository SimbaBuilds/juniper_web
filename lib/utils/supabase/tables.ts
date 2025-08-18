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
    xai_live_search_month: number;
    
    // Stripe subscription fields
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    subscription_status?: string;
    subscription_tier?: string;
    subscription_current_period_end?: Date;
    subscription_cancel_at_period_end?: boolean;
    
    created_at: Date;
    updated_at: Date;
    ubp_current: number;
    ubp_max: number;
    user_tags?: string[]; // deprecated but some weird mapping happening hard to remove
  };
  
  export const userProfileFields = [
    'id', 'display_name', 'name', 'location', 'education', 'profession', 'language', 'deepgram_enabled', 'base_language_model', 'general_instructions',
    'wake_word', 'wake_word_sensitivity', 'wake_word_detection_enabled', 'selected_deepgram_voice', 'timezone', 
    'enabled_system_integrations',
    'requests_today', 'requests_week', 'requests_month', 
    'perplexity_usage_month', 'textbelt_usage_month', 'xai_live_search_month',
    'stripe_customer_id', 'stripe_subscription_id', 'subscription_status', 'subscription_tier', 'subscription_current_period_end', 'subscription_cancel_at_period_end',
    'created_at', 'updated_at', 'ubp_current', 'ubp_max'
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
    owner_info?: Record<string, any>;
    duplicated_template_id?: string;
    // Common sync fields
    last_sync?: Date;
    updated_at?: Date;
    client_id?: string;
    client_secret_id?: string;
    client_secret_value?: string;
    configuration?: Record<string, any>; // New field for integration configuration
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
    parameters?: Record<string, any>;  // JSON schema for input parameters
    returns?: Record<string, any>;     // JSON schema for output format
    example?: Record<string, any>;     // Example usage
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
    metadata: Record<string, any>; // Additional cancellation context
    created_at: Date;
    processed_at?: Date;
  };

  export const cancellationRequestFields = [
    'id', 'user_id', 'request_id', 'request_type', 'status',
    'metadata', 'created_at', 'processed_at'
  ] as const;
  export type CancellationRequestField = (typeof cancellationRequestFields)[number];

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
    metadata: Record<string, any>;   // Additional request context and data
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

  // Automation Schema Tables

  export type AutomationRun = {
    id: string;
    automation_id: string;
    trigger_data: Record<string, any>;
    result: Record<string, any>;
    error?: string;
    duration_ms?: number;
    executed_at: Date;
  };

  export const automationRunFields = [
    'id', 'automation_id', 'trigger_data', 'result', 'error', 'duration_ms', 'executed_at'
  ] as const;
  export type AutomationRunField = (typeof automationRunFields)[number];

  export type AutomationUsage = {
    id: string;
    user_id: string;
    automation_id?: string;
    service_name?: string;
    timestamp: Date;
    tokens_used: number;
    execution_time_ms: number;
  };

  export const automationUsageFields = [
    'id', 'user_id', 'automation_id', 'service_name', 'timestamp', 'tokens_used', 'execution_time_ms'
  ] as const;
  export type AutomationUsageField = (typeof automationUsageFields)[number];

  export type AutomationRecord = {
    id: string;
    user_id: string;
    name: string;
    description?: string;
    trigger_type: 'webhook' | 'schedule' | 'manual';
    trigger_config: Record<string, any>;
    script_code: string;
    execution_params: Record<string, any>;
    dependencies: string[];
    active: boolean;
    created_at: Date;
    updated_at: Date;
  };

  export const automationRecordFields = [
    'id', 'user_id', 'name', 'description', 'trigger_type', 'trigger_config', 
    'script_code', 'execution_params', 'dependencies', 'active', 'created_at', 'updated_at'
  ] as const;
  export type AutomationRecordField = (typeof automationRecordFields)[number];

  export type AutomationAuditLog = {
    id: string;
    automation_id?: string;
    user_id: string;
    service_accessed?: string;
    action_performed?: string;
    timestamp: Date;
    success: boolean;
    error_message?: string;
  };

  export const automationAuditLogFields = [
    'id', 'automation_id', 'user_id', 'service_accessed', 'action_performed', 
    'timestamp', 'success', 'error_message'
  ] as const;
  export type AutomationAuditLogField = (typeof automationAuditLogFields)[number];

  export type AutomationEvent = {
    id: string;
    user_id: string;
    service_name: string;
    event_type: string;
    event_id?: string;
    event_data: Record<string, any>;
    processed: boolean;
    retry_count: number;
    created_at: Date;
    processed_at?: Date;
  };

  export const automationEventFields = [
    'id', 'user_id', 'service_name', 'event_type', 'event_id', 'event_data', 
    'processed', 'retry_count', 'created_at', 'processed_at'
  ] as const;
  export type AutomationEventField = (typeof automationEventFields)[number];

  export type AutomationExecutionSession = {
    id: string;
    automation_id?: string;
    user_id: string;
    session_token?: string;
    sandbox_instance_id?: string;
    started_at: Date;
    completed_at?: Date;
    status: 'running' | 'completed' | 'failed';
  };

  export const automationExecutionSessionFields = [
    'id', 'automation_id', 'user_id', 'session_token', 'sandbox_instance_id', 
    'started_at', 'completed_at', 'status'
  ] as const;
  export type AutomationExecutionSessionField = (typeof automationExecutionSessionFields)[number];

  export type BatchOperation = {
    id: string;
    service_name: string;
    user_id: string;
    operation_type: string;
    item_count: number;
    batch_size: number;
    total_duration_ms?: number;
    items_per_request?: number;
    started_at: Date;
    completed_at?: Date;
    success: boolean;
    metadata: Record<string, any>;
  };

  export const batchOperationFields = [
    'id', 'service_name', 'user_id', 'operation_type', 'item_count', 'batch_size', 
    'total_duration_ms', 'items_per_request', 'started_at', 'completed_at', 'success', 'metadata'
  ] as const;
  export type BatchOperationField = (typeof batchOperationFields)[number];

  export type ServiceApiError = {
    id: string;
    user_id: string;
    service_name: string;
    error_type: string;
    error_message?: string;
    error_code?: string;
    occurred_at: Date;
    resolved: boolean;
    resolved_at?: Date;
  };

  export const serviceApiErrorFields = [
    'id', 'user_id', 'service_name', 'error_type', 'error_message', 'error_code', 
    'occurred_at', 'resolved', 'resolved_at'
  ] as const;
  export type ServiceApiErrorField = (typeof serviceApiErrorFields)[number];

  export type ServiceApiQuota = {
    id: string;
    service_name: string;
    user_id?: string;
    quota_type: string;
    quota_limit: number;
    current_usage: number;
    reset_at: Date;
    created_at: Date;
  };

  export const serviceApiQuotaFields = [
    'id', 'service_name', 'user_id', 'quota_type', 'quota_limit', 'current_usage', 'reset_at', 'created_at'
  ] as const;
  export type ServiceApiQuotaField = (typeof serviceApiQuotaFields)[number];

  export type ServiceAutomationPattern = {
    service_name: string;
    optimization_hints: Record<string, any>;
    webhook_config: Record<string, any>;
    rate_limits: Record<string, any>;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceAutomationPatternFields = [
    'service_name', 'optimization_hints', 'webhook_config', 'rate_limits', 'created_at', 'updated_at'
  ] as const;
  export type ServiceAutomationPatternField = (typeof serviceAutomationPatternFields)[number];

  export type ServiceAutomationTemplate = {
    id: string;
    service_name: string;
    template_name: string;
    description?: string;
    trigger_pattern: Record<string, any>;
    script_template: string;
    parameter_schema?: Record<string, any>;
    tags: string[];
    usage_count: number;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceAutomationTemplateFields = [
    'id', 'service_name', 'template_name', 'description', 'trigger_pattern', 'script_template', 
    'parameter_schema', 'tags', 'usage_count', 'created_at', 'updated_at'
  ] as const;
  export type ServiceAutomationTemplateField = (typeof serviceAutomationTemplateFields)[number];

  export type ServiceCapability = {
    service_name: string;
    supports_webhooks: boolean;
    webhook_events?: string[];
    supports_polling: boolean;
    polling_endpoints: Record<string, any>;
    rate_limits: Record<string, any>;
    auth_types: string[];
    api_version?: string;
    documentation_url?: string;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceCapabilityFields = [
    'service_name', 'supports_webhooks', 'webhook_events', 'supports_polling', 'polling_endpoints', 
    'rate_limits', 'auth_types', 'api_version', 'documentation_url', 'created_at', 'updated_at'
  ] as const;
  export type ServiceCapabilityField = (typeof serviceCapabilityFields)[number];

  export type ServiceCircuitBreaker = {
    service_name: string;
    state: 'closed' | 'half_open' | 'open';
    failure_count: number;
    last_failure_at?: Date;
    recovery_timeout_minutes: number;
    next_attempt_at?: Date;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceCircuitBreakerFields = [
    'service_name', 'state', 'failure_count', 'last_failure_at', 'recovery_timeout_minutes', 
    'next_attempt_at', 'created_at', 'updated_at'
  ] as const;
  export type ServiceCircuitBreakerField = (typeof serviceCircuitBreakerFields)[number];

  export type ServiceOptimizationRule = {
    id: string;
    service_name: string;
    rule_type: string;
    condition_expression: string;
    optimization_action: Record<string, any>;
    active: boolean;
    priority: number;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceOptimizationRuleFields = [
    'id', 'service_name', 'rule_type', 'condition_expression', 'optimization_action', 
    'active', 'priority', 'created_at', 'updated_at'
  ] as const;
  export type ServiceOptimizationRuleField = (typeof serviceOptimizationRuleFields)[number];

  export type ServicePerformanceMetric = {
    id: string;
    service_name: string;
    user_id?: string;
    metric_type: string;
    metric_value: number;
    measurement_window_minutes: number;
    recorded_at: Date;
    metadata: Record<string, any>;
  };

  export const servicePerformanceMetricFields = [
    'id', 'service_name', 'user_id', 'metric_type', 'metric_value', 'measurement_window_minutes', 
    'recorded_at', 'metadata'
  ] as const;
  export type ServicePerformanceMetricField = (typeof servicePerformanceMetricFields)[number];

  export type ServicePollingState = {
    id: string;
    user_id: string;
    service_name: string;
    last_polled_at?: Date;
    last_cursor?: string;
    last_sync_token?: string;
    polling_interval_minutes: number;
    next_poll_at?: Date;
    consecutive_empty_polls: number;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  };

  export const servicePollingStateFields = [
    'id', 'user_id', 'service_name', 'last_polled_at', 'last_cursor', 'last_sync_token', 
    'polling_interval_minutes', 'next_poll_at', 'consecutive_empty_polls', 'active', 'created_at', 'updated_at'
  ] as const;
  export type ServicePollingStateField = (typeof servicePollingStateFields)[number];

  export type ServiceRateLimit = {
    id: string;
    service_name: string;
    user_id?: string;
    rate_limit_type: string;
    limit_value: number;
    current_usage: number;
    reset_at: Date;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceRateLimitFields = [
    'id', 'service_name', 'user_id', 'rate_limit_type', 'limit_value', 'current_usage', 
    'reset_at', 'created_at', 'updated_at'
  ] as const;
  export type ServiceRateLimitField = (typeof serviceRateLimitFields)[number];

  export type ServiceWebhookConfig = {
    id: string;
    user_id: string;
    service_name: string;
    webhook_url: string;
    webhook_secret?: string;
    subscription_id?: string;
    subscription_expires_at?: Date;
    verification_token?: string;
    active: boolean;
    created_at: Date;
    updated_at: Date;
  };

  export const serviceWebhookConfigFields = [
    'id', 'user_id', 'service_name', 'webhook_url', 'webhook_secret', 'subscription_id', 
    'subscription_expires_at', 'verification_token', 'active', 'created_at', 'updated_at'
  ] as const;
  export type ServiceWebhookConfigField = (typeof serviceWebhookConfigFields)[number];

  export type ServiceApiEndpoint = {
    id: string;
    service_name: string;
    endpoint_name: string;              // e.g., "messages.send"
    endpoint_group?: string;            // e.g., "messages" for grouping
    description?: string;
    url_template: string;               // e.g., "https://api.service.com/v1/{userId}/messages"
    http_method: string;                // GET, POST, PUT, DELETE, PATCH
    
    // Full parameter specifications
    path_parameters?: Record<string, any>;      // URL path params
    query_parameters?: Record<string, any>;     // Query string params
    body_schema?: Record<string, any>;          // Request body schema
    headers_required?: Record<string, any>;     // Required headers
    
    // Response information
    response_schema?: Record<string, any>;      // Expected response format
    error_codes?: Record<string, any>;          // Common error codes and meanings
    
    // Examples and documentation
    example_request?: Record<string, any>;      // Full example request
    example_response?: Record<string, any>;     // Full example response
    documentation_url?: string;                 // Link to official docs
    
    // Operational metadata
    rate_limit_weight: number;                  // Cost against rate limit
    requires_auth: boolean;
    auth_type?: string;                         // 'oauth2', 'api_key', 'basic'
    scopes_required?: string[];                 // OAuth scopes needed
    
    // Optimization hints
    supports_batch: boolean;
    max_batch_size?: number;
    pagination_type?: string;                   // 'cursor', 'offset', 'token'
    
    // Management fields
    is_active: boolean;
    deprecated: boolean;
    deprecation_notice?: string;
    version?: string;                           // API version
    created_at: Date;
    updated_at: Date;
  };

  export const serviceApiEndpointFields = [
    'id', 'service_name', 'endpoint_name', 'endpoint_group', 'description', 'url_template', 'http_method',
    'path_parameters', 'query_parameters', 'body_schema', 'headers_required',
    'response_schema', 'error_codes', 'example_request', 'example_response', 'documentation_url',
    'rate_limit_weight', 'requires_auth', 'auth_type', 'scopes_required',
    'supports_batch', 'max_batch_size', 'pagination_type',
    'is_active', 'deprecated', 'deprecation_notice', 'version', 'created_at', 'updated_at'
  ] as const;
  export type ServiceApiEndpointField = (typeof serviceApiEndpointFields)[number];


  // Health & Wellness Dashboard Tables

  export type WearablesData = {
    id: string;
    user_id: string;
    integration_id: string; // FK to integrations table
    metric_type: string; // enum: sleep, activity, heart_rate, hrv, readiness, stress, etc.
    metric_value: Record<string, any>; // JSONB - flexible for different data structures
    recorded_at: Date;
    sync_date: Date; // for daily aggregations
    created_at: Date;
    updated_at: Date;
  };

  export const wearablesDataFields = [
    'id', 'user_id', 'integration_id', 'metric_type', 'metric_value',
    'recorded_at', 'sync_date', 'created_at', 'updated_at'
  ] as const;
  export type WearablesDataField = (typeof wearablesDataFields)[number];

  export type HealthMetricsDaily = {
    id: string;
    user_id: string;
    date: Date;
    sleep_score?: number;
    activity_score?: number;
    readiness_score?: number;
    stress_level?: number;
    recovery_score?: number;
    total_steps?: number;
    calories_burned?: number;
    heart_rate_avg?: number;
    hrv_avg?: number;
    created_at: Date;
    updated_at: Date;
  };

  export const healthMetricsDailyFields = [
    'id', 'user_id', 'date', 'sleep_score', 'activity_score', 'readiness_score',
    'stress_level', 'recovery_score', 'total_steps', 'calories_burned',
    'heart_rate_avg', 'hrv_avg', 'created_at', 'updated_at'
  ] as const;
  export type HealthMetricsDailyField = (typeof healthMetricsDailyFields)[number];


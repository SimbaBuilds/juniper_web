"""
Simple Pydantic models corresponding to database tables
"""

from datetime import datetime
from sys import last_type
from typing import Optional, List, Dict, Any
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel


class UserProfile(BaseModel):
    id: UUID
    display_name: Optional[str] = None
    deepgram_enabled: bool
    base_language_model: str
    general_instructions: str    
    wake_word: str = "Jarvis"
    wake_word_detection_enabled: bool = True
    wake_word_sensitivity: float = 0.8
    selected_deepgram_voice: str = "aura-2-mars-en"
    timezone: str = "UTC"
    preferences: Dict[str, Any] = {}
    # XAI LiveSearch settings
    xai_live_search_enabled: Optional[bool] = False
    xai_live_search_safe_search: Optional[bool] = True
    created_at: datetime
    updated_at: Optional[datetime] = None


class Conversation(BaseModel):
    id: UUID
    user_id: UUID
    title: Optional[str] = None
    summary: Optional[str] = None
    conversation_type: str = "general"
    status: str = "active"
    metadata: Dict[str, Any] = {}
    created_at: datetime
    updated_at: datetime


class Message(BaseModel):
    id: UUID
    conversation_id: UUID
    user_id: UUID
    role: str
    content: str
    audio_url: Optional[str] = None
    transcription_confidence: Optional[float] = None
    tool_calls: Optional[Dict[str, Any]] = None
    metadata: Dict[str, Any] = {}
    created_at: datetime


class Memory(BaseModel):
    id: UUID
    user_id: UUID
    memory_type: str
    category: Optional[str] = None
    title: str
    content: str
    tags: List[str] = []
    importance_score: int = 1
    embedding: Optional[List[float]] = None
    decay_factor: float = 1.0
    auto_committed: bool = False
    source_conversation_id: Optional[UUID] = None
    last_accessed: datetime
    created_at: datetime
    updated_at: datetime


class UserHabit(BaseModel):
    id: UUID
    user_id: UUID
    habit_type: str
    pattern: str
    frequency_data: Dict[str, Any] = {}
    confidence_score: float = 0.5
    suggested_automation: Optional[str] = None
    automation_approved: bool = False
    last_observed: datetime
    created_at: datetime


class Automation(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    trigger_conditions: Dict[str, Any]
    actions: Dict[str, Any]
    is_active: bool = True
    execution_count: int = 0
    last_executed: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime


class ConfigForm(BaseModel):
    id: UUID
    service_id: UUID
    json: Dict[str, Any]
    link: Optional[str] = None
    updated_at: datetime


class Integration(BaseModel):
    id: UUID
    user_id: UUID
    service_id: UUID  # points to service id instead of service_name
    notes: Optional[str] = None
    is_active: bool = True
    status: Optional[str] = 'active'  # pending, in_progress, active, inactive, failed
    last_used: Optional[datetime] = None
    created_at: datetime
    # OAuth fields (for calendar and email integrations)
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    expires_at: Optional[datetime] = None
    # Email specific fields
    email_address: Optional[str] = None
    # Notion specific fields
    bot_id: Optional[str] = None
    workspace_name: Optional[str] = None
    workspace_icon: Optional[str] = None
    workspace_id: Optional[str] = None
    owner_info: Optional[Dict[str, Any]] = None
    duplicated_template_id: Optional[str] = None
    # Common sync fields
    last_sync: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    client_id: Optional[str] = None
    client_secret_id: Optional[str] = None
    client_secret_value: Optional[str] = None


class Service(BaseModel):
    id: UUID
    created_at: datetime
    service_name: str
    num_users: int = 0
    config_form_json: Optional[Dict[str, Any]] = None  # Cached config form data
    auth_script: Optional[str] = None
    tools: Optional[List[str]] = None
    client_creation_script: Optional[str] = None
    integration_method: Optional[str] = None  # e.g. OAuth, External App, Internal App etc.


class Action(BaseModel):
    id: UUID
    service_id: UUID
    name: str
    description: str
    parameters: Dict[str, Any]  # JSON schema for input parameters
    returns: Dict[str, Any]     # JSON schema for output format
    example: Dict[str, Any]     # Example usage
    run_script: str             # Executable Python script/logic
    endpoint_url: Optional[str] = None  # API endpoint if applicable
    http_method: Optional[str] = None   # GET, POST, etc.
    auth_required: bool = True          # Whether authentication is needed
    category: Optional[str] = None      # e.g., "communication", "storage", "analytics"
    version: str = "1.0"               # Tool version
    is_active: bool = True             # Whether tool is available for use
    execution_timeout: int = 30        # Timeout in seconds
    rate_limit: Optional[int] = None   # Max executions per minute
    created_at: datetime
    updated_at: Optional[datetime] = None


class CancellationRequest(BaseModel):
    id: UUID
    user_id: UUID
    request_id: str             # Unique identifier for the request to cancel
    request_type: str = "chat"  # Type of request (chat, integration, etc.)
    status: str = "pending"     # pending, processed, expired
    metadata: Dict[str, Any] = {}  # Additional cancellation context
    created_at: datetime
    processed_at: Optional[datetime] = None


class IntegrationBuildState(BaseModel):
    """
    Tracks the state and progress of integration building workflow.
    Added in Phase 5 for flow validation and step enforcement.
    """
    id: UUID
    user_id: UUID
    service_name: str
    completed_steps: List[str] = []  # List of completed step names
    current_status: str = "not_started"  # not_started, in_progress, form_ready, auth_ready, completed, failed
    state_data: Dict[str, Any] = {}  # Additional state information
    created_at: datetime
    last_updated: datetime
    updated_by: Optional[UUID] = None



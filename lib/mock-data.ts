import { ConfigForm, Service } from './utils/supabase/tables'

export interface FormField {
  field_name: string
  field_type: "text" | "password" | "email" | "url" | "textarea" | "number"
  label: string
  required: boolean
  help_text: string
  default_value?: string
  readonly?: boolean
}

export interface FormJson {
  service_name: string
  service_type: string
  approach: string
  form_fields: FormField[]
  existing_service: boolean
  field_mappings?: Record<string, string>
  mapping_instructions?: Record<string, string>
  mapping_confidence?: number
  cached?: boolean
}

export interface ConfigFormData extends FormJson {
  setup_instructions: string
}

export const mockServices: Service[] = [
  {
    id: "service-1",
    created_at: new Date(),
    service_name: "Google Calendar",
    num_users: 0,
    integration_method: "oauth",
    interactions_day: 0,
    interactions_week: 0,
    interactions_month: 0,
    public: true
  },
  {
    id: "service-2", 
    created_at: new Date(),
    service_name: "Notion",
    num_users: 0,
    integration_method: "api_key",
    interactions_day: 0,
    interactions_week: 0,
    interactions_month: 0,
    public: true
  },
  {
    id: "service-3",
    created_at: new Date(), 
    service_name: "Gmail SMTP",
    num_users: 0,
    integration_method: "smtp",
    interactions_day: 0,
    interactions_week: 0,
    interactions_month: 0,
    public: true
  },
  {
    id: "service-4",
    created_at: new Date(),
    service_name: "Slack", 
    num_users: 0,
    integration_method: "api_key",
    interactions_day: 0,
    interactions_week: 0,
    interactions_month: 0,
    public: true
  }
]

export const mockFormConfigs: ConfigForm[] = [
  {
    id: "google-oauth-123",
    service_id: "service-1",
    setup_instructions: "To connect your Google Calendar, you'll need to create OAuth credentials in the Google Cloud Console. Follow these steps:\n\n1. Go to Google Cloud Console\n2. Create a new project or select existing one\n3. Enable Calendar API\n4. Create OAuth 2.0 credentials\n5. Add authorized redirect URIs",
    json: {
      service_name: "Google Calendar",
      service_type: "calendar",
      approach: "oauth",
      existing_service: false,
      form_fields: [
        {
          field_name: "client_id",
          field_type: "text",
          label: "Client ID",
          required: true,
          help_text: "Your Google OAuth Client ID from Google Cloud Console"
        },
        {
          field_name: "client_secret",
          field_type: "password",
          label: "Client Secret",
          required: true,
          help_text: "Your Google OAuth Client Secret from Google Cloud Console"
        },
        {
          field_name: "redirect_uri",
          field_type: "url",
          label: "Redirect URI",
          required: true,
          help_text: "The authorized redirect URI configured in Google Cloud Console",
          default_value: "https://your-app.com/auth/callback"
        }
      ]
    },
    updated_at: new Date()
  },
  {
    id: "notion-api-456",
    service_id: "service-2",
    setup_instructions: "To connect Notion, you'll need to create an internal integration:\n\n1. Go to https://www.notion.so/my-integrations\n2. Click 'New integration'\n3. Fill out basic information\n4. Copy the integration token\n5. Share your database/page with the integration",
    json: {
      service_name: "Notion",
      service_type: "productivity",
      approach: "api_key",
      existing_service: true,
      form_fields: [
        {
          field_name: "api_key",
          field_type: "password",
          label: "Integration Token",
          required: true,
          help_text: "Your Notion integration token (starts with 'secret_')"
        },
        {
          field_name: "database_id",
          field_type: "text",
          label: "Database ID (Optional)",
          required: false,
          help_text: "The ID of the Notion database you want to connect to"
        }
      ]
    },
    updated_at: new Date()
  },
  {
    id: "smtp-email-789",
    service_id: "service-3",
    setup_instructions: "To send emails via Gmail SMTP, you'll need to generate an app password:\n\n1. Enable 2-factor authentication on your Google account\n2. Go to Google Account settings\n3. Navigate to Security > App passwords\n4. Generate a new app password for 'Mail'\n5. Use this password below (not your regular password)",
    json: {
      service_name: "Gmail SMTP",
      service_type: "email",
      approach: "smtp",
      existing_service: true,
      form_fields: [
        {
          field_name: "email_address",
          field_type: "email",
          label: "Email Address",
          required: true,
          help_text: "Your Gmail address"
        },
        {
          field_name: "app_password",
          field_type: "password",
          label: "App Password",
          required: true,
          help_text: "Gmail app password (16 characters, no spaces)"
        },
        {
          field_name: "smtp_server",
          field_type: "text",
          label: "SMTP Server",
          required: true,
          help_text: "Gmail SMTP server address",
          default_value: "smtp.gmail.com"
        },
        {
          field_name: "smtp_port",
          field_type: "number",
          label: "SMTP Port",
          required: true,
          help_text: "Gmail SMTP port (usually 587 for TLS)",
          default_value: "587"
        }
      ]
    },
    updated_at: new Date()
  },
  {
    id: "slack-webhook-101",
    service_id: "service-4",
    setup_instructions: "To send messages to Slack, you'll need to create a webhook:\n\n1. Go to your Slack workspace\n2. Navigate to Apps > Incoming Webhooks\n3. Add to Slack and choose a channel\n4. Copy the webhook URL",
    json: {
      service_name: "Slack",
      service_type: "communication",
      approach: "api_key",
      existing_service: true,
      form_fields: [
        {
          field_name: "webhook_url",
          field_type: "url",
          label: "Webhook URL",
          required: true,
          help_text: "Your Slack incoming webhook URL"
        },
        {
          field_name: "default_channel",
          field_type: "text",
          label: "Default Channel",
          required: false,
          help_text: "Default channel for messages (e.g., #general)"
        }
      ]
    },
    updated_at: new Date()
  }
] 
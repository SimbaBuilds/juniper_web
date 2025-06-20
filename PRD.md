
**Cursor**

# Product Requirements Document: Dynamic Integration Configuration Forms

## Project Overview

Create a Next.js web application that hosts dynamically generated configuration forms for multi-user integration setup. Users receive email links to complete integration configuration, which then updates database records to progress the integration workflow.

## Database Schema Context

### Core Tables
- **Integration**: Stores user integration records with credentials (access_token, refresh_token, client_id, client_secret_value, email_address, etc.)
- **IntegrationBuildState**: Tracks integration building progress with current_status and completed_steps
- **ConfigForm**: Stores dynamic form configurations with JSON schema and access links
- **Service**: Defines available services with integration_method and cached form data

### Key Fields to Update
- **Integration Table**: All credential fields based on integration method
- **IntegrationBuildState**: current_status (form_ready → auth_ready), completed_steps array

## User Journey

1. User initiates integration in mobile app
2. Backend generates dynamic form and sends email with unique link
3. User clicks link → opens web form with service-specific fields
4. User completes form with credentials → submits
5. System updates database records → integration progresses to next step

## Technical Requirements

### 1. Dynamic Form Generation

**Form Structure:**
```typescript
interface FormConfig {
  service_name: string;
  service_type: string;
  approach: string; // "oauth", "api_key", "smtp", etc.
  form_fields: FormField[];
  setup_instructions: string;
  existing_service: boolean;
}

interface FormField {
  field_name: string;
  field_type: "text" | "password" | "email" | "url" | "textarea" | "number";
  label: string;
  required: boolean;
  help_text: string;
  default_value?: string;
}
```

**Form Field Mapping by Approach:**
- **OAuth**: client_id, client_secret, redirect_uri, scopes
- **API Key**: api_key, server_url (optional)
- **SMTP/Email**: email_address, app_password, smtp_server, smtp_port
- **Basic Auth**: username, password
- **Custom**: Any combination based on service requirements

### 2. URL Structure

**Form Access:**
- `https://forms.[domain].com/integration/setup/[formId]`
- `[formId]` maps to ConfigForm.id in database

**User Authentication:**
- Forms should be accessible without login (secure by unique ID)
- Include user identification in form submission

### 3. Database Operations

**On Form Load:**
```sql
-- Fetch form configuration
SELECT cf.*, s.service_name, s.integration_method 
FROM config_forms cf
JOIN services s ON cf.service_id = s.id
WHERE cf.id = :formId;

-- Get existing integration if any
SELECT * FROM integrations 
WHERE user_id = :userId AND service_id = :serviceId;
```

**On Form Submit:**
```sql
-- Update or create integration record
UPDATE integrations SET
  client_id = :client_id,
  client_secret_value = :client_secret,
  email_address = :email,
  access_token = :api_key,
  status = 'auth_ready',
  updated_at = NOW()
WHERE user_id = :userId AND service_id = :serviceId;

-- Update integration build state
UPDATE integration_build_states SET
  current_status = 'auth_ready',
  completed_steps = array_append(completed_steps, 'form_response'),
  state_data = jsonb_set(state_data, '{form_data_received}', 'true'),
  last_updated = NOW()
WHERE user_id = :userId AND service_name = :serviceName;
```

### 4. Security Requirements

**Data Protection:**
- All credential fields encrypted at rest
- HTTPS only for all form interactions
- Form IDs should be UUIDs (non-guessable)
- Input validation and sanitization
- Rate limiting on form submissions

**Access Control:**
- Forms expire after 7 days
- One-time use forms (mark as used after submission)
- User ID validation from secure token or session

### 5. User Experience Requirements

**Form Design:**
- Clean, professional appearance matching mobile app branding
- Mobile-responsive design
- Progress indicators for multi-step forms
- Clear field labels with help text
- Real-time validation feedback
- Success/error messaging

**Field Types:**
- **Password fields**: Masked input with show/hide toggle
- **URL fields**: Format validation (https:// prefix)
- **Email fields**: Email format validation
- **Required fields**: Clear visual indicators
- **Help text**: Expandable tooltips or info icons

### 6. Form Submission Flow

**Success Path:**
1. Validate all required fields
2. Sanitize and encrypt sensitive data
3. Update Integration table with credentials
4. Update IntegrationBuildState progress
5. Show success message with next steps
6. Optionally redirect to mobile app deep link

**Error Handling:**
- Field-level validation errors
- Database connection errors
- Duplicate submission handling
- Form expiration handling
- Network timeout handling

### 7. Integration with Existing Backend

**API Endpoints to Call:**
- `POST /integration/receive_form_response` - Existing endpoint for form processing
- `GET /integration/status/:integrationId` - Check integration status
- `POST /integration/validate_credentials` - Optional credential testing

**Webhook Integration:**
- Notify mobile app of form completion
- Send confirmation email to user
- Trigger next step in integration workflow

### 8. Hosting and Deployment

**Vercel Configuration:**
- Environment variables for database connection
- Custom domain setup
- Automatic HTTPS
- Serverless function deployment
- CI/CD from Git repository

**Required Environment Variables:**
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
BACKEND_API_URL=your_backend_url
NEXT_PUBLIC_APP_URL=your_app_url
ENCRYPTION_KEY=your_encryption_key
```

### 9. Monitoring and Analytics

**Logging Requirements:**
- Form access attempts
- Submission success/failure rates
- Field validation errors
- Database operation results
- User completion times

**Metrics to Track:**
- Form completion rates by service type
- Time from email send to form completion
- Most common validation errors
- Integration success rates post-form

### 10. Testing Requirements

**Unit Tests:**
- Form field validation functions
- Database operation functions
- Encryption/decryption utilities
- Error handling scenarios

**Integration Tests:**
- End-to-end form submission flow
- Database state changes
- API communication with backend
- Email link functionality

### 11. Performance Requirements

**Response Times:**
- Form load: < 2 seconds
- Form submission: < 5 seconds
- Database updates: < 3 seconds

**Scalability:**
- Support 1000+ concurrent users
- Handle 10,000+ forms per day
- Horizontal scaling capability

## Success Criteria

1. **Functional**: Users can complete integration forms and credentials are properly stored
2. **Performance**: Forms load quickly and submissions process within SLA
3. **Security**: All sensitive data is properly encrypted and secured
4. **Reliability**: 99.9% uptime with proper error handling
5. **User Experience**: High completion rates and positive user feedback

## Implementation Priority

1. **Phase 1**: Basic form rendering and submission
2. **Phase 2**: Database integration and credential storage
3. **Phase 3**: Security enhancements and validation
4. **Phase 4**: UX improvements and mobile optimization
5. **Phase 5**: Monitoring, analytics, and performance optimization

This PRD provides complete specifications for building a production-ready dynamic integration form system that integrates seamlessly with your existing integration builder workflow.

```typescript
interface FormConfig {
  service_name: string;
  service_type: string;
  approach: string; // "oauth", "api_key", "smtp", etc.
  form_fields: FormField[];
  setup_instructions: string;
  existing_service: boolean;
}

interface FormField {
  field_name: string;
  field_type: "text" | "password" | "email" | "url" | "textarea" | "number";
  label: string;
  required: boolean;
  help_text: string;
  default_value?: string;
}
```

```sql
-- Fetch form configuration
SELECT cf.*, s.service_name, s.integration_method 
FROM config_forms cf
JOIN services s ON cf.service_id = s.id
WHERE cf.id = :formId;

-- Get existing integration if any
SELECT * FROM integrations 
WHERE user_id = :userId AND service_id = :serviceId;
```

```sql
-- Update or create integration record
UPDATE integrations SET
  client_id = :client_id,
  client_secret_value = :client_secret,
  email_address = :email,
  access_token = :api_key,
  status = 'auth_ready',
  updated_at = NOW()
WHERE user_id = :userId AND service_id = :serviceId;

-- Update integration build state
UPDATE integration_build_states SET
  current_status = 'auth_ready',
  completed_steps = array_append(completed_steps, 'form_response'),
  state_data = jsonb_set(state_data, '{form_data_received}', 'true'),
  last_updated = NOW()
WHERE user_id = :userId AND service_name = :serviceName;
```

```plaintext
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
BACKEND_API_URL=your_backend_url
NEXT_PUBLIC_APP_URL=your_app_url
ENCRYPTION_KEY=your_encryption_key
```


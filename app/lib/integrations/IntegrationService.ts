import { createClient } from '@/lib/utils/supabase/client';
import { BaseOAuthService, TokenData } from './oauth/BaseOAuthService';
import { getOAuthConfig, getServiceDescriptor } from './oauth/OAuthConfig';
import { HealthDataSyncService } from '@/lib/services/healthDataSync';

export interface Integration {
  id: string;
  user_id: string;
  service_id: string;
  status: 'pending' | 'active' | 'failed' | 'inactive';
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  configuration?: Record<string, any>;
  last_used?: string;
  created_at: string;
  updated_at: string;
}

export interface IntegrationResult {
  success: boolean;
  integration?: Integration;
  error?: string;
}

export class IntegrationService {
  private supabase: any;

  constructor(supabaseClient?: any) {
    this.supabase = supabaseClient || createClient();
  }

  private async getServiceId(serviceName: string): Promise<string | null> {
    try {
      // First, let's debug by listing all service names in the database
      console.log(`Looking for service: ${serviceName}`);
      const { data: allServices } = await this.supabase
        .from('services')
        .select('id, service_name');
      
      console.log('All services in database:', allServices?.map(s => s.service_name));
      
      // Map both URL-style (hyphenated) and config-style (underscored) service names to database names
      const serviceMap: Record<string, string[]> = {
        'notion': ['Notion', 'NOTION'],
        'slack': ['Slack', 'SLACK'], 
        'gmail': ['Gmail', 'GMAIL'],
        'google-calendar': ['Google Calendar', 'GOOGLE CALENDAR'],
        'google_calendar': ['Google Calendar', 'GOOGLE CALENDAR'],
        'google-docs': ['Google Docs', 'GOOGLE DOCS'],
        'google_docs': ['Google Docs', 'GOOGLE DOCS'],
        'google-sheets': ['Google Sheets', 'GOOGLE SHEETS'],
        'google_sheets': ['Google Sheets', 'GOOGLE SHEETS'],
        'google-meet': ['Google Meet', 'GOOGLE MEET'],
        'google_meet': ['Google Meet', 'GOOGLE MEET'],
        'microsoft-excel': ['Microsoft Excel Online', 'MICROSOFT EXCEL ONLINE'],
        'microsoft_excel': ['Microsoft Excel Online', 'MICROSOFT EXCEL ONLINE'],
        'microsoft-word': ['Microsoft Word Online', 'MICROSOFT WORD ONLINE'],
        'microsoft_word': ['Microsoft Word Online', 'MICROSOFT WORD ONLINE'],
        'outlook-calendar': ['Microsoft Outlook Calendar', 'MICROSOFT OUTLOOK CALENDAR'],
        'microsoft_outlook_calendar': ['Microsoft Outlook Calendar', 'MICROSOFT OUTLOOK CALENDAR'],
        'outlook-mail': ['Microsoft Outlook Mail', 'MICROSOFT OUTLOOK MAIL'],
        'microsoft_outlook_mail': ['Microsoft Outlook Mail', 'MICROSOFT OUTLOOK MAIL'],
        'microsoft-teams': ['Microsoft Teams', 'MICROSOFT TEAMS'],
        'microsoft_teams': ['Microsoft Teams', 'MICROSOFT TEAMS'],
        'todoist': ['Todoist', 'TODOIST'],
        'fitbit': ['Fitbit', 'FITBIT'],
        'oura': ['Oura', 'OURA'],
        'textbelt': ['Textbelt', 'TEXTBELT']
      };
      
      // Get possible database names to try
      const possibleNames = serviceMap[serviceName] || [serviceName, serviceName.toUpperCase()];
      
      // Try each possible name until we find a match
      for (const dbServiceName of possibleNames) {
        console.log(`Trying to find service with name: ${dbServiceName}`);
        
        const { data, error } = await this.supabase
          .from('services')
          .select('id')
          .eq('service_name', dbServiceName)
          .single();

        if (!error && data) {
          console.log(`Found service ${dbServiceName} with ID: ${data.id}`);
          return data.id;
        }
      }
      
      // If we get here, none of the variations worked
      console.error(`Failed to find service for any variation of: ${serviceName}`);
      return null;
    } catch (error) {
      console.error('Error getting service ID:', error);
      return null;
    }
  }

  async createOrUpdateIntegration(
    userId: string,
    serviceName: string,
    tokens: TokenData,
    configuration?: Record<string, any>,
    additionalFields?: Record<string, any>
  ): Promise<IntegrationResult> {
    try {
      const now = new Date().toISOString();
      const expiresAt = tokens.expires_at 
        ? new Date(tokens.expires_at * 1000).toISOString()
        : null;

      // First, get the service_id from the services table
      const serviceId = await this.getServiceId(serviceName);
      if (!serviceId) {
        return { success: false, error: `Service ${serviceName} not found` };
      }

      const integrationData = {
        user_id: userId,
        service_id: serviceId,
        status: 'active' as const,
        is_active: true,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || null,
        expires_at: expiresAt,
        scope: tokens.scope || null, // Store OAuth scopes like React Native
        configuration: configuration || {},
        last_used: now,
        updated_at: now,
        // Add service-specific fields if provided (like React Native)
        ...(additionalFields || {})
      };

      // Upsert the integration
      const { data, error } = await this.supabase
        .from('integrations')
        .upsert(integrationData, {
          onConflict: 'user_id,service_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (error) {
        console.error('Failed to create/update integration:', error);
        return { success: false, error: error.message };
      }

      return { success: true, integration: data };

    } catch (error) {
      console.error('Error in createOrUpdateIntegration:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getIntegration(userId: string, serviceName: string): Promise<Integration | null> {
    try {
      const serviceId = await this.getServiceId(serviceName);
      if (!serviceId) {
        return null;
      }

      const { data, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .eq('service_id', serviceId)
        .single();

      if (error) {
        console.error('Failed to get integration:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error in getIntegration:', error);
      return null;
    }
  }

  async getUserIntegrations(userId: string): Promise<Integration[]> {
    try {
      const { data, error } = await this.supabase
        .from('integrations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Failed to get user integrations:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserIntegrations:', error);
      return [];
    }
  }

  async updateIntegrationStatus(
    userId: string,
    serviceName: string,
    status: Integration['status']
  ): Promise<boolean> {
    try {
      const serviceId = await this.getServiceId(serviceName);
      if (!serviceId) {
        return false;
      }

      const { error } = await this.supabase
        .from('integrations')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('service_id', serviceId);

      if (error) {
        console.error('Failed to update integration status:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateIntegrationStatus:', error);
      return false;
    }
  }

  async deleteIntegration(userId: string, serviceName: string): Promise<boolean> {
    try {
      const serviceId = await this.getServiceId(serviceName);
      if (!serviceId) {
        return false;
      }

      const { error } = await this.supabase
        .from('integrations')
        .delete()
        .eq('user_id', userId)
        .eq('service_id', serviceId);

      if (error) {
        console.error('Failed to delete integration:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteIntegration:', error);
      return false;
    }
  }

  async disconnectIntegration(integrationId: string, serviceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🔌 Disconnecting ${serviceName} integration...`);

      // For now, we don't have individual auth services like React Native, so we'll handle cleanup directly
      // In the future, we could implement specific disconnect logic per service here

      // Update integration status to inactive (like React Native)
      const { error: updateError } = await this.supabase
        .from('integrations')
        .update({
          status: 'inactive',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (updateError) {
        console.error('Failed to update integration status:', updateError);
        return { success: false, error: updateError.message };
      }

      // First, verify we can actually see and access this integration record
      console.log(`🔍 Verifying integration record exists and is accessible...`);
      const { data: verifyData, error: verifyError } = await this.supabase
        .from('integrations')
        .select('id, user_id, status, is_active')
        .eq('id', integrationId)
        .single();

      console.log(`🔍 Verification result:`, { data: verifyData, error: verifyError });

      if (verifyError || !verifyData) {
        console.error(`❌ Cannot access integration record:`, verifyError);
        return { success: false, error: 'Integration record not found or not accessible' };
      }

      // Delete the integration record from Supabase (matching React Native exactly)
      console.log(`🗑️ Attempting to delete integration with ID: ${integrationId}`);
      
      const { data: deleteData, error: deleteError, count } = await this.supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId)
        .select();

      console.log(`🗑️ Delete operation result:`, { 
        data: deleteData, 
        error: deleteError, 
        count, 
        deletedRecords: deleteData?.length || 0 
      });

      if (deleteError) {
        console.error('Failed to delete integration by ID:', deleteError);
        return { success: false, error: deleteError.message };
      }

      if (!deleteData || deleteData.length === 0) {
        console.error(`⚠️ No records were deleted for integration ID: ${integrationId}. This suggests RLS policy may be blocking the delete operation.`);
        return { success: false, error: 'Delete operation blocked - possibly by database security policies' };
      }

      console.log(`✅ ${serviceName} integration disconnected and removed successfully (deleted ${deleteData.length} record(s))`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error disconnecting ${serviceName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteIntegrationById(integrationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('integrations')
        .delete()
        .eq('id', integrationId);

      if (error) {
        console.error('Failed to delete integration by ID:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in deleteIntegrationById:', error);
      return false;
    }
  }

  async reconnectIntegration(integrationId: string, serviceName: string): Promise<IntegrationResult> {
    try {
      console.log(`🔄 Reconnecting ${serviceName} integration...`);

      // Map database service names to URL-style service names (used in OAuth flow)
      const serviceMap: Record<string, string> = {
        'Notion': 'notion',
        'Slack': 'slack', 
        'Gmail': 'gmail',
        'Google Calendar': 'google-calendar',
        'Google Docs': 'google-docs',
        'Google Sheets': 'google-sheets',
        'Google Meet': 'google-meet',
        'Microsoft Excel Online': 'microsoft-excel',
        'Microsoft Word Online': 'microsoft-word',
        'Microsoft Outlook Calendar': 'microsoft-outlook-calendar',
        'Microsoft Outlook Mail': 'microsoft-outlook-mail',
        'Microsoft Teams': 'microsoft-teams',
        'Todoist': 'todoist',
        'Fitbit': 'fitbit',
        'Oura': 'oura',
        'Textbelt': 'textbelt'
      };
      
      const internalServiceName = serviceMap[serviceName] || serviceName.toLowerCase().replace(/\s+/g, '-');
      console.log(`🔗 Mapped ${serviceName} to ${internalServiceName} for reconnection`);

      // Update status to pending and is_active to false (like React Native)
      const { error: updateError } = await this.supabase
        .from('integrations')
        .update({
          status: 'pending',
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', integrationId);

      if (updateError) {
        throw new Error(`Failed to update integration status: ${updateError.message}`);
      }

      // Start OAuth flow with existing integration ID (skip completion message for reconnect)
      const result = await this.initiateOAuth(internalServiceName);
      
      return result;

    } catch (error) {
      console.error(`❌ Error reconnecting ${serviceName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async refreshIntegrationTokens(userId: string, serviceName: string): Promise<boolean> {
    try {
      const integration = await this.getIntegration(userId, serviceName);
      if (!integration) {
        console.error('Integration not found for token refresh');
        return false;
      }

      const config = getOAuthConfig(serviceName);
      if (!config) {
        console.error('OAuth config not found for service:', serviceName);
        return false;
      }

      const oauthService = new BaseOAuthService(serviceName, config);
      
      // Store current tokens in localStorage for refresh
      if (integration.access_token) {
        const tokens: TokenData = {
          access_token: integration.access_token,
          refresh_token: integration.refresh_token || undefined,
          expires_at: integration.expires_at 
            ? Math.floor(new Date(integration.expires_at).getTime() / 1000)
            : undefined
        };
        await oauthService.storeTokens(tokens);
      }

      const refreshResult = await oauthService.refreshTokens();
      if (!refreshResult.success || !refreshResult.tokens) {
        await this.updateIntegrationStatus(userId, serviceName, 'failed');
        return false;
      }

      // Preserve existing service-specific fields during token refresh (like React Native)
      const existingAdditionalFields: Record<string, any> = {};
      const serviceSpecificFields = ['bot_id', 'workspace_name', 'workspace_id', 'workspace_icon'];
      
      serviceSpecificFields.forEach(field => {
        if (integration[field as keyof typeof integration]) {
          existingAdditionalFields[field] = integration[field as keyof typeof integration];
        }
      });

      // Update integration with new tokens while preserving configuration and service-specific fields
      const updateResult = await this.createOrUpdateIntegration(
        userId,
        serviceName,
        refreshResult.tokens,
        integration.configuration,
        existingAdditionalFields
      );

      return updateResult.success;

    } catch (error) {
      console.error('Error refreshing integration tokens:', error);
      return false;
    }
  }

  getOAuthService(serviceName: string): BaseOAuthService | null {
    const config = getOAuthConfig(serviceName);
    if (!config) {
      return null;
    }
    return new BaseOAuthService(serviceName, config);
  }

  async initiateOAuth(serviceName: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Call server-side API to get OAuth URL
      const response = await fetch('/api/oauth/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Failed to initiate OAuth' };
      }

      const { authUrl, state, codeVerifier, usePKCE } = await response.json();

      // Store state and code verifier for later validation
      localStorage.setItem(`oauth_${serviceName}_state`, state);
      if (usePKCE && codeVerifier) {
        localStorage.setItem(`oauth_${serviceName}_code_verifier`, codeVerifier);
      }

      // Open OAuth window
      const authWindow = window.open(
        authUrl,
        'oauth_window',
        'width=600,height=700,scrollbars=yes,resizable=yes'
      );

      if (!authWindow) {
        return { success: false, error: 'Failed to open OAuth window. Please check your popup blocker settings.' };
      }

      // Return a promise that resolves when the OAuth flow completes
      return new Promise((resolve) => {
        const checkClosed = setInterval(() => {
          if (authWindow.closed) {
            clearInterval(checkClosed);
            
            // Check if we received tokens (stored by callback)
            const tokens = this.getStoredTokens(serviceName);
            if (tokens) {
              resolve({ success: true });
            } else {
              resolve({ success: false, error: 'OAuth flow was cancelled or failed' });
            }
          }
        }, 1000);

        // Timeout after 10 minutes
        setTimeout(() => {
          clearInterval(checkClosed);
          if (!authWindow.closed) {
            authWindow.close();
          }
          resolve({ success: false, error: 'OAuth flow timed out' });
        }, 600000);
      });

    } catch (error) {
      console.error('Error initiating OAuth:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async handleOAuthCallback(
    serviceName: string,
    code: string,
    state?: string,
    supabase?: any
  ): Promise<IntegrationResult> {
    try {
      // If supabase is provided, call exchange logic directly
      if (supabase) {
        return await this.exchangeOAuthCode(serviceName, code, state, supabase);
      }

      // Fallback to HTTP fetch for client-side calls
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/oauth/exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceName, code, state }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { success: false, error: errorData.error || 'Token exchange failed' };
      }

      const result = await response.json();
      return { success: true, integration: result.integration };

    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'OAuth callback failed'
      };
    }
  }

  private async exchangeOAuthCode(
    serviceName: string,
    code: string,
    state?: string,
    supabase?: any
  ): Promise<IntegrationResult> {
    try {
      // Import getOAuthConfig
      const { getOAuthConfig } = await import('@/app/lib/integrations/oauth/OAuthConfig');
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const config = getOAuthConfig(serviceName);
      if (!config) {
        return { success: false, error: 'OAuth configuration not found for service' };
      }

      // Prepare token exchange request
      const body = new URLSearchParams();
      body.append('grant_type', 'authorization_code');
      body.append('client_id', config.clientId);
      body.append('code', code);
      body.append('redirect_uri', config.redirectUri);

      if (config.clientSecret) {
        body.append('client_secret', config.clientSecret);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      // Handle Basic Auth if required
      if (config.useBasicAuth && config.clientSecret) {
        const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
      }

      // Add custom headers if specified
      if (config.customHeaders) {
        Object.assign(headers, config.customHeaders);
      }

      // Exchange code for tokens
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers,
        body: body.toString(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Token exchange failed for ${serviceName}:`, errorText);
        return { success: false, error: `Token exchange failed: ${response.status} ${response.statusText}` };
      }

      const tokens = await response.json();

      // Calculate expires_at if not provided
      if (tokens.expires_in && !tokens.expires_at) {
        tokens.expires_at = Date.now() / 1000 + tokens.expires_in;
      }

      // Generate service-specific configuration and additional fields like React Native
      const serviceSpecificData = this.generateServiceSpecificData(serviceName, tokens, config);

      // Create/update integration in database with service-specific data
      const integrationResult = await this.createOrUpdateIntegration(
        user.id,
        serviceName,
        tokens,
        serviceSpecificData.configuration,
        serviceSpecificData.additionalFields
      );

      if (!integrationResult.success) {
        return { success: false, error: integrationResult.error };
      }

      // Trigger health data sync for health services (non-blocking)
      if (serviceName === 'oura' || serviceName === 'fitbit') {
        // Use capitalized service names like React Native
        const capitalizedServiceName = serviceName === 'oura' ? 'Oura' : 'Fitbit';
        // Run completely non-blocking to avoid any OAuth callback failures
        setTimeout(() => {
          this.triggerHealthDataSync(user.id, capitalizedServiceName).catch(error => {
            console.warn(`Health data sync failed for ${capitalizedServiceName}, but OAuth completed:`, error);
          });
        }, 0);
      }

      return { success: true, integration: integrationResult.integration };

    } catch (error) {
      console.error('Error in exchangeOAuthCode:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private generateServiceSpecificData(
    serviceName: string, 
    tokens: any, 
    config: any
  ): { configuration: Record<string, any>; additionalFields: Record<string, any> } {
    const baseConfiguration = {
      scopes: config.scopes || []
    };
    
    let additionalFields: Record<string, any> = {};
    
    switch (serviceName.toLowerCase()) {
      case 'notion':
        return {
          configuration: {
            ...baseConfiguration,
            owner: tokens.owner,
            duplicated_template_id: tokens.duplicated_template_id,
          },
          additionalFields: {
            bot_id: tokens.bot_id,
            workspace_name: tokens.workspace_name,
            workspace_id: tokens.workspace_id,
            workspace_icon: tokens.workspace_icon
          }
        };
        
      case 'slack':
        return {
          configuration: {
            ...baseConfiguration,
            appId: tokens.app_id,
            authedUser: tokens.authed_user,
            tokenType: tokens.token_type,
            isEnterpriseInstall: tokens.is_enterprise_install,
            enterprise: tokens.enterprise
          },
          additionalFields: {
            bot_id: tokens.bot_user_id,
            // Use exact field names from React Native: team.name and team.id
            workspace_name: tokens.team?.name,
            workspace_id: tokens.team?.id
          }
        };
        
      case 'fitbit':
        return {
          configuration: {
            ...baseConfiguration,
            user_id: tokens.user_id,
            webhook_subscriptions: [] // Will be populated when webhooks are set up
          },
          additionalFields: {}
        };
        
      case 'oura':
        return {
          configuration: {
            ...baseConfiguration,
            user_id: tokens.user_id
          },
          additionalFields: {}
        };
        
      case 'textbelt':
        // API key service, no OAuth tokens but has configuration
        return {
          configuration: {
            phone_number: tokens.phone_number // For API key services, "tokens" contains credentials
          },
          additionalFields: {}
        };
        
      default:
        // For other services (Google, Microsoft, etc.), just store scopes
        return {
          configuration: baseConfiguration,
          additionalFields: {}
        };
    }
  }

  private async triggerHealthDataSync(userId: string, serviceName: string): Promise<void> {
    try {
      console.log(`Triggering health data sync for ${serviceName}`);
      
      // Use the proper HealthDataSyncService that calls edge function directly with user tokens (like React Native)
      const healthDataSync = new HealthDataSyncService();
      const result = await healthDataSync.syncHealthData('backfill', userId, 7);

      if (!result.success) {
        console.warn(`Health data sync failed for ${serviceName}, but continuing OAuth flow:`, result.error);
      } else {
        console.log(`Health data sync triggered successfully for ${serviceName}, processed ${result.days_processed} days`);
      }

      // For Fitbit, also set up webhooks (non-blocking)
      if (serviceName === 'fitbit') {
        this.setupFitbitWebhooks(userId).catch(error => {
          console.warn('Fitbit webhook setup failed, but continuing OAuth flow:', error);
        });
      }

    } catch (error) {
      console.warn(`Health data sync error for ${serviceName}, but continuing OAuth flow:`, error);
    }
  }

  private async setupFitbitWebhooks(userId: string): Promise<void> {
    try {
      console.log('Setting up Fitbit webhooks');
      
      const collections = ['activities', 'sleep', 'body', 'foods'];
      
      for (const collection of collections) {
        const response = await fetch('/api/integrations/fitbit-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'subscribe',
            user_id: userId,
            collection
          }),
        });

        if (!response.ok) {
          console.error(`Fitbit webhook setup failed for ${collection}:`, await response.text());
        }
      }

    } catch (error) {
      console.error('Error setting up Fitbit webhooks:', error);
    }
  }

  isHealthService(serviceName: string): boolean {
    return serviceName === 'oura' || serviceName === 'fitbit';
  }

  isCredentialBasedService(serviceName: string): boolean {
    return serviceName === 'twilio' || serviceName === 'textbelt';
  }

  getServiceDisplayInfo(serviceName: string) {
    return getServiceDescriptor(serviceName);
  }

  getStoredTokens(serviceName: string): TokenData | null {
    try {
      const stored = localStorage.getItem(`oauth_tokens_${serviceName}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error(`Failed to retrieve tokens for ${serviceName}:`, error);
      return null;
    }
  }
}
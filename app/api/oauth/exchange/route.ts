import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server';
import { getOAuthConfig } from '@/app/lib/integrations/oauth/OAuthConfig';
import { IntegrationService } from '@/app/lib/integrations/IntegrationService';

interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  expires_at?: number;
  token_type?: string;
  scope?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { serviceName, code, state } = await request.json();

    if (!serviceName || !code) {
      return NextResponse.json(
        { success: false, error: 'Service name and code are required' },
        { status: 400 }
      );
    }

    // Get authenticated user
    const supabase = await createSupabaseAppServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'User not authenticated' },
        { status: 401 }
      );
    }

    const config = getOAuthConfig(serviceName);
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'OAuth configuration not found for service' },
        { status: 404 }
      );
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

    // Handle PKCE if needed (get code_verifier from state storage)
    if (config.usePKCE) {
      // In a real implementation, you'd need to store the code_verifier server-side
      // For now, we'll require it to be passed from the client
      // This is a temporary solution - ideally store code_verifier in server session
      console.warn('PKCE implementation needs server-side code_verifier storage');
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
      return NextResponse.json(
        { success: false, error: `Token exchange failed: ${response.status} ${response.statusText}` },
        { status: 400 }
      );
    }

    const tokens: TokenData = await response.json();

    // Calculate expires_at if not provided
    if (tokens.expires_in && !tokens.expires_at) {
      tokens.expires_at = Date.now() / 1000 + tokens.expires_in;
    }

    // Create/update integration in database
    const integrationService = new IntegrationService(supabase);
    const integrationResult = await integrationService.createOrUpdateIntegration(
      user.id,
      serviceName,
      tokens
    );

    if (!integrationResult.success) {
      return NextResponse.json(
        { success: false, error: integrationResult.error },
        { status: 500 }
      );
    }

    // Trigger health data sync for health services (non-blocking)
    if (serviceName === 'oura' || serviceName === 'fitbit') {
      // Use capitalized service names like React Native
      const capitalizedServiceName = serviceName === 'oura' ? 'Oura' : 'Fitbit';
      // Run completely non-blocking to avoid any OAuth callback failures
      setTimeout(() => {
        triggerHealthDataSync(user.id, capitalizedServiceName).catch(error => {
          console.warn(`Health data sync failed for ${capitalizedServiceName}, but OAuth completed:`, error);
        });
      }, 0);
    }

    return NextResponse.json({
      success: true,
      integration: integrationResult.integration
    });

  } catch (error) {
    console.error('Token exchange error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function triggerHealthDataSync(userId: string, serviceName: string): Promise<void> {
  try {
    console.log(`Triggering health data sync for ${serviceName}`);
    
    // Import and use the proper HealthDataSyncService that calls edge function directly with user tokens (like React Native)
    const { HealthDataSyncService } = await import('@/lib/services/healthDataSync');
    const healthDataSync = new HealthDataSyncService();
    const result = await healthDataSync.syncHealthData('backfill', userId, 7, serviceName);

    if (!result.success) {
      console.warn(`Health data sync failed for ${serviceName}, but continuing OAuth flow:`, result.error);
    } else {
      console.log(`Health data sync triggered successfully for ${serviceName}, processed ${result.days_processed} days`);
    }

    // For Fitbit, also set up webhooks (non-blocking)
    if (serviceName === 'fitbit') {
      setupFitbitWebhooks(userId).catch(error => {
        console.warn('Fitbit webhook setup failed, but continuing OAuth flow:', error);
      });
    }

  } catch (error) {
    console.warn(`Health data sync error for ${serviceName}, but continuing OAuth flow:`, error);
  }
}

async function setupFitbitWebhooks(userId: string): Promise<void> {
  try {
    console.log('Setting up Fitbit webhooks');
    
    const collections = ['activities', 'sleep', 'body', 'foods'];
    
    for (const collection of collections) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/integrations/fitbit-webhook`, {
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
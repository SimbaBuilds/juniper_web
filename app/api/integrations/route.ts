import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server';
import { IntegrationService } from '@/app/lib/integrations/IntegrationService';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAppServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Fetching integrations for user:', user.id);

    // Use the exact same query as React Native (lines 601-610 in supabase.ts)
    const { data: integrations, error: integrationsError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (integrationsError) {
      console.error('Error fetching integrations:', integrationsError);
      return NextResponse.json(
        { error: 'Failed to fetch integrations' },
        { status: 500 }
      );
    }

    console.log('Found integrations:', integrations?.length || 0);
    console.log('Integrations data:', integrations);

    return NextResponse.json({ integrations: integrations || [] });

  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseAppServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, serviceName, integrationId } = await request.json();

    const integrationService = new IntegrationService();

    switch (action) {
      case 'initiate_oauth':
        const result = await integrationService.initiateOAuth(serviceName);
        return NextResponse.json(result);

      case 'disconnect':
        if (integrationId) {
          // Disconnect by integration ID
          const success = await integrationService.deleteIntegrationById(integrationId);
          return NextResponse.json({ success });
        } else if (serviceName) {
          // Disconnect by service name (legacy)
          const success = await integrationService.deleteIntegration(user.id, serviceName);
          if (success) {
            // Also clear local OAuth tokens
            const oauthService = integrationService.getOAuthService(serviceName);
            if (oauthService) {
              await oauthService.clearStoredTokens();
            }
          }
          return NextResponse.json({ success });
        } else {
          return NextResponse.json({ error: 'Integration ID or service name required' }, { status: 400 });
        }

      case 'refresh_tokens':
        const refreshSuccess = await integrationService.refreshIntegrationTokens(user.id, serviceName);
        return NextResponse.json({ success: refreshSuccess });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Error handling integration request:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
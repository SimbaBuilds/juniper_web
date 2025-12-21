import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server';

// Helper to wait for a specified duration
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// POST - Manually trigger an automation
// Handles different trigger types appropriately:
// - polling: Two-step process (poll for data → process events)
// - others: Direct execution via script-executor
export async function POST(request: NextRequest) {
  try {
    // Check for Bearer token from mobile app
    const authHeader = request.headers.get('Authorization');
    let supabase;
    let accessToken: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      // Mobile app auth - use the token directly
      accessToken = authHeader.replace('Bearer ', '');
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${accessToken}` }
          }
        }
      );
    } else {
      // Web app auth - use cookies
      supabase = await createSupabaseAppServerClient();
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { automation_id, trigger_data = {} } = await request.json();

    if (!automation_id) {
      return NextResponse.json({ error: 'automation_id is required' }, { status: 400 });
    }

    // Verify the automation exists and belongs to this user
    // Include trigger_type and trigger_config for routing logic
    const { data: automation, error: fetchError } = await supabase
      .schema('automations')
      .from('automation_records')
      .select('id, user_id, name, active, trigger_type, trigger_config')
      .eq('id', automation_id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !automation) {
      return NextResponse.json({ error: 'Automation not found' }, { status: 404 });
    }

    if (!automation.active) {
      return NextResponse.json({ error: 'Automation is paused' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      return NextResponse.json({ error: 'Supabase URL not configured' }, { status: 500 });
    }

    // ================================================================
    // POLLING AUTOMATIONS - Two-step process
    // ================================================================
    if (automation.trigger_type === 'polling') {
      if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
      }

      // Step 1: Trigger the poll to fetch new data and create events
      const pollUrl = `${supabaseUrl}/functions/v1/scheduler-runner/polling`;
      const pollPayload = {
        // Force-poll this specific automation (ignores next_poll_at)
        automation_id: automation_id
      };

      console.log(`Triggering polling automation via scheduler-runner`);
      console.log(`  Automation ID: ${automation_id}`);
      console.log(`  Automation Name: ${automation.name}`);
      console.log(`  Service: ${automation.trigger_config?.service || 'unknown'}`);
      console.log(`  Poll Payload:`, JSON.stringify(pollPayload, null, 2));

      const pollResponse = await fetch(pollUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify(pollPayload)
      });

      if (!pollResponse.ok) {
        const errorText = await pollResponse.text();
        console.error(`Polling failed: ${pollResponse.status} - ${errorText}`);
        return NextResponse.json(
          { error: `Polling failed: ${errorText}` },
          { status: pollResponse.status }
        );
      }

      const pollResult = await pollResponse.json();
      // Force-poll returns items_found/events_created directly in data
      const itemsFound = pollResult.data?.items_found ?? pollResult.data?.total_items_found ?? 0;
      const eventsCreated = pollResult.data?.events_created ?? pollResult.data?.total_events_created ?? 0;
      console.log(`Poll completed: ${eventsCreated} events created`);

      // Step 2: Wait for events to populate in the database
      console.log(`  Waiting 2s for events to populate...`);
      await sleep(2000);

      // Step 3: Process events for this user
      const processUrl = `${supabaseUrl}/functions/v1/event-processor/user`;
      const processPayload = {
        user_id: user.id,
        // Optionally filter by service from trigger_config
        service_name: automation.trigger_config?.service?.toLowerCase()
      };

      console.log(`  Processing events via event-processor/user`);
      console.log(`  Process Payload:`, JSON.stringify(processPayload, null, 2));

      const processResponse = await fetch(processUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${serviceRoleKey}`
        },
        body: JSON.stringify(processPayload)
      });

      if (!processResponse.ok) {
        const errorText = await processResponse.text();
        console.error(`Event processing failed: ${processResponse.status} - ${errorText}`);
        return NextResponse.json(
          { error: `Event processing failed: ${errorText}` },
          { status: processResponse.status }
        );
      }

      const processResult = await processResponse.json();
      console.log(`Events processed: ${processResult.data?.successful || 0} successful`);

      return NextResponse.json({
        success: true,
        trigger_type: 'polling',
        poll_result: {
          items_found: itemsFound,
          events_created: eventsCreated
        },
        process_result: {
          events_processed: processResult.data?.successful || 0,
          events_failed: processResult.data?.failed || 0
        },
        message: `Polled ${itemsFound} items, processed ${processResult.data?.successful || 0} events`
      });
    }

    // ================================================================
    // ALL OTHER AUTOMATION TYPES - Direct execution
    // ================================================================

    // Get access token for edge function calls
    // For mobile (Bearer token), we already have it; for web (cookies), get from session
    if (!accessToken) {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        return NextResponse.json({ error: 'Failed to get session' }, { status: 401 });
      }
      accessToken = session.access_token;
    }

    const executorUrl = `${supabaseUrl}/functions/v1/script-executor/manual`;

    const manualTriggerData = {
      trigger_type: 'manual',
      triggered_at: new Date().toISOString(),
      triggered_by: 'web_ui',
      ...trigger_data
    };

    const payload = {
      automation_id,
      trigger_data: manualTriggerData,
      test_mode: false
    };

    console.log(`Triggering ${automation.trigger_type} automation via script-executor`);
    console.log(`  Automation ID: ${automation_id}`);
    console.log(`  Automation Name: ${automation.name}`);
    console.log(`  Payload:`, JSON.stringify(payload, null, 2));

    const response = await fetch(executorUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Script executor error: ${response.status} - ${errorText}`);

      // Try to parse error response
      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json(
          { error: errorJson.error || errorJson.message || 'Execution failed' },
          { status: response.status }
        );
      } catch {
        return NextResponse.json(
          { error: `Execution failed: ${errorText}` },
          { status: response.status }
        );
      }
    }

    const result = await response.json();
    console.log(`Automation ${automation_id} executed successfully:`, result.execution_id);

    return NextResponse.json({
      success: true,
      trigger_type: automation.trigger_type,
      execution_id: result.execution_id || result.data?.execution_id,
      result: result.data || result,
      message: `Executed ${result.data?.result?.actions_executed || 0} actions`
    });

  } catch (error) {
    console.error('Error triggering automation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

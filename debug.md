https://hightower-ai.com/integrations?error=function%20trigger_health_data_backfill(uuid%2C%20text%2C%20integer)%20does%20not%20exist&service=oura



React Native Implementation Below"

 private async triggerHealthDataSync(integrationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated with Supabase');
      }

      const response = await fetch('https://ydbabipbxxleeiiysojv.supabase.co/functions/v1/health-data-sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'backfill',
          user_id: user.id,
          service_name: 'Fitbit',
          days: 7
        })
      });

      if (!response.ok) {
        throw new Error(`Health data sync request failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Health data sync request sent successfully');
    } catch (error) {
      console.error('❌ Error triggering health data sync:', error);
      throw error;
    }
  }
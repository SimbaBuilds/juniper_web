import { createClient } from '@/lib/utils/supabase/client'

export interface HealthMetric {
  id: string
  user_id: string
  date: string
  sleep_score: number | null
  activity_score: number | null
  readiness_score: number | null
  stress_level: number | null
  recovery_score: number | null
  total_steps: number | null
  calories_burned: number | null
  heart_rate_avg: number | null
  hrv_avg: number | null
  created_at: string
  updated_at: string
  native_scores: any
  normalized_scores: any
}

export interface SyncResult {
  success: boolean
  error?: string
  days_processed?: number
  latency_ms?: number
}

export class HealthDataSyncService {
  private supabase = createClient()

  /**
   * Check if we have recent health metrics data for a user
   */
  async checkRecentMetrics(userId: string, days: number): Promise<boolean> {
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const { data, error } = await this.supabase
      .from('health_metrics_daily')
      .select('id')
      .eq('user_id', userId)
      .gte('date', cutoffDate)
      .limit(1)

    if (error) {
      console.error('Error checking recent metrics:', error)
      return false
    }

    return (data?.length || 0) > 0
  }

  /**
   * Call the health-data-sync edge function
   */
  async syncHealthData(
    action: 'backfill' | 'aggregate',
    userId: string,
    days?: number,
    serviceName?: string
  ): Promise<SyncResult> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      
      if (!session?.access_token) {
        return {
          success: false,
          error: 'No authentication token available'
        }
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const response = await fetch(`${supabaseUrl}/functions/v1/health-data-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          user_id: userId,
          ...(days && { days }),
          ...(serviceName && { service_name: serviceName })
        })
      })

      const result = await response.json()

      if (response.ok) {
        return {
          success: true,
          days_processed: result.days_processed,
          latency_ms: result.latency_ms
        }
      } else {
        return {
          success: false,
          error: result.error || 'Health sync failed'
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Health sync failed'
      }
    }
  }

  /**
   * Load health metrics data after sync
   */
  async loadHealthMetrics(userId: string, timeRangeDays: number): Promise<HealthMetric[]> {
    const cutoffDate = new Date(Date.now() - timeRangeDays * 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]

    const { data: metricsData, error } = await this.supabase
      .from('health_metrics_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', cutoffDate)
      .order('date', { ascending: true })

    if (error) {
      console.error('Error fetching health metrics:', error)
      throw new Error('Failed to load health metrics')
    }

    return metricsData || []
  }

  /**
   * Handle dashboard load with smart sync strategy (per markdown lines 55-88)
   */
  async handleDashboardLoad(userId: string, timeRangeDays: number = 30): Promise<HealthMetric[]> {
    try {
      // 1. Check if we have recent aggregated data (last 3 days)
      const hasRecentMetrics = await this.checkRecentMetrics(userId, 3)

      let syncResult: SyncResult

      if (!hasRecentMetrics) {
        // 2. No recent data - trigger backfill + aggregation for 7 days
        console.log('No recent data found, triggering 7-day backfill...')
        syncResult = await this.syncHealthData('backfill', userId, 7)
      } else {
        // 3. Have recent data - just sync last 2 days
        console.log('Recent data found, syncing last 2 days...')
        syncResult = await this.syncHealthData('backfill', userId, 2)
      }

      if (syncResult.success) {
        console.log(`✅ Health sync completed: ${syncResult.days_processed} days in ${syncResult.latency_ms}ms`)
      } else {
        console.error('Health sync failed:', syncResult.error)
      }

      // 4. Load dashboard with latest data (whether sync succeeded or failed)
      return await this.loadHealthMetrics(userId, timeRangeDays)
    } catch (error) {
      console.error('Error in dashboard load:', error)
      // Fallback: try to load existing data
      return await this.loadHealthMetrics(userId, timeRangeDays)
    }
  }
}

// Export singleton instance
export const healthDataSyncService = new HealthDataSyncService()
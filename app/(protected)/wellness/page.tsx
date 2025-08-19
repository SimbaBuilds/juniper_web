'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { Tags, Activity, Heart, Moon, TrendingUp, Filter, BarChart3, ChevronDown, ChevronUp } from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface HealthMetric {
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

interface ResourceWithTags {
  id: string
  title: string
  content: string
  type: string
  tags: { id: string; name: string; type: string }[]
  created_at: string
}

interface FilterPrefs {
  timeRange: string
  showResources: boolean
  showAutomations: boolean
  sortBy: string
  showHealthScoresTrend: boolean
  showActivityDistribution: boolean
  showDailySteps: boolean
  showDailyCalories: boolean
  showSummaryStats: boolean
  showSleepCard: boolean
  showActivityCard: boolean
  showStepsCard: boolean
  showReadinessCard: boolean
  showAvgStepsCard: boolean
  showAvgStressCard: boolean
  showAvgHeartRateCard: boolean
  showAvgHrvCard: boolean
  // Trend chart metric toggles
  showSleepTrend: boolean
  showActivityTrend: boolean
  showReadinessTrend: boolean
  showStressTrend: boolean
  showHeartRateTrend: boolean
  showHrvTrend: boolean
}

const CHART_CONFIG = {
  sleep_score: {
    label: "Sleep Score",
    color: "hsl(var(--chart-1))"
  },
  activity_score: {
    label: "Activity Score", 
    color: "hsl(var(--chart-2))"
  },
  readiness_score: {
    label: "Readiness Score",
    color: "hsl(var(--chart-3))"
  },
  stress_level: {
    label: "Stress Level",
    color: "hsl(var(--chart-4))"
  }
}

// Use theme-aware colors that match repository screen
const COLORS = {
  light: ['#1e40af', '#166534', '#f59e0b', '#ef4444', '#8b5cf6'], // blue-800, green-800, amber-500, red-500, violet-500
  dark: ['#60a5fa', '#bbf7d0', '#fbbf24', '#f87171', '#a78bfa']   // blue-400, green-200, amber-400, red-400, violet-400
}

export default function WellnessPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [healthData, setHealthData] = useState<HealthMetric[]>([])
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [filterPrefs, setFilterPrefs] = useState<FilterPrefs>({
    timeRange: '30',
    showResources: true,
    showAutomations: true,
    sortBy: 'date',
    showHealthScoresTrend: true,
    showActivityDistribution: true,
    showDailySteps: true,
    showDailyCalories: true,
    showSummaryStats: true,
    showSleepCard: true,
    showActivityCard: true,
    showStepsCard: true,
    showReadinessCard: true,
    showAvgStepsCard: true,
    showAvgStressCard: true,
    showAvgHeartRateCard: true,
    showAvgHrvCard: true,
    // Trend chart metric toggles
    showSleepTrend: true,
    showActivityTrend: true,
    showReadinessTrend: true,
    showStressTrend: true,
    showHeartRateTrend: true,
    showHrvTrend: true
  })

  // Detect dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'))
    }
    checkDarkMode()
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })
    
    return () => observer.disconnect()
  }, [])

  // Load preferences from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wellness-filter-prefs')
    if (saved) {
      try {
        setFilterPrefs(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse saved preferences:', e)
      }
    }
  }, [])

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('wellness-filter-prefs', JSON.stringify(filterPrefs))
  }, [filterPrefs])

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('Error getting user:', userError)
          return
        }
        
        setUser(user)

        // Fetch health metrics data (excluding current day to avoid showing zeros)
        const daysBack = parseInt(filterPrefs.timeRange)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        const startDate = new Date(Date.now() - (daysBack + 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        
        console.log('Date debugging:')
        console.log('Current time:', new Date().toISOString())
        console.log('Yesterday (upper bound):', yesterday)
        console.log('Start date (lower bound):', startDate)
        console.log('Days back:', daysBack)
        
        const { data: metricsData, error: metricsError } = await supabase
          .from('health_metrics_daily')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', yesterday)
          .order('date', { ascending: true })
        
        if (metricsError) {
          console.error('Error fetching health metrics:', metricsError)
        } else {
          console.log('Fetched metrics data:', metricsData?.length, 'records')
          if (metricsData && metricsData.length > 0) {
            console.log('First record date:', metricsData[0].date)
            console.log('Last record date:', metricsData[metricsData.length - 1].date)
          }
          setHealthData(metricsData || [])
        }

        // Fetch resources with "Health and Wellness" tag
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select(`
            *,
            tag_1:tags!resources_tag_1_id_fkey(id, name, type),
            tag_2:tags!resources_tag_2_id_fkey(id, name, type),
            tag_3:tags!resources_tag_3_id_fkey(id, name, type),
            tag_4:tags!resources_tag_4_id_fkey(id, name, type),
            tag_5:tags!resources_tag_5_id_fkey(id, name, type)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError)
        } else {
          // Filter resources with "Health and Wellness" tag
          const healthResources = resourcesData?.filter(resource => {
            const tags = [
              resource.tag_1,
              resource.tag_2,
              resource.tag_3,
              resource.tag_4,
              resource.tag_5
            ].filter(Boolean)
            
            return tags.some(tag => tag.name === 'Health and Wellness')
          }).map(resource => {
            const tags = [
              resource.tag_1,
              resource.tag_2,
              resource.tag_3,
              resource.tag_4,
              resource.tag_5
            ].filter(Boolean)
            
            return {
              ...resource,
              tags
            }
          }) || []
          
          setResources(healthResources)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [filterPrefs.timeRange])

  const updateFilterPref = (key: keyof FilterPrefs, value: any) => {
    setFilterPrefs(prev => ({ ...prev, [key]: value }))
  }

  // Calculate summary stats
  const summaryStats = healthData.length > 0 ? {
    avgSleepScore: Math.round(healthData.reduce((sum, d) => sum + (d.sleep_score || 0), 0) / healthData.length),
    avgActivityScore: Math.round(healthData.reduce((sum, d) => sum + (d.activity_score || 0), 0) / healthData.length),
    totalSteps: healthData.reduce((sum, d) => sum + (d.total_steps || 0), 0),
    avgReadiness: Math.round(healthData.reduce((sum, d) => sum + (d.readiness_score || 0), 0) / Math.max(healthData.filter(d => d.readiness_score && d.readiness_score > 0).length, 1)),
    avgSteps: Math.round(healthData.reduce((sum, d) => sum + (d.total_steps || 0), 0) / Math.max(healthData.filter(d => d.total_steps && d.total_steps > 0).length, 1)),
    avgStressLevel: Math.round(healthData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / Math.max(healthData.filter(d => d.stress_level && d.stress_level > 0).length, 1)),
    avgHeartRate: Math.round(healthData.reduce((sum, d) => sum + (d.heart_rate_avg || 0), 0) / Math.max(healthData.filter(d => d.heart_rate_avg && d.heart_rate_avg > 0).length, 1)),
    avgHrv: Math.round(healthData.reduce((sum, d) => sum + (d.hrv_avg || 0), 0) / Math.max(healthData.filter(d => d.hrv_avg && d.hrv_avg > 0).length, 1))
  } : null

  // Prepare chart data
  const chartData = healthData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sleep_score: d.sleep_score || 0,
    activity_score: d.activity_score || 0,
    readiness_score: d.readiness_score || 0,
    stress_level: d.stress_level || 0,
    heart_rate_avg: d.heart_rate_avg || 0,
    hrv_avg: d.hrv_avg || 0,
    steps: d.total_steps || 0,
    calories: d.calories_burned || 0
  }))

  // Activity distribution for pie chart
  const activityDistribution = healthData.length > 0 ? [
    { name: 'High Activity', value: healthData.filter(d => (d.activity_score || 0) >= 80).length },
    { name: 'Medium Activity', value: healthData.filter(d => (d.activity_score || 0) >= 50 && (d.activity_score || 0) < 80).length },
    { name: 'Low Activity', value: healthData.filter(d => (d.activity_score || 0) < 50).length }
  ].filter(item => item.value > 0) : []

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Wellness Dashboard</h1>
          <p className="text-muted-foreground">
            Track your health metrics and wellness journey.
          </p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Dashboard Settings
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSettingsExpanded(!settingsExpanded)}
            className="h-8 px-2"
          >
            {settingsExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Hide Advanced
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show Advanced
              </>
            )}
          </Button>
        </div>
        
        {/* Always visible controls */}
        <div className="flex gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Time Range</Label>
            <Select 
              value={filterPrefs.timeRange} 
              onValueChange={(value) => updateFilterPref('timeRange', value)}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">*data updates daily at 2am UTC</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Sort By</Label>
            <Select 
              value={filterPrefs.sortBy} 
              onValueChange={(value) => updateFilterPref('sortBy', value)}
            >
              <SelectTrigger className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="sleep_score">Sleep Score</SelectItem>
                <SelectItem value="activity_score">Activity Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expandable toggle groups */}
        {settingsExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Chart Toggles */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Charts</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-health-scores"
                    checked={filterPrefs.showHealthScoresTrend}
                    onCheckedChange={(checked) => updateFilterPref('showHealthScoresTrend', checked)}
                  />
                  <Label htmlFor="show-health-scores" className="text-xs">Health Scores</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-activity-dist"
                    checked={filterPrefs.showActivityDistribution}
                    onCheckedChange={(checked) => updateFilterPref('showActivityDistribution', checked)}
                  />
                  <Label htmlFor="show-activity-dist" className="text-xs">Activity Chart</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-steps"
                    checked={filterPrefs.showDailySteps}
                    onCheckedChange={(checked) => updateFilterPref('showDailySteps', checked)}
                  />
                  <Label htmlFor="show-steps" className="text-xs">Steps Chart</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-calories"
                    checked={filterPrefs.showDailyCalories}
                    onCheckedChange={(checked) => updateFilterPref('showDailyCalories', checked)}
                  />
                  <Label htmlFor="show-calories" className="text-xs">Calories Chart</Label>
                </div>
              </div>
            </div>

            {/* Summary Card Toggles */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Summary Cards</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-summary-stats"
                    checked={filterPrefs.showSummaryStats}
                    onCheckedChange={(checked) => updateFilterPref('showSummaryStats', checked)}
                  />
                  <Label htmlFor="show-summary-stats" className="text-xs">All Summary</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-sleep-card"
                    checked={filterPrefs.showSleepCard}
                    onCheckedChange={(checked) => updateFilterPref('showSleepCard', checked)}
                  />
                  <Label htmlFor="show-sleep-card" className="text-xs">Sleep Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-activity-card"
                    checked={filterPrefs.showActivityCard}
                    onCheckedChange={(checked) => updateFilterPref('showActivityCard', checked)}
                  />
                  <Label htmlFor="show-activity-card" className="text-xs">Activity Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-steps-card"
                    checked={filterPrefs.showStepsCard}
                    onCheckedChange={(checked) => updateFilterPref('showStepsCard', checked)}
                  />
                  <Label htmlFor="show-steps-card" className="text-xs">Steps Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-readiness-card"
                    checked={filterPrefs.showReadinessCard}
                    onCheckedChange={(checked) => updateFilterPref('showReadinessCard', checked)}
                  />
                  <Label htmlFor="show-readiness-card" className="text-xs">Readiness Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-avg-steps-card"
                    checked={filterPrefs.showAvgStepsCard}
                    onCheckedChange={(checked) => updateFilterPref('showAvgStepsCard', checked)}
                  />
                  <Label htmlFor="show-avg-steps-card" className="text-xs">Avg Steps</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-avg-stress-card"
                    checked={filterPrefs.showAvgStressCard}
                    onCheckedChange={(checked) => updateFilterPref('showAvgStressCard', checked)}
                  />
                  <Label htmlFor="show-avg-stress-card" className="text-xs">Avg Stress</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-avg-hr-card"
                    checked={filterPrefs.showAvgHeartRateCard}
                    onCheckedChange={(checked) => updateFilterPref('showAvgHeartRateCard', checked)}
                  />
                  <Label htmlFor="show-avg-hr-card" className="text-xs">Avg HR</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-avg-hrv-card"
                    checked={filterPrefs.showAvgHrvCard}
                    onCheckedChange={(checked) => updateFilterPref('showAvgHrvCard', checked)}
                  />
                  <Label htmlFor="show-avg-hrv-card" className="text-xs">Avg HRV</Label>
                </div>
              </div>
            </div>

            {/* Section Toggles */}
            <div>
              <h4 className="text-sm font-medium mb-3 text-muted-foreground">Sections</h4>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-resources"
                    checked={filterPrefs.showResources}
                    onCheckedChange={(checked) => updateFilterPref('showResources', checked)}
                  />
                  <Label htmlFor="show-resources" className="text-xs">Resources</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-automations"
                    checked={filterPrefs.showAutomations}
                    onCheckedChange={(checked) => updateFilterPref('showAutomations', checked)}
                  />
                  <Label htmlFor="show-automations" className="text-xs">Automations</Label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Summary Stats */}
      {summaryStats && filterPrefs.showSummaryStats && (
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                      {filterPrefs.showSleepCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Sleep Score</CardTitle>
                  <Moon className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">{summaryStats.avgSleepScore}</div>
                  <p className="text-xs text-muted-foreground">/100</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showActivityCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Activity Score</CardTitle>
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">{summaryStats.avgActivityScore}</div>
                  <p className="text-xs text-muted-foreground">/100</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showStepsCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Total Steps</CardTitle>
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">{summaryStats.totalSteps.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">steps</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showReadinessCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Avg Readiness</CardTitle>
                  <Heart className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.readiness_score && d.readiness_score > 0) ? summaryStats.avgReadiness : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">score</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showAvgStepsCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Avg Steps</CardTitle>
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.total_steps && d.total_steps > 0) ? summaryStats.avgSteps.toLocaleString() : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">per day</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showAvgStressCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Avg Stress</CardTitle>
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.stress_level && d.stress_level > 0) ? summaryStats.avgStressLevel : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">level</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showAvgHeartRateCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Avg HR</CardTitle>
                  <Heart className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.heart_rate_avg && d.heart_rate_avg > 0) ? summaryStats.avgHeartRate : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showAvgHrvCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium">Avg HRV</CardTitle>
                  <Activity className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.hrv_avg && d.hrv_avg > 0) ? summaryStats.avgHrv : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">ms</p>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="space-y-4">
          {/* Trends Chart - Full Width */}
          {filterPrefs.showHealthScoresTrend && (
            <Card className="pb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Trends</CardTitle>
                <CardDescription className="text-sm">Health metrics over time</CardDescription>
                
                {/* Metric Toggles */}
                <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="sleep-trend"
                      checked={filterPrefs.showSleepTrend}
                      onCheckedChange={(checked) => updateFilterPref('showSleepTrend', checked)}
                    />
                    <Label htmlFor="sleep-trend" className="text-xs">Sleep</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="activity-trend"
                      checked={filterPrefs.showActivityTrend}
                      onCheckedChange={(checked) => updateFilterPref('showActivityTrend', checked)}
                    />
                    <Label htmlFor="activity-trend" className="text-xs">Activity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="readiness-trend"
                      checked={filterPrefs.showReadinessTrend}
                      onCheckedChange={(checked) => updateFilterPref('showReadinessTrend', checked)}
                    />
                    <Label htmlFor="readiness-trend" className="text-xs">Readiness</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="stress-trend"
                      checked={filterPrefs.showStressTrend}
                      onCheckedChange={(checked) => updateFilterPref('showStressTrend', checked)}
                    />
                    <Label htmlFor="stress-trend" className="text-xs">Stress</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hr-trend"
                      checked={filterPrefs.showHeartRateTrend}
                      onCheckedChange={(checked) => updateFilterPref('showHeartRateTrend', checked)}
                    />
                    <Label htmlFor="hr-trend" className="text-xs">Heart Rate</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="hrv-trend"
                      checked={filterPrefs.showHrvTrend}
                      onCheckedChange={(checked) => updateFilterPref('showHrvTrend', checked)}
                    />
                    <Label htmlFor="hrv-trend" className="text-xs">HRV</Label>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      {filterPrefs.showSleepTrend && (
                        <Line 
                          type="monotone" 
                          dataKey="sleep_score" 
                          stroke={isDarkMode ? "#60a5fa" : "#1e40af"} 
                          strokeWidth={2} 
                          name="Sleep Score" 
                        />
                      )}
                      {filterPrefs.showActivityTrend && (
                        <Line 
                          type="monotone" 
                          dataKey="activity_score" 
                          stroke={isDarkMode ? "#bbf7d0" : "#166534"} 
                          strokeWidth={2} 
                          name="Activity Score" 
                        />
                      )}
                      {filterPrefs.showReadinessTrend && (
                        <Line 
                          type="monotone" 
                          dataKey="readiness_score" 
                          stroke={isDarkMode ? "#fbbf24" : "#f59e0b"} 
                          strokeWidth={2} 
                          name="Readiness Score" 
                        />
                      )}
                      {filterPrefs.showStressTrend && (
                        <Line 
                          type="monotone" 
                          dataKey="stress_level" 
                          stroke={isDarkMode ? "#f87171" : "#ef4444"} 
                          strokeWidth={2} 
                          name="Stress Level" 
                        />
                      )}
                      {filterPrefs.showHeartRateTrend && (
                        <Line 
                          type="monotone" 
                          dataKey="heart_rate_avg" 
                          stroke={isDarkMode ? "#a78bfa" : "#8b5cf6"} 
                          strokeWidth={2} 
                          name="Heart Rate" 
                        />
                      )}
                      {filterPrefs.showHrvTrend && (
                        <Line 
                          type="monotone" 
                          dataKey="hrv_avg" 
                          stroke={isDarkMode ? "#fb7185" : "#ec4899"} 
                          strokeWidth={2} 
                          name="HRV" 
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Other Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Activity Distribution */}
          {filterPrefs.showActivityDistribution && (
            <Card className="pb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Activity Distribution</CardTitle>
                <CardDescription className="text-sm">Distribution of activity levels</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 90, left: 90, bottom: 20 }}>
                      <Pie
                        data={activityDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={140}
                        fill="#8884d8"
                        dataKey="value"
                        labelLine={false}
                        label={({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, value, index }) => {
                          const RADIAN = Math.PI / 180
                          const radius = outerRadius + 35
                          const x = cx + radius * Math.cos(-midAngle * RADIAN)
                          const y = cy + radius * Math.sin(-midAngle * RADIAN)
                          
                          const colorPalette = isDarkMode ? COLORS.dark : COLORS.light
                          return (
                            <text 
                              x={x} 
                              y={y} 
                              fill={colorPalette[index % colorPalette.length]}
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                              className="text-xs font-medium"
                            >
                              <tspan x={x} dy="0">{name}</tspan>
                              <tspan x={x} dy="16">{`${(percent * 100).toFixed(0)}% (${value}/${healthData.length} days)`}</tspan>
                            </text>
                          )
                        }}
                      >
                        {activityDistribution.map((entry, index) => {
                          const colorPalette = isDarkMode ? COLORS.dark : COLORS.light
                          return <Cell key={`cell-${index}`} fill={colorPalette[index % colorPalette.length]} />
                        })}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Steps */}
          {filterPrefs.showDailySteps && (
            <Card className="pb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Steps</CardTitle>
                <CardDescription className="text-sm">Steps taken each day</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="steps" 
                        fill={isDarkMode ? "#60a5fa" : "#1e40af"} 
                        name="Steps"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily Calories */}
          {filterPrefs.showDailyCalories && (
            <Card className="pb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Daily Calories</CardTitle>
                <CardDescription className="text-sm">Calories burned each day</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Bar 
                        dataKey="calories" 
                        fill={isDarkMode ? "#bbf7d0" : "#166534"} 
                        name="Calories"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
          </div>
        </div>
      )}

      {/* Tip Banner */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Tip:</span> Add tag “Health and Wellness” to a resource to have it appear below.
            </p>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      {filterPrefs.showResources && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Health & Wellness Resources
            </CardTitle>
            <CardDescription>
              Resources tagged with "Health and Wellness"
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resources.length > 0 ? (
              <div className="space-y-4">
                {resources.map((resource) => (
                  <div key={resource.id} className="bg-accent/50 p-4 rounded-lg">
                    <h3 className="font-semibold text-foreground mb-2">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {resource.content.length > 200 
                        ? `${resource.content.substring(0, 200)}...`
                        : resource.content
                      }
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      {resource.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No health and wellness resources found.</p>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Tags className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <span className="font-medium">Tip:</span> Add tag "Health and Wellness" to a resource to have it appear on this screen.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Automations placeholder */}
      {filterPrefs.showAutomations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Health & Wellness Automations
            </CardTitle>
            <CardDescription>
              Automated health tracking and insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">No health automations configured yet.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {healthData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">No health data found</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wearable devices to start tracking your wellness metrics.
            </p>
            <Button asChild>
              <a href="/integrations">Connect Devices</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
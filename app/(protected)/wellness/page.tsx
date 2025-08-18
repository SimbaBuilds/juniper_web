'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/utils/supabase/client'
import { Tags, Activity, Heart, Moon, TrendingUp, Filter, BarChart3 } from 'lucide-react'
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function WellnessPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [healthData, setHealthData] = useState<HealthMetric[]>([])
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [loading, setLoading] = useState(true)
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
    showReadinessCard: true
  })

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
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('Error getting user:', userError)
          return
        }
        
        setUser(user)

        // Fetch health metrics data
        const daysBack = parseInt(filterPrefs.timeRange)
        const { data: metricsData, error: metricsError } = await supabase
          .from('health_metrics_daily')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
          .order('date', { ascending: true })
        
        if (metricsError) {
          console.error('Error fetching health metrics:', metricsError)
        } else {
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
    avgReadiness: Math.round(healthData.reduce((sum, d) => sum + (d.readiness_score || 0), 0) / Math.max(healthData.filter(d => d.readiness_score && d.readiness_score > 0).length, 1))
  } : null

  // Prepare chart data
  const chartData = healthData.map(d => ({
    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    sleep_score: d.sleep_score || 0,
    activity_score: d.activity_score || 0,
    readiness_score: d.readiness_score || 0,
    stress_level: d.stress_level || 0,
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
        <h3 className="font-medium text-sm flex items-center gap-2">
          <Filter className="h-4 w-4" />
          Dashboard Settings
        </h3>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Controls - Time Range and Sort */}
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

          {/* Toggle Groups */}
          <div className="flex-1 space-y-3">
            {/* Chart Toggles */}
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

            {/* Summary Card Toggles */}
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
            </div>

            {/* Section Toggles */}
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
      </div>


      {/* Summary Stats */}
      {summaryStats && filterPrefs.showSummaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {filterPrefs.showSleepCard && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Sleep Score</CardTitle>
                <Moon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.avgSleepScore}</div>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </CardContent>
            </Card>
          )}
          {filterPrefs.showActivityCard && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Activity Score</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.avgActivityScore}</div>
                <p className="text-xs text-muted-foreground">out of 100</p>
              </CardContent>
            </Card>
          )}
          {filterPrefs.showStepsCard && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Steps</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryStats.totalSteps.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">steps taken</p>
              </CardContent>
            </Card>
          )}
          {filterPrefs.showReadinessCard && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Readiness</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {healthData.some(d => d.readiness_score && d.readiness_score > 0) ? summaryStats.avgReadiness : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">readiness score</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Health Scores Trend */}
          {filterPrefs.showHealthScoresTrend && (
            <Card className="pb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Health Scores Trend</CardTitle>
                <CardDescription className="text-sm">Sleep, Activity, and Readiness scores over time</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sleep_score" stroke="#6366f1" strokeWidth={2} name="Sleep Score" />
                      <Line type="monotone" dataKey="activity_score" stroke="#f59e0b" strokeWidth={2} name="Activity Score" />
                      <Line type="monotone" dataKey="readiness_score" stroke="#ef4444" strokeWidth={2} name="Readiness Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

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
                    <PieChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                      <Pie
                        data={activityDistribution}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {activityDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
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
                      <Bar dataKey="steps" fill="#3b82f6" name="Steps" />
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
                      <Bar dataKey="calories" fill="#10b981" name="Calories" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
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
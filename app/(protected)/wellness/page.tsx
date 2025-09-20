'use client'

import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { createClient } from '@/lib/utils/supabase/client'
import { Tags, Activity, Heart, Moon, TrendingUp, Filter, BarChart3, ChevronDown, ChevronUp, Info, CalendarIcon, Save, Plus, X, Check, ChevronsUpDown, Search, Edit2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { MedicalRecordsUpload } from '@/components/MedicalRecordsUpload'

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
  resting_hr: number | null
  hrv_avg: number | null
  resilience_score: number | null
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

interface ChartInstance {
  id: string
  name: string
  selectedMetrics: string[]
  isExpanded: boolean
}

interface MetricDefinition {
  key: string
  label: string
  group: string
  color: {
    light: string
    dark: string
  }
}

interface FilterPrefs {
  timeRange: string
  showResources: boolean
  sortBy: string
  showSummaryStats: boolean
  showSleepCard: boolean
  showActivityCard: boolean
  showStepsCard: boolean
  showReadinessCard: boolean
  showAvgStepsCard: boolean
  showAvgStressCard: boolean
  showAvgHeartRateCard: boolean
  showAvgHrvCard: boolean
  // New trend chart instances
  trendCharts: ChartInstance[]
}

// Define all available metrics with their configuration
const AVAILABLE_METRICS: MetricDefinition[] = [
  // Recovery & Sleep
  {
    key: 'sleep_score',
    label: 'Sleep Score',
    group: 'Recovery',
    color: { light: '#1e40af', dark: '#60a5fa' }
  },
  {
    key: 'readiness_score',
    label: 'Readiness Score',
    group: 'Recovery',
    color: { light: '#f59e0b', dark: '#fbbf24' }
  },
  {
    key: 'recovery_score',
    label: 'Recovery Score',
    group: 'Recovery',
    color: { light: '#059669', dark: '#10b981' }
  },

  // Activity & Exercise
  {
    key: 'activity_score',
    label: 'Activity Score',
    group: 'Activity',
    color: { light: '#166534', dark: '#bbf7d0' }
  },
  {
    key: 'total_steps',
    label: 'Total Steps',
    group: 'Activity',
    color: { light: '#7c3aed', dark: '#8b5cf6' }
  },
  {
    key: 'calories_burned',
    label: 'Calories Burned',
    group: 'Activity',
    color: { light: '#dc2626', dark: '#ef4444' }
  },
  {
    key: 'exercise_minutes',
    label: 'Exercise Minutes',
    group: 'Activity',
    color: { light: '#16a34a', dark: '#4ade80' }
  },
  {
    key: 'active_energy',
    label: 'Active Energy',
    group: 'Activity',
    color: { light: '#ea580c', dark: '#fb923c' }
  },
  {
    key: 'distance',
    label: 'Distance',
    group: 'Activity',
    color: { light: '#9333ea', dark: '#c084fc' }
  },

  // Vitals & Health Metrics
  {
    key: 'resting_hr',
    label: 'Resting Heart Rate',
    group: 'Vitals',
    color: { light: '#8b5cf6', dark: '#a78bfa' }
  },
  {
    key: 'hrv_avg',
    label: 'HRV Average',
    group: 'Vitals',
    color: { light: '#ec4899', dark: '#fb7185' }
  },
  {
    key: 'body_temperature',
    label: 'Body Temperature',
    group: 'Vitals',
    color: { light: '#dc2626', dark: '#f87171' }
  },
  {
    key: 'blood_glucose',
    label: 'Blood Glucose',
    group: 'Vitals',
    color: { light: '#c2410c', dark: '#fb923c' }
  },
  {
    key: 'blood_pressure_systolic',
    label: 'Blood Pressure (Systolic)',
    group: 'Vitals',
    color: { light: '#b91c1c', dark: '#ef4444' }
  },
  {
    key: 'blood_pressure_diastolic',
    label: 'Blood Pressure (Diastolic)',
    group: 'Vitals',
    color: { light: '#991b1b', dark: '#dc2626' }
  },
  {
    key: 'oxygen_saturation',
    label: 'Oxygen Saturation',
    group: 'Vitals',
    color: { light: '#0ea5e9', dark: '#38bdf8' }
  },
  {
    key: 'respiratory_rate',
    label: 'Respiratory Rate',
    group: 'Vitals',
    color: { light: '#0284c7', dark: '#0ea5e9' }
  },

  // Wellness & Mental Health
  {
    key: 'stress_level',
    label: 'Stress Level',
    group: 'Wellness',
    color: { light: '#ef4444', dark: '#f87171' }
  },
  {
    key: 'resilience_score',
    label: 'Resilience Score',
    group: 'Wellness',
    color: { light: '#0891b2', dark: '#0ea5e9' }
  },

  // Body Composition
  {
    key: 'weight',
    label: 'Weight',
    group: 'Body Composition',
    color: { light: '#7c2d12', dark: '#f97316' }
  },
  {
    key: 'height',
    label: 'Height',
    group: 'Body Composition',
    color: { light: '#854d0e', dark: '#eab308' }
  },
  {
    key: 'lbm',
    label: 'Lean Body Mass',
    group: 'Body Composition',
    color: { light: '#166534', dark: '#22c55e' }
  },
  {
    key: 'body_fat_percentage',
    label: 'Body Fat Percentage',
    group: 'Body Composition',
    color: { light: '#a16207', dark: '#fbbf24' }
  },
  {
    key: 'basal_metabolic_rate',
    label: 'Basal Metabolic Rate',
    group: 'Body Composition',
    color: { light: '#92400e', dark: '#f59e0b' }
  },
  {
    key: 'lean_body_mass',
    label: 'Lean Body Mass (Alt)',
    group: 'Body Composition',
    color: { light: '#065f46', dark: '#10b981' }
  },

  // Sleep Details
  {
    key: 'time_in_bed',
    label: 'Time in Bed',
    group: 'Sleep',
    color: { light: '#1e3a8a', dark: '#3b82f6' }
  },
  {
    key: 'time_asleep',
    label: 'Time Asleep',
    group: 'Sleep',
    color: { light: '#1e40af', dark: '#60a5fa' }
  },
  {
    key: 'awake_in_bed',
    label: 'Awake in Bed',
    group: 'Sleep',
    color: { light: '#1d4ed8', dark: '#6366f1' }
  },
  {
    key: 'light_sleep',
    label: 'Light Sleep',
    group: 'Sleep',
    color: { light: '#2563eb', dark: '#8b5cf6' }
  },
  {
    key: 'deep_sleep',
    label: 'Deep Sleep',
    group: 'Sleep',
    color: { light: '#3730a3', dark: '#7c3aed' }
  },
  {
    key: 'rem_sleep',
    label: 'REM Sleep',
    group: 'Sleep',
    color: { light: '#581c87', dark: '#a855f7' }
  },

  // Fitness & Performance
  {
    key: 'vo2_max',
    label: 'VO2 Max',
    group: 'Fitness',
    color: { light: '#be123c', dark: '#f43f5e' }
  },
  {
    key: 'time_in_daylight',
    label: 'Time in Daylight',
    group: 'Fitness',
    color: { light: '#ca8a04', dark: '#facc15' }
  },

  // Nutrition & Hydration
  {
    key: 'hydration',
    label: 'Hydration',
    group: 'Nutrition',
    color: { light: '#0369a1', dark: '#0ea5e9' }
  },
  {
    key: 'nutrition_calories',
    label: 'Nutrition Calories',
    group: 'Nutrition',
    color: { light: '#c2410c', dark: '#f97316' }
  },

  // Women's Health
  {
    key: 'menstruation_flow',
    label: 'Menstruation Flow',
    group: 'Women\'s Health',
    color: { light: '#be185d', dark: '#ec4899' }
  }
]

// Metric presets for quick selection
const METRIC_PRESETS = {
  vitals: ['resting_hr', 'hrv_avg', 'body_temperature', 'blood_pressure_systolic', 'oxygen_saturation'],
  activity: ['activity_score', 'total_steps', 'calories_burned', 'exercise_minutes', 'active_energy', 'distance'],
  recovery: ['sleep_score', 'readiness_score', 'recovery_score'],
  wellness: ['stress_level', 'resilience_score'],
  sleep: ['time_in_bed', 'time_asleep', 'light_sleep', 'deep_sleep', 'rem_sleep'],
  body: ['weight', 'body_fat_percentage', 'lbm', 'basal_metabolic_rate'],
  blood: ['blood_glucose', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
  fitness: ['vo2_max', 'time_in_daylight'],
  nutrition: ['hydration', 'nutrition_calories'],
  all: AVAILABLE_METRICS.map(m => m.key)
}


// MetricSelector Component
interface MetricSelectorProps {
  selectedMetrics: string[]
  onSelectionChange: (metrics: string[]) => void
  isDarkMode: boolean
}

function MetricSelector({ selectedMetrics, onSelectionChange, isDarkMode }: MetricSelectorProps) {
  const [open, setOpen] = useState(false)

  const toggleMetric = (metricKey: string) => {
    console.log('toggleMetric called with:', metricKey)
    console.log('selectedMetrics before toggle:', selectedMetrics)
    const newSelection = selectedMetrics.includes(metricKey)
      ? selectedMetrics.filter(m => m !== metricKey)
      : [...selectedMetrics, metricKey]
    console.log('newSelection:', newSelection)
    onSelectionChange(newSelection)
  }

  const applyPreset = (presetKey: keyof typeof METRIC_PRESETS) => {
    onSelectionChange(METRIC_PRESETS[presetKey])
  }

  const groupedMetrics = AVAILABLE_METRICS.reduce((acc, metric) => {
    if (!acc[metric.group]) acc[metric.group] = []
    acc[metric.group].push(metric)
    return acc
  }, {} as Record<string, MetricDefinition[]>)

  return (
    <div className="space-y-3">
      {/* Info text */}
      <p className="text-xs text-muted-foreground italic">
        Some metrics may not have data depending on your connected integrations
      </p>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('vitals')}
          className="h-7 px-2 text-xs"
        >
          Vitals
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('activity')}
          className="h-7 px-2 text-xs"
        >
          Activity
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('recovery')}
          className="h-7 px-2 text-xs"
        >
          Recovery
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('wellness')}
          className="h-7 px-2 text-xs"
        >
          Wellness
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('sleep')}
          className="h-7 px-2 text-xs"
        >
          Sleep
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('body')}
          className="h-7 px-2 text-xs"
        >
          Body
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('blood')}
          className="h-7 px-2 text-xs"
        >
          Blood
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('fitness')}
          className="h-7 px-2 text-xs"
        >
          Fitness
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('nutrition')}
          className="h-7 px-2 text-xs"
        >
          Nutrition
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyPreset('all')}
          className="h-7 px-2 text-xs"
        >
          All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onSelectionChange([])}
          className="h-7 px-2 text-xs"
        >
          None
        </Button>
      </div>

      {/* Multi-select Dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">
              {selectedMetrics.length === 0
                ? "Select metrics..."
                : `${selectedMetrics.length} metric${selectedMetrics.length !== 1 ? 's' : ''} selected`
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search metrics..." />
            <CommandEmpty>No metrics found.</CommandEmpty>
            <CommandList>
              {Object.entries(groupedMetrics).map(([group, metrics]) => (
                <CommandGroup key={group} heading={group}>
                  {metrics.map((metric) => (
                    <CommandItem
                      key={metric.key}
                      onSelect={() => toggleMetric(metric.key)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <div className="flex items-center space-x-2 flex-1">
                          <div
                            className="w-3 h-3 rounded-sm"
                            style={{ backgroundColor: isDarkMode ? metric.color.dark : metric.color.light }}
                          />
                          <span>{metric.label}</span>
                        </div>
                        <Check
                          className={`h-4 w-4 ${selectedMetrics.includes(metric.key) ? "opacity-100" : "opacity-0"}`}
                        />
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Metrics Display */}
      {selectedMetrics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedMetrics.map(metricKey => {
            const metric = AVAILABLE_METRICS.find(m => m.key === metricKey)
            if (!metric) return null
            return (
              <Badge
                key={metricKey}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                <div
                  className="w-2 h-2 rounded-sm"
                  style={{ backgroundColor: isDarkMode ? metric.color.dark : metric.color.light }}
                />
                {metric.label}
                <button
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-sm"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    console.log('X button clicked for metric:', metricKey)
                    console.log('Current selectedMetrics:', selectedMetrics)
                    toggleMetric(metricKey)
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// TrendChart Component
interface TrendChartProps {
  chart: ChartInstance
  chartData: any[]
  isDarkMode: boolean
  onUpdateChart: (chartId: string, updates: Partial<ChartInstance>) => void
  onRemoveChart: (chartId: string) => void
  canRemove: boolean
  getMetricColor: (metricKey: string, isDark: boolean) => string
}

function TrendChart({
  chart,
  chartData,
  isDarkMode,
  onUpdateChart,
  onRemoveChart,
  canRemove,
  getMetricColor
}: TrendChartProps) {
  const [isEditingName, setIsEditingName] = useState(false)
  const [tempName, setTempName] = useState(chart.name)

  const handleNameSave = () => {
    onUpdateChart(chart.id, { name: tempName })
    setIsEditingName(false)
  }

  const handleNameCancel = () => {
    setTempName(chart.name)
    setIsEditingName(false)
  }

  return (
    <Card className="pb-2">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="h-8 text-lg font-semibold"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSave()
                    if (e.key === 'Escape') handleNameCancel()
                  }}
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={handleNameSave}
                  className="h-8"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNameCancel}
                  className="h-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <CardTitle className="text-lg">{chart.name}</CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingName(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateChart(chart.id, { isExpanded: !chart.isExpanded })}
              className="h-8 px-2"
            >
              {chart.isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
            {canRemove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveChart(chart.id)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <CardDescription className="text-sm">
          {chart.selectedMetrics.length > 0
            ? `Showing ${chart.selectedMetrics.length} metric${chart.selectedMetrics.length !== 1 ? 's' : ''}`
            : 'No metrics selected'
          }
        </CardDescription>

        {chart.isExpanded && (
          <div className="space-y-3 mt-4">
            <MetricSelector
              selectedMetrics={chart.selectedMetrics}
              onSelectionChange={(metrics) => onUpdateChart(chart.id, { selectedMetrics: metrics })}
              isDarkMode={isDarkMode}
            />
          </div>
        )}
      </CardHeader>

      {chart.isExpanded && (
        <CardContent className="pt-0">
          <div className="h-[400px] w-full">
            {chartData.length > 0 && chart.selectedMetrics.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  {chart.selectedMetrics.map((metricKey) => {
                    const metric = AVAILABLE_METRICS.find(m => m.key === metricKey)
                    if (!metric) return null

                    return (
                      <Line
                        key={metricKey}
                        type="monotone"
                        dataKey={metricKey}
                        stroke={getMetricColor(metricKey, isDarkMode)}
                        strokeWidth={2}
                        name={metric.label}
                        connectNulls={false}
                      />
                    )
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">
                  {chart.selectedMetrics.length === 0
                    ? "Select metrics to display trends"
                    : "No data available for selected metrics"
                  }
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

export default function WellnessPage() {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [healthData, setHealthData] = useState<HealthMetric[]>([])
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const [advancedExpanded, setAdvancedExpanded] = useState(false)
  const [manualEntryDate, setManualEntryDate] = useState<Date>()
  const [manualEntryValues, setManualEntryValues] = useState<Record<string, string>>({})
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [filterPrefs, setFilterPrefs] = useState<FilterPrefs>({
    timeRange: '30',
    showResources: true,
    sortBy: 'date',
    showSummaryStats: true,
    showSleepCard: true,
    showActivityCard: true,
    showStepsCard: true,
    showReadinessCard: true,
    showAvgStepsCard: true,
    showAvgStressCard: true,
    showAvgHeartRateCard: true,
    showAvgHrvCard: true,
    // Default trend chart instance
    trendCharts: [{
      id: '1',
      name: 'Overall Trends',
      selectedMetrics: ['sleep_score', 'activity_score', 'readiness_score', 'stress_level'],
      isExpanded: true
    }]
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
        const parsedPrefs = JSON.parse(saved)
        // Ensure trendCharts exists for backward compatibility
        if (!parsedPrefs.trendCharts) {
          parsedPrefs.trendCharts = [{
            id: '1',
            name: 'Overall Trends',
            selectedMetrics: ['sleep_score', 'activity_score', 'readiness_score', 'stress_level'],
            isExpanded: true
          }]
        }
        setFilterPrefs(parsedPrefs)
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

        // Fetch health metrics data (including current day)
        const daysBack = parseInt(filterPrefs.timeRange)
        const today = new Date().toISOString().split('T')[0]
        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        console.log('Date debugging:')
        console.log('Current time:', new Date().toISOString())
        console.log('Today (upper bound):', today)
        console.log('Start date (lower bound):', startDate)
        console.log('Days back:', daysBack)

        const { data: metricsData, error: metricsError } = await supabase
          .from('health_metrics_daily')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', today)
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

  // Chart instance management functions
  const addTrendChart = () => {
    const newChart: ChartInstance = {
      id: Date.now().toString(),
      name: `Trend Chart ${filterPrefs.trendCharts.length + 1}`,
      selectedMetrics: ['sleep_score', 'activity_score'],
      isExpanded: true
    }
    setFilterPrefs(prev => ({
      ...prev,
      trendCharts: [...prev.trendCharts, newChart]
    }))
  }

  const removeTrendChart = (chartId: string) => {
    if (filterPrefs.trendCharts.length <= 1) return // Keep at least one chart
    setFilterPrefs(prev => ({
      ...prev,
      trendCharts: prev.trendCharts.filter(chart => chart.id !== chartId)
    }))
  }

  const updateTrendChart = (chartId: string, updates: Partial<ChartInstance>) => {
    console.log('updateTrendChart called with chartId:', chartId, 'updates:', updates)
    setFilterPrefs(prev => {
      const newPrefs = {
        ...prev,
        trendCharts: prev.trendCharts.map(chart =>
          chart.id === chartId ? { ...chart, ...updates } : chart
        )
      }
      console.log('New filterPrefs after update:', newPrefs)
      return newPrefs
    })
  }

  const getMetricColor = (metricKey: string, isDark: boolean) => {
    const metric = AVAILABLE_METRICS.find(m => m.key === metricKey)
    return metric ? (isDark ? metric.color.dark : metric.color.light) : '#999'
  }

  // Available metrics for manual entry
  const availableMetrics = [
    { value: 'sleep_score', label: 'Sleep Score (0-100)' },
    { value: 'activity_score', label: 'Activity Score (0-100)' },
    { value: 'readiness_score', label: 'Readiness Score (0-100)' },
    { value: 'stress_level', label: 'Stress Level (0-100)' },
    { value: 'recovery_score', label: 'Recovery Score (0-100)' },
    { value: 'total_steps', label: 'Total Steps' },
    { value: 'calories_burned', label: 'Calories Burned' },
    { value: 'resting_hr', label: 'Resting Heart Rate (bpm)' },
    { value: 'hrv_avg', label: 'HRV Average (ms)' },
    { value: 'resilience_score', label: 'Resilience Score (0-100)' }
  ]

  const handleManualEntry = async () => {
    if (!user || !manualEntryDate) {
      alert('Please select a date')
      return
    }

    // Get only non-empty values
    const validEntries = Object.entries(manualEntryValues).filter(([_, value]) => value.trim() !== '')
    
    if (validEntries.length === 0) {
      alert('Please enter at least one metric value')
      return
    }

    // Validate all values are numbers
    const parsedEntries: Record<string, number> = {}
    for (const [metric, value] of validEntries) {
      const numValue = parseFloat(value)
      if (isNaN(numValue)) {
        alert(`Please enter a valid number for ${availableMetrics.find(m => m.value === metric)?.label}`)
        return
      }
      parsedEntries[metric] = numValue
    }

    setIsSaving(true)
    try {
      const supabase = createClient()
      const dateStr = format(manualEntryDate, 'yyyy-MM-dd')
      
      // Check if record exists for this date
      const { data: existingRecord } = await supabase
        .from('health_metrics_daily')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle()

      if (existingRecord) {
        // Update existing record with new values
        const { error } = await supabase
          .from('health_metrics_daily')
          .update({ 
            ...parsedEntries,
            updated_at: new Date().toISOString(),
            // Initialize other required fields if they don't exist
            native_scores: existingRecord.native_scores || {},
            normalized_scores: existingRecord.normalized_scores || {}
          })
          .eq('user_id', user.id)
          .eq('date', dateStr)
        
        if (error) throw error
      } else {
        // Create new record with all required fields
        const { error } = await supabase
          .from('health_metrics_daily')
          .insert({
            user_id: user.id,
            date: dateStr,
            ...parsedEntries,
            native_scores: {},
            normalized_scores: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (error) throw error
      }
      
      // Clear the form
      setManualEntryDate(undefined)
      setManualEntryValues({})
      
      // Reload data to reflect changes
      window.location.reload()
    } catch (error) {
      console.error('Error saving manual entry:', error)
      alert('Failed to save entry. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }


  // Calculate summary stats
  const summaryStats = healthData.length > 0 ? {
    avgSleepScore: Math.round(healthData.reduce((sum, d) => sum + (d.sleep_score || 0), 0) / healthData.length),
    avgActivityScore: Math.round(healthData.reduce((sum, d) => sum + (d.activity_score || 0), 0) / healthData.length),
    avgResilienceScore: Math.round(healthData.reduce((sum, d) => sum + (d.resilience_score || 0), 0) / Math.max(healthData.filter(d => d.resilience_score && d.resilience_score > 0).length, 1)),
    avgReadiness: Math.round(healthData.reduce((sum, d) => sum + (d.readiness_score || 0), 0) / Math.max(healthData.filter(d => d.readiness_score && d.readiness_score > 0).length, 1)),
    avgSteps: Math.round(healthData.reduce((sum, d) => sum + (d.total_steps || 0), 0) / Math.max(healthData.filter(d => d.total_steps && d.total_steps > 0).length, 1)),
    avgStressLevel: Math.round(healthData.reduce((sum, d) => sum + (d.stress_level || 0), 0) / Math.max(healthData.filter(d => d.stress_level && d.stress_level > 0).length, 1)),
    avgRestingHr: Math.round(healthData.reduce((sum, d) => sum + (d.resting_hr || 0), 0) / Math.max(healthData.filter(d => d.resting_hr && d.resting_hr > 0).length, 1)),
    avgHrv: Math.round(healthData.reduce((sum, d) => sum + (d.hrv_avg || 0), 0) / Math.max(healthData.filter(d => d.hrv_avg && d.hrv_avg > 0).length, 1))
  } : null

  // Prepare chart data - ensure it updates when healthData changes
  const chartData = React.useMemo(() => {
    const data = healthData.map(d => ({
      date: new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      // Recovery & Sleep scores
      sleep_score: (d.sleep_score && d.sleep_score > 0) ? d.sleep_score : null,
      readiness_score: (d.readiness_score && d.readiness_score > 0) ? d.readiness_score : null,
      recovery_score: (d.recovery_score && d.recovery_score > 0) ? d.recovery_score : null,

      // Activity metrics
      activity_score: (d.activity_score && d.activity_score > 0) ? d.activity_score : null,
      total_steps: (d.total_steps && d.total_steps > 0) ? d.total_steps : null,
      calories_burned: (d.calories_burned && d.calories_burned > 0) ? d.calories_burned : null,
      exercise_minutes: (d.exercise_minutes && d.exercise_minutes > 0) ? d.exercise_minutes : null,
      active_energy: (d.active_energy && d.active_energy > 0) ? d.active_energy : null,
      distance: (d.distance && d.distance > 0) ? d.distance : null,

      // Vitals
      resting_hr: (d.resting_hr && d.resting_hr > 0) ? d.resting_hr : null,
      hrv_avg: (d.hrv_avg && d.hrv_avg > 0) ? d.hrv_avg : null,
      body_temperature: (d.body_temperature && d.body_temperature > 0) ? d.body_temperature : null,
      blood_glucose: (d.blood_glucose && d.blood_glucose > 0) ? d.blood_glucose : null,
      blood_pressure_systolic: (d.blood_pressure_systolic && d.blood_pressure_systolic > 0) ? d.blood_pressure_systolic : null,
      blood_pressure_diastolic: (d.blood_pressure_diastolic && d.blood_pressure_diastolic > 0) ? d.blood_pressure_diastolic : null,
      oxygen_saturation: (d.oxygen_saturation && d.oxygen_saturation > 0) ? d.oxygen_saturation : null,
      respiratory_rate: (d.respiratory_rate && d.respiratory_rate > 0) ? d.respiratory_rate : null,

      // Wellness
      stress_level: (d.stress_level && d.stress_level > 0) ? d.stress_level : null,
      resilience_score: (d.resilience_score && d.resilience_score > 0) ? d.resilience_score : null,

      // Body composition
      weight: (d.weight && d.weight > 0) ? d.weight : null,
      height: (d.height && d.height > 0) ? d.height : null,
      lbm: (d.lbm && d.lbm > 0) ? d.lbm : null,
      body_fat_percentage: (d.body_fat_percentage && d.body_fat_percentage > 0) ? d.body_fat_percentage : null,
      basal_metabolic_rate: (d.basal_metabolic_rate && d.basal_metabolic_rate > 0) ? d.basal_metabolic_rate : null,
      lean_body_mass: (d.lean_body_mass && d.lean_body_mass > 0) ? d.lean_body_mass : null,

      // Sleep details
      time_in_bed: (d.time_in_bed && d.time_in_bed > 0) ? d.time_in_bed : null,
      time_asleep: (d.time_asleep && d.time_asleep > 0) ? d.time_asleep : null,
      awake_in_bed: (d.awake_in_bed && d.awake_in_bed > 0) ? d.awake_in_bed : null,
      light_sleep: (d.light_sleep && d.light_sleep > 0) ? d.light_sleep : null,
      deep_sleep: (d.deep_sleep && d.deep_sleep > 0) ? d.deep_sleep : null,
      rem_sleep: (d.rem_sleep && d.rem_sleep > 0) ? d.rem_sleep : null,

      // Fitness
      vo2_max: (d.vo2_max && d.vo2_max > 0) ? d.vo2_max : null,
      time_in_daylight: (d.time_in_daylight && d.time_in_daylight > 0) ? d.time_in_daylight : null,

      // Nutrition
      hydration: (d.hydration && d.hydration > 0) ? d.hydration : null,
      nutrition_calories: (d.nutrition_calories && d.nutrition_calories > 0) ? d.nutrition_calories : null,

      // Women's health
      menstruation_flow: (d.menstruation_flow && d.menstruation_flow > 0) ? d.menstruation_flow : null
    }))

    console.log('Chart data prepared:', data.length, 'points for timeRange:', filterPrefs.timeRange)
    console.log('Chart dates:', data.map(d => d.date))
    console.log('Health data dates:', healthData.map(d => d.date))

    return data
  }, [healthData, filterPrefs.timeRange])


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
                <SelectItem value="sleep_score">Sleep</SelectItem>
                <SelectItem value="activity_score">Activity Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Expandable toggle groups */}
        {settingsExpanded && (
          <div className="space-y-4 pt-4 border-t">
            {/* Advanced Section */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Manual Data Entry
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setAdvancedExpanded(!advancedExpanded)}
                  className="h-7 px-2 text-xs"
                >
                  {advancedExpanded ? (
                    <>
                      <ChevronUp className="h-3 w-3 mr-1" />
                      Hide
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3 w-3 mr-1" />
                      Advanced
                    </>
                  )}
                </Button>
              </div>
              
              {advancedExpanded && (
                <div className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Manually add health metric values for specific dates
                  </p>
                  
                  <div className="space-y-4">
                    {/* Date Picker */}
                    <div className="space-y-2">
                      <Label className="text-xs">Date</Label>
                      <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full h-8 justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-3 w-3" />
                            {manualEntryDate ? format(manualEntryDate, "MMM d, yyyy") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={manualEntryDate}
                            onSelect={(date) => {
                              setManualEntryDate(date)
                              setIsDatePickerOpen(false)
                            }}
                            disabled={(date) => date > new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {availableMetrics.map((metric) => (
                        <div key={metric.value} className="space-y-2">
                          <Label className="text-xs">{metric.label}</Label>
                          <Input
                            type="number"
                            placeholder="Enter value"
                            value={manualEntryValues[metric.value] || ''}
                            onChange={(e) => setManualEntryValues(prev => ({
                              ...prev,
                              [metric.value]: e.target.value
                            }))}
                            className="h-8"
                            step="0.01"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button
                        onClick={handleManualEntry}
                        disabled={isSaving || !manualEntryDate || Object.values(manualEntryValues).every(v => !v.trim())}
                        className="h-8"
                        size="sm"
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary-foreground mr-2" />
                        ) : (
                          <Save className="h-3 w-3 mr-2" />
                        )}
                        Save All Metrics
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Medical Records Upload */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Medical Records
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload medical documents for Juniper to analyze and reference in health conversations
                </p>
              </div>
              <MedicalRecordsUpload />
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
                  <Label htmlFor="show-avg-steps-card" className="text-xs">Steps</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-avg-stress-card"
                    checked={filterPrefs.showAvgStressCard}
                    onCheckedChange={(checked) => updateFilterPref('showAvgStressCard', checked)}
                  />
                  <Label htmlFor="show-avg-stress-card" className="text-xs">Stress</Label>
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
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    Sleep
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Your sleep quality score based on duration, efficiency, and sleep stages. Higher scores indicate better sleep quality and recovery.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
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
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    Activity Score
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Your daily activity level based on movement, exercise intensity, and calories burned. Higher scores indicate more active days.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
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
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    Resilience
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Your body's ability to handle stress and recover from challenges. Higher scores indicate better stress management and adaptability.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.resilience_score && d.resilience_score > 0) ? summaryStats.avgResilienceScore : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">/100</p>
                </CardContent>
              </Card>
            )}
                      {/* {filterPrefs.showReadinessCard && (
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
            )} */}
                      {filterPrefs.showAvgStepsCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    Steps
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Your average daily step count from your wearable device. Most health guidelines recommend 8,000-10,000 steps per day.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
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
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    Stress
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Your stress level based on heart rate variability and other physiological markers. Lower values indicate less stress.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
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
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    Resting HR
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Your resting heart rate measured during sleep or rest periods. Lower values typically indicate better cardiovascular fitness.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
                  <Heart className="h-3 w-3 text-muted-foreground" />
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="text-lg font-bold">
                    {healthData.some(d => d.resting_hr && d.resting_hr > 0) ? summaryStats.avgRestingHr : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">bpm</p>
                </CardContent>
              </Card>
            )}
                      {filterPrefs.showAvgHrvCard && (
              <Card className="p-3">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                  <CardTitle className="text-xs font-medium flex items-center gap-1">
                    HRV
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-xs">
                          Heart Rate Variability measures the variation in time between heartbeats. Higher values typically indicate better recovery and stress resilience.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </CardTitle>
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
      {/* Trend Charts Section */}
      <div className="space-y-4">
        {/* Add Chart Button */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Trend Charts</h2>
          <Button
            onClick={addTrendChart}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Trend Chart
          </Button>
        </div>

        {/* Render all trend chart instances */}
        {filterPrefs.trendCharts.map((chart) => (
          <TrendChart
            key={chart.id}
            chart={chart}
            chartData={chartData}
            isDarkMode={isDarkMode}
            onUpdateChart={updateTrendChart}
            onRemoveChart={removeTrendChart}
            canRemove={filterPrefs.trendCharts.length > 1}
            getMetricColor={getMetricColor}
          />
        ))}
      </div>


      {/* No Data Message - Show when no health data */}
      {healthData.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium text-foreground mb-2">Connect a service to see health metrics</h3>
            <p className="text-muted-foreground mb-4">
              Connect your wearable devices to start tracking your wellness metrics.
            </p>
            <Button asChild>
              <a href="/integrations">Connect Devices</a>
            </Button>
          </CardContent>
        </Card>
      )}

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
                        <span className="font-medium"></span> Add tag "Health and Wellness" to a resource for it to appear here.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
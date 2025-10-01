'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { createClient } from '@/lib/utils/supabase/client'
import { Tags, Activity, Heart, Moon, TrendingUp, BarChart3, ChevronDown, ChevronUp, Info, CalendarIcon, Save, Plus, X, Check, ChevronsUpDown, Search, Edit2, FileText, Minimize2 } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { WellnessDataExport } from '@/components/WellnessDataExport'
import { UserWellnessForm } from '@/components/UserWellnessForm'

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
  timeRange: string
  isNormalized: boolean
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
  showResources: boolean
  sortBy: string
  showSummaryStats: boolean
  selectedSummaryCards: string[]
  summaryTimeRange: string
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
    label: 'Lean Body Mass',
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
  body: ['weight', 'body_fat_percentage', 'lean_body_mass', 'basal_metabolic_rate'],
  blood: ['blood_glucose', 'blood_pressure_systolic', 'blood_pressure_diastolic'],
  fitness: ['vo2_max', 'time_in_daylight'],
  nutrition: ['hydration', 'nutrition_calories'],
  all: AVAILABLE_METRICS.map(m => m.key)
}

// Integration support data
const INTEGRATION_SUPPORT = {
  'oura': {
    name: 'Oura Ring',
    metrics: {
      // Metrics Supported by ALL Integrations
      'sleep_score': { support: 'native', note: 'Overall sleep quality score (0-100)' },
      'activity_score': { support: 'native', note: 'Daily activity performance score (0-100)' },
      'readiness_score': { support: 'native', note: 'Body\'s readiness for physical activity (0-100)' },
      'total_steps': { support: 'full', note: 'Total steps taken during the day' },
      'calories_burned': { support: 'full', note: 'Total calories burned' },
      'resting_hr': { support: 'full', note: 'Resting heart rate (bpm)' },

      // Most Integrations
      'hrv_avg': { support: 'full', note: 'Average heart rate variability (ms)' },
      'stress_level': { support: 'native', note: 'Daytime stress feature (Gen 3+)' },

      // Variable Support
      'recovery_score': { support: 'native', note: 'Native Recovery Index as part of Readiness contributors' },
      'resilience_score': { support: 'native', note: 'Resilience feature for long-term stress adaptation' },

      // Not supported
      'weight': { support: 'manual', note: 'Manual entry only - no automatic tracking' },
      'height': { support: 'manual', note: 'Manual entry only - stored in profile' }
    }
  },
  'apple': {
    name: 'Apple Health | Apple Watch',
    metrics: {
      // Metrics Supported by ALL Integrations
      'sleep_score': { support: 'full', note: 'Overall sleep quality score (0-100)' },
      'activity_score': { support: 'full', note: 'Daily activity performance score (0-100)' },
      'readiness_score': { support: 'full', note: 'Body\'s readiness for physical activity (0-100)' },
      'total_steps': { support: 'full', note: 'Total steps taken during the day' },
      'calories_burned': { support: 'full', note: 'Total calories burned' },
      'resting_hr': { support: 'full', note: 'Resting heart rate (bpm)' },

      // Most Integrations
      'hrv_avg': { support: 'full', note: 'Average heart rate variability (ms)' },
      'weight': { support: 'full', note: 'Body weight measurement' },
      'height': { support: 'full', note: 'Height measurement' },
      'stress_level': { support: 'indirect', note: 'Derived from HRV and mindfulness minutes' },

      // Variable Support
      'recovery_score': { support: 'derived', note: 'Calculated from HRV trends and activity patterns' },
      'resilience_score': { support: 'derived', note: 'Calculated from HRV baseline and trends' }
    }
  },
  'google': {
    name: 'Google Health Connect | Pixel Watch',
    metrics: {
      // Metrics Supported by ALL Integrations
      'sleep_score': { support: 'full', note: 'Overall sleep quality score (0-100)' },
      'activity_score': { support: 'full', note: 'Daily activity performance score (0-100)' },
      'readiness_score': { support: 'full', note: 'Body\'s readiness for physical activity (0-100)' },
      'total_steps': { support: 'full', note: 'Total steps taken during the day' },
      'calories_burned': { support: 'full', note: 'Total calories burned' },
      'resting_hr': { support: 'full', note: 'Resting heart rate (bpm)' },

      // Most Integrations
      'hrv_avg': { support: 'full', note: 'Average heart rate variability (ms)' },
      'weight': { support: 'full', note: 'Body weight measurement' },
      'height': { support: 'full', note: 'Height measurement' },
      'stress_level': { support: 'full', note: 'Stress tracking from Pixel Watch' },

      // Variable Support
      'recovery_score': { support: 'derived', note: 'Derived from recovery metrics' },
      'resilience_score': { support: 'derived', note: 'Derived from stress and recovery patterns' }
    }
  },
  'fitbit': {
    name: 'Fitbit',
    metrics: {
      // Metrics Supported by ALL Integrations
      'sleep_score': { support: 'full', note: 'Overall sleep quality score (0-100)' },
      'activity_score': { support: 'full', note: 'Daily activity performance score (0-100)' },
      'readiness_score': { support: 'full', note: 'Body\'s readiness for physical activity (0-100)' },
      'total_steps': { support: 'full', note: 'Total steps taken during the day' },
      'calories_burned': { support: 'full', note: 'Total calories burned' },
      'resting_hr': { support: 'full', note: 'Resting heart rate (bpm)' },

      // Most Integrations
      // 'hrv_avg': { support: 'premium', note: 'Requires Premium subscription for HRV data' },
      'weight': { support: 'full', note: 'Body weight measurement with smart scales' },
      'height': { support: 'full', note: 'Height measurement' },
      // 'stress_level': { support: 'premium', note: 'Stress Management Score (Premium feature)' },
    }
  }
}

// Unified MetricsSelector Component
interface MetricsSelectorProps {
  selectedMetrics: string[]
  onSelectionChange: (metrics: string[]) => void
  isDarkMode?: boolean
  mode: 'manual-entry' | 'summary-cards' | 'trends'
  className?: string
  onShowIntegrationSupport?: () => void
}

function MetricsSelector({ selectedMetrics, onSelectionChange, isDarkMode, mode, className, onShowIntegrationSupport }: MetricsSelectorProps) {
  const [open, setOpen] = useState(false)
  const metrics = selectedMetrics || []

  const toggleMetric = (metricKey: string) => {
    const newSelection = metrics.includes(metricKey)
      ? metrics.filter(m => m !== metricKey)
      : [...metrics, metricKey]
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

  // Get appropriate data source and labels based on mode
  const getDisplayText = () => {
    switch (mode) {
      case 'manual-entry':
        return {
          infoText: 'Select which metrics to manually enter',
          placeholder: 'Select metrics...',
          searchPlaceholder: 'Search metrics...',
          emptyText: 'No metrics found.',
          buttonText: `${metrics.length} metric${metrics.length !== 1 ? 's' : ''} selected`
        }
      case 'summary-cards':
        return {
          // infoText: 'Select which summary cards to display',
          placeholder: 'Select cards...',
          searchPlaceholder: 'Search cards...',
          emptyText: 'No cards found.',
          buttonText: `${metrics.length} card${metrics.length !== 1 ? 's' : ''} selected`
        }
      case 'trends':
        return {
          infoText: 'See supported metrics by integration',
          placeholder: 'Select metrics...',
          searchPlaceholder: 'Search metrics...',
          emptyText: 'No metrics found.',
          buttonText: `${metrics.length} metric${metrics.length !== 1 ? 's' : ''} selected`
        }
      default:
        return {
          infoText: 'Select metrics',
          placeholder: 'Select metrics...',
          searchPlaceholder: 'Search metrics...',
          emptyText: 'No metrics found.',
          buttonText: `${metrics.length} selected`
        }
    }
  }

  const displayText = getDisplayText()

  return (
    <div className={cn("space-y-3", className)}>
      {/* Info text */}
      {mode === 'trends' && onShowIntegrationSupport ? (
        <button
          onClick={onShowIntegrationSupport}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 italic underline cursor-pointer"
        >
          {displayText.infoText}
        </button>
      ) : (
        <p className="text-xs text-muted-foreground italic">
          {displayText.infoText}
        </p>
      )}

      {/* Preset Buttons - show for all modes */}
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
              {metrics.length === 0
                ? displayText.placeholder
                : displayText.buttonText
              }
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder={displayText.searchPlaceholder} />
            <CommandEmpty>{displayText.emptyText}</CommandEmpty>
            <CommandList>
              {Object.entries(groupedMetrics).map(([group, groupMetrics]) => (
                <CommandGroup key={group} heading={group}>
                  {groupMetrics.map((metric) => (
                    <CommandItem
                      key={metric.key}
                      onSelect={() => toggleMetric(metric.key)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center space-x-2 w-full">
                        <div className="flex items-center space-x-2 flex-1">
                          {isDarkMode !== undefined && (
                            <div
                              className="w-3 h-3 rounded-sm"
                              style={{ backgroundColor: isDarkMode ? metric.color.dark : metric.color.light }}
                            />
                          )}
                          <span>{metric.label}</span>
                        </div>
                        <Check
                          className={`h-4 w-4 ${metrics.includes(metric.key) ? "opacity-100" : "opacity-0"}`}
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

      {/* Selected Metrics Display - for trends mode */}
      {mode === 'trends' && metrics.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metrics.map(metricKey => {
            const metric = AVAILABLE_METRICS.find(m => m.key === metricKey)
            if (!metric) return null
            return (
              <Badge
                key={metricKey}
                variant="secondary"
                className="text-xs flex items-center gap-1"
              >
                {isDarkMode !== undefined && (
                  <div
                    className="w-2 h-2 rounded-sm"
                    style={{ backgroundColor: isDarkMode ? metric.color.dark : metric.color.light }}
                  />
                )}
                {metric.label}
                <button
                  onClick={() => toggleMetric(metricKey)}
                  className="ml-1 hover:bg-secondary-foreground/20 rounded-sm p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}

// Legacy alias for backward compatibility
interface MetricSelectorProps {
  selectedMetrics: string[]
  onSelectionChange: (metrics: string[]) => void
  isDarkMode: boolean
  onShowIntegrationSupport?: () => void
}

function MetricSelector({ selectedMetrics, onSelectionChange, isDarkMode, onShowIntegrationSupport }: MetricSelectorProps) {
  return (
    <MetricsSelector
      selectedMetrics={selectedMetrics}
      onSelectionChange={onSelectionChange}
      isDarkMode={isDarkMode}
      mode="trends"
      onShowIntegrationSupport={onShowIntegrationSupport}
    />
  )
}

// Integration Support Modal Component
interface IntegrationSupportModalProps {
  isOpen: boolean
  onClose: () => void
}

function IntegrationSupportModal({ isOpen, onClose }: IntegrationSupportModalProps) {
  if (!isOpen) return null

  const getSupportIcon = (support: string) => {
    switch (support) {
      case 'native':
        return <Check className="h-4 w-4 text-green-600" />
      case 'full':
        return <Check className="h-4 w-4 text-green-600" />
      case 'derived':
        return <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center">
          <div className="h-2 w-2 rounded-full bg-white" />
        </div>
      case 'premium':
        return <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">P</div>
      case 'indirect':
        return <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
          <div className="h-1 w-3 bg-white rounded" />
        </div>
      case 'manual':
        return <X className="h-4 w-4 text-gray-500" />
      default:
        return <X className="h-4 w-4 text-gray-400" />
    }
  }

  const getSupportLabel = (support: string) => {
    switch (support) {
      case 'native': return 'Native'
      case 'full': return 'Full Support'
      case 'derived': return 'Derived'
      case 'premium': return 'Premium'
      case 'indirect': return 'Indirect'
      case 'manual': return 'Manual Only'
      default: return 'Not Supported'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Supported Metrics by Integration</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Legend */}
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-medium mb-3">Legend:</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-green-600" />
                <span>Full Support / Native</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-yellow-500 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
                <span>Derived/Calculated</span>
              </div>
              {/* <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs">P</div>
                <span>Premium Required</span>
              </div> */}
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center">
                  <div className="h-1 w-3 bg-white rounded" />
                </div>
                <span>Indirect Measurement</span>
              </div>
              <div className="flex items-center gap-2">
                <X className="h-4 w-4 text-gray-500" />
                <span>Manual Entry Only</span>
              </div>
            </div>
          </div>

          {/* Integration Support Tables */}
          {Object.entries(INTEGRATION_SUPPORT).map(([key, integration]) => (
            <div key={key} className="mb-8">
              <h3 className="text-lg font-semibold mb-4">{integration.name}</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-border rounded-lg">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left p-3 border-b border-border">Metric</th>
                      <th className="text-left p-3 border-b border-border">Support</th>
                      <th className="text-left p-3 border-b border-border">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(integration.metrics).map(([metricKey, metricInfo]) => {
                      const metricConfig = AVAILABLE_METRICS.find(m => m.key === metricKey)
                      return (
                        <tr key={metricKey} className="border-b border-border/50">
                          <td className="p-3 font-medium">
                            {metricConfig?.label || metricKey}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {getSupportIcon(metricInfo.support)}
                              <span className="text-sm">{getSupportLabel(metricInfo.support)}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {metricInfo.note}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Normalization function for chart data
const normalizeChartData = (data: any[], metrics: string[]) => {
  if (data.length === 0 || metrics.length === 0) return { normalizedData: data, originalRanges: {} }

  // Calculate min/max for each metric
  const ranges = metrics.reduce((acc, metric) => {
    const values = data.map(d => d[metric]).filter(v => v != null && !isNaN(v))
    if (values.length > 0) {
      acc[metric] = {
        min: Math.min(...values),
        max: Math.max(...values)
      }
    }
    return acc
  }, {} as Record<string, { min: number; max: number }>)

  // Normalize data
  const normalizedData = data.map(row => {
    const normalized = { ...row }
    metrics.forEach(metric => {
      if (row[metric] != null && !isNaN(row[metric]) && ranges[metric]) {
        const { min, max } = ranges[metric]
        if (max !== min) {
          normalized[metric] = ((row[metric] - min) / (max - min)) * 100
        } else {
          normalized[metric] = 50 // If all values are the same, normalize to middle
        }
      }
    })
    return normalized
  })

  return { normalizedData, originalRanges: ranges }
}

// Custom tooltip component for normalized charts
const CustomTooltip = ({ active, payload, label, isNormalized, originalData }: any) => {
  if (!active || !payload || !payload.length) {
    return null
  }

  return (
    <div className="bg-background border border-border rounded-lg shadow-lg p-3">
      <p className="font-medium mb-2">{label}</p>
      {payload.map((entry: any, index: number) => {
        const originalValue = isNormalized && originalData
          ? originalData.find((d: any) => d.date === label)?.[entry.dataKey]
          : entry.value

        return (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium">{entry.name}:</span>
            {isNormalized && originalValue !== undefined ? (
              <span>{originalValue} (normalized: {entry.value?.toFixed(1)}%)</span>
            ) : (
              <span>{entry.value}</span>
            )}
          </div>
        )
      })}
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
  onShowIntegrationSupport?: () => void
}

function TrendChart({
  chart,
  chartData,
  isDarkMode,
  onUpdateChart,
  onRemoveChart,
  canRemove,
  getMetricColor,
  onShowIntegrationSupport
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
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Time Range</Label>
                <Select
                  value={chart.timeRange}
                  onValueChange={(value) => onUpdateChart(chart.id, { timeRange: value })}
                >
                  <SelectTrigger className="h-8 w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                    <SelectItem value="365">1 Year</SelectItem>
                    <SelectItem value="max">Max</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <MetricSelector
              selectedMetrics={chart.selectedMetrics}
              onSelectionChange={(metrics) => onUpdateChart(chart.id, { selectedMetrics: metrics })}
              isDarkMode={isDarkMode}
              onShowIntegrationSupport={onShowIntegrationSupport}
            />

            {/* Normalize button - positioned prominently below metrics */}
            <div className="flex justify-end">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={chart.isNormalized ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onUpdateChart(chart.id, { isNormalized: !chart.isNormalized })}
                    className="h-8 px-3"
                  >
                    <Minimize2 className="h-4 w-4 mr-2" />
                    {chart.isNormalized ? 'Original Scale' : 'Normalize'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{chart.isNormalized ? 'Show original values' : 'Normalize all metrics to 0-100 scale for comparison'}</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}
      </CardHeader>

      {chart.isExpanded && (
        <CardContent className="pt-0">
          <div className="h-[400px] w-full" data-chart-id={chart.id}>
            {chartData.length > 0 && chart.selectedMetrics.length > 0 ? (() => {
              const { normalizedData, originalRanges } = chart.isNormalized
                ? normalizeChartData(chartData, chart.selectedMetrics)
                : { normalizedData: chartData, originalRanges: {} }

              return (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={normalizedData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                  <XAxis dataKey="date" />
                  <YAxis label={chart.isNormalized ? { value: 'Normalized (%)', angle: -90, position: 'insideLeft' } : undefined} />
                  <RechartsTooltip
                    content={(props) => (
                      <CustomTooltip
                        {...props}
                        isNormalized={chart.isNormalized}
                        originalData={chartData}
                      />
                    )}
                  />
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
              )
            })() : (
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
  const [summaryHealthData, setSummaryHealthData] = useState<HealthMetric[]>([])
  const [chartHealthData, setChartHealthData] = useState<Record<string, HealthMetric[]>>({})
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [resourcesExpanded, setResourcesExpanded] = useState(true)
  const [manualEntryExpanded, setManualEntryExpanded] = useState(false)
  const [showExport, setShowExport] = useState(false)
  const [manualEntryDate, setManualEntryDate] = useState<Date>()
  const [manualEntryValues, setManualEntryValues] = useState<Record<string, string>>({})
  const [selectedManualMetrics, setSelectedManualMetrics] = useState<string[]>(['sleep_score', 'activity_score', 'readiness_score', 'stress_level', 'recovery_score'])
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showIntegrationSupport, setShowIntegrationSupport] = useState(false)
  const [filterPrefs, setFilterPrefs] = useState<FilterPrefs>({
    showResources: true,
    sortBy: 'date',
    showSummaryStats: true,
    selectedSummaryCards: ['sleep_score', 'activity_score', 'resilience_score', 'total_steps'],
    summaryTimeRange: '30',
    // Default trend chart instance
    trendCharts: [{
      id: '1',
      name: 'Overall Trends',
      selectedMetrics: ['sleep_score', 'activity_score', 'readiness_score', 'stress_level'],
      isExpanded: true,
      timeRange: '30',
      isNormalized: false
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
            isExpanded: true,
            timeRange: '30',
            isNormalized: false
          }]
        }
        // Ensure selectedSummaryCards exists for backward compatibility
        if (!parsedPrefs.selectedSummaryCards) {
          parsedPrefs.selectedSummaryCards = ['sleep_score', 'activity_score', 'resilience_score', 'total_steps']
        }
        // Ensure summaryTimeRange exists for backward compatibility
        if (!parsedPrefs.summaryTimeRange) {
          parsedPrefs.summaryTimeRange = '30'
        }
        // Ensure each chart has timeRange and isNormalized for backward compatibility
        if (parsedPrefs.trendCharts) {
          parsedPrefs.trendCharts = parsedPrefs.trendCharts.map(chart => ({
            ...chart,
            timeRange: chart.timeRange || '30',
            isNormalized: chart.isNormalized ?? false
          }))
        }
        // Remove old timeRange property if it exists
        if (parsedPrefs.timeRange) {
          delete parsedPrefs.timeRange
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

  // Load initial data and resources
  useEffect(() => {
    async function loadInitialData() {
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
        console.error('Error loading initial data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [])

  // Load summary data when summary time range changes
  useEffect(() => {
    async function loadSummaryData() {
      if (!user) return

      try {
        const data = await fetchHealthDataForRange(filterPrefs.summaryTimeRange)
        setSummaryHealthData(data)
      } catch (error) {
        console.error('Error loading summary data:', error)
      }
    }

    loadSummaryData()
  }, [user, filterPrefs.summaryTimeRange])

  // Load chart data when chart time ranges change
  useEffect(() => {
    async function loadChartData() {
      if (!user) return

      try {
        const newChartData: Record<string, HealthMetric[]> = {}

        // Get unique time ranges to avoid duplicate fetches
        const uniqueTimeRanges = [...new Set(filterPrefs.trendCharts.map(chart => chart.timeRange))]

        // Fetch data for each unique time range
        const dataPromises = uniqueTimeRanges.map(async (timeRange) => {
          const data = await fetchHealthDataForRange(timeRange)
          return { timeRange, data }
        })

        const results = await Promise.all(dataPromises)
        const dataByTimeRange: Record<string, HealthMetric[]> = {}

        results.forEach(({ timeRange, data }) => {
          dataByTimeRange[timeRange] = data
        })

        // Assign data to each chart based on its time range
        filterPrefs.trendCharts.forEach(chart => {
          newChartData[chart.id] = dataByTimeRange[chart.timeRange] || []
        })

        setChartHealthData(newChartData)
      } catch (error) {
        console.error('Error loading chart data:', error)
      }
    }

    loadChartData()
  }, [user, filterPrefs.trendCharts])

  const updateFilterPref = (key: keyof FilterPrefs, value: any) => {
    setFilterPrefs(prev => ({ ...prev, [key]: value }))
  }

  // Chart instance management functions
  // Helper function to fetch health data for a specific time range
  const fetchHealthDataForRange = async (timeRange: string): Promise<HealthMetric[]> => {
    if (!user) return []

    try {
      const supabase = createClient()
      const today = new Date().toISOString().split('T')[0]

      let query = supabase
        .from('health_metrics_daily')
        .select('*')
        .eq('user_id', user.id)
        .lte('date', today)
        .order('date', { ascending: true })

      // Handle different time ranges
      if (timeRange !== 'max') {
        const daysBack = parseInt(timeRange)
        const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        query = query.gte('date', startDate)
      }
      // For 'max', we don't add any date filtering to get all data

      const { data: metricsData, error: metricsError } = await query

      if (metricsError) {
        console.error('Error fetching health metrics:', metricsError)
        return []
      }

      return metricsData || []
    } catch (error) {
      console.error('Error in fetchHealthDataForRange:', error)
      return []
    }
  }

  const addTrendChart = () => {
    const newChart: ChartInstance = {
      id: Date.now().toString(),
      name: `Trend Chart ${filterPrefs.trendCharts.length + 1}`,
      selectedMetrics: ['sleep_score', 'activity_score'],
      isExpanded: true,
      timeRange: '30',
      isNormalized: false
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

  // Get selected metrics for manual entry from AVAILABLE_METRICS
  const selectedManualMetricsData = selectedManualMetrics.map(key => {
    const metric = AVAILABLE_METRICS.find(m => m.key === key)
    return metric ? { value: metric.key, label: metric.label } : null
  }).filter(Boolean) as { value: string; label: string }[]

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
        alert(`Please enter a valid number for ${selectedManualMetricsData.find(m => m.value === metric)?.label}`)
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


  // Calculate summary stats for all available metrics using summaryHealthData
  const calculateAverage = (key: string) => {
    const validData = summaryHealthData.filter(d => d[key] && d[key] > 0)
    if (validData.length === 0) return null
    return Math.round(validData.reduce((sum, d) => sum + d[key], 0) / validData.length)
  }

  const summaryStats = summaryHealthData.length > 0 ? {
    // Recovery & Sleep
    sleep_score: calculateAverage('sleep_score'),
    readiness_score: calculateAverage('readiness_score'),
    recovery_score: calculateAverage('recovery_score'),

    // Activity & Exercise
    activity_score: calculateAverage('activity_score'),
    total_steps: calculateAverage('total_steps'),
    calories_burned: calculateAverage('calories_burned'),
    exercise_minutes: calculateAverage('exercise_minutes'),
    active_energy: calculateAverage('active_energy'),
    distance: calculateAverage('distance'),

    // Vitals & Health Metrics
    resting_hr: calculateAverage('resting_hr'),
    hrv_avg: calculateAverage('hrv_avg'),
    body_temperature: calculateAverage('body_temperature'),
    blood_pressure_systolic: calculateAverage('blood_pressure_systolic'),
    blood_pressure_diastolic: calculateAverage('blood_pressure_diastolic'),
    oxygen_saturation: calculateAverage('oxygen_saturation'),

    // Wellness & Mental Health
    stress_level: calculateAverage('stress_level'),
    resilience_score: calculateAverage('resilience_score'),

    // Body Composition
    weight: calculateAverage('weight'),
    body_fat_percentage: calculateAverage('body_fat_percentage'),
    lean_body_mass: calculateAverage('lean_body_mass'),
    basal_metabolic_rate: calculateAverage('basal_metabolic_rate'),

    // Sleep Details
    time_in_bed: calculateAverage('time_in_bed'),
    time_asleep: calculateAverage('time_asleep'),
    light_sleep: calculateAverage('light_sleep'),
    deep_sleep: calculateAverage('deep_sleep'),
    rem_sleep: calculateAverage('rem_sleep'),

    // Blood Metrics
    blood_glucose: calculateAverage('blood_glucose'),

    // Fitness & Performance
    vo2_max: calculateAverage('vo2_max'),
    time_in_daylight: calculateAverage('time_in_daylight'),

    // Nutrition
    hydration: calculateAverage('hydration'),
    nutrition_calories: calculateAverage('nutrition_calories'),

    // Women's Health
    menstruation_flow: calculateAverage('menstruation_flow')
  } : null

  // Helper function to prepare chart data for a specific data set
  const prepareChartData = (healthData: HealthMetric[]) => {
    return healthData.map(d => ({
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
  }

  // Prepare chart data for each chart based on its specific data
  const getChartData = (chartId: string) => {
    const healthData = chartHealthData[chartId] || []
    return prepareChartData(healthData)
  }


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
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setManualEntryExpanded(!manualEntryExpanded)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Data
          </Button>
          <Button
            onClick={() => setShowExport(!showExport)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Manual Data Entry Section */}
      {manualEntryExpanded && (
        <div className="bg-muted/50 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Manual Data Entry
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setManualEntryExpanded(false)}
              className="h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

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

              {/* Metrics Selector */}
              <div className="space-y-2">
                <Label className="text-xs">Metrics to Enter</Label>
                <MetricsSelector
                  selectedMetrics={selectedManualMetrics}
                  onSelectionChange={setSelectedManualMetrics}
                  mode="manual-entry"
                />
              </div>

              {/* Metrics Grid - only show selected metrics */}
              {selectedManualMetrics.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {selectedManualMetricsData.map((metric) => (
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
              )}

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
        </div>
      )}

      {/* Export Section */}
      {showExport && (
        <WellnessDataExport
          healthData={summaryHealthData}
          chartData={chartHealthData}
          trendCharts={filterPrefs.trendCharts}
          currentSummaryTimeRange={filterPrefs.summaryTimeRange}
          currentSelectedMetrics={filterPrefs.selectedSummaryCards || []}
          onExportStart={() => {
            console.log('Export started')
          }}
          onExportComplete={() => {
            console.log('Export completed successfully')
          }}
          onExportError={(error) => {
            console.error('Export failed:', error)
          }}
        />
      )}



      {/* Summary Cards Section */}
      {summaryStats && filterPrefs.showSummaryStats && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Summary</h2>
            <div className="flex items-center gap-2">
              <Select
                value={filterPrefs.summaryTimeRange}
                onValueChange={(value) => updateFilterPref('summaryTimeRange', value)}
              >
                <SelectTrigger className="h-8 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="365">1 Year</SelectItem>
                  <SelectItem value="max">Max</SelectItem>
                </SelectContent>
              </Select>
              <MetricsSelector
                selectedMetrics={filterPrefs.selectedSummaryCards || []}
                onSelectionChange={(cards) => updateFilterPref('selectedSummaryCards', cards)}
                mode="summary-cards"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
            {(filterPrefs.selectedSummaryCards || []).map((cardKey) => {
              const cardConfig = AVAILABLE_METRICS.find(m => m.key === cardKey)
              if (!cardConfig) return null

              const value = summaryStats[cardKey]
              const hasData = value !== null && value !== undefined

              // Determine icon based on metric group
              const IconComponent = cardConfig.group === 'Sleep' || cardKey.includes('sleep') ? Moon :
                                   cardConfig.group === 'Activity' || cardKey.includes('steps') || cardKey.includes('calories') || cardKey.includes('exercise') ? Activity :
                                   cardConfig.group === 'Vitals' || cardKey.includes('hr') || cardKey.includes('blood') || cardKey.includes('oxygen') ? Heart :
                                   cardConfig.group === 'Recovery' || cardKey.includes('score') ? TrendingUp : Activity

              // Determine unit
              const unit = cardKey === 'total_steps' ? 'per day' :
                          cardKey === 'resting_hr' ? 'bpm' :
                          cardKey === 'hrv_avg' ? 'ms' :
                          cardKey === 'calories_burned' || cardKey === 'active_energy' || cardKey === 'nutrition_calories' ? 'kcal' :
                          cardKey === 'exercise_minutes' ? 'min' :
                          cardKey === 'distance' ? 'km' :
                          cardKey === 'body_temperature' ? '°F' :
                          cardKey === 'blood_pressure_systolic' || cardKey === 'blood_pressure_diastolic' ? 'mmHg' :
                          cardKey === 'oxygen_saturation' ? '%' :
                          cardKey === 'weight' ? 'lbs' :
                          cardKey === 'body_fat_percentage' ? '%' :
                          cardKey === 'lean_body_mass' ? 'lbs' :
                          cardKey === 'basal_metabolic_rate' ? 'kcal/day' :
                          cardKey === 'time_in_bed' || cardKey === 'time_asleep' || cardKey === 'light_sleep' || cardKey === 'deep_sleep' || cardKey === 'rem_sleep' ? 'hours' :
                          cardKey === 'blood_glucose' ? 'mg/dL' :
                          cardKey === 'vo2_max' ? 'ml/kg/min' :
                          cardKey === 'time_in_daylight' ? 'hours' :
                          cardKey === 'hydration' ? 'ml' :
                          cardKey === 'menstruation_flow' ? 'level' :
                          cardKey.includes('score') ? '/100' : ''

              // Determine tooltip
              const tooltip = cardKey === 'sleep_score' ? 'Your sleep quality score based on duration, efficiency, and sleep stages.' :
                             cardKey === 'activity_score' ? 'Your daily activity level based on movement and exercise.' :
                             cardKey === 'resilience_score' ? 'Your body\'s ability to handle stress and recover.' :
                             cardKey === 'readiness_score' ? 'Your readiness for physical and mental challenges.' :
                             cardKey === 'recovery_score' ? 'Your recovery status from previous activities.' :
                             cardKey === 'total_steps' ? 'Your average daily step count.' :
                             cardKey === 'calories_burned' ? 'Average calories burned per day.' :
                             cardKey === 'exercise_minutes' ? 'Average exercise minutes per day.' :
                             cardKey === 'active_energy' ? 'Average active energy expenditure per day.' :
                             cardKey === 'distance' ? 'Average distance covered per day.' :
                             cardKey === 'resting_hr' ? 'Your resting heart rate during sleep or rest.' :
                             cardKey === 'hrv_avg' ? 'Heart Rate Variability - higher is typically better.' :
                             cardKey === 'body_temperature' ? 'Your average body temperature.' :
                             cardKey === 'blood_pressure_systolic' ? 'Systolic blood pressure (pressure when heart beats).' :
                             cardKey === 'blood_pressure_diastolic' ? 'Diastolic blood pressure (pressure when heart rests).' :
                             cardKey === 'oxygen_saturation' ? 'Blood oxygen saturation level.' :
                             cardKey === 'stress_level' ? 'Your stress level based on physiological markers.' :
                             cardKey === 'weight' ? 'Your average body weight.' :
                             cardKey === 'body_fat_percentage' ? 'Your body fat percentage.' :
                             cardKey === 'lean_body_mass' ? 'Your lean body mass (muscle, bones, organs).' :
                             cardKey === 'basal_metabolic_rate' ? 'Calories burned at rest per day.' :
                             cardKey === 'time_in_bed' ? 'Average time spent in bed per night.' :
                             cardKey === 'time_asleep' ? 'Average actual sleep time per night.' :
                             cardKey === 'light_sleep' ? 'Average light sleep duration per night.' :
                             cardKey === 'deep_sleep' ? 'Average deep sleep duration per night.' :
                             cardKey === 'rem_sleep' ? 'Average REM sleep duration per night.' :
                             cardKey === 'blood_glucose' ? 'Average blood glucose level.' :
                             cardKey === 'vo2_max' ? 'Maximum oxygen consumption during exercise.' :
                             cardKey === 'time_in_daylight' ? 'Average time spent in daylight per day.' :
                             cardKey === 'hydration' ? 'Average daily water intake.' :
                             cardKey === 'nutrition_calories' ? 'Average calories consumed per day.' :
                             cardKey === 'menstruation_flow' ? 'Menstruation flow intensity level.' :
                             'Health metric average for selected period.'

              return (
                <Card key={cardKey} className="p-3">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-0 pt-0">
                    <CardTitle className="text-xs font-medium flex items-center gap-1">
                      {cardConfig.label}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs text-xs">
                            {tooltip}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </CardTitle>
                    <IconComponent className="h-3 w-3 text-muted-foreground" />
                  </CardHeader>
                  <CardContent className="px-0 pb-0">
                    <div className="text-lg font-bold">
                      {hasData ? (cardKey === 'total_steps' ? value.toLocaleString() : value) : 'N/A'}
                    </div>
                    <p className="text-xs text-muted-foreground">{hasData ? unit : 'No data'}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
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
            chartData={getChartData(chart.id)}
            isDarkMode={isDarkMode}
            onUpdateChart={updateTrendChart}
            onRemoveChart={removeTrendChart}
            canRemove={filterPrefs.trendCharts.length > 1}
            getMetricColor={getMetricColor}
            onShowIntegrationSupport={() => setShowIntegrationSupport(true)}
          />
        ))}
      </div>


      {/* No Data Message - Show when no health data */}
      {summaryHealthData.length === 0 && (
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

      {/* User Wellness Form */}
      <UserWellnessForm />

      {/* Resources Section */}
      {/* {filterPrefs.showResources && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Tags className="h-5 w-5" />
                  Health & Wellness Resources
                </CardTitle>
                <CardDescription>
                  Resources tagged with "Health and Wellness"
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setResourcesExpanded(!resourcesExpanded)}
                className="h-8 px-2"
              >
                {resourcesExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {resourcesExpanded && (
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
          )}
        </Card>
      )} */}

      {/* Medical Records Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Medical Records
          </CardTitle>
          <CardDescription>
            Provide medical records to Juniper so it can provide valuable insights and conversation around your health data - we do not share your records with third parties.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload and manage your medical records in your <Link href="/repository"><u>Repository</u></Link>.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Integration Support Modal */}
      <IntegrationSupportModal
        isOpen={showIntegrationSupport}
        onClose={() => setShowIntegrationSupport(false)}
      />
    </div>
  )
}
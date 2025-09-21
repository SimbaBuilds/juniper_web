'use client'

import React, { useState } from 'react'
import { Download, FileText, ChevronDown, ChevronUp, Calendar, BarChart3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

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

interface ChartInstance {
  id: string
  name: string
  selectedMetrics: string[]
  isExpanded: boolean
  timeRange: string
  isNormalized: boolean
}

interface WellnessDataExportProps {
  healthData: HealthMetric[]
  chartData: Record<string, HealthMetric[]>
  trendCharts: ChartInstance[]
  currentSummaryTimeRange: string
  currentSelectedMetrics: string[]
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
}

export function WellnessDataExport({
  healthData,
  chartData,
  trendCharts,
  currentSummaryTimeRange,
  currentSelectedMetrics,
  onExportStart,
  onExportComplete,
  onExportError
}: WellnessDataExportProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Export options state
  const [includeSummary, setIncludeSummary] = useState(true)
  const [includeTrendCharts, setIncludeTrendCharts] = useState(true)
  const [includeChartValues, setIncludeChartValues] = useState(false)

  const timeFrameOptions = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
    { value: '180', label: '6 months' },
    { value: '365', label: '1 year' }
  ]

  const getCurrentTimeFrameLabel = () => {
    const option = timeFrameOptions.find(opt => opt.value === currentSummaryTimeRange)
    return option ? option.label : `${currentSummaryTimeRange} days`
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    onExportStart?.()

    try {
      // Prepare export configuration
      const exportConfig = {
        includeSummary,
        summaryTimeFrame: currentSummaryTimeRange,
        selectedMetrics: currentSelectedMetrics,
        includeTrendCharts,
        includeChartValues,
        trendCharts: trendCharts.map(chart => ({
          id: chart.id,
          name: chart.name,
          selectedMetrics: chart.selectedMetrics,
          timeRange: chart.timeRange,
          isNormalized: chart.isNormalized
        }))
      }

      // Call the export service
      const response = await fetch('/api/wellness/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(exportConfig)
      })

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      // Download the PDF
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `wellness-data-export-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      onExportComplete?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      setError(errorMessage)
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  const hasExportableData = healthData.length > 0 || Object.keys(chartData).some(key => chartData[key].length > 0)
  const hasValidSummarySelection = !includeSummary || (currentSelectedMetrics.length > 0)
  const canExport = hasExportableData && (includeSummary || includeTrendCharts) && hasValidSummarySelection

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Data Export
        </h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="h-7 px-2 text-xs"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Hide
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
            </>
          )}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Export your wellness data and trends to PDF
          </p>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Export Options */}
          <div className="space-y-4">
            {/* Summary Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-summary"
                    checked={includeSummary}
                    onCheckedChange={setIncludeSummary}
                  />
                  <Label htmlFor="include-summary" className="text-xs font-medium">
                    Include Summary
                  </Label>
                </div>
              </div>

              {includeSummary && (
                <div className="ml-6 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Current Summary Settings</Label>
                    <div className="bg-muted/50 rounded p-2 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        <span className="font-medium">Time Frame:</span>
                        <span>{getCurrentTimeFrameLabel()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <BarChart3 className="h-3 w-3" />
                        <span className="font-medium">Metrics:</span>
                        <span>{currentSelectedMetrics.length} selected</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Summary will export your current selections from the Summary section below
                  </p>
                </div>
              )}
            </div>

            {/* Trend Charts Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-trends"
                    checked={includeTrendCharts}
                    onCheckedChange={setIncludeTrendCharts}
                  />
                  <Label htmlFor="include-trends" className="text-xs font-medium">
                    Include Trend Charts
                  </Label>
                </div>
              </div>

              {includeTrendCharts && (
                <div className="ml-6 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Charts will maintain current metric selection and normalization state
                  </p>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-chart-values"
                      checked={includeChartValues}
                      onCheckedChange={setIncludeChartValues}
                    />
                    <Label htmlFor="include-chart-values" className="text-xs font-medium">
                      Include chart values (CSV format)
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-4 border-t">
            <Button
              onClick={handleExport}
              disabled={isExporting || !canExport}
              className="w-full h-8 text-xs"
              size="sm"
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-3 w-3 mr-2" />
                  Export to PDF
                </>
              )}
            </Button>

            {!hasExportableData && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                No data available for export
              </p>
            )}

            {hasExportableData && !includeSummary && !includeTrendCharts && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Select at least one export option
              </p>
            )}

            {hasExportableData && includeSummary && currentSelectedMetrics.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                No summary metrics selected. Please select metrics in the Summary section below.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState } from 'react'
import { Download, FileText, Calendar, BarChart3, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import html2canvas from 'html2canvas-pro'

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

interface ChartImage {
  id: string
  image: string
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
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Export options state
  const [includeWellnessInfo, setIncludeWellnessInfo] = useState(true)
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

  const captureCharts = async (): Promise<ChartImage[]> => {
    const chartImages: ChartImage[] = []

    if (!includeTrendCharts) {
      console.log('📸 Skipping chart capture - includeTrendCharts is false')
      return chartImages
    }

    console.log('📸 Starting chart capture with html2canvas')
    console.log('📊 Trend charts to capture:', trendCharts.map(c => ({ id: c.id, name: c.name })))

    for (const chart of trendCharts) {
      try {
        console.log(`🔍 Looking for chart element with ID: ${chart.id}`)

        // Find the chart element by ID
        const chartElement = document.querySelector(`[data-chart-id="${chart.id}"]`) as HTMLElement

        if (chartElement) {
          console.log(`📷 Found chart element: ${chart.name} (ID: ${chart.id})`)

          // Store original dimensions and styles
          const originalWidth = chartElement.offsetWidth
          const originalHeight = chartElement.offsetHeight
          const originalStyle = chartElement.style.cssText

          console.log('📐 Original chart element dimensions:', {
            width: originalWidth,
            height: originalHeight,
            visible: chartElement.offsetParent !== null
          })

          // Set fixed dimensions for consistent capture across devices
          // Target dimensions: maintain desktop-like aspect ratio
          const targetWidth = 1166  // Standard desktop chart width
          const targetHeight = 400  // Standard chart height

          // Apply temporary fixed dimensions for capture
          chartElement.style.width = `${targetWidth}px`
          chartElement.style.height = `${targetHeight}px`
          chartElement.style.position = 'relative'

          // Force a reflow to ensure dimensions are applied
          chartElement.offsetHeight // Force reflow

          // Wait a bit for chart to re-render with new dimensions
          await new Promise(resolve => setTimeout(resolve, 800))

          console.log('📐 Capture dimensions set to:', {
            width: targetWidth,
            height: targetHeight
          })

          // Capture the chart with html2canvas-pro (supports oklch colors)
          console.log('🎨 Starting html2canvas-pro capture with fixed dimensions...')
          const canvas = await html2canvas(chartElement, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: '#ffffff',
            scale: 2, // Higher resolution
            logging: false,
            width: targetWidth,
            height: targetHeight,
            windowWidth: targetWidth,
            windowHeight: targetHeight
          })

          // Restore original dimensions immediately after capture
          chartElement.style.cssText = originalStyle

          console.log('🖼️ Canvas created:', {
            width: canvas.width,
            height: canvas.height,
            restoredOriginalDimensions: true
          })

          // Convert to base64
          const imageData = canvas.toDataURL('image/png', 0.9)
          console.log('📦 Image data size:', imageData.length, 'characters')

          chartImages.push({
            id: chart.id,
            image: imageData
          })

          console.log(`✅ Successfully captured chart: ${chart.name}`)
        } else {
          console.warn(`⚠️ Chart element not found for ID: ${chart.id}`)
          console.log('🔍 Available elements with data-chart-id:',
            Array.from(document.querySelectorAll('[data-chart-id]')).map(el => el.getAttribute('data-chart-id'))
          )
        }
      } catch (error) {
        console.error(`❌ Failed to capture chart ${chart.name}:`, error)
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        })
        // Continue with other charts even if one fails
      }
    }

    console.log(`📸 Chart capture completed. Captured ${chartImages.length} out of ${trendCharts.length} charts`)
    return chartImages
  }

  const handleExport = async () => {
    setIsExporting(true)
    setError(null)
    onExportStart?.()

    try {
      console.log('🚀 Starting export process...')

      // Capture chart images if trend charts are included
      let chartImages: ChartImage[] = []
      if (includeTrendCharts) {
        console.log('📸 Capturing chart images...')
        chartImages = await captureCharts()
        console.log('📸 Chart capture result:', {
          totalCharts: trendCharts.length,
          capturedCharts: chartImages.length,
          chartIds: chartImages.map(img => img.id)
        })
      }

      // Prepare export configuration
      const exportConfig = {
        includeWellnessInfo,
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
        })),
        chartImages // Add captured chart images
      }

      console.log('📊 Export configuration:', {
        includeSummary: exportConfig.includeSummary,
        includeTrendCharts: exportConfig.includeTrendCharts,
        chartCount: exportConfig.trendCharts.length,
        chartImagesCount: exportConfig.chartImages.length
      })

      // Call the export service
      console.log('🌐 Sending export request to API...')
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
  const canExport = hasExportableData && (includeWellnessInfo || includeSummary || includeTrendCharts) && hasValidSummarySelection

  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="mb-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Export Wellness Data
        </h4>
      </div>

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
            {/* Wellness Info Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="include-wellness-info"
                    checked={includeWellnessInfo}
                    onCheckedChange={setIncludeWellnessInfo}
                  />
                  <Label htmlFor="include-wellness-info" className="text-xs font-medium">
                    Include Personal Wellness Information
                  </Label>
                </div>
              </div>

              {includeWellnessInfo && (
                <div className="ml-6">
                  <p className="text-xs text-muted-foreground">
                    Exports your wellness goals, progress, favorite activities, and notes
                  </p>
                </div>
              )}
            </div>

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
                    Include Trend Chart(s)
                  </Label>
                </div>
              </div>

              {includeTrendCharts && (
                <div className="ml-6 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Charts will maintain your current metric selection and normalization state
                  </p>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="include-chart-values"
                      checked={includeChartValues}
                      onCheckedChange={setIncludeChartValues}
                    />
                    <Label htmlFor="include-chart-values" className="text-xs font-medium">
                      Include chart values as CSV
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

            {hasExportableData && !includeWellnessInfo && !includeSummary && !includeTrendCharts && (
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
    </div>
  )
}
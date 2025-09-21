import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format, parseISO, subDays } from 'date-fns'

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

interface ChartConfig {
  id: string
  name: string
  selectedMetrics: string[]
  timeRange: string
  isNormalized: boolean
}

interface ChartImage {
  id: string
  image: string
}

interface ExportConfig {
  includeSummary: boolean
  summaryTimeFrame: string
  selectedMetrics: string[]
  includeTrendCharts: boolean
  includeChartValues: boolean
  trendCharts: ChartConfig[]
  chartImages?: ChartImage[]
}

interface MetricDefinition {
  key: string
  label: string
  group: string
  unit?: string
  color: {
    light: string
    dark: string
  }
}

const AVAILABLE_METRICS: MetricDefinition[] = [
  // Recovery
  {
    key: 'sleep_score',
    label: 'Sleep Score',
    group: 'Recovery',
    unit: 'score',
    color: { light: '#1e40af', dark: '#60a5fa' }
  },
  {
    key: 'readiness_score',
    label: 'Readiness Score',
    group: 'Recovery',
    unit: 'score',
    color: { light: '#f59e0b', dark: '#fbbf24' }
  },
  {
    key: 'recovery_score',
    label: 'Recovery Score',
    group: 'Recovery',
    unit: 'score',
    color: { light: '#059669', dark: '#10b981' }
  },

  // Activity
  {
    key: 'activity_score',
    label: 'Activity Score',
    group: 'Activity',
    unit: 'score',
    color: { light: '#166534', dark: '#bbf7d0' }
  },
  {
    key: 'total_steps',
    label: 'Total Steps',
    group: 'Activity',
    unit: 'steps',
    color: { light: '#7c3aed', dark: '#8b5cf6' }
  },
  {
    key: 'calories_burned',
    label: 'Calories Burned',
    group: 'Activity',
    unit: 'cal',
    color: { light: '#dc2626', dark: '#ef4444' }
  },

  // Vitals
  {
    key: 'heart_rate_avg',
    label: 'Resting Heart Rate',
    group: 'Vitals',
    unit: 'bpm',
    color: { light: '#8b5cf6', dark: '#a78bfa' }
  },
  {
    key: 'hrv_avg',
    label: 'HRV Average',
    group: 'Vitals',
    unit: 'ms',
    color: { light: '#ec4899', dark: '#fb7185' }
  },

  // Wellness
  {
    key: 'stress_level',
    label: 'Stress Level',
    group: 'Wellness',
    unit: 'level',
    color: { light: '#ef4444', dark: '#f87171' }
  }
]

export class WellnessExportService {
  // PDF layout constants
  private static readonly PAGE_MARGIN_TOP = 20
  private static readonly PAGE_MARGIN_BOTTOM = 30
  private static readonly PAGE_MARGIN_LEFT = 20
  private static readonly PAGE_MARGIN_RIGHT = 20
  private static readonly PAGE_HEIGHT = 297 // A4 height in mm
  private static readonly USABLE_HEIGHT = this.PAGE_HEIGHT - this.PAGE_MARGIN_TOP - this.PAGE_MARGIN_BOTTOM

  /**
   * Check if content will fit on current page, add new page if needed
   */
  private static checkPageBreak(pdf: jsPDF, currentY: number, contentHeight: number): number {
    const maxY = this.PAGE_MARGIN_TOP + this.USABLE_HEIGHT

    if (currentY + contentHeight > maxY) {
      console.log(`📄 Adding new page - current Y: ${currentY}, content height: ${contentHeight}, max Y: ${maxY}`)
      pdf.addPage()
      return this.PAGE_MARGIN_TOP
    }

    return currentY
  }

  /**
   * Normalize chart data like the wellness page does
   */
  private static normalizeMetricValues(
    healthData: HealthMetric[],
    selectedMetrics: string[]
  ): { normalizedData: HealthMetric[], originalRanges: Record<string, { min: number; max: number }> } {
    if (healthData.length === 0 || selectedMetrics.length === 0) {
      return { normalizedData: healthData, originalRanges: {} }
    }

    console.log('🔄 Calculating normalization for metrics:', selectedMetrics)

    // Calculate min/max for each metric
    const ranges = selectedMetrics.reduce((acc, metric) => {
      const values = healthData
        .map(d => d[metric as keyof HealthMetric] as number)
        .filter(v => v != null && !isNaN(v))

      if (values.length > 0) {
        acc[metric] = {
          min: Math.min(...values),
          max: Math.max(...values)
        }
        console.log(`📊 ${metric} range: ${acc[metric].min} - ${acc[metric].max}`)
      }
      return acc
    }, {} as Record<string, { min: number; max: number }>)

    // Create normalized data
    const normalizedData = healthData.map(row => {
      const normalized = { ...row }
      selectedMetrics.forEach(metric => {
        const originalValue = row[metric as keyof HealthMetric] as number
        if (originalValue != null && !isNaN(originalValue) && ranges[metric]) {
          const { min, max } = ranges[metric]
          if (max !== min) {
            const normalizedValue = Math.round(((originalValue - min) / (max - min)) * 100 * 100) / 100
            // Store in a virtual normalized_scores object
            if (!normalized.normalized_scores || typeof normalized.normalized_scores !== 'object') {
              normalized.normalized_scores = {}
            }
            normalized.normalized_scores[metric] = normalizedValue
          } else {
            // If all values are the same, normalize to middle
            if (!normalized.normalized_scores || typeof normalized.normalized_scores !== 'object') {
              normalized.normalized_scores = {}
            }
            normalized.normalized_scores[metric] = 50.00
          }
        }
      })
      return normalized
    })

    console.log('✅ Normalization calculation completed')
    return { normalizedData, originalRanges: ranges }
  }

  /**
   * Generate PDF export of wellness data
   */
  static async generateExport(
    userId: string,
    config: ExportConfig
  ): Promise<Buffer> {
    console.log('🔄 WellnessExportService: Starting export', {
      userId,
      config
    })

    // Fetch health data
    const healthData = await this.fetchHealthData(userId, config)

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')

    // Set up fonts and styling
    pdf.setFont('helvetica')

    // Add header
    this.addHeader(pdf)

    let yPosition = this.PAGE_MARGIN_TOP + 25 // Leave space after header

    // Add summary section if requested
    if (config.includeSummary) {
      yPosition = this.checkPageBreak(pdf, yPosition, 60) // Estimate summary section height
      yPosition = this.addSummarySection(pdf, healthData, config.summaryTimeFrame, config.selectedMetrics, yPosition)
    }

    // Add trend charts section if requested
    if (config.includeTrendCharts && config.trendCharts.length > 0) {
      yPosition = this.checkPageBreak(pdf, yPosition, 100) // Estimate chart section height
      yPosition = this.addTrendChartsSection(pdf, healthData, config, yPosition)
    }

    // Add footer
    this.addFooter(pdf)

    return Buffer.from(pdf.output('arraybuffer'))
  }

  /**
   * Fetch health data from database
   */
  private static async fetchHealthData(
    userId: string,
    config: ExportConfig
  ): Promise<HealthMetric[]> {
    const supabase = await createSupabaseAppServerClient()

    // Determine the maximum time range needed
    const timeRanges = [config.summaryTimeFrame, ...config.trendCharts.map(c => c.timeRange)]
    const maxDays = Math.max(...timeRanges.map(range => parseInt(range)))

    const startDate = subDays(new Date(), maxDays)

    const { data, error } = await supabase
      .from('health_metrics_daily')
      .select('*')
      .eq('user_id', userId)
      .gte('date', format(startDate, 'yyyy-MM-dd'))
      .order('date', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch health data: ${error.message}`)
    }

    return data || []
  }

  /**
   * Add PDF header
   */
  private static addHeader(pdf: jsPDF): void {
    pdf.setFontSize(20)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Wellness Data Export', 20, 20)

    pdf.setFontSize(10)
    pdf.setTextColor(102, 102, 102)
    pdf.text(`Generated on ${format(new Date(), 'MMMM d, yyyy')}`, 20, 30)

    // Add line
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, 35, 190, 35)
  }

  /**
   * Add summary statistics section
   */
  private static addSummarySection(
    pdf: jsPDF,
    healthData: HealthMetric[],
    timeFrame: string,
    selectedMetrics: string[],
    startY: number
  ): number {
    const days = parseInt(timeFrame)
    const cutoffDate = subDays(new Date(), days)
    const filteredData = healthData.filter(metric =>
      parseISO(metric.date) >= cutoffDate
    )

    pdf.setFontSize(14)
    pdf.setTextColor(51, 51, 51)
    pdf.text(`Summary Statistics (Last ${days} days)`, this.PAGE_MARGIN_LEFT, startY)

    let yPosition = startY + 15

    if (filteredData.length === 0) {
      pdf.setFontSize(10)
      pdf.setTextColor(102, 102, 102)
      pdf.text('No data available for the selected time period', 20, yPosition)
      return yPosition + 20
    }

    // Calculate statistics for selected metrics only
    const stats = this.calculateStatistics(filteredData, selectedMetrics)

    // Create table data
    const tableData = Object.entries(stats).map(([key, values]) => {
      const metric = AVAILABLE_METRICS.find(m => m.key === key)
      if (!metric || values.count === 0 || !selectedMetrics.includes(key)) return null

      return [
        metric.label,
        values.average.toFixed(1),
        values.min.toFixed(1),
        values.max.toFixed(1),
        values.count.toString()
      ]
    }).filter(Boolean)

    if (tableData.length > 0) {
      // Add table using autotable
      autoTable(pdf, {
        startY: yPosition,
        head: [['Metric', 'Average', 'Min', 'Max', 'Data Points']],
        body: tableData,
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: this.PAGE_MARGIN_LEFT, right: this.PAGE_MARGIN_RIGHT }
      })

      yPosition = (pdf as any).lastAutoTable.finalY + 15
    }

    return yPosition
  }

  /**
   * Add trend charts section
   */
  private static addTrendChartsSection(
    pdf: jsPDF,
    healthData: HealthMetric[],
    config: ExportConfig,
    startY: number
  ): number {
    console.log('🔄 Adding trend charts section', {
      chartCount: config.trendCharts.length,
      healthDataLength: healthData.length,
      includeChartValues: config.includeChartValues
    })

    pdf.setFontSize(14)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Trend Charts', this.PAGE_MARGIN_LEFT, startY)

    let yPosition = startY + 15

    for (const [index, chart] of config.trendCharts.entries()) {
      console.log(`📊 Processing chart ${index + 1}:`, {
        id: chart.id,
        name: chart.name,
        selectedMetrics: chart.selectedMetrics,
        timeRange: chart.timeRange,
        isNormalized: chart.isNormalized
      })

      // Check if chart section will fit on current page (estimate 120px for chart + legend + spacing)
      yPosition = this.checkPageBreak(pdf, yPosition, 120)

      yPosition = this.addChartSection(pdf, healthData, chart, config.includeChartValues, yPosition, config.chartImages)
    }

    console.log('✅ Trend charts section completed')
    return yPosition
  }

  /**
   * Add individual chart section
   */
  private static addChartSection(
    pdf: jsPDF,
    healthData: HealthMetric[],
    chart: ChartConfig,
    includeValues: boolean,
    startY: number,
    chartImages?: ChartImage[]
  ): number {
    const days = parseInt(chart.timeRange)
    const cutoffDate = subDays(new Date(), days)
    const filteredData = healthData.filter(metric =>
      parseISO(metric.date) >= cutoffDate
    )

    console.log(`📈 Chart section for "${chart.name}":`, {
      timeRangeDays: days,
      cutoffDate: cutoffDate.toISOString(),
      totalHealthData: healthData.length,
      filteredDataLength: filteredData.length,
      selectedMetrics: chart.selectedMetrics,
      isNormalized: chart.isNormalized,
      includeValues
    })

    pdf.setFontSize(12)
    pdf.setTextColor(51, 51, 51)
    pdf.text(chart.name, this.PAGE_MARGIN_LEFT, startY)

    pdf.setFontSize(9)
    pdf.setTextColor(102, 102, 102)
    pdf.text(`Time Range: ${days} days | Normalization: ${chart.isNormalized ? 'On' : 'Off'}`, this.PAGE_MARGIN_LEFT, startY + 7)

    let yPosition = startY + 15

    // Add chart visualization with proper aspect ratio
    // Original chart is ~1166x400, so maintain ~3:1 aspect ratio
    const chartWidth = 170
    const chartHeight = 60 // Increased from 40 to better match aspect ratio
    const chartX = this.PAGE_MARGIN_LEFT
    const chartY = yPosition

    // Draw chart background
    pdf.setDrawColor(200, 200, 200)
    pdf.setFillColor(248, 250, 252)
    pdf.rect(chartX, chartY, chartWidth, chartHeight, 'FD')

    // Try to add captured chart image first, fallback to data summary
    const chartImage = chartImages?.find(img => img.id === chart.id)

    if (chartImage) {
      console.log(`🖼️ Adding captured chart image for "${chart.name}"`)
      try {
        // Add the captured chart image with proper padding
        pdf.addImage(
          chartImage.image,
          'PNG',
          chartX + 3,
          chartY + 3,
          chartWidth - 6,
          chartHeight - 6,
          undefined,
          'FAST'
        )
        console.log(`✅ Chart image added successfully for "${chart.name}"`)

        // Add legend for the chart
        yPosition = this.addChartLegend(pdf, chart, chartX, chartY + chartHeight + 5)

        console.log(`📊 Chart image workflow completed for "${chart.name}" - skipping data summary`)
      } catch (error) {
        console.error(`❌ Failed to add chart image for "${chart.name}":`, error)
        // Only on error, fallback to data summary
        this.addChartDataSummary(pdf, filteredData, chart, chartX, chartY, chartWidth, chartHeight)
        yPosition = chartY + chartHeight + 15 // Consistent positioning
      }
    } else {
      console.log(`📊 No chart image found for "${chart.name}", using data summary fallback`)
      if (filteredData.length > 0 && chart.selectedMetrics.length > 0) {
        this.addChartDataSummary(pdf, filteredData, chart, chartX, chartY, chartWidth, chartHeight)
      } else {
        pdf.setFontSize(10)
        pdf.setTextColor(102, 102, 102)
        pdf.text('No data available for chart', chartX + 5, chartY + 25)
      }
      yPosition = chartY + chartHeight + 15 // Consistent positioning
    }

    // Add chart values if requested
    if (includeValues && filteredData.length > 0) {
      console.log(`📊 Adding chart values table for "${chart.name}"`)

      // Apply normalization if needed
      let dataToUse = filteredData
      if (chart.isNormalized) {
        console.log('🔄 Applying normalization to chart data')
        const { normalizedData } = this.normalizeMetricValues(filteredData, chart.selectedMetrics)
        dataToUse = normalizedData
      }

      yPosition = this.addChartValuesTable(pdf, dataToUse, chart, yPosition)
    } else {
      console.log(`⚠️ Skipping chart values: includeValues=${includeValues}, filteredDataLength=${filteredData.length}`)
    }

    return yPosition + 10
  }

  /**
   * Add a simple chart data summary using jsPDF text features
   */
  private static addChartDataSummary(
    pdf: jsPDF,
    healthData: HealthMetric[],
    chart: ChartConfig,
    x: number,
    y: number,
    width: number,
    height: number
  ): void {
    // Apply normalization if needed
    let dataToPlot = healthData
    if (chart.isNormalized) {
      const { normalizedData } = this.normalizeMetricValues(healthData, chart.selectedMetrics)
      dataToPlot = normalizedData
    }

    pdf.setFontSize(9)
    pdf.setTextColor(75, 85, 99)

    let textY = y + 12
    const leftMargin = x + 8

    // Show basic statistics for each metric
    chart.selectedMetrics.forEach((metric, index) => {
      const metricDef = AVAILABLE_METRICS.find(m => m.key === metric)
      const metricLabel = metricDef ? metricDef.label : metric

      const values = dataToPlot
        .map(d => chart.isNormalized && d.normalized_scores
          ? d.normalized_scores[metric]
          : d[metric as keyof HealthMetric] as number
        )
        .filter(v => v != null && !isNaN(v))

      if (values.length > 0) {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length
        const min = Math.min(...values)
        const max = Math.max(...values)
        const latest = values[values.length - 1]

        const unit = chart.isNormalized ? '%' : (metricDef?.unit || '')
        const formatValue = (val: number) => chart.isNormalized ? val.toFixed(1) : Math.round(val).toString()

        pdf.text(
          `${metricLabel}: Latest ${formatValue(latest)}${unit}, Avg ${formatValue(avg)}${unit} (${formatValue(min)}-${formatValue(max)}${unit})`,
          leftMargin,
          textY + (index * 8)
        )
      } else {
        pdf.text(`${metricLabel}: No data available`, leftMargin, textY + (index * 8))
      }
    })

    // Reset text color
    pdf.setTextColor(0, 0, 0)
  }

  /**
   * Add chart values table
   */
  private static addChartValuesTable(
    pdf: jsPDF,
    healthData: HealthMetric[],
    chart: ChartConfig,
    startY: number
  ): number {
    console.log(`📋 Creating chart values table for "${chart.name}":`, {
      healthDataLength: healthData.length,
      selectedMetrics: chart.selectedMetrics,
      isNormalized: chart.isNormalized
    })

    pdf.setFontSize(10)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Chart Values (CSV Format)', this.PAGE_MARGIN_LEFT, startY)

    const headers = ['Date', ...chart.selectedMetrics.map(key => {
      const metric = AVAILABLE_METRICS.find(m => m.key === key)
      return metric ? metric.label : key
    })]

    console.log('📊 Table headers:', headers)

    const tableData = healthData.map((metric, index) => {
      const values = [format(parseISO(metric.date), 'MMM d, yyyy')]

      console.log(`📅 Processing row ${index + 1} for date ${metric.date}:`)

      chart.selectedMetrics.forEach(key => {
        let value: any

        if (chart.isNormalized) {
          // Check if normalized_scores exists and has the key
          if (metric.normalized_scores && typeof metric.normalized_scores === 'object') {
            value = metric.normalized_scores[key]
            console.log(`  🔢 ${key} (normalized from DB): ${value}`)
          } else {
            console.log(`  ⚠️ ${key}: normalized_scores is empty or not an object:`, metric.normalized_scores)
            value = null
          }
        } else {
          value = metric[key as keyof HealthMetric]
          console.log(`  📈 ${key} (original): ${value}`)
        }

        values.push(value !== null && value !== undefined ? value.toString() : 'N/A')
      })

      console.log(`  📝 Row values:`, values)
      return values
    })

    console.log(`📊 Table data summary: ${tableData.length} rows, first few rows:`, tableData.slice(0, 3))

    if (tableData.length > 0) {
      autoTable(pdf, {
        startY: startY + 8,
        head: [headers],
        body: tableData,
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        margin: { left: this.PAGE_MARGIN_LEFT, right: this.PAGE_MARGIN_RIGHT },
        pageBreak: 'auto'
      })

      console.log('✅ Table added successfully')
      return (pdf as any).lastAutoTable.finalY + 10
    }

    console.log('⚠️ No table data to display')
    return startY + 20
  }

  /**
   * Add chart legend showing metrics and their actual colors from wellness page
   */
  private static addChartLegend(
    pdf: jsPDF,
    chart: ChartConfig,
    startX: number,
    startY: number
  ): number {
    console.log(`🎨 Adding legend for chart: ${chart.name}`)

    // Helper function to convert hex color to RGB array
    const hexToRgb = (hex: string): [number, number, number] => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result
        ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
        : [153, 153, 153] // Default gray
    }

    // Get metric color function (using light colors for PDF)
    const getMetricColor = (metricKey: string): [number, number, number] => {
      const metric = AVAILABLE_METRICS.find(m => m.key === metricKey)
      return metric ? hexToRgb(metric.color.light) : [153, 153, 153]
    }

    pdf.setFontSize(8)
    pdf.setTextColor(51, 51, 51)

    let currentY = startY
    let currentX = startX

    chart.selectedMetrics.forEach((metricKey) => {
      const metric = AVAILABLE_METRICS.find(m => m.key === metricKey)
      const label = metric ? metric.label : metricKey
      const color = getMetricColor(metricKey)

      // Draw color indicator (small rectangle)
      pdf.setFillColor(color[0], color[1], color[2])
      pdf.rect(currentX, currentY - 2, 4, 3, 'F')

      // Add metric label
      pdf.setTextColor(51, 51, 51)
      pdf.text(label, currentX + 6, currentY)

      // Calculate next position (wrap to next line if needed)
      const textWidth = pdf.getTextWidth(label) + 12 // 6 for box + 6 for spacing
      currentX += textWidth

      // If we exceed the chart width, move to next line
      if (currentX > startX + 150) {
        currentX = startX
        currentY += 8
      }
    })

    console.log(`✅ Legend added for ${chart.selectedMetrics.length} metrics`)
    return currentY + 10 // Return position after legend
  }

  /**
   * Calculate statistics for metrics
   */
  private static calculateStatistics(
    healthData: HealthMetric[],
    selectedMetrics?: string[]
  ): Record<string, {
    average: number
    min: number
    max: number
    count: number
  }> {
    const stats: Record<string, { values: number[], average: number, min: number, max: number, count: number }> = {}

    // Determine which metrics to process
    const metricsToProcess = selectedMetrics
      ? AVAILABLE_METRICS.filter(metric => selectedMetrics.includes(metric.key))
      : AVAILABLE_METRICS

    // Initialize stats for selected metrics
    metricsToProcess.forEach(metric => {
      stats[metric.key] = { values: [], average: 0, min: 0, max: 0, count: 0 }
    })

    // Collect values
    healthData.forEach(metric => {
      metricsToProcess.forEach(metricDef => {
        const value = metric[metricDef.key as keyof HealthMetric] as number
        if (value !== null && value !== undefined && !isNaN(value)) {
          stats[metricDef.key].values.push(value)
        }
      })
    })

    // Calculate statistics
    Object.keys(stats).forEach(key => {
      const values = stats[key].values
      if (values.length > 0) {
        stats[key].average = values.reduce((sum, val) => sum + val, 0) / values.length
        stats[key].min = Math.min(...values)
        stats[key].max = Math.max(...values)
        stats[key].count = values.length
      }
    })

    return stats
  }

  /**
   * Add PDF footer
   */
  private static addFooter(pdf: jsPDF): void {
    const pageCount = pdf.getNumberOfPages()

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)

      pdf.setFontSize(8)
      pdf.setTextColor(102, 102, 102)
      pdf.text(`Page ${i} of ${pageCount}`, 20, 285)
      pdf.text('Generated by Juniper Wellness Platform', 190, 285, { align: 'right' })
    }
  }
}
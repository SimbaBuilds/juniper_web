import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import jsPDF from 'jspdf'
import 'jspdf-autotable'
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
  resting_hr: number | null
  hrv_avg: number | null
  resilience_score: number | null
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

interface ExportConfig {
  includeSummary: boolean
  summaryTimeFrame: string
  selectedMetrics: string[]
  includeTrendCharts: boolean
  includeChartValues: boolean
  trendCharts: ChartConfig[]
}

interface MetricDefinition {
  key: string
  label: string
  group: string
  unit?: string
}

const AVAILABLE_METRICS: MetricDefinition[] = [
  { key: 'sleep_score', label: 'Sleep Score', group: 'Recovery', unit: 'score' },
  { key: 'readiness_score', label: 'Readiness Score', group: 'Recovery', unit: 'score' },
  { key: 'recovery_score', label: 'Recovery Score', group: 'Recovery', unit: 'score' },
  { key: 'activity_score', label: 'Activity Score', group: 'Activity', unit: 'score' },
  { key: 'total_steps', label: 'Total Steps', group: 'Activity', unit: 'steps' },
  { key: 'calories_burned', label: 'Calories Burned', group: 'Activity', unit: 'cal' },
  { key: 'resting_hr', label: 'Resting Heart Rate', group: 'Vitals', unit: 'bpm' },
  { key: 'hrv_avg', label: 'HRV Average', group: 'Vitals', unit: 'ms' },
  { key: 'stress_level', label: 'Stress Level', group: 'Wellness', unit: 'level' },
  { key: 'resilience_score', label: 'Resilience Score', group: 'Wellness', unit: 'score' }
]

export class WellnessExportService {
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

    let yPosition = 40

    // Add summary section if requested
    if (config.includeSummary) {
      yPosition = this.addSummarySection(pdf, healthData, config.summaryTimeFrame, config.selectedMetrics, yPosition)
    }

    // Add trend charts section if requested
    if (config.includeTrendCharts && config.trendCharts.length > 0) {
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
      .from('health_metrics')
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
    pdf.text(`Summary Statistics (Last ${days} days)`, 20, startY)

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
      ;(pdf as any).autoTable({
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
        margin: { left: 20, right: 20 }
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
    pdf.setFontSize(14)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Trend Charts', 20, startY)

    let yPosition = startY + 15

    for (const chart of config.trendCharts) {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage()
        yPosition = 20
      }

      yPosition = this.addChartSection(pdf, healthData, chart, config.includeChartValues, yPosition)
    }

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
    startY: number
  ): number {
    const days = parseInt(chart.timeRange)
    const cutoffDate = subDays(new Date(), days)
    const filteredData = healthData.filter(metric =>
      parseISO(metric.date) >= cutoffDate
    )

    pdf.setFontSize(12)
    pdf.setTextColor(51, 51, 51)
    pdf.text(chart.name, 20, startY)

    pdf.setFontSize(9)
    pdf.setTextColor(102, 102, 102)
    pdf.text(`Time Range: ${days} days | Normalization: ${chart.isNormalized ? 'On' : 'Off'}`, 20, startY + 7)

    let yPosition = startY + 15

    // Add placeholder for chart (since we can't easily render charts server-side)
    pdf.setDrawColor(200, 200, 200)
    pdf.setFillColor(248, 250, 252)
    pdf.rect(20, yPosition, 170, 40, 'FD')

    pdf.setFontSize(10)
    pdf.setTextColor(102, 102, 102)
    pdf.text('Chart visualization not available in PDF export', 25, yPosition + 22)

    yPosition += 50

    // Add chart values if requested
    if (includeValues && filteredData.length > 0) {
      yPosition = this.addChartValuesTable(pdf, filteredData, chart, yPosition)
    }

    return yPosition + 10
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
    pdf.setFontSize(10)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Chart Values (CSV Format)', 20, startY)

    const headers = ['Date', ...chart.selectedMetrics.map(key => {
      const metric = AVAILABLE_METRICS.find(m => m.key === key)
      return metric ? metric.label : key
    })]

    const tableData = healthData.map(metric => {
      const values = [format(parseISO(metric.date), 'MMM d, yyyy')]

      chart.selectedMetrics.forEach(key => {
        const value = chart.isNormalized && metric.normalized_scores
          ? metric.normalized_scores[key]
          : metric[key as keyof HealthMetric]

        values.push(value !== null && value !== undefined ? value.toString() : 'N/A')
      })

      return values
    })

    if (tableData.length > 0) {
      ;(pdf as any).autoTable({
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
        margin: { left: 20, right: 20 },
        pageBreak: 'auto'
      })

      return (pdf as any).lastAutoTable.finalY + 10
    }

    return startY + 20
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
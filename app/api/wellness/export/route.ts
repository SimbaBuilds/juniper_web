import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import { WellnessExportService } from '@/app/lib/services/WellnessExportService'

interface ChartImage {
  id: string
  image: string
}

interface ExportConfig {
  includeWellnessInfo: boolean
  includeSummary: boolean
  summaryTimeFrame: string
  selectedMetrics: string[]
  includeTrendCharts: boolean
  includeChartValues: boolean
  trendCharts: Array<{
    id: string
    name: string
    selectedMetrics: string[]
    timeRange: string
    isNormalized: boolean
  }>
  chartImages?: ChartImage[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Wellness export API: Request received')

    // Get the authenticated user
    const supabase = await createSupabaseAppServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Authentication failed:', authError?.message)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated:', user.id)

    // Parse request body
    let exportConfig: ExportConfig
    try {
      exportConfig = await request.json()
    } catch (error) {
      console.log('❌ Invalid request body:', error)
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate export configuration
    if (!exportConfig.includeWellnessInfo && !exportConfig.includeSummary && !exportConfig.includeTrendCharts) {
      return NextResponse.json(
        { error: 'At least one export option must be selected' },
        { status: 400 }
      )
    }

    if (exportConfig.includeSummary && (!exportConfig.selectedMetrics || exportConfig.selectedMetrics.length === 0)) {
      return NextResponse.json(
        { error: 'At least one metric must be selected when including summary' },
        { status: 400 }
      )
    }

    console.log('📊 Export config:', {
      includeSummary: exportConfig.includeSummary,
      summaryTimeFrame: exportConfig.summaryTimeFrame,
      selectedMetricsCount: exportConfig.selectedMetrics?.length || 0,
      includeTrendCharts: exportConfig.includeTrendCharts,
      includeChartValues: exportConfig.includeChartValues,
      chartCount: exportConfig.trendCharts?.length || 0,
      chartImagesCount: exportConfig.chartImages?.length || 0
    })

    // Log chart images details
    if (exportConfig.chartImages && exportConfig.chartImages.length > 0) {
      console.log('🖼️ Chart images received:', exportConfig.chartImages.map(img => ({
        id: img.id,
        imageSize: img.image.length,
        imageType: img.image.substring(0, 30) + '...'
      })))
    } else {
      console.log('⚠️ No chart images received in request')
    }

    // Generate the PDF export
    const pdfBuffer = await WellnessExportService.generateExport(
      user.id,
      exportConfig
    )

    console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes')

    // Return the PDF as a download
    const filename = `wellness-data-export-${new Date().toISOString().split('T')[0]}.pdf`

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    })

  } catch (error) {
    console.error('❌ Wellness export error:', error)

    const errorMessage = error instanceof Error ? error.message : 'Export failed'

    return NextResponse.json(
      {
        error: 'Export failed',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
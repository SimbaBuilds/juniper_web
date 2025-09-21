import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import { MedicalRecordsExportService } from '@/app/lib/services/MedicalRecordsExportService'

interface ExportRequest {
  recordIds: string[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Medical Records Export API: Starting export request')

    const supabase = await createSupabaseAppServerClient()

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('❌ Authentication failed - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session for access token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      console.log('❌ Session validation failed - returning 401')
      return NextResponse.json(
        { error: 'No valid session token' },
        { status: 401 }
      )
    }

    // Parse request body
    let body: ExportRequest
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { recordIds } = body

    // Validate request
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json(
        { error: 'recordIds array is required and must contain at least one ID' },
        { status: 400 }
      )
    }

    if (recordIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 records allowed per export' },
        { status: 400 }
      )
    }

    // Validate all record IDs are strings
    if (!recordIds.every(id => typeof id === 'string' && id.length > 0)) {
      return NextResponse.json(
        { error: 'All record IDs must be non-empty strings' },
        { status: 400 }
      )
    }

    console.log('✅ Export request validated:', {
      userId: user.id,
      recordCount: recordIds.length
    })

    try {
      // Create export using the service
      const { stream, filename } = await MedicalRecordsExportService.exportRecords(
        user.id,
        recordIds,
        session.access_token
      )

      console.log('✅ Export archive created successfully:', { filename })

      // Set response headers for file download
      const headers = new Headers({
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      })

      // Convert PassThrough stream to ReadableStream for response
      const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk))
          })

          stream.on('end', () => {
            controller.close()
          })

          stream.on('error', (error) => {
            console.error('Stream error:', error)
            controller.error(error)
          })
        },

        cancel() {
          stream.destroy()
        }
      })

      return new Response(readableStream, {
        status: 200,
        headers
      })

    } catch (exportError) {
      console.error('❌ Export service error:', exportError)

      const errorMessage = exportError instanceof Error ? exportError.message : 'Export failed'

      // Return appropriate error based on the message
      if (errorMessage.includes('No exportable files found')) {
        return NextResponse.json(
          { error: 'No exportable files found in selected records' },
          { status: 404 }
        )
      }

      if (errorMessage.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied to one or more requested records' },
          { status: 403 }
        )
      }

      if (errorMessage.includes('No records selected')) {
        return NextResponse.json(
          { error: 'No records selected for export' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: `Export failed: ${errorMessage}` },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Medical Records Export API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to export records.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to export records.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to export records.' },
    { status: 405 }
  )
}
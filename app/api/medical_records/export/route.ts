import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import { MedicalRecordsPDFService } from '@/app/lib/services/MedicalRecordsPDFService'
import * as archiver from 'archiver'
import { PassThrough } from 'stream'

interface ExportRequest {
  recordIds: string[]
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Medical Records Export API: Starting PDF export request')

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
      // Handle single record case - return PDF directly
      if (recordIds.length === 1) {
        console.log('📄 Generating single PDF for record:', recordIds[0])

        const pdfBuffer = await MedicalRecordsPDFService.generateRecordPDF(
          user.id,
          recordIds[0]
        )

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
        const filename = `medical-record-${recordIds[0].substring(0, 8)}-${timestamp}.pdf`

        return new Response(pdfBuffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
      }

      // Handle multiple records - create ZIP with PDFs
      console.log('📦 Generating ZIP with multiple PDFs for records:', recordIds)

      const { pdfBuffers, recordTitles } = await MedicalRecordsPDFService.generateMultipleRecordsPDF(
        user.id,
        recordIds
      )

      if (pdfBuffers.length === 0) {
        return NextResponse.json(
          { error: 'No exportable content found in selected records' },
          { status: 404 }
        )
      }

      // Create ZIP archive
      const archive = archiver('zip', { zlib: { level: 9 } })
      const passThrough = new PassThrough()

      archive.pipe(passThrough)

      // Add each PDF to the archive
      pdfBuffers.forEach((buffer, index) => {
        const safeTitle = recordTitles[index]?.replace(/[^a-zA-Z0-9-_]/g, '_') || `record-${index + 1}`
        const filename = `${safeTitle}.pdf`
        archive.append(buffer, { name: filename })
      })

      await archive.finalize()

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
      const zipFilename = `medical-records-export-${timestamp}.zip`

      console.log('✅ ZIP archive created successfully:', {
        filename: zipFilename,
        recordCount: pdfBuffers.length
      })

      // Convert PassThrough stream to ReadableStream for response
      const readableStream = new ReadableStream({
        start(controller) {
          passThrough.on('data', (chunk) => {
            controller.enqueue(new Uint8Array(chunk))
          })

          passThrough.on('end', () => {
            controller.close()
          })

          passThrough.on('error', (error) => {
            console.error('Stream error:', error)
            controller.error(error)
          })
        },

        cancel() {
          passThrough.destroy()
        }
      })

      return new Response(readableStream, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${zipFilename}"`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

    } catch (exportError) {
      console.error('❌ Export service error:', exportError)

      const errorMessage = exportError instanceof Error ? exportError.message : 'Export failed'

      // Return appropriate error based on the message
      if (errorMessage.includes('not found') || errorMessage.includes('No page content found')) {
        return NextResponse.json(
          { error: 'No exportable content found in selected records' },
          { status: 404 }
        )
      }

      if (errorMessage.includes('Access denied')) {
        return NextResponse.json(
          { error: 'Access denied to one or more requested records' },
          { status: 403 }
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
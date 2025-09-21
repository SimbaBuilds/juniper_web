import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import jsPDF from 'jspdf'
import { format } from 'date-fns'

interface MedicalRecord {
  id: string
  user_id: string
  title: string
  original_file_type: string
  original_filename: string | null
  file_size_bytes: number | null
  num_pages: number
  status: string
  summary: string | null
  metadata: any
  created_at: string
  updated_at: string
}

interface RecordPage {
  id: string
  medical_record_id: string
  page_number: number
  summary: string | null
  content: string
  processed_at: string | null
  created_at: string
  updated_at: string
}

export class MedicalRecordsPDFService {
  /**
   * Generate PDF export of medical record content
   */
  static async generateRecordPDF(
    userId: string,
    recordId: string
  ): Promise<Buffer> {
    console.log('🔄 MedicalRecordsPDFService: Starting PDF generation', {
      userId,
      recordId
    })

    // Fetch record and its pages
    const { record, pages } = await this.fetchRecordWithPages(userId, recordId)

    if (!record) {
      throw new Error('Medical record not found')
    }

    if (!pages || pages.length === 0) {
      throw new Error('No page content found for this medical record')
    }

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    pdf.setFont('helvetica')

    // Add cover page with metadata
    this.addCoverPage(pdf, record)

    // Add content pages
    this.addContentPages(pdf, pages)

    // Add footer to all pages
    this.addFooter(pdf, record.id)

    console.log('✅ PDF generation completed')
    return Buffer.from(pdf.output('arraybuffer'))
  }

  /**
   * Generate ZIP with multiple record PDFs
   */
  static async generateMultipleRecordsPDF(
    userId: string,
    recordIds: string[]
  ): Promise<{ pdfBuffers: Buffer[], recordTitles: string[] }> {
    console.log('🔄 Generating multiple PDFs:', { userId, recordCount: recordIds.length })

    const pdfBuffers: Buffer[] = []
    const recordTitles: string[] = []

    for (const recordId of recordIds) {
      try {
        const buffer = await this.generateRecordPDF(userId, recordId)
        const { record } = await this.fetchRecordWithPages(userId, recordId)

        pdfBuffers.push(buffer)
        recordTitles.push(record?.title || recordId)
      } catch (error) {
        console.warn(`Failed to generate PDF for record ${recordId}:`, error)
        // Continue with other records
      }
    }

    return { pdfBuffers, recordTitles }
  }

  /**
   * Fetch medical record with its pages
   */
  private static async fetchRecordWithPages(
    userId: string,
    recordId: string
  ): Promise<{ record: MedicalRecord | null, pages: RecordPage[] }> {
    const supabase = await createSupabaseAppServerClient()

    // Fetch the medical record
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', userId)
      .single()

    if (recordError) {
      console.error('❌ Error fetching medical record:', recordError)
      throw new Error(`Failed to fetch medical record: ${recordError.message}`)
    }

    // Fetch the record pages
    const { data: pages, error: pagesError } = await supabase
      .from('record_pages')
      .select('*')
      .eq('medical_record_id', recordId)
      .eq('user_id', userId)
      .order('page_number', { ascending: true })

    if (pagesError) {
      console.error('❌ Error fetching record pages:', pagesError)
      throw new Error(`Failed to fetch record pages: ${pagesError.message}`)
    }

    return { record, pages: pages || [] }
  }

  /**
   * Add cover page with medical record metadata
   */
  private static addCoverPage(pdf: jsPDF, record: MedicalRecord): void {
    // Title
    pdf.setFontSize(20)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Medical Record Export', 20, 30)

    // Record title
    pdf.setFontSize(16)
    pdf.setTextColor(59, 130, 246)
    const title = record.title || 'Untitled Record'
    pdf.text(title, 20, 50)

    // Metadata section
    pdf.setFontSize(12)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Record Information', 20, 70)

    pdf.setFontSize(10)
    pdf.setTextColor(102, 102, 102)

    let yPos = 80
    const lineHeight = 8

    if (record.original_filename) {
      pdf.text(`Original Filename: ${record.original_filename}`, 20, yPos)
      yPos += lineHeight
    }

    pdf.text(`File Type: ${record.original_file_type.toUpperCase()}`, 20, yPos)
    yPos += lineHeight

    if (record.file_size_bytes) {
      const sizeText = this.formatFileSize(record.file_size_bytes)
      pdf.text(`File Size: ${sizeText}`, 20, yPos)
      yPos += lineHeight
    }

    pdf.text(`Pages: ${record.num_pages}`, 20, yPos)
    yPos += lineHeight

    pdf.text(`Upload Date: ${format(new Date(record.created_at), 'MMMM d, yyyy')}`, 20, yPos)
    yPos += lineHeight

    pdf.text(`Status: ${record.status}`, 20, yPos)
    yPos += lineHeight * 2

    // Summary section
    if (record.summary) {
      pdf.setFontSize(12)
      pdf.setTextColor(51, 51, 51)
      pdf.text('Summary', 20, yPos)
      yPos += 10

      pdf.setFontSize(10)
      pdf.setTextColor(102, 102, 102)

      // Split summary text to fit within page width
      const summaryLines = pdf.splitTextToSize(record.summary, 170)
      summaryLines.forEach((line: string) => {
        if (yPos > 250) {
          pdf.addPage()
          yPos = 20
        }
        pdf.text(line, 20, yPos)
        yPos += 5
      })
    }

    // Add line before content
    pdf.setDrawColor(200, 200, 200)
    pdf.line(20, 270, 190, 270)

    // Add new page for content
    pdf.addPage()
  }

  /**
   * Add content pages
   */
  private static addContentPages(pdf: jsPDF, pages: RecordPage[]): void {
    let yPos = 20

    // Content title
    pdf.setFontSize(16)
    pdf.setTextColor(51, 51, 51)
    pdf.text('Medical Record Content', 20, yPos)
    yPos += 20

    pages.forEach((page, index) => {
      // Check if we need a new page
      if (yPos > 250) {
        pdf.addPage()
        yPos = 20
      }

      // Page header
      pdf.setFontSize(12)
      pdf.setTextColor(59, 130, 246)
      pdf.text(`Page ${page.page_number}`, 20, yPos)
      yPos += 10

      // Page summary if available
      if (page.summary) {
        pdf.setFontSize(10)
        pdf.setTextColor(102, 102, 102)
        pdf.text('Summary: ', 20, yPos)

        const summaryLines = pdf.splitTextToSize(page.summary, 150)
        summaryLines.forEach((line: string) => {
          if (yPos > 270) {
            pdf.addPage()
            yPos = 20
          }
          pdf.text(line, 40, yPos)
          yPos += 5
        })
        yPos += 5
      }

      // Page content
      pdf.setFontSize(9)
      pdf.setTextColor(51, 51, 51)

      const contentLines = pdf.splitTextToSize(page.content, 170)
      contentLines.forEach((line: string) => {
        if (yPos > 270) {
          pdf.addPage()
          yPos = 20
        }
        pdf.text(line, 20, yPos)
        yPos += 4
      })

      // Add spacing between pages
      yPos += 15

      // Add separator line if not the last page
      if (index < pages.length - 1) {
        if (yPos > 265) {
          pdf.addPage()
          yPos = 20
        }
        pdf.setDrawColor(200, 200, 200)
        pdf.line(20, yPos, 190, yPos)
        yPos += 10
      }
    })
  }

  /**
   * Add footer to all pages
   */
  private static addFooter(pdf: jsPDF, recordId: string): void {
    const pageCount = pdf.getNumberOfPages()
    const exportDate = format(new Date(), 'MMMM d, yyyy')

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)

      pdf.setFontSize(8)
      pdf.setTextColor(102, 102, 102)

      // Left side: page number
      pdf.text(`Page ${i} of ${pageCount}`, 20, 285)

      // Center: export info
      pdf.text(`Exported: ${exportDate}`, 105, 285, { align: 'center' })

      // Right side: record ID
      pdf.text(`Record ID: ${recordId.substring(0, 8)}...`, 190, 285, { align: 'right' })
    }
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }
}
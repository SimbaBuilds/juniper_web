import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import * as archiver from 'archiver'
import { PassThrough } from 'stream'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://mobile-jarvis-backend.onrender.com'

interface MedicalRecordMetadata {
  id: string
  user_id: string
  title: string
  original_file_type: string
  original_filename: string | null
  file_size_bytes: number | null
  upload_url: string | null
  status: 'processing' | 'completed' | 'failed'
}

interface ExportFileInfo {
  filename: string
  url: string
  originalPath: string
}

export class MedicalRecordsExportService {

  /**
   * Main export function that creates a ZIP archive of selected medical records
   */
  static async exportRecords(
    userId: string,
    recordIds: string[],
    accessToken: string
  ): Promise<{ stream: PassThrough; filename: string }> {
    console.log('🔄 MedicalRecordsExportService: Starting export', {
      userId,
      recordCount: recordIds.length
    })

    if (recordIds.length === 0) {
      throw new Error('No records selected for export')
    }

    if (recordIds.length > 50) {
      throw new Error('Maximum 50 records allowed per export')
    }

    // Fetch record metadata from Python backend
    const records = await this.fetchRecordMetadata(recordIds, accessToken)

    // Validate user ownership
    await this.validateUserOwnership(userId, records)

    // Filter only completed records with files
    const exportableRecords = records.filter(record =>
      record.status === 'completed' &&
      record.upload_url &&
      record.original_filename
    )

    if (exportableRecords.length === 0) {
      throw new Error('No exportable files found in selected records')
    }

    console.log('✅ Found exportable records:', exportableRecords.length)

    // Prepare file information
    const fileInfos = await this.prepareFileInfos(exportableRecords)

    // Create ZIP archive
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `medical-records-${timestamp}.zip`

    const zipStream = await this.createZipArchive(fileInfos)

    return { stream: zipStream, filename }
  }

  /**
   * Fetch record metadata from Python backend
   */
  private static async fetchRecordMetadata(
    recordIds: string[],
    accessToken: string
  ): Promise<MedicalRecordMetadata[]> {
    console.log('🔄 Fetching record metadata for', recordIds.length, 'records')

    const records: MedicalRecordMetadata[] = []

    // Fetch each record individually (since we don't have a bulk endpoint)
    for (const recordId of recordIds) {
      try {
        const response = await fetch(`${PYTHON_BACKEND_URL}/api/medical_records/${recordId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          console.warn(`Failed to fetch record ${recordId}:`, response.status)
          continue
        }

        const data = await response.json()
        if (data.record) {
          records.push(data.record)
        }
      } catch (error) {
        console.warn(`Error fetching record ${recordId}:`, error)
        continue
      }
    }

    return records
  }

  /**
   * Validate that user owns all requested records
   */
  private static async validateUserOwnership(
    userId: string,
    records: MedicalRecordMetadata[]
  ): Promise<void> {
    const invalidRecords = records.filter(record => record.user_id !== userId)

    if (invalidRecords.length > 0) {
      throw new Error(`Access denied: User does not own ${invalidRecords.length} of the requested records`)
    }
  }

  /**
   * Prepare file information with fresh signed URLs
   */
  private static async prepareFileInfos(
    records: MedicalRecordMetadata[]
  ): Promise<ExportFileInfo[]> {
    const supabase = await createSupabaseAppServerClient()
    const fileInfos: ExportFileInfo[] = []

    for (const record of records) {
      if (!record.upload_url || !record.original_filename) continue

      try {
        // Extract the file path from the upload URL
        const urlParts = record.upload_url.split('/')
        const bucketIndex = urlParts.findIndex(part => part === 'medical-records')

        if (bucketIndex === -1 || bucketIndex + 1 >= urlParts.length) {
          console.warn(`Could not parse file path from URL: ${record.upload_url}`)
          continue
        }

        // Get the path after 'medical-records' bucket
        const pathParts = urlParts.slice(bucketIndex + 1)
        const filePath = pathParts.join('/').split('?')[0] // Remove query parameters

        console.log('🔄 Generating signed URL for:', filePath)

        // Generate a fresh signed URL
        const { data, error } = await supabase.storage
          .from('medical-records')
          .createSignedUrl(filePath, 3600) // 1 hour expiry

        if (error || !data.signedUrl) {
          console.warn(`Failed to generate signed URL for ${filePath}:`, error?.message)
          continue
        }

        // Create a safe filename for the ZIP
        const safeFilename = this.createSafeFilename(record.original_filename, record.id)

        fileInfos.push({
          filename: safeFilename,
          url: data.signedUrl,
          originalPath: filePath
        })

      } catch (error) {
        console.warn(`Error preparing file info for record ${record.id}:`, error)
        continue
      }
    }

    return fileInfos
  }

  /**
   * Create a safe filename for ZIP entries
   */
  private static createSafeFilename(originalFilename: string, recordId: string): string {
    // Remove path separators and other unsafe characters
    const safeName = originalFilename
      .replace(/[/\\:*?"<>|]/g, '_')
      .replace(/\s+/g, '_')

    // If filename is too long or doesn't have an extension, add record ID
    const maxLength = 200
    if (safeName.length > maxLength || !safeName.includes('.')) {
      const ext = safeName.split('.').pop() || 'bin'
      const baseName = safeName.substring(0, maxLength - 20)
      return `${baseName}_${recordId.substring(0, 8)}.${ext}`
    }

    return safeName
  }

  /**
   * Create ZIP archive from file information
   */
  private static async createZipArchive(fileInfos: ExportFileInfo[]): Promise<PassThrough> {
    console.log('🔄 Creating ZIP archive with', fileInfos.length, 'files')

    const archive = archiver('zip', {
      zlib: { level: 1 } // Fastest compression for large medical files
    })

    const passThrough = new PassThrough()
    archive.pipe(passThrough)

    // Handle archive errors
    archive.on('error', (err) => {
      console.error('Archive error:', err)
      passThrough.destroy(err)
    })

    archive.on('warning', (err) => {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err)
      } else {
        throw err
      }
    })

    // Add files to archive
    for (const fileInfo of fileInfos) {
      try {
        console.log('📁 Adding file to archive:', fileInfo.filename)

        // Fetch file from Supabase
        const response = await fetch(fileInfo.url)

        if (!response.ok) {
          console.warn(`Failed to fetch file ${fileInfo.filename}:`, response.status)
          continue
        }

        if (!response.body) {
          console.warn(`No body in response for ${fileInfo.filename}`)
          continue
        }

        // Convert ReadableStream to Node.js Readable
        const webStream = response.body
        const nodeStream = new PassThrough()

        // Stream the file into the archive
        archive.append(nodeStream, { name: fileInfo.filename })

        // Pipe web stream to node stream
        const reader = webStream.getReader()

        const pump = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) {
                nodeStream.end()
                break
              }
              nodeStream.write(Buffer.from(value))
            }
          } catch (error) {
            console.error(`Error streaming file ${fileInfo.filename}:`, error)
            nodeStream.destroy(error as Error)
          }
        }

        pump()

      } catch (error) {
        console.warn(`Error adding file ${fileInfo.filename} to archive:`, error)
        continue
      }
    }

    // Finalize the archive
    archive.finalize()

    return passThrough
  }
}
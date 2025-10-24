'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MedicalRecordsStorageService, FileMetadata } from '@/app/lib/services/MedicalRecordsStorageService'
import { createClient } from '@/lib/utils/supabase/client'

interface UploadedFile {
  file: File
  id: string
  status: 'pending' | 'uploading' | 'uploaded' | 'processing' | 'completed' | 'failed'
  progress: number
  error?: string
  url?: string
}

interface ProcessingResult {
  success: boolean
  message: string
  processed_records: any[]
  failed_records: any[]
  total_pages: number
  total_files: number
  processing_time: number
  request_id: string
}

interface MedicalRecordsUploadProps {
  onUploadComplete?: () => void
}

export function MedicalRecordsUpload({ onUploadComplete }: MedicalRecordsUploadProps) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const validateFile = (file: File): string | null => {
    if (!MedicalRecordsStorageService.isSupportedFileType(file.type)) {
      return `${file.name}: Unsupported file type. Please use ${MedicalRecordsStorageService.getSupportedFileTypesText()}`
    }

    if (file.size > MedicalRecordsStorageService.getFileSizeLimit()) {
      return `${file.name}: File size exceeds 50MB limit`
    }

    return null
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles = Array.from(selectedFiles)
    const currentFileCount = files.length
    const totalFiles = currentFileCount + newFiles.length

    if (totalFiles > MedicalRecordsStorageService.getMaxFileCount()) {
      setError(`Maximum ${MedicalRecordsStorageService.getMaxFileCount()} files allowed. You currently have ${currentFileCount} files.`)
      return
    }

    setError(null)

    const validatedFiles: UploadedFile[] = []

    for (const file of newFiles) {
      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        continue
      }

      validatedFiles.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        progress: 0
      })
    }

    if (validatedFiles.length > 0) {
      setFiles(prev => [...prev, ...validatedFiles])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setError(null)
  }

  const uploadFile = async (uploadedFile: UploadedFile): Promise<FileMetadata | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('User not authenticated')
    }

    setFiles(prev => prev.map(f =>
      f.id === uploadedFile.id
        ? { ...f, status: 'uploading' as const, progress: 10 }
        : f
    ))

    const result = await MedicalRecordsStorageService.uploadMedicalRecord(
      user.id,
      uploadedFile.file
    )

    if (!result.success || !result.fileUrl) {
      throw new Error(result.error || 'Upload failed')
    }

    setFiles(prev => prev.map(f =>
      f.id === uploadedFile.id
        ? { ...f, status: 'uploaded' as const, progress: 100, url: result.fileUrl }
        : f
    ))

    return {
      url: result.fileUrl,
      file_type: MedicalRecordsStorageService.getFileExtension(uploadedFile.file.type),
      filename: uploadedFile.file.name,
      size_bytes: uploadedFile.file.size
    }
  }

  const processFiles = async () => {
    if (files.length === 0) return

    setIsProcessing(true)
    setError(null)
    setProcessingResult(null)

    try {
      const fileMetadata: FileMetadata[] = []

      for (const file of files) {
        if (file.status === 'pending') {
          const metadata = await uploadFile(file)
          if (metadata) {
            fileMetadata.push(metadata)
          }
        } else if (file.status === 'uploaded' && file.url) {
          fileMetadata.push({
            url: file.url,
            file_type: MedicalRecordsStorageService.getFileExtension(file.file.type),
            filename: file.file.name,
            size_bytes: file.file.size
          })
        }
      }

      if (fileMetadata.length === 0) {
        throw new Error('No files to process')
      }

      setFiles(prev => prev.map(f => ({ ...f, status: 'processing' as const })))

      const payload = {
        files: fileMetadata,
        request_id: `web-medical-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }

      const response = await fetch('/api/process_medical_records', {
        method: 'POST',
        body: (() => {
          const formData = new FormData()
          formData.append('json_data', JSON.stringify(payload))
          return formData
        })()
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      const result: ProcessingResult = await response.json()
      setProcessingResult(result)

      if (result.success) {
        setFiles(prev => prev.map(f => ({ ...f, status: 'completed' as const })))
        // Trigger refresh of medical records list
        if (onUploadComplete) {
          onUploadComplete()
        }
      } else {
        setFiles(prev => prev.map(f => ({ ...f, status: 'failed' as const })))
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed'
      setError(errorMessage)
      setFiles(prev => prev.map(f => ({ ...f, status: 'failed' as const })))
    } finally {
      setIsProcessing(false)
    }
  }

  const clearAll = () => {
    setFiles([])
    setError(null)
    setProcessingResult(null)
  }

  const getFileIcon = (file: File) => {
    return <FileText className="h-8 w-8 text-blue-500" />
  }

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="h-4 w-4 text-gray-400" />
      case 'uploading':
      case 'processing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'uploaded':
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const canProcess = files.length > 0 && !isProcessing && files.some(f => f.status === 'pending' || f.status === 'uploaded')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Medical Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Upload medical files for Juniper to analyze and use in wellness related conversations and tasks. <br />
          Have a MyChart account?  Look for a "Sharing Hub" or "Download All" section to download your records.
        </div>

        <div className="text-sm font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
          We do not share your data with advertisers or health care providers - see full{' '}
          <a href="https://juniperassistant.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800 dark:hover:text-green-200">
            privacy policy
          </a>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/10'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Supports PDF, PNG, JPEG, CSV, TXT, RTF, DOCX, DOC, and MD files up to 50MB each. 8 files per upload.
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.csv"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Selected Files ({files.length}/8)</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={isProcessing}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {files.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
                >
                  {getFileIcon(uploadedFile.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(uploadedFile.file.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    {uploadedFile.status === 'uploading' && (
                      <Progress value={uploadedFile.progress} className="mt-1" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(uploadedFile.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(uploadedFile.id)}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={processFiles}
                disabled={!canProcess}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Process Medical Records
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {processingResult && (
          <Alert className={processingResult.success ? 'border-green-200 bg-green-50 dark:bg-green-950/10' : 'border-red-200 bg-red-50 dark:bg-red-950/10'}>
            {processingResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{processingResult.message}</p>
                {processingResult.success && (
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    {/* <p>✅ Processed {processingResult.total_files} files with {processingResult.total_pages} total pages</p>
                    <p>⏱️ Processing time: {processingResult.processing_time.toFixed(1)}s</p> */}
                  </div>
                )}
                {processingResult.failed_records && processingResult.failed_records.length > 0 && (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    <p>Failed files:</p>
                    <ul className="list-disc list-inside">
                      {processingResult.failed_records.map((failure: any, index: number) => (
                        <li key={index}>{failure.file_metadata?.filename}: {failure.error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
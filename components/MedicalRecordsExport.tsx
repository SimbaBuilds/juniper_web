'use client'

import React, { useState } from 'react'
import { Download, CheckCircle, FileText, Calendar, Loader2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { format } from 'date-fns'
import { saveAs } from 'file-saver'

interface MedicalRecord {
  id: string
  user_id: string
  title: string
  original_file_type: string
  original_filename: string | null
  file_size_bytes: number | null
  num_pages: number
  status: 'processing' | 'completed' | 'failed'
  upload_url: string | null
  summary: string | null
  metadata: any
  created_at: string
  updated_at: string
}

interface MedicalRecordsExportProps {
  records: MedicalRecord[]
  onExportStart?: () => void
  onExportComplete?: () => void
  onExportError?: (error: string) => void
}

export function MedicalRecordsExport({
  records,
  onExportStart,
  onExportComplete,
  onExportError
}: MedicalRecordsExportProps) {
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(new Set())
  const [isExporting, setIsExporting] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filter to only show completed records with files
  const exportableRecords = records.filter(record =>
    record.status === 'completed' &&
    record.upload_url &&
    record.original_filename
  )

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const handleSelectAll = () => {
    setSelectedRecords(new Set(exportableRecords.map(record => record.id)))
  }

  const handleSelectNone = () => {
    setSelectedRecords(new Set())
  }

  const handleRecordToggle = (recordId: string) => {
    const newSelected = new Set(selectedRecords)
    if (newSelected.has(recordId)) {
      newSelected.delete(recordId)
    } else {
      newSelected.add(recordId)
    }
    setSelectedRecords(newSelected)
  }

  const handleExport = async () => {
    if (selectedRecords.size === 0) {
      setError('Please select at least one record to export')
      return
    }

    setIsExporting(true)
    setError(null)
    onExportStart?.()

    try {
      const response = await fetch('/api/medical_records/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recordIds: Array.from(selectedRecords)
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Export failed with status ${response.status}`)
      }

      // Get the filename from the response headers
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'medical-records-export.zip'

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      // Download the file
      const blob = await response.blob()
      saveAs(blob, filename)

      // Reset selection and close dropdown
      setSelectedRecords(new Set())
      setIsDropdownOpen(false)
      onExportComplete?.()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Export failed'
      setError(errorMessage)
      onExportError?.(errorMessage)
    } finally {
      setIsExporting(false)
    }
  }

  if (exportableRecords.length === 0) {
    return (
      <Button variant="outline" disabled className="opacity-50">
        <Download className="h-4 w-4 mr-2" />
        Export Records
      </Button>
    )
  }

  const selectedCount = selectedRecords.size
  const totalCount = exportableRecords.length

  return (
    <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export Records
              {selectedCount > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {selectedCount}
                </Badge>
              )}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-96 p-0"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <div className="p-4 border-b">
          <h3 className="font-medium text-sm mb-3">Select Records to Export</h3>

          <div className="flex gap-2 mb-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={isExporting}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectNone}
              disabled={isExporting}
            >
              Select None
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            {selectedCount} of {totalCount} records selected
          </div>
        </div>

        <ScrollArea className="max-h-80">
          <div className="p-2">
            {exportableRecords.map((record) => (
              <div
                key={record.id}
                className="flex items-start space-x-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                onClick={() => handleRecordToggle(record.id)}
              >
                <Checkbox
                  checked={selectedRecords.has(record.id)}
                  onChange={() => handleRecordToggle(record.id)}
                  disabled={isExporting}
                  className="mt-1"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-3 w-3 text-blue-500 flex-shrink-0" />
                    <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                  </div>

                  {record.original_filename && (
                    <p className="text-sm font-medium truncate mb-1">
                      {record.original_filename}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.created_at), 'MMM d, yyyy')}
                    </span>
                    <span>{record.original_file_type.toUpperCase()}</span>
                    <span>{formatFileSize(record.file_size_bytes)}</span>
                  </div>

                  {record.summary && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {record.summary}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="p-4 border-t">
          {error && (
            <Alert variant="destructive" className="mb-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleExport}
            disabled={selectedCount === 0 || isExporting}
            className="w-full"
            size="sm"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating Export...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {selectedCount} Record{selectedCount === 1 ? '' : 's'}
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground mt-2 text-center">
            Original files will be downloaded as a ZIP archive
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
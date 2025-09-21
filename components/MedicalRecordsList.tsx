'use client'

import React, { useState, useEffect } from 'react'
import { FileText, Calendar, Download, Trash2, Eye, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { MedicalRecordsExport } from '@/components/MedicalRecordsExport'

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

interface MedicalRecordsListProps {
  refreshTrigger?: number
}

export function MedicalRecordsList({ refreshTrigger }: MedicalRecordsListProps) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecords = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/medical_records')

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication required')
        }
        if (response.status === 404) {
          throw new Error('Medical records service not available')
        }
        throw new Error(`Failed to fetch records: ${response.status}`)
      }

      const data = await response.json()
      setRecords(data.records || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load medical records'
      setError(errorMessage)
      console.error('Error fetching medical records:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [refreshTrigger])

  const getStatusIcon = (status: MedicalRecord['status']) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: MedicalRecord['status']) => {
    switch (status) {
      case 'processing':
        return <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-300">Processing</Badge>
      case 'completed':
        return null // Don't show badge for completed status
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return 'Unknown size'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  const handleDelete = async (recordId: string) => {
    if (!confirm('Are you sure you want to delete this medical record? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/medical_records/${recordId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete record')
      }

      // Refresh the list
      await fetchRecords()
    } catch (err) {
      console.error('Error deleting medical record:', err)
      alert('Failed to delete medical record. Please try again.')
    }
  }

  const handleView = (record: MedicalRecord) => {
    if (record.upload_url) {
      window.open(record.upload_url, '_blank')
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading medical records...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No medical records uploaded</h3>
          <p className="text-muted-foreground">
            Upload your first medical record using the form above to get started.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Your Medical Records ({records.length})</h3>
        <div className="flex items-center gap-2">
          <MedicalRecordsExport
            records={records}
            onExportStart={() => console.log('Export started')}
            onExportComplete={() => console.log('Export completed')}
            onExportError={(error) => console.error('Export error:', error)}
          />
          <Button variant="outline" size="sm" onClick={fetchRecords}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {records.map((record) => (
          <Card key={record.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <FileText className="h-5 w-5 text-blue-500 mt-1 flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(record.status)}
                  </div>

                  {record.original_filename && (
                    <p className="text-sm text-muted-foreground truncate mb-1">
                      {record.original_filename}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.created_at), 'MMM d, yyyy')}
                    </span>
                    <span>{record.original_file_type.toUpperCase()}</span>
                    <span>{formatFileSize(record.file_size_bytes)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(record.status)}
                  </div>

                  {record.summary && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {record.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 ml-4">
                {record.status === 'completed' && record.upload_url && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(record)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>View document</TooltipContent>
                  </Tooltip>
                )}

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete record</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Save, X, Edit2, ChevronDown, ChevronUp, Heart } from 'lucide-react'

interface UserWellnessData {
  id?: string
  user_id?: string
  goals: string
  status_progress: string
  fav_activities: string
  misc_info: string
  created_at?: string
  updated_at?: string
}

export function UserWellnessForm() {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<UserWellnessData>({
    goals: '',
    status_progress: '',
    fav_activities: '',
    misc_info: ''
  })

  const [originalData, setOriginalData] = useState<UserWellnessData>({
    goals: '',
    status_progress: '',
    fav_activities: '',
    misc_info: ''
  })

  // Fetch wellness data on mount
  useEffect(() => {
    fetchWellnessData()
  }, [])

  const fetchWellnessData = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/user-wellness')

      if (!response.ok) {
        throw new Error('Failed to fetch wellness data')
      }

      const result = await response.json()

      if (result.data) {
        const data = result.data
        setFormData(data)
        setOriginalData(data)
      }
    } catch (err) {
      console.error('Error fetching wellness data:', err)
      setError('Failed to load wellness data')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Validate misc_info length
      if (formData.misc_info && formData.misc_info.length > 2000) {
        setError('Miscellaneous info must be less than 2000 characters')
        return
      }

      const response = await fetch('/api/user-wellness', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          goals: formData.goals,
          status_progress: formData.status_progress,
          fav_activities: formData.fav_activities,
          misc_info: formData.misc_info
        })
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to save wellness data')
      }

      const result = await response.json()
      setFormData(result.data)
      setOriginalData(result.data)
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving wellness data:', err)
      setError(err instanceof Error ? err.message : 'Failed to save wellness data')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(originalData)
    setIsEditing(false)
    setError(null)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const hasContent = formData.goals || formData.status_progress || formData.fav_activities || formData.misc_info

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Personal Wellness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Personal Wellness
            </CardTitle>
            <CardDescription>
              Auto-included in every wellness related chat with Juniper.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && hasContent && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="h-8 px-3"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 px-2"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Collapse
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expand
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Goals */}
            <div className="space-y-2">
              <Label htmlFor="goals" className="text-sm font-medium">
                Goals
              </Label>
              {isEditing ? (
                <Textarea
                  id="goals"
                  placeholder="What are your wellness goals?"
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  className="min-h-[100px]"
                  disabled={saving}
                />
              ) : (
                <div className="min-h-[100px] p-3 rounded-md border bg-muted/50">
                  {formData.goals ? (
                    <p className="text-sm whitespace-pre-wrap">{formData.goals}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No goals set yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Status & Progress */}
            <div className="space-y-2">
              <Label htmlFor="status_progress" className="text-sm font-medium">
                Status & Progress
              </Label>
              {isEditing ? (
                <Textarea
                  id="status_progress"
                  placeholder="How are you progressing towards your goals?"
                  value={formData.status_progress}
                  onChange={(e) => setFormData({ ...formData, status_progress: e.target.value })}
                  className="min-h-[100px]"
                  disabled={saving}
                />
              ) : (
                <div className="min-h-[100px] p-3 rounded-md border bg-muted/50">
                  {formData.status_progress ? (
                    <p className="text-sm whitespace-pre-wrap">{formData.status_progress}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No progress notes yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Favorite Activities */}
            <div className="space-y-2">
              <Label htmlFor="fav_activities" className="text-sm font-medium">
                Favorite Activities
              </Label>
              {isEditing ? (
                <Textarea
                  id="fav_activities"
                  placeholder="What activities do you enjoy for wellness?"
                  value={formData.fav_activities}
                  onChange={(e) => setFormData({ ...formData, fav_activities: e.target.value })}
                  className="min-h-[100px]"
                  disabled={saving}
                />
              ) : (
                <div className="min-h-[100px] p-3 rounded-md border bg-muted/50">
                  {formData.fav_activities ? (
                    <p className="text-sm whitespace-pre-wrap">{formData.fav_activities}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No activities listed yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Miscellaneous Info */}
            <div className="space-y-2">
              <Label htmlFor="misc_info" className="text-sm font-medium">
                Miscellaneous Info
              </Label>
              {isEditing ? (
                <>
                  <Textarea
                    id="misc_info"
                    placeholder="Any other wellness-related information..."
                    value={formData.misc_info}
                    onChange={(e) => {
                      if (e.target.value.length <= 2000) {
                        setFormData({ ...formData, misc_info: e.target.value })
                      }
                    }}
                    className="min-h-[100px]"
                    disabled={saving}
                    maxLength={2000}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {formData.misc_info.length}/2000 characters
                  </p>
                </>
              ) : (
                <div className="min-h-[100px] p-3 rounded-md border bg-muted/50">
                  {formData.misc_info ? (
                    <p className="text-sm whitespace-pre-wrap">{formData.misc_info}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No additional info yet</p>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Show edit button at bottom if not editing and no content */}
            {!isEditing && !hasContent && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Add Wellness Information
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

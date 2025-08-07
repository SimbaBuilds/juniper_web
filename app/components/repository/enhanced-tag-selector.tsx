'use client'

import React, { useState, useEffect } from 'react'
import { Tag } from '@/lib/utils/supabase/tables'
import { createClient } from '@/lib/utils/supabase/client'
import { X, ChevronDown, Loader2 } from 'lucide-react'

interface EnhancedTagSelectorProps {
  selectedTags: Tag[]
  userId: string
  onTagsChange: (tags: Tag[]) => void
  disabled?: boolean
  maxTags?: number
}

interface TagsByType {
  general: Tag[]
  service: Tag[]
  service_type: Tag[]
  user_created: Tag[]
}

export function EnhancedTagSelector({ 
  selectedTags, 
  userId, 
  onTagsChange, 
  disabled = false,
  maxTags = 4
}: EnhancedTagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [tagsByType, setTagsByType] = useState<TagsByType>({
    general: [],
    service: [],
    service_type: [],
    user_created: []
  })

  // Load tags from database
  const loadTags = async () => {
    if (!userId) return
    
    try {
      setLoading(true)
      const supabase = createClient()

      // Load all tag types in parallel
      const [generalResult, serviceResult, serviceTypeResult, userResult] = await Promise.all([
        supabase.from('tags').select('*').eq('type', 'general').order('name'),
        supabase.from('tags').select('*').eq('type', 'service').order('name'),
        supabase.from('tags').select('*').eq('type', 'service_type').order('name'),
        supabase.from('tags').select('*').eq('type', 'user_created').eq('user_id', userId).order('name')
      ])

      setTagsByType({
        general: generalResult.data || [],
        service: serviceResult.data || [],
        service_type: serviceTypeResult.data || [],
        user_created: userResult.data || []
      })
    } catch (error) {
      console.error('Error loading tags:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadTags()
    }
  }, [isOpen, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTagToggle = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id)
    
    if (isSelected) {
      onTagsChange(selectedTags.filter(t => t.id !== tag.id))
    } else {
      if (selectedTags.length >= maxTags) {
        alert(`You can only select up to ${maxTags} tags per resource.`)
        return
      }
      onTagsChange([...selectedTags, tag])
    }
  }

  const renderTagSection = (title: string, tags: Tag[]) => {
    if (tags.length === 0) return null

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground">{title}</h4>
          <span className="text-xs text-muted-foreground">({tags.length})</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {tags.map((tag) => {
            const isSelected = selectedTags.some(t => t.id === tag.id)
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleTagToggle(tag)}
                className={`px-3 py-2 text-sm rounded-md border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-background border-border hover:bg-accent hover:border-accent-foreground'
                }`}
              >
                <span className="truncate block">{tag.name}</span>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-foreground mb-2">
        Tags ({selectedTags.length}/{maxTags})
      </label>
      
      {/* Selected Tags Display */}
      <div
        className={`w-full min-h-[48px] px-3 py-2 border border-border rounded-md bg-background cursor-pointer transition-all ${
          disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : isOpen 
              ? 'border-primary ring-2 ring-primary/20' 
              : 'hover:border-primary/50'
        }`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-wrap gap-1.5 mr-2">
            {selectedTags.length === 0 ? (
              <span className="text-muted-foreground py-1">Select tags...</span>
            ) : (
              selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border border-border"
                >
                  <span className="max-w-24 truncate">{tag.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleTagToggle(tag)
                    }}
                    className="ml-1.5 hover:bg-destructive hover:text-destructive-foreground rounded-sm w-4 h-4 flex items-center justify-center transition-colors"
                    disabled={disabled}
                    title={`Remove ${tag.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))
            )}
          </div>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-background border border-border rounded-md shadow-xl overflow-hidden flex flex-col" style={{ maxHeight: 'min(24rem, 50vh)' }}>
          <div className="flex-1 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <div className="p-4 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading tags...</span>
                </div>
              ) : (
                <>
                  {renderTagSection('General', tagsByType.general)}
                  {renderTagSection('Services', tagsByType.service)}
                  {renderTagSection('Service Types', tagsByType.service_type)}
                  {renderTagSection('My Tags', tagsByType.user_created)}
                  
                  {Object.values(tagsByType).every(tags => tags.length === 0) && (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">No tags available</p>
                    </div>
                  )}
                  
                  {/* Add some padding at the bottom to ensure smooth scrolling */}
                  <div className="h-4" />
                </>
              )}
            </div>
          </div>
          
          {/* Sticky footer with close button */}
          <div className="border-t border-border bg-background/95 backdrop-blur-sm p-4">
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {selectedTags.length} of {maxTags} tags selected
                </span>
                {selectedTags.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    Click tags to remove them
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
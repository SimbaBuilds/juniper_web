'use client'

import { useState, useEffect } from 'react'
import { ResourceType, RESOURCE_TYPES, MAX_CONTENT_LENGTH, MAX_INSTRUCTIONS_LENGTH } from '@/app/lib/repository/types'
import { Resource, Tag } from '@/lib/utils/supabase/tables'
import { EnhancedTagSelector } from './enhanced-tag-selector'
import { createClient } from '@/lib/utils/supabase/client'
import { Pencil, ChevronDown, ChevronUp } from 'lucide-react'

interface EditResourceSectionProps {
  resource: Resource & { tags?: Tag[] }
  onSave: (resource: Partial<Resource>, tagIds: string[]) => void
  onCancel: () => void
}

export function EditResourceSection({ resource, onSave, onCancel }: EditResourceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: resource.title || '',
    content: resource.content,
    instructions: resource.instructions || '',
    type: resource.type as ResourceType,
    tags: resource.tags || []
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Get current user
  useEffect(() => {
    const getCurrentUser = async () => {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user && !error) {
        setUserId(user.id)
      }
    }
    getCurrentUser()
  }, [])

  // Load existing resource tags
  useEffect(() => {
    const loadResourceTags = async () => {
      if (userId) {
        const supabase = createClient()
        
        // Get the tag IDs from the resource
        const tagIds = [
          resource.tag_1_id,
          resource.tag_2_id, 
          resource.tag_3_id,
          resource.tag_4_id,
          resource.tag_5_id
        ].filter(Boolean)
        
        if (tagIds.length > 0) {
          const { data: tags } = await supabase
            .from('tags')
            .select('*')
            .in('id', tagIds)
          
          if (tags) {
            setFormData(prev => ({ ...prev, tags }))
          }
        }
      }
    }
    loadResourceTags()
  }, [resource, userId])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required'
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Content is required'
    }
    
    if (formData.content.length > MAX_CONTENT_LENGTH) {
      newErrors.content = `Content must be ${MAX_CONTENT_LENGTH} characters or less`
    }
    
    if (formData.instructions.length > MAX_INSTRUCTIONS_LENGTH) {
      newErrors.instructions = `Instructions must be ${MAX_INSTRUCTIONS_LENGTH} characters or less`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    const resourceData: Partial<Resource> = {
      id: resource.id,
      title: formData.title,
      content: formData.content,
      instructions: formData.instructions || undefined,
      type: formData.type,
      relevance_score: resource.relevance_score,
      decay_factor: resource.decay_factor,
      auto_committed: resource.auto_committed,
      last_accessed: new Date(),
      updated_at: new Date()
    }

    const tagIds = formData.tags.map(tag => tag.id)
    onSave(resourceData, tagIds)
  }

  const handleCancelEdit = () => {
    setFormData({
      title: resource.title || '',
      content: resource.content,
      instructions: resource.instructions || '',
      type: resource.type as ResourceType,
      tags: resource.tags || []
    })
    setErrors({})
    onCancel()
  }

  const handleTagsChange = (tags: Tag[]) => {
    setFormData(prev => ({ ...prev, tags }))
  }

  return (
    <div className="bg-accent/30 rounded-lg border border-border">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-primary" />
          <span className="text-lg font-medium text-foreground">Edit Resource: {resource.title}</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Enter resource title"
                />
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ResourceType }))}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {RESOURCE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content * ({formData.content.length}/{MAX_CONTENT_LENGTH})
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter resource content"
              />
              {errors.content && <p className="text-red-500 text-sm mt-1">{errors.content}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Instructions ({formData.instructions.length}/{MAX_INSTRUCTIONS_LENGTH})
              </label>
              <input
                type="text"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Usage instructions (optional)"
              />
              {errors.instructions && <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>}
            </div>

            {userId && (
              <EnhancedTagSelector
                selectedTags={formData.tags}
                userId={userId}
                onTagsChange={handleTagsChange}
                maxTags={4}
              />
            )}

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { ResourceType, RESOURCE_TYPES, MAX_CONTENT_LENGTH, MAX_INSTRUCTIONS_LENGTH, PREDEFINED_TAGS, MAX_RESOURCE_TAGS } from '@/app/lib/repository/types'
import { Resource } from '@/lib/utils/supabase/tables'

interface ResourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (resource: Partial<Resource>) => void
  resource?: Resource | null
  mode: 'add' | 'edit'
}

export function ResourceModal({ isOpen, onClose, onSave, resource, mode }: ResourceModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    instructions: '',
    type: 'memory' as ResourceType,
    tags: [] as string[]
  })
  
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (resource && mode === 'edit') {
      setFormData({
        title: resource.title || '',
        content: resource.content,
        instructions: resource.instructions || '',
        type: resource.type as ResourceType,
        tags: [] // Tags handled separately since they're stored as tag_1_id, etc.
      })
    } else {
      setFormData({
        title: '',
        content: '',
        instructions: '',
        type: 'memory',
        tags: []
      })
    }
    setErrors({})
  }, [resource, mode, isOpen])

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
      title: formData.title,
      content: formData.content,
      instructions: formData.instructions || undefined,
      type: formData.type,
      ...(mode === 'edit' && resource ? { id: resource.id } : {}),
      relevance_score: resource?.relevance_score || 100,
      decay_factor: resource?.decay_factor || 0.8,
      auto_committed: resource?.auto_committed || false,
      last_accessed: new Date(),
      updated_at: new Date(),
      ...(mode === 'add' ? { created_at: new Date() } : {})
    }

    onSave(resourceData)
    onClose()
  }

  const handleTagToggle = (tag: string) => {
    if (formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: prev.tags.filter(t => t !== tag)
      }))
    } else if (formData.tags.length < MAX_RESOURCE_TAGS) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-foreground">
              {mode === 'add' ? 'Add Resource' : 'Edit Resource'}
            </h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Content * ({formData.content.length}/{MAX_CONTENT_LENGTH})
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                rows={8}
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

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Tags ({formData.tags.length}/{MAX_RESOURCE_TAGS})
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary text-primary-foreground"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className="ml-2 hover:bg-primary/80 rounded-full w-4 h-4 flex items-center justify-center"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                
                <div className="border border-border rounded-md p-3">
                  <div className="text-sm font-medium text-foreground mb-2">Available Tags:</div>
                  <div className="flex flex-wrap gap-2">
                    {PREDEFINED_TAGS.filter(tag => !formData.tags.includes(tag)).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        disabled={formData.tags.length >= MAX_RESOURCE_TAGS}
                        className="px-3 py-1 text-sm border border-border rounded-full hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-accent"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                {mode === 'add' ? 'Add Resource' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
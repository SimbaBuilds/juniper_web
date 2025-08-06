'use client'

import { useState, useMemo } from 'react'
import { Resource, ResourceType, RESOURCE_TYPES, PREDEFINED_TAGS } from '@/app/lib/repository/types'
import { ResourceModal } from '@/app/components/repository/resource-modal'

// Mock data - in real app this would come from API
const mockResources: Resource[] = [
  {
    id: '1',
    user_id: 'user1',
    title: 'Project Planning Meeting Notes',
    content: 'Discussed project timeline, resource allocation, and key milestones. Action items: 1) Finalize budget by Friday, 2) Schedule stakeholder review, 3) Update project documentation. Key decisions: Moving forward with agile methodology, weekly sprint reviews.',
    instructions: 'Use for project reference',
    type: 'memory',
    relevance_score: 95,
    decay_factor: 1,
    auto_committed: false,
    tags: ['Work', 'Project', 'Meeting'],
    last_accessed: new Date('2024-01-20T10:30:00Z'),
    created_at: new Date('2024-01-15T09:00:00Z'),
    updated_at: new Date('2024-01-15T09:00:00Z')
  },
  {
    id: '2',
    user_id: 'user1',
    title: 'API Integration Code Sample',
    content: 'const fetchData = async () => {\n  try {\n    const response = await fetch(\'/api/data\');\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error(\'Error fetching data:\', error);\n  }\n};',
    instructions: 'Reusable API pattern',
    type: 'sample',
    relevance_score: 88,
    decay_factor: 1,
    auto_committed: true,
    tags: ['Work', 'Documentation'],
    last_accessed: new Date('2024-01-19T14:15:00Z'),
    created_at: new Date('2024-01-10T11:00:00Z'),
    updated_at: new Date('2024-01-12T15:30:00Z')
  },
  {
    id: '3',
    user_id: 'user1',
    title: 'Design System Guidelines',
    content: 'Color palette: Primary #3B82F6, Secondary #6B7280. Typography: Headings use Inter Bold, body text uses Inter Regular. Spacing follows 8px grid system. Component variants must maintain accessibility standards.',
    type: 'reference',
    relevance_score: 92,
    decay_factor: 1,
    auto_committed: false,
    tags: ['Work', 'Documentation', 'Important'],
    last_accessed: new Date('2024-01-18T16:45:00Z'),
    created_at: new Date('2024-01-08T13:20:00Z'),
    updated_at: new Date('2024-01-08T13:20:00Z')
  },
  {
    id: '4',
    user_id: 'user1',
    title: 'Weekend Plans',
    content: 'Visit the farmers market, try new hiking trail, dinner with friends at 7pm. Don\'t forget to pick up groceries and call mom.',
    type: 'note',
    relevance_score: 45,
    decay_factor: 1,
    auto_committed: false,
    tags: ['Personal'],
    last_accessed: new Date('2024-01-17T20:00:00Z'),
    created_at: new Date('2024-01-14T18:30:00Z'),
    updated_at: new Date('2024-01-14T18:30:00Z')
  },
  {
    id: '5',
    user_id: 'user1',
    title: 'Low Relevance Old Note',
    content: 'This is an old note that has become less relevant over time.',
    type: 'note',
    relevance_score: 8,
    decay_factor: 1,
    auto_committed: false,
    tags: ['Archive'],
    last_accessed: new Date('2024-01-05T12:00:00Z'),
    created_at: new Date('2024-01-01T10:00:00Z'),
    updated_at: new Date('2024-01-01T10:00:00Z')
  }
];

function formatLastAccessed(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 24) {
    return `${Math.floor(diffHours)} hours ago`;
  } else if (diffDays < 7) {
    return `${Math.floor(diffDays)} days ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export default function RepositoryPage() {
  const [resources, setResources] = useState<Resource[]>(mockResources)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingResource, setEditingResource] = useState<Resource | null>(null)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<ResourceType | 'all'>('all')
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set())
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['memory', 'sample', 'reference', 'note']))

  // Filter resources based on selected tags and type
  const filteredResources = useMemo(() => {
    return resources.filter(resource => {
      const matchesType = selectedType === 'all' || resource.type === selectedType
      const matchesTags = selectedTags.length === 0 || selectedTags.every(tag => resource.tags.includes(tag))
      return matchesType && matchesTags
    })
  }, [resources, selectedType, selectedTags])

  // Group resources by type
  const resourcesByType = useMemo(() => {
    const grouped = RESOURCE_TYPES.reduce((acc, type) => {
      acc[type.value] = filteredResources.filter(r => r.type === type.value)
      return acc
    }, {} as Record<ResourceType, Resource[]>)
    return grouped
  }, [filteredResources])

  // Get expiring resources (relevance_score < 10)
  const expiringResources = useMemo(() => {
    return filteredResources.filter(r => r.relevance_score < 10)
  }, [filteredResources])

  const handleAddResource = () => {
    setEditingResource(null)
    setModalMode('add')
    setIsModalOpen(true)
  }

  const handleEditResource = (resource: Resource) => {
    setEditingResource(resource)
    setModalMode('edit')
    setIsModalOpen(true)
  }

  const handleSaveResource = (resourceData: Partial<Resource>) => {
    if (modalMode === 'add') {
      const newResource: Resource = {
        id: Date.now().toString(),
        user_id: 'user1',
        relevance_score: 100,
        decay_factor: 1,
        auto_committed: false,
        last_accessed: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
        ...resourceData
      } as Resource

      setResources(prev => [newResource, ...prev])
    } else if (modalMode === 'edit' && editingResource) {
      setResources(prev => prev.map(r => 
        r.id === editingResource.id 
          ? { ...r, ...resourceData, updated_at: new Date() }
          : r
      ))
    }
  }

  const handleDeleteResource = (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource?')) {
      setResources(prev => prev.filter(r => r.id !== resourceId))
    }
  }

  const handleResetRelevance = (resourceId: string) => {
    setResources(prev => prev.map(r => 
      r.id === resourceId 
        ? { ...r, relevance_score: 100, updated_at: new Date() }
        : r
    ))
  }

  const toggleResourceExpansion = (resourceId: string) => {
    setExpandedResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  const toggleSectionExpansion = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const isExpanded = expandedResources.has(resource.id)
    const shouldTruncate = resource.content.length > 200

    return (
      <div key={resource.id} className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Score: {resource.relevance_score}%</span>
              <span>Last accessed: {formatLastAccessed(resource.last_accessed)}</span>
              {resource.auto_committed && (
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs dark:bg-blue-900 dark:text-blue-200">
                  Auto-committed
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleEditResource(resource)}
              className="text-primary hover:text-primary/80 text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeleteResource(resource.id)}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
            {resource.relevance_score < 100 && (
              <button
                onClick={() => handleResetRelevance(resource.id)}
                className="text-green-600 hover:text-green-800 text-sm"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-foreground">
            {shouldTruncate && !isExpanded 
              ? `${resource.content.substring(0, 200)}...`
              : resource.content
            }
          </p>
          {shouldTruncate && (
            <button
              onClick={() => toggleResourceExpansion(resource.id)}
              className="text-primary hover:text-primary/80 text-sm mt-2"
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>

        {resource.instructions && (
          <div className="mb-4 p-3 bg-accent rounded-md">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Instructions:</span> {resource.instructions}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {resource.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Repository</h1>
          <p className="text-muted-foreground">
            Manage your memories, samples, references, and notes with full CRUD functionality.
          </p>
        </div>
        <button
          onClick={handleAddResource}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
        >
          Add Resource
        </button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {RESOURCE_TYPES.map((type) => (
          <div key={type.value} className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">{type.label}</h3>
            <div className="text-3xl font-bold text-primary mb-1">
              {resourcesByType[type.value]?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Total items</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h3 className="text-lg font-semibold text-foreground mb-4">Filters</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Resource Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as ResourceType | 'all')}
              className="px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Types</option>
              {RESOURCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Filter by Tags {selectedTags.length > 0 && `(${selectedTags.length} selected)`}
            </label>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagToggle(tag)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-accent'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-sm text-primary hover:text-primary/80 mt-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Expiring Resources */}
      {expiringResources.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">Expiring Resources ({expiringResources.length})</h2>
            <button
              onClick={() => toggleSectionExpansion('expiring')}
              className="text-primary hover:text-primary/80"
            >
              {expandedSections.has('expiring') ? 'Collapse' : 'Expand'}
            </button>
          </div>
          
          {expandedSections.has('expiring') && (
            <div className="space-y-4">
              {expiringResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Resources by Type */}
      <div className="space-y-8">
        {RESOURCE_TYPES.map((type) => {
          const typeResources = resourcesByType[type.value] || []
          if (typeResources.length === 0) return null

          return (
            <div key={type.value} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-foreground">
                  {type.label} ({typeResources.length})
                </h2>
                <button
                  onClick={() => toggleSectionExpansion(type.value)}
                  className="text-primary hover:text-primary/80"
                >
                  {expandedSections.has(type.value) ? 'Collapse' : 'Expand'}
                </button>
              </div>
              
              {expandedSections.has(type.value) && (
                <div className="space-y-4">
                  {typeResources.map((resource) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {filteredResources.length === 0 && (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No resources found</h3>
          <p className="text-muted-foreground mb-4">
            {selectedTags.length > 0 || selectedType !== 'all'
              ? 'Try adjusting your filters or add a new resource.'
              : 'Get started by adding your first resource.'}
          </p>
          <button
            onClick={handleAddResource}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Add Resource
          </button>
        </div>
      )}

      <ResourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveResource}
        resource={editingResource}
        mode={modalMode}
      />
    </div>
  )
}
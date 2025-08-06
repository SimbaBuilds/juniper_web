'use client'

import { useEffect, useState } from 'react'
import { RESOURCE_TYPES } from '@/app/lib/repository/types'
import { Resource } from '@/lib/utils/supabase/tables'
import { ResourceModal } from '@/app/components/repository/resource-modal'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/utils/supabase/client'

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
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          console.error('Error getting user:', userError)
          return
        }
        
        // Fetch resources
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError)
          return
        }
        
        setUser(user)
        setResources(resourcesData || [])
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddResource = () => {
    setModalMode('add')
    setSelectedResource(null)
    setShowModal(true)
  }

  const handleEditResource = (resource: Resource) => {
    setModalMode('edit')
    setSelectedResource(resource)
    setShowModal(true)
  }

  const handleDeleteResource = async (resourceId: string) => {
    if (confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from('resources')
          .delete()
          .eq('id', resourceId)
        
        if (error) throw error
        
        setResources(prev => prev.filter(r => r.id !== resourceId))
      } catch (error) {
        console.error('Error deleting resource:', error)
        alert('Failed to delete resource')
      }
    }
  }

  const handleSaveResource = async (resourceData: Partial<Resource>) => {
    if (!user) return
    
    try {
      const supabase = createClient()
      
      if (modalMode === 'add') {
        const { data: newResource, error } = await supabase
          .from('resources')
          .insert([{ ...resourceData, user_id: user.id }])
          .select()
          .single()
        
        if (error) throw error
        
        setResources(prev => [newResource, ...prev])
      } else if (selectedResource) {
        const { data: updatedResource, error } = await supabase
          .from('resources')
          .update({ ...resourceData, updated_at: new Date() })
          .eq('id', selectedResource.id)
          .select()
          .single()
        
        if (error) throw error
        
        setResources(prev => prev.map(r => r.id === selectedResource.id ? updatedResource : r))
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving resource:', error)
      
      // Check if this is a resource limit error
      const errorStr = String(error).toLowerCase()
      if (errorStr.includes('resource limit exceeded') || errorStr.includes('p0001')) {
        alert('Resource Limit Reached\n\nYou have reached the maximum number of resources allowed. Please delete some existing resources before adding new ones.')
      } else {
        alert('Failed to save resource')
      }
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Group resources by type
  const resourcesByType = RESOURCE_TYPES.reduce((acc, type) => {
    acc[type.value] = resources.filter(r => r.type === type.value)
    return acc
  }, {} as Record<string, Resource[]>)

  // Get expiring resources (relevance_score < 10)
  const expiringResources = resources.filter(r => r.relevance_score < 10)

  return (
    <div className="space-y-8 relative">
      {/* Floating Add Button */}
      <button
        onClick={handleAddResource}
        className="fixed bottom-6 right-6 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full p-4 shadow-lg transition-colors z-50"
        title="Add Resource"
      >
        <Plus className="h-6 w-6" />
      </button>

      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Repository</h1>
        <p className="text-muted-foreground">
          Your saved memories, samples, references, and notes.
        </p>
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

      {/* Expiring Resources */}
      {expiringResources.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Expiring Resources ({expiringResources.length})</h2>
          <div className="space-y-4">
            {expiringResources.map((resource) => (
              <div key={resource.id} className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Score: {resource.relevance_score}%</span>
                      <span>Last accessed: {formatLastAccessed(new Date(resource.last_accessed))}</span>
                      {resource.auto_committed && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs dark:bg-blue-900 dark:text-blue-200">
                          Auto-committed
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditResource(resource)}
                      className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                      title="Edit Resource"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteResource(resource.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-accent rounded-md transition-colors"
                      title="Delete Resource"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-foreground">
                    {resource.content.length > 200 
                      ? `${resource.content.substring(0, 200)}...`
                      : resource.content
                    }
                  </p>
                </div>

                {resource.instructions && (
                  <div className="mb-4 p-3 bg-accent rounded-md">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Instructions:</span> {resource.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resources by Type */}
      <div className="space-y-8">
        {RESOURCE_TYPES.map((type) => {
          const typeResources = resourcesByType[type.value] || []
          if (typeResources.length === 0) return null

          return (
            <div key={type.value} className="space-y-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {type.label} ({typeResources.length})
              </h2>
              
              <div className="space-y-4">
                {typeResources.map((resource) => (
                  <div key={resource.id} className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Score: {resource.relevance_score}%</span>
                          <span>Last accessed: {formatLastAccessed(new Date(resource.last_accessed))}</span>
                          {resource.auto_committed && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs dark:bg-blue-900 dark:text-blue-200">
                              Auto-committed
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditResource(resource)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
                          title="Edit Resource"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="p-2 text-muted-foreground hover:text-red-500 hover:bg-accent rounded-md transition-colors"
                          title="Delete Resource"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-foreground">
                        {resource.content.length > 200 
                          ? `${resource.content.substring(0, 200)}...`
                          : resource.content
                        }
                      </p>
                    </div>

                    {resource.instructions && (
                      <div className="mb-4 p-3 bg-accent rounded-md">
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium">Instructions:</span> {resource.instructions}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {resources.length === 0 && (
        <div className="bg-card p-8 rounded-lg border border-border text-center">
          <h3 className="text-lg font-medium text-foreground mb-2">No resources found</h3>
          <p className="text-muted-foreground mb-4">
            Start building your repository by interacting with your AI assistant or click the + button to add manually.
          </p>
          <button
            onClick={handleAddResource}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md transition-colors"
          >
            Add Your First Resource
          </button>
        </div>
      )}


      {/* Resource Modal */}
      <ResourceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveResource}
        resource={selectedResource}
        mode={modalMode}
      />
    </div>
  )
}
'use client'

import { useEffect, useState } from 'react'
import { RESOURCE_TYPES } from '@/app/lib/repository/types'
import { Resource, Tag } from '@/lib/utils/supabase/tables'
import { ResourceModal } from '@/app/components/repository/resource-modal'
import { AddResourceSection } from '@/app/components/repository/add-resource-section'
import { Pencil, Trash2, Tags } from 'lucide-react'
import { createClient } from '@/lib/utils/supabase/client'
import { createResourceWithTags, updateResourceWithTags } from '@/lib/client-services'

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

interface ResourceWithTags extends Resource {
  tags?: Tag[]
}

export default function RepositoryPage() {
  const [user, setUser] = useState<{ id: string } | null>(null)
  const [resources, setResources] = useState<ResourceWithTags[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedResource, setSelectedResource] = useState<ResourceWithTags | null>(null)

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
        
        // Fetch resources with tags
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select(`
            *,
            tag_1:tags!resources_tag_1_id_fkey(id, name, type),
            tag_2:tags!resources_tag_2_id_fkey(id, name, type),
            tag_3:tags!resources_tag_3_id_fkey(id, name, type),
            tag_4:tags!resources_tag_4_id_fkey(id, name, type),
            tag_5:tags!resources_tag_5_id_fkey(id, name, type)
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        
        if (resourcesError) {
          console.error('Error fetching resources:', resourcesError)
          return
        }
        
        // Transform the data to include tags array
        const resourcesWithTags = resourcesData?.map(resource => {
          const tags = [
            resource.tag_1,
            resource.tag_2,
            resource.tag_3,
            resource.tag_4,
            resource.tag_5
          ].filter(Boolean) // Remove null values
          
          return {
            ...resource,
            tags
          }
        }) || []
        
        setUser(user)
        setResources(resourcesWithTags)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const handleAddResource = async (resourceData: Partial<Resource>, tagIds: string[]) => {
    if (!user) return
    
    try {
      const newResource = await createResourceWithTags(user.id, resourceData, tagIds)
      
      // Fetch the resource with tags for display
      const supabase = createClient()
      const { data: resourceWithTags } = await supabase
        .from('resources')
        .select(`
          *,
          tag_1:tags!resources_tag_1_id_fkey(id, name, type),
          tag_2:tags!resources_tag_2_id_fkey(id, name, type),
          tag_3:tags!resources_tag_3_id_fkey(id, name, type),
          tag_4:tags!resources_tag_4_id_fkey(id, name, type),
          tag_5:tags!resources_tag_5_id_fkey(id, name, type)
        `)
        .eq('id', newResource.id)
        .single()
      
      if (resourceWithTags) {
        const tags = [
          resourceWithTags.tag_1,
          resourceWithTags.tag_2,
          resourceWithTags.tag_3,
          resourceWithTags.tag_4,
          resourceWithTags.tag_5
        ].filter(Boolean)
        
        setResources(prev => [{ ...resourceWithTags, tags }, ...prev])
      }
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

  const handleEditResource = (resource: ResourceWithTags) => {
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

  const handleSaveResource = async (resourceData: Partial<Resource>, tagIds: string[]) => {
    if (!user) return
    
    try {
      if (selectedResource) {
        await updateResourceWithTags(selectedResource.id, resourceData, tagIds)
        
        // Fetch the updated resource with tags for display
        const supabase = createClient()
        const { data: resourceWithTags } = await supabase
          .from('resources')
          .select(`
            *,
            tag_1:tags!resources_tag_1_id_fkey(id, name, type),
            tag_2:tags!resources_tag_2_id_fkey(id, name, type),
            tag_3:tags!resources_tag_3_id_fkey(id, name, type),
            tag_4:tags!resources_tag_4_id_fkey(id, name, type),
            tag_5:tags!resources_tag_5_id_fkey(id, name, type)
          `)
          .eq('id', selectedResource.id)
          .single()
        
        if (resourceWithTags) {
          const tags = [
            resourceWithTags.tag_1,
            resourceWithTags.tag_2,
            resourceWithTags.tag_3,
            resourceWithTags.tag_4,
            resourceWithTags.tag_5
          ].filter(Boolean)
          
          setResources(prev => prev.map(r => 
            r.id === selectedResource.id ? { ...resourceWithTags, tags } : r
          ))
        }
      }
      setShowModal(false)
    } catch (error) {
      console.error('Error saving resource:', error)
      alert('Failed to save resource')
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
  }, {} as Record<string, ResourceWithTags[]>)

  // Get expiring resources (relevance_score < 10)
  const expiringResources = resources.filter(r => r.relevance_score < 10)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Repository</h1>
          <p className="text-muted-foreground">
            Your saved memories, samples, references, and notes.
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {RESOURCE_TYPES.map((type) => (
          <div key={type.value} className="bg-card p-6 rounded-lg border border-border">
            <h3 className="text-lg font-semibold text-foreground mb-2">{type.label}</h3>
            <div className="text-number-lg mb-1">
              {resourcesByType[type.value]?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">Total items</p>
          </div>
        ))}
      </div>

      {/* Add Resource Section */}
      <AddResourceSection onSave={handleAddResource} />

      {/* Expiring Resources */}
      {expiringResources.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">Expiring Resources (<span className="text-number">{expiringResources.length}</span>)</h2>
          <div className="space-y-4">
            {expiringResources.map((resource) => (
              <div key={resource.id} className="bg-card p-6 rounded-lg border border-border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {/* <span>Relevance Score: <span className="text-number">{resource.relevance_score}</span>%</span> */}
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

                {resource.tags && resource.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Tags className="h-4 w-4 text-muted-foreground" />
                    {resource.tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag.name}
                      </span>
                    ))}
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
                {type.label} (<span className="text-number">{typeResources.length}</span>)
              </h2>
              
              <div className="space-y-4">
                {typeResources.map((resource) => (
                  <div key={resource.id} className="bg-card p-6 rounded-lg border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground mb-2">{resource.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          {/* <span>Relevance Score: <span className="text-number">{resource.relevance_score}</span>%</span> */}
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

                    {resource.tags && resource.tags.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <Tags className="h-4 w-4 text-muted-foreground" />
                        {resource.tags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          >
                            {tag.name}
                          </span>
                        ))}
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
          <AddResourceSection onSave={handleAddResource} />
        </div>
      )}


      {/* Resource Modal */}
      <ResourceModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveResource}
        resource={selectedResource}
        mode="edit"
      />
    </div>
  )
}
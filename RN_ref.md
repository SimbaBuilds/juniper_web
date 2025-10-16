import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { DatabaseService } from '../../supabase/supabase';
import { useAuth } from '../../auth/AuthContext';
import { MAX_MEMORY_TAGS } from '../constants/tags';
import { RESOURCE_TYPES } from '../types';

interface DisplayResource {
  id: string;
  content: string;
  title?: string;
  instructions?: string;
  type: string;
  relevance_score: number;
  last_accessed: string;
  created_at: string;
  tags: any[];
}

export const NUM_DISPLAYED_RESOURCES = 0;


interface NewResource {
  title: string;
  content: string;
  instructions: string;
  type: string;
  tags: any[];
}

export const useRepoScreen = () => {
  const { user } = useAuth();
  const [resources, setResources] = useState<DisplayResource[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newResource, setNewResource] = useState<NewResource>({
    title: '',
    content: '',
    instructions: '',
    type: 'memory',
    tags: []
  });
  const [saving, setSaving] = useState(false);
  const [selectedFilterTags, setSelectedFilterTags] = useState<any[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingResource, setEditingResource] = useState<DisplayResource | null>(null);
  const [editResource, setEditResource] = useState<NewResource>({
    title: '',
    content: '',
    instructions: '',
    type: 'memory',
    tags: []
  });

  // Helper function to ensure resources have proper tags arrays
  const ensureResourceTags = (resources: any[]): DisplayResource[] => {
    return resources.map(resource => ({
      ...resource,
      tags: Array.isArray(resource.tags) ? resource.tags : []
    }));
  };

  // Load resources from database
  const loadResourcesFromDatabase = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load resources
      const dbResources = await DatabaseService.getResources(user.id);
      
      // Convert database resources to UI format with tag objects
      const formattedResources: DisplayResource[] = dbResources.map((resource: any) => {
        // Collect tags from tag_1 through tag_5 columns
        const tags = [
          resource.tag_1,
          resource.tag_2, 
          resource.tag_3,
          resource.tag_4,
          resource.tag_5
        ].filter(Boolean); // Remove null/undefined tags
        
        return {
          id: resource.id,
          content: resource.content,
          title: resource.title,
          instructions: resource.instructions,
          type: resource.type || 'memory',
          relevance_score: resource.relevance_score || 100,
          last_accessed: resource.last_accessed,
          created_at: resource.created_at,
          tags: tags
        };
      });

      // Add default resources if none exist
      if (formattedResources.length === 0) {
        const defaultResources: DisplayResource[] = [
          {
            id: '1',
            content: 'Favorite coffee shop is Blue Bottle Coffee on Market Street - they make excellent cortados',
            type: 'memory',
            relevance_score: 100,
            last_accessed: '2024-05-30',
            created_at: '2024-05-30',
            tags: [],
          },
          {
            id: '2',
            content: 'Meeting with design team every Tuesday at 2 PM in conference room B',
            type: 'notes',
            relevance_score: 100,
            last_accessed: '2024-05-29',
            created_at: '2024-05-29',
            tags: [],
          },
          {
            id: '3',
            content: 'Preferred news sources: TechCrunch, The Verge, Hacker News for tech updates',
            type: 'memory',
            relevance_score: 100,
            last_accessed: '2024-05-28',
            created_at: '2024-05-28',
            tags: [],
          },
        ];
        setResources(ensureResourceTags(defaultResources));
      } else {
        setResources(ensureResourceTags(formattedResources));
      }
    } catch (err) {
      console.error('Error loading resources:', err);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    loadResourcesFromDatabase();
  }, [loadResourcesFromDatabase]);

  // Refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadResourcesFromDatabase();
    }, [loadResourcesFromDatabase])
  );

  const handleAddResource = useCallback(async () => {
    if (!user?.id || !newResource.content.trim()) {
      Alert.alert('Error', 'Please enter resource content');
      return;
    }

    if (newResource.tags.length > MAX_MEMORY_TAGS) {
      Alert.alert('Error', `You can only select up to ${MAX_MEMORY_TAGS} tags per resource.`);
      return;
    }

    try {
      setSaving(true);
      
      // Extract tag IDs from tag objects
      const tagIds = newResource.tags.map(tag => tag.id);
      
      const resourceData = {
        title: newResource.title.trim() || null,
        content: newResource.content.trim(),
        instructions: newResource.instructions.trim() || null,
        type: newResource.type,
        relevance_score: 100,
        decay_factor: 0.8,
        auto_committed: false,
        tags: tagIds,
        last_accessed: new Date().toISOString()
      };

      const savedResource = await DatabaseService.createResource(user.id, resourceData);
      
      // Get full tag details for UI display
      const resourceTags = await DatabaseService.getResourceTags(savedResource.id);
      
      // Add to local state
      const formattedResource: DisplayResource = {
        id: savedResource.id,
        content: savedResource.content,
        title: savedResource.title,
        instructions: savedResource.instructions,
        type: savedResource.type,
        relevance_score: savedResource.relevance_score || 100,
        last_accessed: savedResource.last_accessed,
        created_at: savedResource.created_at,
        tags: resourceTags
      };

      setResources(prev => ensureResourceTags([formattedResource, ...prev]));
      
      // Reset form
      setNewResource({ title: '', content: '', instructions: '', type: 'memory', tags: [] });
      setShowAddModal(false);
      
      Alert.alert('Success', 'Resource saved successfully');
    } catch (err) {
      console.error('Error saving resource:', err);
      
      // Check if this is a resource limit error
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('resource limit exceeded') || errorStr.includes('p0001')) {
        Alert.alert(
          'Resource Limit Reached',
          'You have reached the maximum number of resources allowed. Please delete some existing resources before adding new ones.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to save resource');
      }
    } finally {
      setSaving(false);
    }
  }, [user?.id, newResource]);

  const openEditModal = useCallback((resource: DisplayResource) => {
    setEditingResource(resource);
    setEditResource({
      title: resource.title || '',
      content: resource.content,
      instructions: resource.instructions || '',
      type: resource.type,
      tags: resource.tags || []
    });
    setShowEditModal(true);
  }, []);

  const handleEditResource = useCallback(async () => {
    if (!user?.id || !editingResource || !editResource.content.trim()) {
      Alert.alert('Error', 'Please enter resource content');
      return;
    }

    if (editResource.tags.length > MAX_MEMORY_TAGS) {
      Alert.alert('Error', `You can only select up to ${MAX_MEMORY_TAGS} tags per resource.`);
      return;
    }

    try {
      setSaving(true);
      
      // Extract tag IDs from tag objects
      const tagIds = editResource.tags.map(tag => tag.id);
      
      const updateData = {
        title: editResource.title.trim() || null,
        content: editResource.content.trim(),
        instructions: editResource.instructions.trim() || null,
        type: editResource.type,
        tags: tagIds,
        last_accessed: new Date().toISOString()
      };

      const updatedResource = await DatabaseService.updateResource(editingResource.id, updateData);
      
      // Collect tags from the returned resource (tag_1 through tag_5)
      const tags = [
        updatedResource.tag_1,
        updatedResource.tag_2,
        updatedResource.tag_3,
        updatedResource.tag_4,
        updatedResource.tag_5
      ].filter(Boolean); // Remove null/undefined tags
      
      // Update local state
      const formattedResource: DisplayResource = {
        id: updatedResource.id,
        content: updatedResource.content,
        title: updatedResource.title,
        instructions: updatedResource.instructions,
        type: updatedResource.type,
        relevance_score: updatedResource.relevance_score || editingResource.relevance_score,
        last_accessed: updatedResource.last_accessed,
        created_at: updatedResource.created_at,
        tags: tags
      };

      setResources(prev => prev.map(resource => 
        resource.id === editingResource.id ? formattedResource : resource
      ));
      
      // Reset form
      setEditResource({ title: '', content: '', instructions: '', type: 'memory', tags: [] });
      setEditingResource(null);
      setShowEditModal(false);
      
      Alert.alert('Success', 'Resource updated successfully');
    } catch (err) {
      console.error('Error updating resource:', err);
      
      // Check if this is a resource limit error
      const errorStr = String(err).toLowerCase();
      if (errorStr.includes('resource limit exceeded') || errorStr.includes('p0001')) {
        Alert.alert(
          'Resource Limit Reached',
          'You have reached the maximum number of resources allowed. Please delete some existing resources before adding new ones.',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        Alert.alert('Error', 'Failed to update resource');
      }
    } finally {
      setSaving(false);
    }
  }, [user?.id, editingResource, editResource]);

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const groupResourcesByType = (resources: DisplayResource[]) => {
    const grouped: { [key: string]: DisplayResource[] } = {};
    
    RESOURCE_TYPES.forEach(type => {
      grouped[type.value] = [];
    });
    
    // Initialize 'other' category for unknown resource types
    grouped['other'] = [];
    
    resources.forEach(resource => {
      if (grouped[resource.type]) {
        grouped[resource.type].push(resource);
      } else {
        grouped['other'].push(resource);
      }
    });
    
    // Sort each category by last_accessed (most recent first)
    Object.keys(grouped).forEach(type => {
      grouped[type].sort((a, b) => 
        new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime()
      );
    });
    
    return grouped;
  };

  const getRecentResources = (resources: DisplayResource[], limit: number = NUM_DISPLAYED_RESOURCES) => {
    return resources ? resources.slice(0, limit) : [];
  };

  const getResourcesFromPast30Days = (resources: DisplayResource[]) => {
    if (!resources) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return resources.filter(resource => 
      new Date(resource.last_accessed) >= thirtyDaysAgo
    );
  };

  const toggleCategoryExpansion = useCallback((category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  }, [expandedCategories]);

  const toggleResourceExpansion = useCallback((resourceId: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(resourceId)) {
      newExpanded.delete(resourceId);
    } else {
      newExpanded.add(resourceId);
    }
    setExpandedResources(newExpanded);
  }, [expandedResources]);

  const deleteResource = useCallback(async (resourceId: string) => {
    Alert.alert(
      'Delete Resource',
      'Are you sure you want to delete this resource? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteResource(resourceId);
              setResources(prev => prev.filter(resource => resource.id !== resourceId));
              Alert.alert('Success', 'Resource deleted successfully');
            } catch (err) {
              console.error('Error deleting resource:', err);
              Alert.alert('Error', 'Failed to delete resource');
            }
          },
        },
      ]
    );
  }, []);

  const resetRelevanceScore = useCallback(async (resourceId: string) => {
    try {
      await DatabaseService.updateResource(resourceId, { relevance_score: 100 });
      setResources(prev => prev.map(resource => 
        resource.id === resourceId 
          ? { ...resource, relevance_score: 100 }
          : resource
      ));
      Alert.alert('Success', 'Relevance score reset to 100%');
    } catch (err) {
      console.error('Error resetting relevance score:', err);
      Alert.alert('Error', 'Failed to reset relevance score');
    }
  }, []);

  // Get all unique tags from resources for filter options
  const getAllTagsFromResources = useCallback(() => {
    const tagMap = new Map<string, any>();
    resources.forEach(resource => {
      if (resource.tags) {
        resource.tags.forEach(tag => tagMap.set(tag.id, tag));
      }
    });
    return Array.from(tagMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [resources]);

  // Separate expiring and regular resources
  const regularResources = resources.filter(resource => resource.relevance_score >= 10);
  const expiringResources = resources.filter(resource => resource.relevance_score < 10);

  // Filter resources by selected tags (AND logic - resource must have all selected tags)
  const filteredRegularResources = selectedFilterTags.length === 0 
    ? regularResources 
    : regularResources.filter(resource => 
        selectedFilterTags.every(filterTag => 
          resource.tags && resource.tags.some(tag => tag.id === filterTag.id)
        )
      );

  const filteredExpiringResources = selectedFilterTags.length === 0 
    ? expiringResources 
    : expiringResources.filter(resource => 
        selectedFilterTags.every(filterTag => 
          resource.tags && resource.tags.some(tag => tag.id === filterTag.id)
        )
      );

  const groupedResources = groupResourcesByType(filteredRegularResources);
  const groupedExpiringResources = groupResourcesByType(filteredExpiringResources);

  return {
    // State
    user,
    resources,
    expandedCategories,
    loading,
    error,
    showAddModal,
    setShowAddModal,
    newResource,
    setNewResource,
    saving,
    selectedFilterTags,
    setSelectedFilterTags,
    showFilterModal,
    setShowFilterModal,
    expandedResources,
    showEditModal,
    setShowEditModal,
    editingResource,
    editResource,
    setEditResource,
    
    // Computed values
    regularResources,
    expiringResources,
    filteredRegularResources,
    filteredExpiringResources,
    groupedResources,
    groupedExpiringResources,
    
    // Functions
    ensureResourceTags,
    handleAddResource,
    openEditModal,
    handleEditResource,
    formatDate,
    groupResourcesByType,
    getRecentResources,
    getResourcesFromPast30Days,
    toggleCategoryExpansion,
    toggleResourceExpansion,
    deleteResource,
    resetRelevanceScore,
    getAllTagsFromResources,
  };
};
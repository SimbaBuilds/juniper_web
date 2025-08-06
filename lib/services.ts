import { createClient } from './utils/supabase/client'
import { createClient as createServerClient } from './utils/supabase/server'
import { Service, Automation, HotPhrase, Resource } from './utils/supabase/tables'
import { cookies } from 'next/headers'

export interface ServiceWithTags extends Service {
  tags: string[]
}

export async function fetchServicesWithTags(): Promise<ServiceWithTags[]> {
  const supabase = createClient()
  
  // Fetch services
  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .order('service_name')
  
  if (servicesError) {
    console.error('Error fetching services:', servicesError)
    return []
  }
  
  if (!services || services.length === 0) {
    return []
  }
  
  // Get all unique tag IDs from services
  const tagIds = new Set<string>()
  services.forEach(service => {
    if (service.tag_1_id) tagIds.add(service.tag_1_id)
    if (service.tag_2_id) tagIds.add(service.tag_2_id)
    if (service.tag_3_id) tagIds.add(service.tag_3_id)
    if (service.tag_4_id) tagIds.add(service.tag_4_id)
    if (service.tag_5_id) tagIds.add(service.tag_5_id)
  })
  
  // Fetch tags
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .in('id', Array.from(tagIds))
  
  if (tagsError) {
    console.error('Error fetching tags:', tagsError)
    return services.map(service => ({ ...service, tags: [] }))
  }
  
  // Create tag lookup map
  const tagMap = new Map<string, string>()
  tags?.forEach(tag => {
    tagMap.set(tag.id, tag.name)
  })
  
  // Combine services with their tags
  return services.map(service => {
    const serviceTags: string[] = []
    
    if (service.tag_1_id && tagMap.has(service.tag_1_id)) {
      serviceTags.push(tagMap.get(service.tag_1_id)!)
    }
    if (service.tag_2_id && tagMap.has(service.tag_2_id)) {
      serviceTags.push(tagMap.get(service.tag_2_id)!)
    }
    if (service.tag_3_id && tagMap.has(service.tag_3_id)) {
      serviceTags.push(tagMap.get(service.tag_3_id)!)
    }
    if (service.tag_4_id && tagMap.has(service.tag_4_id)) {
      serviceTags.push(tagMap.get(service.tag_4_id)!)
    }
    if (service.tag_5_id && tagMap.has(service.tag_5_id)) {
      serviceTags.push(tagMap.get(service.tag_5_id)!)
    }
    
    return {
      ...service,
      tags: serviceTags
    }
  })
}

export async function fetchAutomations(userId?: string): Promise<Automation[]> {
  const supabase = createServerClient(cookies())
  
  let query = supabase
    .from('automations')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data: automations, error } = await query
  
  if (error) {
    console.error('Error fetching automations:', error)
    return []
  }
  
  return automations || []
}

export async function fetchHotPhrases(userId?: string): Promise<HotPhrase[]> {
  const supabase = createServerClient(cookies())
  
  let query = supabase
    .from('hot_phrases')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data: hotPhrases, error } = await query
  
  if (error) {
    console.error('Error fetching hot phrases:', error)
    return []
  }
  
  return hotPhrases || []
}

export async function fetchUserProfile(userId: string) {
  const supabase = createServerClient(cookies())
  
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
  
  return profile
}

export async function fetchIntegrations(userId?: string) {
  const supabase = createServerClient(cookies())
  
  let query = supabase
    .from('integrations')
    .select(`
      *,
      services (
        service_name,
        description,
        type
      )
    `)
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data: integrations, error } = await query
  
  if (error) {
    console.error('Error fetching integrations:', error)
    return []
  }
  
  return integrations || []
}

export async function fetchResources(userId?: string) {
  const supabase = createServerClient(cookies())
  
  let query = supabase
    .from('resources')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (userId) {
    query = query.eq('user_id', userId)
  }
  
  const { data: resources, error } = await query
  
  if (error) {
    console.error('Error fetching resources:', error)
    return []
  }
  
  return resources || []
}

export async function getDashboardStats(userId: string) {
  const [integrations, automations, resources] = await Promise.all([
    fetchIntegrations(userId),
    fetchAutomations(userId),
    fetchResources(userId)
  ])
  
  return {
    activeIntegrationsCount: integrations.filter(i => i.is_active).length,
    activeAutomationsCount: automations.filter(a => a.is_active).length,
    resourcesCount: resources.length,
    recentIntegrations: integrations
      .filter(i => i.is_active)
      .slice(0, 3)
      .map(i => ({
        name: i.services?.service_name || 'Unknown',
        status: i.status || 'active',
        lastUsed: i.last_used || i.created_at
      })),
    recentAutomations: automations
      .filter(a => a.is_active)
      .slice(0, 3)
      .map(a => ({
        name: a.name,
        status: a.is_active ? 'active' : 'inactive',
        lastExecuted: a.last_executed
      }))
  }
}

export async function createResource(userId: string, resourceData: Partial<Resource>) {
  const supabase = createServerClient(cookies())
  
  const { data: resource, error } = await supabase
    .from('resources')
    .insert([{ ...resourceData, user_id: userId }])
    .select()
    .single()
  
  if (error) {
    console.error('Error creating resource:', error)
    throw error
  }
  
  return resource
}

export async function updateResource(resourceId: string, resourceData: Partial<Resource>) {
  const supabase = createServerClient(cookies())
  
  const { data: resource, error } = await supabase
    .from('resources')
    .update({ ...resourceData, updated_at: new Date() })
    .eq('id', resourceId)
    .select()
    .single()
  
  if (error) {
    console.error('Error updating resource:', error)
    throw error
  }
  
  return resource
}

export async function deleteResource(resourceId: string) {
  const supabase = createServerClient(cookies())
  
  const { error } = await supabase
    .from('resources')
    .delete()
    .eq('id', resourceId)
  
  if (error) {
    console.error('Error deleting resource:', error)
    throw error
  }
  
  return true
}
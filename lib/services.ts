import { createClient } from './utils/supabase/client'
import { Service } from './utils/supabase/tables'

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
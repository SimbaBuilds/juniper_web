import { NextResponse } from 'next/server';
import { createClient } from '@/lib/utils/supabase/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    
    // Fetch services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .eq('public', true)
      .order('service_name');
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }
    
    if (!services || services.length === 0) {
      return NextResponse.json([]);
    }
    
    // Get all unique tag IDs from services
    const tagIds = new Set<string>();
    services.forEach(service => {
      if (service.tag_1_id) tagIds.add(service.tag_1_id);
      if (service.tag_2_id) tagIds.add(service.tag_2_id);
      if (service.tag_3_id) tagIds.add(service.tag_3_id);
      if (service.tag_4_id) tagIds.add(service.tag_4_id);
      if (service.tag_5_id) tagIds.add(service.tag_5_id);
    });
    
    // Fetch tags if we have tag IDs
    let tagMap = new Map<string, string>();
    if (tagIds.size > 0) {
      const { data: tags, error: tagsError } = await supabase
        .from('tags')
        .select('*')
        .in('id', Array.from(tagIds));
      
      if (tagsError) {
        console.error('Error fetching tags:', tagsError);
      } else if (tags) {
        tags.forEach(tag => {
          tagMap.set(tag.id, tag.name);
        });
      }
    }
    
    // Combine services with their tags
    const servicesWithTags = services.map(service => {
      const serviceTags: string[] = [];
      
      if (service.tag_1_id && tagMap.has(service.tag_1_id)) {
        serviceTags.push(tagMap.get(service.tag_1_id)!);
      }
      if (service.tag_2_id && tagMap.has(service.tag_2_id)) {
        serviceTags.push(tagMap.get(service.tag_2_id)!);
      }
      if (service.tag_3_id && tagMap.has(service.tag_3_id)) {
        serviceTags.push(tagMap.get(service.tag_3_id)!);
      }
      if (service.tag_4_id && tagMap.has(service.tag_4_id)) {
        serviceTags.push(tagMap.get(service.tag_4_id)!);
      }
      if (service.tag_5_id && tagMap.has(service.tag_5_id)) {
        serviceTags.push(tagMap.get(service.tag_5_id)!);
      }
      
      return {
        ...service,
        tags: serviceTags
      };
    });
    
    return NextResponse.json(servicesWithTags);
  } catch (error) {
    console.error('Unexpected error in services API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
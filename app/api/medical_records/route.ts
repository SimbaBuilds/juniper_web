import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseAppServerClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log('Authentication failed - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    console.log('🔄 Fetching medical records from Supabase:', {
      userId: user.id,
      limit,
      offset
    })

    // Fetch medical records with page counts from Supabase
    const { data: records, error: recordsError } = await supabase
      .from('medical_records')
      .select(`
        *,
        page_count:record_pages(count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (recordsError) {
      console.error('❌ Supabase query error:', recordsError)
      return NextResponse.json(
        { error: 'Failed to fetch medical records' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    const { count: totalCount, error: countError } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('❌ Count query error:', countError)
      return NextResponse.json(
        { error: 'Failed to get total count' },
        { status: 500 }
      )
    }

    // Transform the data to include page count and add upload_url for compatibility
    const transformedRecords = records?.map(record => ({
      ...record,
      page_count: record.page_count?.[0]?.count || 0,
      // Add upload_url as null for now - we'll use page content instead
      upload_url: record.page_count?.[0]?.count > 0 ? 'content-available' : null
    })) || []

    console.log('✅ Successfully fetched medical records:', {
      recordCount: transformedRecords.length,
      totalCount,
      hasMore: offset + limit < (totalCount || 0)
    })

    return NextResponse.json({
      records: transformedRecords,
      total_count: totalCount || 0,
      has_more: offset + limit < (totalCount || 0)
    })

  } catch (error) {
    console.error('❌ Medical records list API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
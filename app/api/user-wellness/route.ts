import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createSupabaseAppServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user wellness data
    const { data, error } = await supabase
      .from('user_wellness')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching user wellness:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Unexpected error in GET /api/user-wellness:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseAppServerClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { goals, status_progress, fav_activities, misc_info } = body

    // Validate misc_info length
    if (misc_info && misc_info.length > 2000) {
      return NextResponse.json({ error: 'misc_info exceeds 2000 characters' }, { status: 400 })
    }

    // Check if record exists
    const { data: existingData } = await supabase
      .from('user_wellness')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingData) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_wellness')
        .update({
          goals,
          status_progress,
          fav_activities,
          misc_info,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user wellness:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data })
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_wellness')
        .insert({
          user_id: user.id,
          goals,
          status_progress,
          fav_activities,
          misc_info,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user wellness:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ data }, { status: 201 })
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/user-wellness:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

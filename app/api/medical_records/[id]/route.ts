import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recordId = params.id

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Fetching medical record details:', { recordId, userId: user.id })

    // Fetch the medical record
    const { data: record, error: recordError } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', recordId)
      .eq('user_id', user.id)
      .single()

    if (recordError) {
      console.error('❌ Error fetching medical record:', recordError)

      if (recordError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Medical record not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to fetch medical record' },
        { status: 500 }
      )
    }

    // Fetch the record pages
    const { data: pages, error: pagesError } = await supabase
      .from('record_pages')
      .select('*')
      .eq('medical_record_id', recordId)
      .eq('user_id', user.id)
      .order('page_number', { ascending: true })

    if (pagesError) {
      console.error('❌ Error fetching record pages:', pagesError)
      return NextResponse.json(
        { error: 'Failed to fetch record pages' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully fetched medical record details:', {
      recordId: record.id,
      pageCount: pages?.length || 0,
      title: record.title
    })

    return NextResponse.json({
      record,
      pages: pages || [],
      total_pages: pages?.length || 0
    })

  } catch (error) {
    console.error('❌ Medical record details API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const recordId = params.id

    if (!recordId) {
      return NextResponse.json(
        { error: 'Record ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Deleting medical record:', { recordId, userId: user.id })

    // Delete the medical record (this will cascade delete pages due to foreign key constraint)
    const { error: deleteError } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', recordId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ Error deleting medical record:', deleteError)

      if (deleteError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Medical record not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to delete medical record' },
        { status: 500 }
      )
    }

    console.log('✅ Successfully deleted medical record:', { recordId })

    return NextResponse.json({
      success: true,
      message: 'Medical record deleted successfully'
    })

  } catch (error) {
    console.error('❌ Medical record deletion API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
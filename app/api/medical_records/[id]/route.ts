import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://mobile-jarvis-backend.onrender.com'

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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      console.log('Session validation failed - returning 401')
      return NextResponse.json(
        { error: 'No valid session token' },
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

    const response = await fetch(
      `${PYTHON_BACKEND_URL}/api/medical_records/${recordId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python backend error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      })

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Medical record not found' },
          { status: 404 }
        )
      }

      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Successfully fetched medical record details:', {
      recordId: data.record?.id,
      pageCount: data.pages?.length,
      totalPages: data.total_pages
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Medical record details API error:', error)

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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      console.log('Session validation failed - returning 401')
      return NextResponse.json(
        { error: 'No valid session token' },
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

    const response = await fetch(
      `${PYTHON_BACKEND_URL}/api/medical_records/${recordId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python backend error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      })

      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Medical record not found' },
          { status: 404 }
        )
      }

      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Successfully deleted medical record:', { recordId })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Medical record deletion API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
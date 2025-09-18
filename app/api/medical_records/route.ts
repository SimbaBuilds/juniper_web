import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://mobile-jarvis-backend.onrender.com'

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

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    if (sessionError || !session?.access_token) {
      console.log('Session validation failed - returning 401')
      return NextResponse.json(
        { error: 'No valid session token' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0'), 0)

    const response = await fetch(
      `${PYTHON_BACKEND_URL}/api/medical_records?limit=${limit}&offset=${offset}`,
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
          { error: 'Medical records endpoint not found' },
          { status: 404 }
        )
      }

      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Successfully fetched medical records:', {
      recordCount: data.records?.length,
      totalCount: data.total_count,
      hasMore: data.has_more
    })

    return NextResponse.json(data)

  } catch (error) {
    console.error('Medical records list API error:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'https://mobile-jarvis-backend.onrender.com'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface ChatRequest {
  message: string
  history: ChatMessage[]
}

export async function POST(request: NextRequest) {
 
  try {
    // Get authenticated user (recommended for server-side validation)
    const supabase = await createSupabaseAppServerClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
   
    
    if (authError || !user) {
      console.log('Authentication failed - returning 401')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session to extract access token for external API
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('Session check result:', { 
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      accessTokenLength: session?.access_token?.length,
      sessionError: sessionError?.message 
    })
    
    if (sessionError || !session?.access_token) {
      console.log('Session validation failed - returning 401')
      return NextResponse.json(
        { error: 'No valid session token' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: ChatRequest = await request.json()
    const { message, history } = body

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Invalid message' },
        { status: 400 }
      )
    }

    // Get user profile for settings
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('general_instructions, base_language_model, timezone')
      .eq('id', user.id)
      .single()

    // Prepare request for Python backend (matching backend ChatRequest model)
    const chatRequest = {
      message: message.trim(),
      timestamp: Date.now(),
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        type: 'text'
      })),
      preferences: {
        general_instructions: profile?.general_instructions || '',
        base_language_model: profile?.base_language_model || 'gpt-4',
        timezone: profile?.timezone || 'UTC'
      },
      request_id: `web-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      integration_in_progress: false,
      image_url: null
    }

    // Call Python backend using FormData format (matching React Native)
    const formData = new FormData()
    formData.append('json_data', JSON.stringify(chatRequest))
    

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: formData,
    })


    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python backend error details:', {
        status: response.status,
        statusText: response.statusText,
        errorText: errorText
      })
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()
    console.log('Python backend success response:', {
      hasResponse: !!data.response,
      responseLength: data.response?.length,
      timestamp: data.timestamp,
      settingsUpdated: data.settings_updated,
      integrationInProgress: data.integration_in_progress
    })

    // Update usage statistics if needed
    if (data.usage_updated) {
      // The Python backend handles usage updates, but we could add additional logic here if needed
    }

    console.log('=== CHAT API REQUEST SUCCESS ===')
    return NextResponse.json({
      response: data.response,
      timestamp: data.timestamp,
      settings_updated: data.settings_updated || false,
      integration_in_progress: data.integration_in_progress || false,
    })

  } catch (error) {
    console.error('=== CHAT API REQUEST FAILED ===')
    console.error('Chat API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
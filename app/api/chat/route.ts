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
    // Get authenticated user
    const supabase = await createSupabaseAppServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
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

    // Prepare request for Python backend
    const chatRequest = {
      message: message.trim(),
      timestamp: Date.now(),
      history: history.map(msg => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        type: 'text'
      })),
      user_id: user.id,
      settings: {
        general_instructions: profile?.general_instructions || '',
        base_language_model: profile?.base_language_model || 'gpt-4',
        timezone: profile?.timezone || 'UTC'
      }
    }

    // Call Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.id}`, // Use user ID as auth token
      },
      body: JSON.stringify(chatRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Python backend error:', errorText)
      throw new Error(`Backend error: ${response.status}`)
    }

    const data = await response.json()

    // Update usage statistics if needed
    if (data.usage_updated) {
      // The Python backend handles usage updates, but we could add additional logic here if needed
    }

    return NextResponse.json({
      response: data.response,
      timestamp: data.timestamp,
      settings_updated: data.settings_updated || false,
      integration_in_progress: data.integration_in_progress || false,
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
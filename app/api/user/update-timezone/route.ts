import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { timezone } = await request.json()

    if (typeof timezone !== 'string' || !timezone) {
      return NextResponse.json({ message: 'Invalid timezone value' }, { status: 400 })
    }

    // Validate that it's a valid IANA timezone
    try {
      Intl.DateTimeFormat(undefined, { timeZone: timezone })
    } catch {
      return NextResponse.json({ message: 'Invalid timezone identifier' }, { status: 400 })
    }

    const supabase = await createSupabaseAppServerClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({ timezone })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating timezone:', error)
      return NextResponse.json({ message: `Failed to update timezone: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ message: 'Timezone updated successfully', timezone })
  } catch (error) {
    console.error('Error in update-timezone API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

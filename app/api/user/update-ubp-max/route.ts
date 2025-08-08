import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/auth/get-user'
import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const user = await getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { ubp_max } = await request.json()

    if (typeof ubp_max !== 'number' || ubp_max < 0) {
      return NextResponse.json({ message: 'Invalid UBP max value' }, { status: 400 })
    }

    const supabase = await createSupabaseAppServerClient()
    
    const { error } = await supabase
      .from('user_profile')
      .update({ ubp_max })
      .eq('id', user.id)

    if (error) {
      console.error('Error updating ubp_max:', error)
      return NextResponse.json({ message: 'Failed to update max UBP' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Max UBP updated successfully' })
  } catch (error) {
    console.error('Error in update-ubp-max API:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
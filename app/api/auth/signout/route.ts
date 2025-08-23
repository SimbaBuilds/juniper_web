import { createSupabaseAppServerClient } from '@/lib/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseAppServerClient()
  
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/', request.url))
}

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseAppServerClient()
  
  await supabase.auth.signOut()
  
  return NextResponse.redirect(new URL('/', request.url))
}

import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export const createClient = (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    },
  );

  return { supabase, response: supabaseResponse }
};

export async function updateSession(request: NextRequest) {
  const { supabase, response } = createClient(request)
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  // Protected routes that require authentication
  const protectedPaths = ['/dashboard', '/automations', '/integrations', '/repository', '/account']
  const isProtectedPath = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  // Auth routes that authenticated users shouldn't access
  const authPaths = ['/login', '/signup', '/reset-password']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))
  
  // Special case: update-password should be accessible for users with a valid reset token
  const isUpdatePasswordPath = request.nextUrl.pathname.startsWith('/update-password')
  
  // Redirect unauthenticated users away from protected routes
  if (isProtectedPath && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Redirect authenticated users away from auth pages (but not update-password)
  if (isAuthPath && user && !isUpdatePasswordPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return response
}


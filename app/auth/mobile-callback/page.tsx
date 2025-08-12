'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/utils/supabase/client'

export default function MobileCallbackPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleHashCallback = async () => {
      try {
        // Get the hash from the URL
        const hash = window.location.hash
        if (!hash) {
          setError('No authentication data found')
          setLoading(false)
          return
        }

        // Parse the hash parameters
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (!accessToken || !refreshToken) {
          setError('Invalid authentication data')
          setLoading(false)
          return
        }

        // Set the session with the tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        })

        if (sessionError) {
          setError(sessionError.message)
          setLoading(false)
          return
        }

        // Handle different flow types
        if (type === 'recovery') {
          // Password reset flow - redirect to update password
          router.push('/update-password')
        } else {
          // Regular auth flow - redirect to dashboard
          router.push('/dashboard')
        }
      } catch (err) {
        setError('An error occurred during authentication')
        setLoading(false)
      }
    }

    handleHashCallback()
  }, [router, supabase.auth])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing authentication...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Authentication Error
            </h2>
            <p className="mt-2 text-gray-600">
              {error}
            </p>
          </div>
          <div className="mt-4">
            <a
              href="/login"
              className="text-primary hover:underline"
            >
              Return to login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return null
}
'use client'

import { useState } from 'react'
import { UserProfile } from '@/lib/utils/supabase/tables'

interface MaxUbpSettingProps {
  userProfile: UserProfile | null
}

export default function MaxUbpSetting({ userProfile }: MaxUbpSettingProps) {
  const [maxUbp, setMaxUbp] = useState(userProfile?.ubp_max?.toString() || '')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/user/update-ubp-max', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ubp_max: parseFloat(maxUbp) || 0,
        }),
      })

      if (response.ok) {
        setMessage('Max UBP updated successfully')
      } else {
        const error = await response.json()
        setMessage(error.message || 'Failed to update max UBP')
      }
    } catch {
      setMessage('An error occurred while updating max UBP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-card p-6 rounded-lg border border-border">
      <h2 className="text-xl font-semibold text-foreground mb-6">Usage Based Pricing Limits</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Set a maximum limit for usage-based pricing to control your spending
      </p>
      
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current UBP
            </label>
            <input
              type="number"
              value={userProfile?.ubp_current || 0}
              disabled
              className="w-full px-3 py-2 border border-border rounded-md bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">Your current usage-based pricing amount</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Max UBP Limit
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={maxUbp}
              onChange={(e) => setMaxUbp(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="Enter maximum UBP limit"
            />
            <p className="text-xs text-muted-foreground mt-1">Set your spending limit for usage-based features</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={isLoading || !maxUbp}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Saving...' : 'Save Max UBP'}
          </button>
          
          {message && (
            <p className={`text-sm ${message.includes('successfully') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
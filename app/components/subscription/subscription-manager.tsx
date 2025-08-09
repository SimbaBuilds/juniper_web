'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import PricingCard from '../pricing/pricing-card'
import { CreditCard, ExternalLink } from 'lucide-react'
import { UserProfile } from '@/lib/utils/supabase/tables'
import { FREE_TIER_REQUESTS_LIMIT, FREE_TIER_USAGE_LIMIT, PRO_TIER_USAGE_LIMIT, PRO_TIER_REQUESTS_LIMIT } from '@/app/lib/constants'

interface UsageData {
  tier: 'free' | 'pro'
  status?: string
  period_end?: string
  current: {
    requests_today: number
    requests_week: number
    requests_month: number
    perplexity_usage_month: number
    twitter_x_usage_month: number
    textbelt_usage_month: number
  }
  limits: {
    requests_monthly: number
    perplexity_monthly: number
    twitter_x_monthly: number
    textbelt_monthly: number
  }
  percentages: {
    requests: number
    perplexity: number
    twitter_x: number
    textbelt: number
  }
}

interface SubscriptionManagerProps {
  userProfile: UserProfile
}

export default function SubscriptionManager({ userProfile }: SubscriptionManagerProps) {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchUsageData()
    
    // Handle success/cancel parameters
    const success = searchParams.get('success')
    const canceled = searchParams.get('canceled')
    
    if (success === 'true') {
      toast.success('Welcome to Juniper Pro! Your subscription is now active.')
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (canceled === 'true') {
      toast.error('Subscription canceled. You can try again anytime.')
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [searchParams])

  const fetchUsageData = async () => {
    try {
      const response = await fetch('/api/stripe/usage')
      if (response.ok) {
        const data = await response.json()
        setUsageData(data)
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error)
    }
  }

  const handleSubscribeToPro = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Subscription error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to start subscription')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create portal session')
      }

      const { url } = await response.json()
      
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      console.error('Portal error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal')
    } finally {
      setIsLoading(false)
    }
  }

  const freeTierFeatures = [
    `${FREE_TIER_REQUESTS_LIMIT} requests per month`,
    `$${FREE_TIER_USAGE_LIMIT} worth of usage based services (Perplexity, SMS, XAI LiveSearch, etc.)`
  ]

  const proTierFeatures = [
    `${PRO_TIER_REQUESTS_LIMIT} requests per month`,
    `$${PRO_TIER_USAGE_LIMIT} worth of usage based services (XAI LiveSearch, Perplexity, SMS, etc.)`
  ]

  return (
    <div className="space-y-8">
      {/* Current Plan Status */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Subscription & Billing</h2>
          <button
            onClick={userProfile.subscription_tier === 'pro' ? handleManageSubscription : handleSubscribeToPro}
            disabled={isLoading}
            className="flex items-center space-x-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/80 disabled:opacity-50 text-sm"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>{userProfile.subscription_tier === 'pro' ? 'Manage Subscription' : 'Upgrade to Pro'}</span>
            {userProfile.subscription_tier === 'pro' && <ExternalLink className="h-3.5 w-3.5" />}
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Current Plan</label>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm font-medium">
                  {userProfile.subscription_tier?.toUpperCase() || 'FREE'}
                </span>
                {userProfile.subscription_status && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    userProfile.subscription_status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {userProfile.subscription_status}
                  </span>
                )}
              </div>
            </div>
            
            {userProfile.subscription_current_period_end && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Next Billing Date</label>
                <p className="text-sm text-muted-foreground">
                  {new Date(userProfile.subscription_current_period_end).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {usageData && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Usage This Month</label>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Requests:</span>
                    <span className="font-medium text-foreground">
                      {usageData.current.requests_month.toLocaleString()} / {usageData.limits.requests_monthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full" 
                      style={{ width: `${Math.min(usageData.percentages.requests, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {userProfile.subscription_cancel_at_period_end && (
          <div className="p-3 bg-yellow-100 text-yellow-800 rounded-md dark:bg-yellow-900 dark:text-yellow-200">
            <p className="text-sm">
              Your subscription will be canceled at the end of the current billing period 
              {userProfile.subscription_current_period_end && 
                ` (${new Date(userProfile.subscription_current_period_end).toLocaleDateString()})`}.
            </p>
          </div>
        )}
      </div>

      {/* Detailed Usage Stats */}
      {usageData && (
        <div className="bg-card p-6 rounded-lg border border-border">
          <h3 className="text-lg font-medium text-foreground mb-4">Service Usage Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {usageData.current.requests_month}
              </div>
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <div className="w-full bg-secondary rounded-full h-1 mt-2">
                <div 
                  className="bg-primary h-1 rounded-full" 
                  style={{ width: `${Math.min(usageData.percentages.requests, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {usageData.current.perplexity_usage_month}
              </div>
              <p className="text-sm text-muted-foreground">Perplexity</p>
              <div className="w-full bg-secondary rounded-full h-1 mt-2">
                <div 
                  className="bg-primary h-1 rounded-full" 
                  style={{ width: `${Math.min(usageData.percentages.perplexity, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {usageData.current.twitter_x_usage_month}
              </div>
              <p className="text-sm text-muted-foreground">Twitter/X</p>
              <div className="w-full bg-secondary rounded-full h-1 mt-2">
                <div 
                  className="bg-primary h-1 rounded-full" 
                  style={{ width: `${Math.min(usageData.percentages.twitter_x, 100)}%` }}
                ></div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary mb-1">
                {usageData.current.textbelt_usage_month}
              </div>
              <p className="text-sm text-muted-foreground">SMS</p>
              <div className="w-full bg-secondary rounded-full h-1 mt-2">
                <div 
                  className="bg-primary h-1 rounded-full" 
                  style={{ width: `${Math.min(usageData.percentages.textbelt, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pricing Plans */}
      <div className="bg-card p-6 rounded-lg border border-border">
        <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Choose Your Plan</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <PricingCard
            title="Free"
            price="$0"
            period="/month"
            features={freeTierFeatures}
            isCurrentPlan={userProfile.subscription_tier === 'free' || !userProfile.subscription_tier}
            buttonText="Current Plan"
          />
          
          <PricingCard
            title="Pro"
            price="$29.99"
            period="/month"
            features={proTierFeatures}
            isCurrentPlan={userProfile.subscription_tier === 'pro'}
            onSubscribe={userProfile.subscription_tier !== 'pro' ? handleSubscribeToPro : undefined}
            buttonText={userProfile.subscription_tier === 'pro' ? 'Current Plan' : 'Upgrade to Pro'}
            popular={true}
          />
        </div>
      </div>
    </div>
  )
}
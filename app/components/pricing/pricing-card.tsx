'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'

interface PricingCardProps {
  title: string
  price: string
  period?: string
  features: string[]
  isCurrentPlan?: boolean
  onSubscribe?: () => Promise<void>
  buttonText?: string
  popular?: boolean
}

export default function PricingCard({
  title,
  price,
  period = '/month',
  features,
  isCurrentPlan = false,
  onSubscribe,
  buttonText,
  popular = false
}: PricingCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!onSubscribe) return
    
    setIsLoading(true)
    try {
      await onSubscribe()
    } catch (error) {
      console.error('Subscription error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`relative bg-card rounded-lg border p-6 ${
      popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'
    }`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-primary text-primary-foreground px-3 py-1 text-sm font-medium rounded-full">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
        <div className="mb-6">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </div>
        
        <ul className="space-y-3 mb-6 text-left">
          {features.map((feature, index) => (
            <li key={index} className="relative pl-7 text-sm">
              <Check className="absolute left-0 top-0.5 h-4 w-4 text-green-500 flex-shrink-0" />
              <span className="text-muted-foreground leading-relaxed">{feature}</span>
            </li>
          ))}
        </ul>
        
        {isCurrentPlan ? (
          <div className="w-full py-2 px-4 bg-secondary text-secondary-foreground rounded-md text-sm font-medium">
            Current Plan
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            disabled={isLoading}
            className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              popular 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </div>
            ) : (
              buttonText || 'Get Started'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
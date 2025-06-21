'use client'

import { useSearchParams } from 'next/navigation'
import { IntegrationForm } from '@/components/integration-form'
import { INTEGRATION_CONFIG } from '@/lib/config'

export default function Page() {
  const searchParams = useSearchParams()
  
  // Configuration for the single service this app handles
  const formId = INTEGRATION_CONFIG.ALLOW_URL_PARAMS 
    ? searchParams.get('formId') || INTEGRATION_CONFIG.DEFAULT_FORM_ID
    : INTEGRATION_CONFIG.DEFAULT_FORM_ID
    
  const userId = INTEGRATION_CONFIG.ALLOW_URL_PARAMS
    ? searchParams.get('userId') || INTEGRATION_CONFIG.DEFAULT_USER_ID  
    : INTEGRATION_CONFIG.DEFAULT_USER_ID

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Debug info in development */}
        {INTEGRATION_CONFIG.SHOW_DEBUG_INFO && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
            <div className="font-semibold text-yellow-800 mb-1">Debug Info (dev mode only):</div>
            <div className="text-yellow-700">
              <div>Form ID: {formId}</div>
              <div>User ID: {userId}</div>
              <div>URL Params Allowed: {INTEGRATION_CONFIG.ALLOW_URL_PARAMS ? 'Yes' : 'No'}</div>
            </div>
          </div>
        )}

        <IntegrationForm 
          formId={formId}
          userId={userId}
        />
      </div>
    </div>
  )
}

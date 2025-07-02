import { headers } from 'next/headers';

// This page fetches HTML from the Supabase Edge Function and renders it
export default async function IntegrationPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[]>> 
}) {
  const params = await searchParams;
  
  // Get Supabase URL from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900">Configuration Error</h1>
          <p className="text-gray-600">
            Server configuration is missing. Please contact support.
          </p>
        </div>
      </div>
    );
  }
  
  // Build the edge function URL
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/handle-integration-form`;
  
  // Build the query string from searchParams
  const query = new URLSearchParams();
  for (const key in params) {
    const value = params[key];
    if (Array.isArray(value)) {
      value.forEach((v) => query.append(key, v));
    } else if (value !== undefined) {
      query.append(key, value);
    }
  }
  
  const targetUrl = `${edgeFunctionUrl}${query.toString() ? `?${query.toString()}` : ''}`;
  
  try {
    // Get the host header for the form action
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;
    
    // Make the request to the edge function with proper headers
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', response.status, errorText);
      
      // Try to parse and display the HTML error if it's HTML
      if (errorText.includes('<!DOCTYPE html>') || errorText.includes('<html>')) {
        return <div dangerouslySetInnerHTML={{ __html: errorText }} />;
      }
      
      throw new Error(`Edge function responded with status: ${response.status}`);
    }
    
    let htmlContent = await response.text();
    
    // Important: Update form action URLs to use our proxy endpoint
    // This ensures form submissions stay on our domain
    htmlContent = htmlContent.replace(
      /action="[^"]*\/functions\/v1\/handle-integration-form"/g,
      `action="${baseUrl}/api/integration-proxy"`
    );
    
    // Also update any relative form actions
    htmlContent = htmlContent.replace(
      /action="\/functions\/v1\/handle-integration-form"/g,
      `action="${baseUrl}/api/integration-proxy"`
    );
    
    // Return the HTML content with a wrapper div for proper rendering
    return (
      <div 
        className="min-h-screen"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    );
    
  } catch (error) {
    console.error('Error fetching from edge function:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900">Integration Form Unavailable</h1>
          <p className="text-gray-600">
            We&apos;re having trouble loading the integration form. Please try again later.
          </p>
          <p className="text-sm text-gray-500">
            If this problem persists, please contact support.
          </p>
        </div>
      </div>
    );
  }
}
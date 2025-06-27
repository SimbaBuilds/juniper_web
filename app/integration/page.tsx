import { redirect } from 'next/navigation';

// This page is a server component that immediately redirects to the Supabase Edge Function,
// preserving all query parameters from the incoming request.

const SUPABASE_EDGE_FUNCTION_URL = 'https://your-project-ref.supabase.co/functions/v1/handle-integration-form';

export default async function IntegrationRedirectPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string | string[]>> 
}) {
  const params = await searchParams;
  
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
  const dest = `${SUPABASE_EDGE_FUNCTION_URL}${query.toString() ? `?${query.toString()}` : ''}`;
  redirect(dest); // 307 Temporary Redirect by default
  return null;
} 
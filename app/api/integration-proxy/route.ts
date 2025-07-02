import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return handleRequest(request, 'GET');
}

export async function POST(request: NextRequest) {
  return handleRequest(request, 'POST');
}

async function handleRequest(request: NextRequest, method: 'GET' | 'POST') {
  // Get Supabase URL from environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'Server configuration error' }, 
      { status: 500 }
    );
  }
  
  // Build the edge function URL
  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/handle-integration-form`;
  
  // Get query parameters from the request URL
  const url = new URL(request.url);
  const queryString = url.search;
  const targetUrl = `${edgeFunctionUrl}${queryString}`;
  
  try {
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'apikey': supabaseAnonKey,
        'Content-Type': request.headers.get('content-type') || 'application/json',
        // Forward other relevant headers
        ...(request.headers.get('user-agent') && {
          'User-Agent': request.headers.get('user-agent')!
        }),
      },
    };
    
    // For POST requests, include the body
    if (method === 'POST') {
      fetchOptions.body = await request.text();
    }
    
    // Make the request to the edge function
    const response = await fetch(targetUrl, fetchOptions);
    
    const contentType = response.headers.get('content-type');
    
    // If it's HTML, return it for rendering
    if (contentType?.includes('text/html')) {
      const htmlContent = await response.text();
      return new NextResponse(htmlContent, {
        status: response.status,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }
    
    // For JSON responses (like form submissions), return as JSON
    if (contentType?.includes('application/json')) {
      const jsonContent = await response.json();
      return NextResponse.json(jsonContent, {
        status: response.status,
      });
    }
    
    // For other content types, return as text
    const textContent = await response.text();
    return new NextResponse(textContent, {
      status: response.status,
      headers: {
        'Content-Type': contentType || 'text/plain',
      },
    });
    
  } catch (error) {
    console.error('Error proxying to edge function:', error);
    return NextResponse.json(
      { error: 'Failed to process integration request' }, 
      { status: 500 }
    );
  }
}
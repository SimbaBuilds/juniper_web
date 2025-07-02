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
      const contentType = request.headers.get('content-type') || '';
      const body = await request.text();
      
      console.log('POST request details:', {
        contentType,
        bodyLength: body.length,
        bodyPreview: body.substring(0, 100)
      });
      
      fetchOptions.body = body;
      
      // Preserve the original content type
      if (fetchOptions.headers && typeof fetchOptions.headers === 'object') {
        (fetchOptions.headers as Record<string, string>)['Content-Type'] = contentType || 'application/json';
      }
    }
    
    // Make the request to the edge function
    const response = await fetch(targetUrl, fetchOptions);
    
    const responseText = await response.text();
    const contentType = response.headers.get('content-type') || '';
    
    // Log the response for debugging
    console.log('Edge function response:', {
      status: response.status,
      contentType,
      bodyLength: responseText.length,
      bodyPreview: responseText.substring(0, 200)
    });
    
    // Check if the response is JSON by trying to parse it
    try {
      const jsonData = JSON.parse(responseText);
      return NextResponse.json(jsonData, {
        status: response.status,
      });
    } catch {
      // Not JSON, check if it's HTML
      if (contentType.includes('text/html') || responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return new NextResponse(responseText, {
          status: response.status,
          headers: {
            'Content-Type': 'text/html',
          },
        });
      }
      
      // Return as plain text for other content
      return new NextResponse(responseText, {
        status: response.status,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
    
  } catch (error) {
    console.error('Error proxying to edge function:', error);
    return NextResponse.json(
      { error: 'Failed to process integration request' }, 
      { status: 500 }
    );
  }
}
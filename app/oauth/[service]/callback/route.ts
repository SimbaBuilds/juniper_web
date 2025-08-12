import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  
  const service = params.service;

  // Build the callback URL with all parameters
  const callbackParams = new URLSearchParams();
  if (code) callbackParams.append('code', code);
  if (state) callbackParams.append('state', state);
  if (error) callbackParams.append('error', error);
  if (errorDescription) callbackParams.append('error_description', errorDescription);
  
  const callbackUrl = `https://hightower-ai.com/oauth/${service}/callback?${callbackParams.toString()}`;

  // Return HTML that handles both iOS Universal Links and Android App Links
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Redirecting to Juniper...</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            text-align: center;
            padding: 50px 20px;
            background-color: #f5f5f5;
            margin: 0;
          }
          .container {
            max-width: 400px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h2 {
            color: #333;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            padding: 12px 30px;
            background: #007AFF;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 500;
            transition: background 0.2s;
          }
          .button:hover {
            background: #0056b3;
          }
          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #007AFF;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .error {
            color: #d32f2f;
            margin-bottom: 20px;
          }
        </style>
        <script>
          // For iOS: Universal Links
          window.location.href = "${callbackUrl}";
          
          // For Android: Fallback if App Link doesn't auto-open
          setTimeout(function() {
            // If still here after 2 seconds, show manual redirect
            document.getElementById('spinner').style.display = 'none';
            document.getElementById('manual-redirect').style.display = 'block';
          }, 2000);
        </script>
      </head>
      <body>
        <div class="container">
          <div id="spinner" class="spinner"></div>
          <h2>Completing authentication...</h2>
          <p>You should be redirected to Juniper automatically.</p>
          
          ${error ? `<p class="error">Error: ${errorDescription || error}</p>` : ''}
          
          <div id="manual-redirect" style="display: none;">
            <p>If you're not redirected automatically:</p>
            <a href="${callbackUrl}" class="button">
              Open in Juniper
            </a>
          </div>
        </div>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
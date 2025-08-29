import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''
  
  // Check if this is likely an Android system request for app link verification
  const isAndroidSystemRequest = userAgent.includes('Android') || 
    searchParams.has('android-app-link') ||
    request.headers.get('accept')?.includes('application/json')

  if (isAndroidSystemRequest) {
    try {
      // Serve the actual assetlinks.json for legitimate app link verification
      const assetlinksPath = join(process.cwd(), 'public', '.well-known', 'assetlinks.json')
      const assetlinks = readFileSync(assetlinksPath, 'utf8')
      
      return new NextResponse(assetlinks, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400'
        }
      })
    } catch (error) {
      return NextResponse.json({ error: 'Asset links not found' }, { status: 404 })
    }
  }

  // For users who ended up here due to app link failures, show helpful message
  return new NextResponse(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Authentication Successful</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
          line-height: 1.6;
          color: #333;
        }
        .container {
          text-align: center;
          padding: 40px 20px;
          border: 2px solid #4CAF50;
          border-radius: 10px;
          background-color: #f9f9f9;
        }
        .success {
          color: #4CAF50;
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .instructions {
          margin-top: 20px;
          padding: 15px;
          background-color: #e8f4fd;
          border-radius: 5px;
          text-align: left;
        }
        .steps {
          margin: 10px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✓ Authentication successful</div>
        <p>You can return to the app.</p>
        
        <div class="instructions">
          <div class="steps">To avoid this issue in the future:</div>
          <ol>
            <li>Navigate to the app settings</li>
            <li>Go to "Open by Default"</li>
            <li>Select the juniper URL</li>
          </ol>
          <p style="margin-top: 15px; font-style: italic;">You can also ask your assistant to complete the integration for this service since it was interrupted.</p>
        </div>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html',
    }
  })
}
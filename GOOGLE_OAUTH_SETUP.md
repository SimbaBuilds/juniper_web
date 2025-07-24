# Google OAuth Setup Instructions

To enable Google OAuth authentication, you need to configure it in both Google Cloud Console and Supabase.

## 1. Google Cloud Console Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/auth/callback`
     - For production: `https://yourdomain.com/auth/callback`
   - Note down the Client ID and Client Secret

## 2. Supabase Dashboard Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "Authentication" > "Providers"
4. Find "Google" and toggle it on
5. Enter your Google OAuth credentials:
   - Client ID (from Google Cloud Console)
   - Client Secret (from Google Cloud Console)
6. Save the configuration

## 3. Environment Variables

Make sure your `.env.local` file includes:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Test the Integration

1. Start your development server: `npm run dev`
2. Go to `/signup` or `/login`
3. Click the "Google" button
4. You should be redirected to Google's OAuth flow
5. After authorization, you'll be redirected back to your app

## Troubleshooting

- Make sure the redirect URI in Google Cloud Console exactly matches your app's URL
- Check that the Google+ API is enabled
- Verify that your Supabase project has the correct Google OAuth credentials
- Check the browser console for any error messages during the OAuth flow
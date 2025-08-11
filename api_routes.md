 The issue is clear: your server at https://hightower-ai.com is 
  returning a 404 for the OAuth callback URL. The Universal Links
  configuration is correct, but there's no server-side handler for
   the OAuth callback endpoints.

  Key findings:

  1. Universal Links setup is working: Your AASA file is properly
  served and configured for applinks:hightower-ai.com
  2. Mobile app config is correct: OAuth redirects point to
  https://hightower-ai.com/oauth/gmail/callback
  3. Server issue: The server returns 404 for
  /oauth/gmail/callback, meaning no API route exists to handle
  OAuth callbacks

  Solution:

  You need to create server-side API routes to handle OAuth
  callbacks. The Universal Links will work once the server
  endpoints exist. Here's what you need:
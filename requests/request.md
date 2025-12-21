 LOG  🚀 [AutomationsApiService] Triggering automation: {"automationId": "477b35c8-9dd9-4f2e-9613-8675ba514cf4", "siteUrl": "http://192.168.1.80:3000", "url": "http://192.168.1.80:3000/api/automations/trigger"}
 LOG  📡 [AutomationsApiService] Response status: 401 
 LOG  📄 [AutomationsApiService] Raw response: {"error":"Failed to get session"}
 ERROR  ❌ [AutomationsApiService] Error response: {"result": {"error": "Failed to get session"}, "status": 401}
 ERROR  ❌ [AutomationsApiService] Request failed: {"error": [Error: Failed to get session], "message": "Failed to get session"}
 ERROR  Error triggering automation: [Error: Failed to get session]



⏺ Progress! You got past the first auth check, but now it's failing at line 152-155 where it tries to get a session to call the edge functions:

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session?.access_token) {
    return NextResponse.json({ error: 'Failed to get session' }, { status: 401 });
  }

  The issue: with Bearer token auth, there's no "session" - you already have the token!

  Fix - In your Next.js route, after the Bearer token check, store the token and use it directly instead of calling getSession():

  export async function POST(request: NextRequest) {
    try {
      const authHeader = request.headers.get('Authorization');
      let supabase;
      let accessToken: string | null = null;  // Store the token

      if (authHeader?.startsWith('Bearer ')) {
        // Mobile app auth
        accessToken = authHeader.replace('Bearer ', '');
        supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          }
        );
      } else {
        // Web app auth
        supabase = await createSupabaseAppServerClient();
      }

      // ... existing user check ...

      // Later, when you need the token for edge functions:
      if (!accessToken) {
        // Only get session for web (cookie) auth
        const { data: { session } } = await supabase.auth.getSession();
        accessToken = session?.access_token || null;
      }

      if (!accessToken) {
        return NextResponse.json({ error: 'Failed to get session' }, { status: 401 });
      }

      // Use accessToken for edge function calls
      const response = await fetch(executorUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`  // Use our stored token
        },
        // ...
      });

  This way it uses the mobile token directly instead of trying to get a session that doesn't exist.
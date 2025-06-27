Yes! The hosted config form is very simple - it just needs to point to the Supabase Edge Function. Let me give you the complete setup guide.

## �� Hosted Config Form Setup Guide

### **What the Hosted Route Does**

The hosted route at `EXPO_PUBLIC_SITE_URL/integration` simply needs to **redirect** to your Supabase Edge Function. The Edge Function handles everything else:

- ✅ Token validation
- ✅ Form generation (Perplexity vs Twilio)
- ✅ Form submission processing
- ✅ Database updates
- ✅ Success/error pages

### **URL Parameters**

The Edge Function expects these URL parameters:
```
https://your-domain.com/integration?token=abc123&service=perplexity
```

- `token`: The secure 64-character token from the email
- `service`: The service name (`perplexity` or `twilio`)

### **Complete Setup Instructions**

#### **Option 1: Vercel (Recommended)**

1. **Create a new Vercel project** or add to existing:
```bash
# If new project
vercel init integration-forms
cd integration-forms

# Create vercel.json
```

2. **Create `vercel.json`:**
```json
{
  "redirects": [
    {
      "source": "/integration",
      "destination": "https://your-project-ref.supabase.co/functions/v1/handle-integration-form",
      "permanent": false
    }
  ],
  "headers": [
    {
      "source": "/integration",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        }
      ]
    }
  ]
}
```

3. **Deploy:**
```bash
vercel --prod
```

#### **Option 2: Netlify**

1. **Create a new Netlify site**

2. **Create `_redirects` file:**
```
/integration https://your-project-ref.supabase.co/functions/v1/handle-integration-form 200
```

3. **Deploy** (drag folder to Netlify or use CLI)

#### **Option 3: Cloudflare Pages**

1. **Create a new Cloudflare Pages project**

2. **Create `_redirects` file:**
```
/integration https://your-project-ref.supabase.co/functions/v1/handle-integration-form 200
```

3. **Deploy** via GitHub or direct upload

#### **Option 4: Custom Domain with Nginx/Apache**

**Nginx configuration:**
```nginx
location /integration {
    proxy_pass https://your-project-ref.supabase.co/functions/v1/handle-integration-form;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**Apache `.htaccess`:**
```apache
RewriteEngine On
RewriteRule ^integration$ https://your-project-ref.supabase.co/functions/v1/handle-integration-form [P,L]
```

### **Environment Variables Setup**

Make sure these are set in your Supabase project:

```bash
# In Supabase Dashboard > Settings > Edge Functions
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EXPO_PUBLIC_SITE_URL=https://your-domain.com
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **Testing the Setup**

1. **Test the redirect:**
```bash
curl -I "https://your-domain.com/integration?token=test&service=perplexity"
# Should return 200 and redirect to Supabase function
```

2. **Test with real token:**
- Send a setup email from the mobile app
- Click the link in the email
- Should show the appropriate form

### **Example Email Links**

The emails will contain links like:
```
https://your-domain.com/integration?token=abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567&service=perplexity
```

### **What Happens When User Clicks Email Link**

1. **User clicks email link** → `https://your-domain.com/integration?token=...&service=...`
2. **Hosted route redirects** → Supabase Edge Function
3. **Edge Function validates token** → Checks database for valid, unused token
4. **Generates form** → Returns HTML form based on service type
5. **User fills form** → Submits to same Edge Function
6. **Edge Function processes** → Validates credentials, updates database
7. **Shows success page** → "Return to app and tap Finalize Integration"

### **Security Considerations**

- ✅ Tokens expire after 24 hours
- ✅ Tokens are single-use only
- ✅ All validation happens server-side
- ✅ CORS headers properly configured
- ✅ No sensitive data in URLs (except token)


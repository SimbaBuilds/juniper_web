import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:', {
    SUPABASE_URL: !!SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY
  });
}
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  console.log('🔵 handle-integration-form request:', req.method, req.url);
  try {
    if (req.method === 'GET') {
      // Handle GET requests (serve form) - no authentication required for serving HTML
      console.log('🔵 Handling GET request to serve form...');
      // Initialize Supabase client with anon key for public access
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      // Serve the form page
      const url = new URL(req.url);
      const token = url.searchParams.get('token');
      const service = url.searchParams.get('service');
      if (!token || !service) {
        return new Response(generateErrorPage('Invalid or missing parameters'), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html'
          }
        });
      }
      // Validate token (bypass RLS for service role)
      console.log('🔍 Validating GET token:', token.substring(0, 8) + '...');
      const { data: tokenData, error: tokenError } = await supabase.from('integration_setup_tokens').select('*').eq('token', token).eq('is_used', false).gt('expires_at', new Date().toISOString()).single();
      console.log('🔍 GET token validation result:', {
        found: !!tokenData,
        error: tokenError?.message,
        errorCode: tokenError?.code
      });
      if (tokenError || !tokenData) {
        return new Response(generateErrorPage('Invalid or expired setup link. Please request a new one from the mobile app.'), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/html'
          }
        });
      }
      // Generate form page
      const formPage = generateFormPage(token, service.toLowerCase(), tokenData.service_name);
      return new Response(formPage, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/html'
        }
      });
    }
    if (req.method === 'POST') {
      // Handle form submission with service role authentication
      console.log('🔵 Handling POST request for form submission...');
      // Initialize Supabase client with service role for data modifications
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      const body = await req.json();
      const { token, service, formData } = body;
      if (!token || !service || !formData) {
        return new Response(JSON.stringify({
          error: 'Missing required fields'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Validate token (bypass RLS for service role)
      console.log('🔍 Validating POST token:', token.substring(0, 8) + '...');
      const { data: tokenData, error: tokenError } = await supabase.from('integration_setup_tokens').select('*').eq('token', token).eq('is_used', false).gt('expires_at', new Date().toISOString()).single();
      console.log('🔍 POST token validation result:', {
        found: !!tokenData,
        error: tokenError?.message,
        errorCode: tokenError?.code
      });
      if (tokenError || !tokenData) {
        return new Response(JSON.stringify({
          error: 'Invalid or expired setup token'
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      // Process form data based on service type
      let success = false;
      let errorMessage = '';
      if (service.toLowerCase() === 'perplexity') {
        if (!formData.apiKey) {
          errorMessage = 'API key is required';
        } else {
          // Validate and store Perplexity API key
          success = await processPerplexitySetup(formData.apiKey, tokenData, supabase);
          if (!success) errorMessage = 'Failed to validate API key';
        }
      } else if (service.toLowerCase() === 'twilio') {
        if (!formData.accountSid || !formData.apiKey || !formData.apiSecret || !formData.phoneNumber) {
          errorMessage = 'All Twilio credentials are required';
        } else {
          // Validate and store Twilio credentials
          success = await processTwilioSetup(formData, tokenData, supabase);
          if (!success) errorMessage = 'Failed to validate credentials';
        }
      } else {
        errorMessage = 'Unsupported service type';
      }
      if (success) {
        // Mark token as used
        await supabase.from('integration_setup_tokens').update({
          is_used: true,
          updated_at: new Date().toISOString()
        }).eq('id', tokenData.id);
        return new Response(JSON.stringify({
          success: true,
          message: 'Setup completed successfully! Your integration is now active and ready to use.'
        }), {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else {
        return new Response(JSON.stringify({
          error: errorMessage
        }), {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
    }
    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error in handle-integration-form function:', error);
    console.error('Error type:', typeof error);
    console.error('Error details:', error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : String(error));
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
async function processPerplexitySetup(apiKey, tokenData, supabase) {
  try {
    // Validate API key format
    if (!apiKey.startsWith('pplx-') || apiKey.length < 40) {
      return false;
    }
    // Test API key
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'user',
            content: 'Test'
          }
        ],
        max_tokens: 10
      })
    });
    // API key is valid if we don't get a 401
    const isValid = response.status !== 401;
    if (isValid) {
      // Store API key in the same format as mobile app
      await supabase.from('integrations').update({
        api_key: apiKey,
        is_active: true,
        status: 'active',
        updated_at: new Date().toISOString(),
        last_used: new Date().toISOString()
      }).eq('id', tokenData.integration_id);
    }
    return isValid;
  } catch (error) {
    console.error('Error processing Perplexity setup:', error);
    return false;
  }
}
async function processTwilioSetup(formData, tokenData, supabase) {
  try {
    const { accountSid, apiKey, apiSecret, phoneNumber } = formData;
    // Basic validation
    if (!accountSid.startsWith('AC') || !apiKey.startsWith('SK')) {
      return false;
    }
    // Clean phone number
    const cleanedPhoneNumber = phoneNumber.replace(/[^\d]/g, '');
    if (cleanedPhoneNumber.length < 10) {
      return false;
    }
    // Store credentials in the same format as mobile app
    await supabase.from('integrations').update({
      configuration: {
        account_sid: accountSid,
        api_key: apiKey,
        api_secret: apiSecret,
        phone_number: cleanedPhoneNumber
      },
      is_active: true,
      status: 'active',
      updated_at: new Date().toISOString(),
      last_used: new Date().toISOString()
    }).eq('id', tokenData.integration_id);
    return true;
  } catch (error) {
    console.error('Error processing Twilio setup:', error);
    return false;
  }
}
function generateErrorPage(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Integration Setup Error</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        .error-icon { font-size: 48px; margin-bottom: 20px; }
        h1 { color: #e74c3c; margin-bottom: 20px; }
        p { color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">❌</div>
        <h1>Setup Error</h1>
        <p>${message}</p>
      </div>
    </body>
    </html>
  `;
}
function generateFormPage(token, service, serviceName) {
  const isPerplexity = service === 'perplexity';
  const isTwilio = service === 'twilio';
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${serviceName} Integration Setup</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 40px; }
        .header h1 { color: #333; margin-bottom: 10px; }
        .header p { color: #666; }
        .form-group { margin-bottom: 20px; }
        label { display: block; font-weight: 600; margin-bottom: 8px; color: #333; }
        input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box; }
        input:focus { outline: none; border-color: #4A90E2; }
        .submit-btn { background: #4A90E2; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: 600; cursor: pointer; width: 100%; }
        .submit-btn:hover { background: #357ABD; }
        .submit-btn:disabled { background: #ccc; cursor: not-allowed; }
        .instructions { background: #f8f9ff; padding: 20px; border-radius: 5px; margin-bottom: 30px; border-left: 4px solid #4A90E2; }
        .instructions h3 { margin-top: 0; color: #4A90E2; }
        .loading { display: none; text-align: center; padding: 20px; }
        .success { display: none; text-align: center; padding: 20px; background: #d4edda; border-radius: 5px; color: #155724; }
        .error { display: none; text-align: center; padding: 20px; background: #f8d7da; border-radius: 5px; color: #721c24; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${serviceName} Integration Setup</h1>
          <p>Complete your integration setup for Juniper</p>
        </div>

        ${isPerplexity ? `
        <div class="instructions">
          <h3>📝 Getting your Perplexity API Key</h3>
          <ol>
            <li><strong>Create an account</strong></li>
            <li><strong>Go to <a href="https://www.perplexity.ai/account/api/group" target="_blank">perplexity.ai/account</a></strong></li>
            <li><strong>Create a group</strong></li>
            <li><strong>Go to API Billing and enter info</strong></li>
            <li><strong>Purchase credits</strong></li>
            <li><strong>Go to API Keys and generate a key.</strong> It might take a second for the credits to propagate.</li>
          </ol>
          
          <h4>💰 Personal Usage Estimates:</h4>
          <ul>
            <li><strong>Light use:</strong> ~4 queries/day = $1-2/month</li>
            <li><strong>Moderate use:</strong> ~10 queries/day = $5-10/month</li>
            <li><strong>Heavy use:</strong> ~50 queries/day = $15-30/month</li>
          </ul>
          
        </div>

        <form id="setupForm">
          <div class="form-group">
            <label for="apiKey">Perplexity API Key</label>
            <input type="password" id="apiKey" name="apiKey" placeholder="pplx-" required>
          </div>
          <button type="submit" class="submit-btn">Complete Setup</button>
        </form>
        ` : ''}

        ${isTwilio ? `
        <div class="instructions">
          <h3>📝 Instructions</h3>
          <ol>
            <li>Sign up at <a href="https://twilio.com" target="_blank">twilio.com</a> ($15 free credit)</li>
            <li>Go to Console > Account > API keys & tokens</li>
            <li>Copy your Account SID</li>
            <li>Create a new API Key (gives you Key + Secret)</li>
            <li>Buy a phone number in Console > Phone Numbers</li>
          </ol>
        </div>

        <form id="setupForm">
          <div class="form-group">
            <label for="accountSid">Account SID</label>
            <input type="text" id="accountSid" name="accountSid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required>
          </div>
          <div class="form-group">
            <label for="apiKey">API Key</label>
            <input type="text" id="apiKey" name="apiKey" placeholder="SKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" required>
          </div>
          <div class="form-group">
            <label for="apiSecret">API Secret</label>
            <input type="password" id="apiSecret" name="apiSecret" placeholder="Your API secret" required>
          </div>
          <div class="form-group">
            <label for="phoneNumber">Twilio Phone Number</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" placeholder="+1234567890" required>
          </div>
          <button type="submit" class="submit-btn">Complete Setup</button>
        </form>
        ` : ''}

        <div class="loading" id="loading">
          <p>Processing your setup...</p>
        </div>

        <div class="success" id="success">
          <h3>✅ Setup Complete!</h3>
          <p>Your ${serviceName} integration has been configured successfully and is now active.</p>
          <p><strong>Next step:</strong> Return to your Juniper app - your integration is ready to use!</p>
        </div>

        <div class="error" id="error">
          <h3>❌ Setup Failed</h3>
          <p id="errorMessage">There was an error processing your setup. Please check your credentials and try again.</p>
        </div>
      </div>

      <script>
        document.getElementById('setupForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const form = e.target;
          const formData = new FormData(form);
          const data = {};
          
          for (let [key, value] of formData.entries()) {
            data[key] = value;
          }

          // Show loading
          document.getElementById('setupForm').style.display = 'none';
          document.getElementById('loading').style.display = 'block';

          try {
            const response = await fetch('/functions/v1/handle-integration-form', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                token: '${token}',
                service: '${service}',
                formData: data
              })
            });

            const result = await response.json();
            
            if (response.ok && result.success) {
              document.getElementById('loading').style.display = 'none';
              document.getElementById('success').style.display = 'block';
            } else {
              throw new Error(result.error || 'Setup failed');
            }
          } catch (error) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('error').style.display = 'block';
            document.getElementById('errorMessage').textContent = error.message;
          }
        });
      </script>
    </body>
    </html>
  `;
}

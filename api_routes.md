The Cross-Platform Solution:

  Your web app needs to handle OAuth callbacks differently for
  iOS vs Android:

  // Web app OAuth callback handler
  export default function OAuthCallback(req, res) {
    const { service } = req.query;
    const { code, state } = req.query;

    // Build the callback URL
    const callbackUrl = `https://hightower-ai.com/oauth/${servic
  e}/callback?code=${code}&state=${state}`;

    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, 
  initial-scale=1">
          <title>Redirecting to Juniper...</title>
          <script>
            // For iOS: Universal Links
            window.location.href = "${callbackUrl}";
            
            // For Android: Fallback if App Link doesn't 
  auto-open
            setTimeout(function() {
              // If still here after 2 seconds, show manual 
  redirect
              
  document.getElementById('manual-redirect').style.display = 
  'block';
            }, 2000);
          </script>
        </head>
        <body style="font-family: Arial, sans-serif; text-align:
   center; padding: 50px;">
          <h2>Completing authentication...</h2>
          <p>You should be redirected to Juniper 
  automatically.</p>
          
          <div id="manual-redirect" style="display: none; 
  margin-top: 30px;">
            <p>If you're not redirected automatically:</p>
            <a href="${callbackUrl}" style="display: 
  inline-block; padding: 10px 20px; background: #007AFF; color: 
  white; text-decoration: none; border-radius: 5px;">
              Open in Juniper
            </a>
          </div>
        </body>
      </html>
    `);
  }

  Key Differences:

  iOS (Universal Links):
  - Requires apple-app-site-association ✅
  - Uses https:// URLs only
  - Opens app directly if installed

  Android (App Links):
  - Requires assetlinks.json ✅
  - Uses https:// URLs with autoVerify="true"
  - Opens app directly if verified

  Both platforms need the same web OAuth callback routes to work
   properly.
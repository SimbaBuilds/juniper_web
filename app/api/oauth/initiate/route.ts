import { NextRequest, NextResponse } from 'next/server';
import { getOAuthConfig } from '@/app/lib/integrations/oauth/OAuthConfig';

export async function POST(request: NextRequest) {
  try {
    const { serviceName, isReconnection } = await request.json();

    if (!serviceName) {
      return NextResponse.json(
        { success: false, error: 'Service name is required' },
        { status: 400 }
      );
    }

    const config = getOAuthConfig(serviceName);
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'OAuth configuration not found for service' },
        { status: 404 }
      );
    }

    if (!config.clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID not configured for service' },
        { status: 500 }
      );
    }

    // Build the OAuth URL
    const params = new URLSearchParams();
    params.append('client_id', config.clientId);
    params.append('redirect_uri', config.redirectUri);
    params.append('response_type', 'code');
    
    if (config.scopes.length > 0) {
      params.append('scope', config.scopes.join(' '));
    }

    // Generate and add state parameter for security
    const state = generateRandomState();
    // Add reconnection flag to state if this is a reconnection
    const stateWithFlags = isReconnection ? `${state}&reconnect=true` : state;
    params.append('state', stateWithFlags);

    // Add additional params if specified
    if (config.additionalParams) {
      Object.entries(config.additionalParams).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    // Handle PKCE if required
    let codeVerifier: string | undefined;
    if (config.usePKCE) {
      codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    const authUrl = `${config.authorizationUrl}?${params.toString()}`;

    return NextResponse.json({
      success: true,
      authUrl,
      state: stateWithFlags,
      codeVerifier,
      usePKCE: config.usePKCE
    });

  } catch (error) {
    console.error('OAuth initiation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateRandomState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Buffer.from(array).toString('base64url');
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(digest).toString('base64url');
}
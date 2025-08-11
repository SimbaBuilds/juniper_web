import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 59;

interface OuraWebhookEvent {
  event_type: string;
  object: string;
  aspect: string;
  user_id: string;
  data_id: string;
  timestamp: string;
}

const OURA_WEBHOOK_SECRET = process.env.OURA_WEBHOOK_SECRET || '';
const OURA_VERIFICATION_TOKEN = process.env.OURA_VERIFICATION_TOKEN || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const verificationToken = searchParams.get('verification_token');
    
    if (verificationToken === OURA_VERIFICATION_TOKEN) {
      console.log('Oura webhook verification successful');
      return new NextResponse(verificationToken, { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    }
    
    console.error('Oura webhook verification failed', { verificationToken });
    return NextResponse.json({ error: 'Verification failed' }, { status: 404 });
  } catch (error) {
    console.error('Error in Oura webhook GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('oura-signature');
    
    if (!signature) {
      console.error('Missing Oura signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    const timestamp = req.headers.get('oura-timestamp');
    if (!timestamp) {
      console.error('Missing Oura timestamp header');
      return NextResponse.json({ error: 'Missing timestamp' }, { status: 401 });
    }
    
    const timestampNum = parseInt(timestamp);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - timestampNum);
    
    if (timeDiff > 300) {
      console.error('Oura webhook timestamp too old', { timeDiff });
      return NextResponse.json({ error: 'Timestamp too old' }, { status: 401 });
    }
    
    const rawBody = await req.text();
    
    const signatureBase = `v0:${timestamp}:${rawBody}`;
    const expectedSignature = crypto
      .createHmac('sha256', OURA_WEBHOOK_SECRET)
      .update(signatureBase)
      .digest('hex');
    
    const expectedSignatureHeader = `v0=${expectedSignature}`;
    
    if (signature !== expectedSignatureHeader) {
      console.error('Invalid Oura signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    let event: OuraWebhookEvent;
    try {
      event = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse Oura webhook body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    console.log('Processing Oura webhook event:', {
      event_type: event.event_type,
      object: event.object,
      aspect: event.aspect,
      user_id: event.user_id,
      data_id: event.data_id,
      timestamp: event.timestamp
    });
    
    switch (event.event_type) {
      case 'create':
        switch (event.object) {
          case 'daily_activity':
            console.log(`New daily activity data for user ${event.user_id}`);
            break;
          case 'daily_readiness':
            console.log(`New daily readiness data for user ${event.user_id}`);
            break;
          case 'daily_sleep':
            console.log(`New daily sleep data for user ${event.user_id}`);
            break;
          case 'workout':
            console.log(`New workout data for user ${event.user_id}`);
            break;
          case 'session':
            console.log(`New session data for user ${event.user_id}`);
            break;
          case 'tag':
            console.log(`New tag data for user ${event.user_id}`);
            break;
          default:
            console.log(`Unknown object type: ${event.object}`);
        }
        break;
      case 'update':
        console.log(`Updated ${event.object} data for user ${event.user_id}`);
        break;
      case 'delete':
        console.log(`Deleted ${event.object} data for user ${event.user_id}`);
        break;
      case 'revoke':
        console.log(`User ${event.user_id} revoked access`);
        break;
      default:
        console.log(`Unknown event type: ${event.event_type}`);
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error processing Oura webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
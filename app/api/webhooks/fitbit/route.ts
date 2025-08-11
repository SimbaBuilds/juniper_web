import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 59;

interface FitbitWebhookEvent {
  collectionType: string;
  date: string;
  ownerId: string;
  ownerType: string;
  subscriptionId: string;
}

const FITBIT_VERIFICATION_CODE = process.env.FITBIT_VERIFICATION_CODE || '';
const FITBIT_CLIENT_SECRET = process.env.FITBIT_CLIENT_SECRET || '';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const verify = searchParams.get('verify');
    const mode = searchParams.get('mode');
    
    if (mode === 'subscribe' && verify === FITBIT_VERIFICATION_CODE) {
      console.log('Fitbit webhook verification successful');
      return new NextResponse(null, { status: 204 });
    }
    
    console.error('Fitbit webhook verification failed', { verify, mode });
    return NextResponse.json({ error: 'Verification failed' }, { status: 404 });
  } catch (error) {
    console.error('Error in Fitbit webhook GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-fitbit-signature');
    
    if (!signature) {
      console.error('Missing Fitbit signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    const rawBody = await req.text();
    
    const expectedSignature = crypto
      .createHmac('sha1', FITBIT_CLIENT_SECRET + '&')
      .update(rawBody)
      .digest('base64');
    
    if (signature !== expectedSignature) {
      console.error('Invalid Fitbit signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    let events: FitbitWebhookEvent[];
    try {
      events = JSON.parse(rawBody);
    } catch (parseError) {
      console.error('Failed to parse Fitbit webhook body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    console.log(`Received ${events.length} Fitbit webhook events`);
    
    for (const event of events) {
      console.log('Processing Fitbit event:', {
        collectionType: event.collectionType,
        date: event.date,
        ownerId: event.ownerId,
        ownerType: event.ownerType,
        subscriptionId: event.subscriptionId
      });
      
      switch (event.collectionType) {
        case 'activities':
          console.log(`Processing activities data for user ${event.ownerId}`);
          break;
        case 'body':
          console.log(`Processing body metrics for user ${event.ownerId}`);
          break;
        case 'foods':
          console.log(`Processing food data for user ${event.ownerId}`);
          break;
        case 'sleep':
          console.log(`Processing sleep data for user ${event.ownerId}`);
          break;
        case 'userRevokedAccess':
          console.log(`User ${event.ownerId} revoked access`);
          break;
        default:
          console.log(`Unknown collection type: ${event.collectionType}`);
      }
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error processing Fitbit webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
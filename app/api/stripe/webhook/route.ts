/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from "@/lib/stripe";
import { createSupabaseServiceClient } from "@/lib/utils/supabase/service";
import Stripe from "stripe";

// Route Segment Config
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 59;

const relevantEvents = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.paid', // Add this event that Stripe actually sends
]);

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = (await headers()).get('stripe-signature');

    // Debug logging
    console.log('Webhook Secret:', process.env.STRIPE_WEBHOOK_SECRET?.slice(0, 5) + '...');
    console.log('Raw Body Length:', rawBody.length);
    console.log('Raw Body Type:', typeof rawBody);
    console.log('First 100 chars of Raw Body:', rawBody.slice(0, 100));

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('Missing signature or webhook secret');
      return new NextResponse('Webhook signature or secret missing', { status: 400 });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
      
      console.log('Event successfully constructed:', event.type);

      if (!relevantEvents.has(event.type)) {
        return NextResponse.json({ received: true });
      }

      const supabase = createSupabaseServiceClient();

      switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        
        console.log('🔄 Processing checkout session completed:', {
          sessionId: session.id,
          userId: userId,
          customerId: session.customer,
          subscriptionId: session.subscription
        });
        
        if (!userId || !session.subscription) {
          console.error('❌ No user ID or subscription in checkout session metadata');
          break;
        }

        // Store all subscription details immediately since checkout completed successfully
        const updateData = {
          stripe_subscription_id: session.subscription as string,
          stripe_customer_id: session.customer as string,
          subscription_tier: 'pro',
          subscription_status: 'active',
        };

        console.log('📝 Updating user profile with checkout data:', { userId, updateData });

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', userId);

        if (updateError) {
          console.error('❌ Failed to update user profile after checkout:', updateError);
        } else {
          console.log('✅ Successfully updated user profile after checkout:', userId);
        }

        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const periodEnd = new Date(((subscription as any).current_period_end) * 1000);

        console.log('🔄 Processing subscription event:', {
          eventType: event.type,
          subscriptionId: subscription.id,
          customerId: customerId,
          status: subscription.status,
          periodEnd: periodEnd.toISOString(),
          cancelAtPeriodEnd: (subscription as any).cancel_at_period_end
        });

        // Find user by subscription ID (more reliable than customer ID)
        console.log('🔍 Looking up user by subscription ID:', subscription.id);
                                    const { data: profileData, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('id, stripe_customer_id, subscription_status, subscription_tier')
                    .eq('stripe_subscription_id', subscription.id)
                    .single();
                  let profile = profileData || null

        if (profileError) {
          console.error('❌ Failed to find user by subscription ID:', {
            error: profileError,
            subscriptionId: subscription.id,
            customerId: customerId
          });
          
          // Try fallback: look by customer ID in case subscription ID wasn't saved yet
          console.log('🔍 Trying fallback lookup by customer ID...');
          const { data: fallbackProfile, error: fallbackError } = await supabase
            .from('user_profiles')
            .select('id, stripe_customer_id, subscription_status, subscription_tier')
            .eq('stripe_customer_id', customerId)
            .single();

          if (fallbackError) {
            console.error('❌ Fallback customer lookup also failed:', fallbackError);
            break;
          }
          
          if (fallbackProfile) {
            console.log('✅ Found user via customer ID fallback:', fallbackProfile.id);
            // Use fallback profile for update
            profile = fallbackProfile;
          } else {
            console.error('❌ No fallback profile found');
            break;
          }
        } else if (profile) {
          console.log('✅ Found user by subscription ID:', profile.id);
        } else {
          console.error('❌ No user profile found by subscription ID');
          break;
        }

        // Ensure we have a valid profile before proceeding
        if (!profile) {
          console.error('❌ No user profile found after lookup attempts');
          break;
        }

        // Update subscription data
        const updateData = {
          stripe_subscription_id: subscription.id,
          stripe_customer_id: customerId, // Ensure customer ID is always set
          subscription_status: subscription.status,
          subscription_tier: subscription.status === 'active' ? 'pro' : 'free',
          subscription_current_period_end: periodEnd,
          subscription_cancel_at_period_end: (subscription as any).cancel_at_period_end,
        };

        console.log('📝 Updating subscription data:', { userId: profile.id, updateData });

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update(updateData)
          .eq('id', profile.id);

        if (updateError) {
          console.error('❌ Failed to update subscription data:', {
            error: updateError,
            userId: profile.id,
            updateData: updateData
          });
        } else {
          console.log('✅ Successfully updated subscription data for user:', profile.id);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        // Get user by stripe customer ID
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();

        if (profile) {
          await supabase
            .from('user_profiles')
            .update({
              subscription_status: 'canceled',
              subscription_tier: 'free',
              subscription_cancel_at_period_end: false,
              subscription_current_period_end: null,
            })
            .eq('id', profile.id);
        }

        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        
        console.log('🔄 Processing invoice payment event:', {
          eventType: event.type,
          invoiceId: invoice.id,
          subscriptionId: subscriptionId,
          customerId: (invoice as any).customer,
          status: (invoice as any).status
        });
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;

          console.log('🔍 Looking up user for invoice payment by customer ID:', customerId);

          // Get user by stripe customer ID
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (profileError) {
            console.error('❌ Failed to find user profile for invoice payment:', {
              error: profileError,
              customerId: customerId,
              subscriptionId: subscriptionId
            });
          } else if (profile) {
            console.log('✅ Found user profile for invoice payment:', profile.id);
            
            const updateData = {
              subscription_status: 'active',
              subscription_tier: 'pro',
              subscription_current_period_end: new Date(((subscription as any).current_period_end) * 1000),
            };

            console.log('📝 Updating subscription status for successful payment:', updateData);

            const { error: updateError } = await supabase
              .from('user_profiles')
              .update(updateData)
              .eq('id', profile.id);

            if (updateError) {
              console.error('❌ Failed to update subscription for invoice payment:', updateError);
            } else {
              console.log('✅ Successfully updated subscription for invoice payment:', profile.id);
            }
          }
        } else {
          console.log('⚠️ Invoice payment event has no subscription ID');
        }

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = subscription.customer as string;

          // Get user by stripe customer ID
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (profile) {
            await supabase
              .from('user_profiles')
              .update({
                subscription_status: subscription.status,
              })
              .eq('id', profile.id);
          }
        }

        break;
      }

        default:
          console.log(`Unhandled relevant event type: ${event.type}`);
      }

      return NextResponse.json({ received: true });
    } catch (verifyError) {
      console.error('Verification Error Details:', {
        signatureHeader: signature?.slice(0, 50),
        bodyPreview: rawBody.slice(0, 50) + '...'
      });
      throw verifyError;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message.slice(0, 50),
        name: error.name.slice(0, 50),
        stack: error.stack?.slice(0, 50),
      });
    }
    return new NextResponse(
      error instanceof Error ? error.message.slice(0, 50) : 'Webhook handler failed',
      { status: 400 }
    );
  }
}


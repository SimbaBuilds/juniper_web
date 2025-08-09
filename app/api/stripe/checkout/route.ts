import { NextResponse } from "next/server";
import { stripe, getURL } from "@/lib/stripe";
import { createSupabaseAppServerClient } from "@/lib/utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createSupabaseAppServerClient();
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, subscription_tier')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    // Check if user already has a pro subscription
    if (profile?.subscription_tier === 'pro') {
      return NextResponse.json(
        { error: "You already have an active pro subscription" },
        { status: 400 }
      );
    }

    // Create or retrieve Stripe customer
    let customerId = profile?.stripe_customer_id;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      
      customerId = customer.id;
      
      // Update user profile with Stripe customer ID
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Create checkout session with both subscription and metered pricing
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRO_PRICE_ID,
          quantity: 1,
        },
        {
          price: process.env.STRIPE_UBP_PRICE_ID,
        },
      ],
      success_url: `${getURL()}account?success=true`,
      cancel_url: `${getURL()}account?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: {
        address: 'auto',
      },
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST requests for this endpoint
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body (optional)
    let body: { mode?: 'immediate' | 'period_end'; reason?: string } = {};
    try {
      if (req.headers.get('Content-Type')?.includes('application/json')) {
        body = await req.json();
      }
    } catch (_) {
      // ignore malformed body, we'll use defaults
    }

    const mode = body.mode === 'period_end' ? 'period_end' : 'immediate';
    const reason = body.reason || undefined;
    // Debug: Check what headers we're receiving
    const authHeader = req.headers.get('Authorization');
    console.log('Received Authorization header:', authHeader ? 'Bearer token present' : 'No auth header');
    
    if (!authHeader) {
      console.error('No Authorization header found');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client for JWT verification
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_ANON_KEY') || ''
    );

    // Get the user from the JWT token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      console.error('User data:', user);
      return new Response(
        JSON.stringify({ error: 'Not authenticated', details: userError?.message }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully authenticated user:', user.id);

    // Create service role client for database operations
    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the latest subscription (if any) using service client
    const { data: subscription, error: subscriptionError } = await serviceClient
      .from('subscriptions')
      .select('id, tier, status, cancel_at_period_end, created_at, updated_at, stripe_subscription_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subscriptionError && subscriptionError.code !== 'PGRST116') { // PGRST116 = no rows
      console.error('Error fetching subscription:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no subscription or already on free tier, return success
    if (!subscription || subscription.tier === 'free') {
      return new Response(
        JSON.stringify({ success: true, info: 'No active paid subscription' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle Stripe subscription according to requested mode
    if (subscription?.stripe_subscription_id) {
      const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') || '';
      if (!stripeSecret) {
        console.error('Missing STRIPE_SECRET_KEY for downgrade-subscription');
      } else {
        const subId = subscription.stripe_subscription_id;
        if (mode === 'period_end') {
          // Set cancel_at_period_end = true on Stripe
          (async () => {
            try {
              const stripe = new Stripe(stripeSecret, {
                apiVersion: '2022-11-15',
                httpClient: Stripe.createFetchHttpClient(),
              });
              await stripe.subscriptions.update(subId, { cancel_at_period_end: true, cancellation_details: reason ? { comment: reason } as any : undefined });
              console.log('Marked Stripe subscription to cancel at period end:', subId);
            } catch (e) {
              console.error('Failed to mark Stripe subscription cancel_at_period_end:', e);
            }
          })();
        } else {
          // immediate
          (async () => {
            try {
              const stripe = new Stripe(stripeSecret, {
                apiVersion: '2022-11-15',
                httpClient: Stripe.createFetchHttpClient(),
              });
              await stripe.subscriptions.cancel(subId);
              console.log('Canceled Stripe subscription immediately:', subId);
            } catch (e) {
              console.error('Failed to cancel Stripe subscription immediately:', e);
            }
          })();
        }
      }
    }

    // Update database according to mode
    if (mode === 'period_end') {
      // Keep access until end of period; record intent
      const { error: subUpdateError } = await serviceClient
        .from('subscriptions')
        .update({ cancel_at_period_end: true, updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      if (subUpdateError) {
        console.error('Failed to update subscriptions.cancel_at_period_end:', subUpdateError);
        return new Response(
          JSON.stringify({ success: false, mode, error: 'DB update failed', details: subUpdateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, mode, message: 'Subscription will cancel at period end' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      // immediate downgrade access
      const { error: profileError } = await serviceClient
        .from('profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
          max_photospheres: 3,
          max_photos: 100,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      const { error: subStatusError } = await serviceClient
        .from('subscriptions')
        .update({ status: 'canceled', updated_at: new Date().toISOString() })
        .eq('id', subscription.id);

      if (profileError || subStatusError) {
        if (profileError) console.error('Failed to update profile on immediate downgrade:', profileError);
        if (subStatusError) console.error('Failed to update subscription status to canceled:', subStatusError);
        return new Response(
          JSON.stringify({ success: false, mode, error: 'DB update failed', details: profileError?.message || subStatusError?.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Invalidate subscription cache to force frontend refresh
      try {
        const cacheResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/invalidate-subscription-cache`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          },
          body: JSON.stringify({ userId: user.id }),
        });
        if (!cacheResponse.ok) {
          console.warn('Failed to invalidate subscription cache, but downgrade succeeded');
        }
      } catch (cacheError) {
        console.warn('Cache invalidation failed:', cacheError);
      }

      return new Response(
        JSON.stringify({ success: true, mode, message: 'Subscription canceled immediately and access downgraded' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in downgrade-subscription function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

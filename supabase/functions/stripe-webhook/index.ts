import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1?target=deno&pin=v135';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Environment variables
const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const INTERNAL_API_KEY = Deno.env.get('INTERNAL_API_KEY') || '';

console.log('🔍 Environment check - SUBSCRIPTIONS ONLY VERSION:');
console.log('- SUPABASE_URL exists:', !!SUPABASE_URL);
console.log('- SUPABASE_SERVICE_KEY exists:', !!SUPABASE_SERVICE_KEY);
console.log('- STRIPE_WEBHOOK_SECRET exists:', !!STRIPE_WEBHOOK_SECRET);
console.log('- STRIPE_SECRET_KEY exists:', !!STRIPE_SECRET_KEY);
console.log('- INTERNAL_API_KEY exists:', !!INTERNAL_API_KEY);

// Initialize Stripe client
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  httpClient: Stripe.createFetchHttpClient()
});

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Initialize Supabase with service role key for admin access
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Test Supabase connection on startup
console.log('🧪 Testing Supabase connection...');
try {
  const { data, error } = await supabase.from('subscriptions').select('id').limit(1);
  if (error) {
    console.error('❌ Supabase connection failed:', error);
  } else {
    console.log('✅ Supabase connection successful');
  }
} catch (err) {
  console.error('❌ Supabase connection error:', err);
}

/**
 * Update profile subscription fields to reflect current status/tier/expiry
 */
async function updateProfileSubscription(
  userId: string,
  params: { status?: string; tier?: string; expiry?: string | null }
) {
  try {
    const payload: Record<string, any> = { updated_at: new Date().toISOString() };
    if (typeof params.status !== 'undefined') payload.subscription_status = params.status;
    if (typeof params.tier !== 'undefined') payload.subscription_tier = params.tier;
    if (typeof params.expiry !== 'undefined') payload.subscription_expiry = params.expiry;

    const { error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', userId);
    if (error) throw error;
    console.log(`🧾 Synced profile ${userId} ->`, payload);
    
    // Invalidate subscription cache after profile update
    await invalidateSubscriptionCache(userId);
  } catch (e) {
    console.error('updateProfileSubscription error:', e);
  }
}

// Price ID to subscription tier mapping
const PRICE_TO_TIER_MAP = {
  // Recurring prices (monthly subscriptions)
  'price_1PqOhJRsGLTEABdJKhGvZRWR': 'starter', // $45/month
  'price_1PqOi5RsGLTEABdJhQFqAGhU': 'pro',     // $99/month
  'price_1PqOiWRsGLTEABdJKQtjuGGE': 'enterprise' // $499/month
};

// Credit allocation by tier
const TIER_CREDITS = {
  'starter': 1000,
  'pro': 2500,
  'enterprise': 999999
};

// Deno-safe async Stripe signature verification using Web Crypto API
const textEncoder = new TextEncoder();

function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error('Invalid hex string length');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) {
    out |= a[i] ^ b[i];
  }
  return out === 0;
}

async function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): Promise<boolean> {
  try {
    // Parse header: t=timestamp, v1=signature[, v1=altSignature...]
    const parts = signatureHeader.split(',').reduce<Record<string, string[]>>((acc, kv) => {
      const [k, v] = kv.split('=');
      if (!acc[k]) acc[k] = [];
      acc[k].push(v);
      return acc;
    }, {});

    const timestampStr = parts['t']?.[0];
    const signatures = parts['v1'] || [];
    if (!timestampStr || signatures.length === 0) return false;

    // 5-minute tolerance window
    const tolerance = 300; // seconds
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Number.isNaN(timestamp) || Math.abs(now - timestamp) > tolerance) {
      console.error('⚠️ Stripe signature timestamp outside tolerance');
      return false;
    }

    // Compute HMAC-SHA256 of `${t}.${payload}`
    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sigBuf = await crypto.subtle.sign('HMAC', key, textEncoder.encode(signedPayload));
    const sigBytes = new Uint8Array(sigBuf);

    // Compare against any v1 signature provided
    for (const s of signatures) {
      const headerSig = hexToUint8Array(s);
      if (timingSafeEqual(sigBytes, headerSig)) return true;
    }
    return false;
  } catch (e) {
    console.error('Error verifying Stripe signature:', e);
    return false;
  }
}

/**
 * Ensure a local customer record exists for a given Stripe customer ID.
 * If missing, fetch from Stripe and link it to an existing authenticated user by email.
 * Only creates customer records for users that already exist in auth.users.
 */
async function ensureCustomerExists(stripeCustomerId: string): Promise<{ user_id: string } | null> {
  if (!stripeCustomerId) return null;
  try {
    // Check if customer mapping already exists
    const { data: existing, error: existingErr } = await supabase
      .from('customers')
      .select('id, user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    if (existingErr) throw existingErr;
    if (existing) {
      return { user_id: existing.user_id };
    }

    // Fetch customer details from Stripe
    const sc = await stripe.customers.retrieve(stripeCustomerId as string);
    const email = (sc as any)?.email || null;
    const name = (sc as any)?.name || null;

    if (!email) {
      console.warn(`⚠️ No email found for Stripe customer ${stripeCustomerId}, cannot link to user`);
      return null;
    }

    // Try to find existing authenticated user by email
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, stripe_customer_id')
      .eq('email', email)
      .maybeSingle();
    if (pErr) throw pErr;

    if (!profile) {
      console.warn(`⚠️ No authenticated user found with email ${email} for Stripe customer ${stripeCustomerId}`);
      return null;
    }

    // Update profile with stripe_customer_id if missing
    if (!profile.stripe_customer_id) {
      const { error: upErr } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId, updated_at: new Date().toISOString() })
        .eq('id', profile.id);
      if (upErr) throw upErr;
      console.log(`🔗 Updated profile ${profile.id} with Stripe customer ID ${stripeCustomerId}`);
    }

    // Create customer mapping record (using auto-generated UUID for id)
    const { error: insCustErr } = await supabase
      .from('customers')
      .insert({
        user_id: profile.id, // Link to existing authenticated user
        stripe_customer_id: stripeCustomerId,
        email: email,
        name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    if (insCustErr) throw insCustErr;

    console.log(`✅ Created customer mapping for ${stripeCustomerId} linked to user ${profile.id}`);
    return { user_id: profile.id };
  } catch (e) {
    console.error('ensureCustomerExists error:', e);
    return null;
  }
}

/**
 * Fetch a customer from Stripe and find the related user
 */
async function getUserByStripeCustomerId(stripeCustomerId: string): Promise<any> {
  try {
    console.log(`🔍 Looking up user by Stripe customer ID: ${stripeCustomerId}`);
    
    // First check if customer exists in our database
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    
    if (customerError) throw customerError;
    
    if (!customer) {
      console.log(`⚠️ No customer found with Stripe ID: ${stripeCustomerId}`);
      throw new Error(`No customer found with Stripe ID: ${stripeCustomerId}`);
    }
    
    return { id: customer.user_id, stripe_customer_id: stripeCustomerId };
  } catch (error) {
    console.error('Error fetching user by Stripe customer ID:', error);
    throw error;
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log('Handling checkout.session.completed event');
    
    // Extract user ID from metadata
    const userId = session.metadata?.user_id;
    const planType = session.metadata?.plan_type;
    
    if (!userId) {
      console.error('No user ID found in session metadata');
      throw new Error('No user ID found in session metadata');
    }
    
    // Get the subscription details
    if (!session.subscription) {
      console.log('No subscription found in checkout session');
      return {
        success: true,
        message: 'No subscription to process'
      };
    }
    
    const subscription = await stripe.subscriptions.retrieve(session.subscription);

    // Persist customer mapping for future webhooks
    const customerId = (subscription.customer as string) || (session.customer as string) || null;
    const customerEmail = session.customer_details?.email || null;
    if (customerId) {
      // 1) Update profile with stripe_customer_id
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq('id', userId);
      if (profErr) {
        console.error('Failed to update profile with stripe_customer_id:', profErr);
      }

      // 2) Upsert into customers table if missing
      const { data: existingCust, error: existErr } = await supabase
        .from('customers')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      if (!existErr && !existingCust) {
        const { error: insCustErr } = await supabase
          .from('customers')
          .insert({
            user_id: userId,
            stripe_customer_id: customerId,
            email: customerEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        if (insCustErr) {
          console.error('Failed to insert customer mapping:', insCustErr);
        } else {
          console.log(`🔗 Linked user ${userId} to Stripe customer ${customerId}`);
        }
      }
    } else {
      console.warn('No Stripe customer ID found on checkout session/subscription');
    }
    
    // Determine subscription tier from price ID
    let subscriptionTier = 'free';
    let priceId = '';
    
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      priceId = subscription.items.data[0].price.id;
      subscriptionTier = PRICE_TO_TIER_MAP[priceId] || planType || 'free';
    }
    
    // Create or update the subscription in the database
    const { data: existingSubscription, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    const subscriptionData = {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId as string,
      status: subscription.status,
      tier: subscriptionTier,
      price_id: priceId,
      quantity: 1,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      credits_per_cycle: TIER_CREDITS[subscriptionTier] || 0,
      plan_type: subscriptionTier,
    };
    
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
        
      if (updateError) throw updateError;
      
      console.log(`Updated subscription: ${existingSubscription.id}`);
    } else {
      // Insert new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          id: crypto.randomUUID(),
          ...subscriptionData
        });
        
      if (insertError) throw insertError;
      
      console.log(`Created new subscription for user: ${userId}`);
    }
    
    // Sync profile snapshot
    await updateProfileSubscription(userId, {
      status: subscription.status,
      tier: subscriptionTier,
      expiry: subscriptionData.current_period_end,
    });

    return {
      success: true,
      message: 'Checkout session completed and subscription created/updated'
    };
  } catch (error) {
    console.error('Error handling checkout.session.completed event:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: any) {
  try {
    console.log('Handling customer.subscription.created event');
    
    // Ensure local customer exists, then resolve user
    await ensureCustomerExists(subscription.customer as string);
    const user = await getUserByStripeCustomerId(subscription.customer);
    
    // Determine subscription tier from price ID
    let subscriptionTier = 'free';
    let priceId = '';
    
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      priceId = subscription.items.data[0].price.id;
      subscriptionTier = PRICE_TO_TIER_MAP[priceId] || 'free';
    }
    
    // Insert or update subscription record
    const { data: existingSubscription, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    const subscriptionData = {
      user_id: user.id,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      status: subscription.status,
      tier: subscriptionTier,
      price_id: priceId,
      quantity: 1,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
      current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
      current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
      credits_per_cycle: TIER_CREDITS[subscriptionTier] || 0,
      plan_type: subscriptionTier,
    };
    
    if (existingSubscription) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id);
        
      if (updateError) throw updateError;
      
      console.log(`Updated subscription: ${existingSubscription.id}`);
    } else {
      // Insert new subscription
      const { error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          id: crypto.randomUUID(),
          ...subscriptionData
        });
        
      if (insertError) throw insertError;
      
      console.log(`Created new subscription for user: ${user.id}`);
    }
    
    // Sync profile snapshot
    await updateProfileSubscription(user.id, {
      status: subscription.status,
      tier: subscriptionTier,
      expiry: subscriptionData.current_period_end,
    });

    return {
      success: true,
      message: 'Subscription created event processed successfully'
    };
  } catch (error) {
    console.error('Error handling customer.subscription.created event:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    console.log('Handling customer.subscription.updated event');
    
    // Ensure local customer exists, then resolve user
    await ensureCustomerExists(subscription.customer as string);
    const user = await getUserByStripeCustomerId(subscription.customer);
    
    // Determine subscription tier from price ID
    let subscriptionTier = 'free';
    let priceId = '';
    
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      priceId = subscription.items.data[0].price.id;
      subscriptionTier = PRICE_TO_TIER_MAP[priceId] || 'free';
    }
    
    // Find the existing subscription
    const { data: existingSubscription, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    if (!existingSubscription) {
      console.log(`No existing subscription found with ID: ${subscription.id}, creating new record`);
      return await handleSubscriptionCreated(subscription);
    }
    
    // Update the subscription
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        tier: subscriptionTier,
        price_id: priceId,
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
        trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
        trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
        credits_per_cycle: TIER_CREDITS[subscriptionTier] || 0,
        plan_type: subscriptionTier,
      })
      .eq('id', existingSubscription.id);
      
    if (updateError) throw updateError;
    
    console.log(`Updated subscription: ${existingSubscription.id}`);
    
    // Sync profile snapshot to reflect subscription changes
    await updateProfileSubscription(user.id, {
      status: subscription.status,
      tier: subscriptionTier,
      expiry: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    });
    
    return {
      success: true,
      message: 'Subscription updated event processed successfully'
    };
  } catch (error) {
    console.error('Error handling customer.subscription.updated event:', error);
    throw error;
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    console.log('Handling customer.subscription.deleted event');
    
    // Find the existing subscription
    const { data: existingSubscription, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    if (!existingSubscription) {
      console.log(`No existing subscription found with ID: ${subscription.id}`);
      return {
        success: false,
        message: `No subscription found with ID: ${subscription.id}`
      };
    }
    
    // Update the subscription status to canceled
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'canceled',
        cancel_at_period_end: subscription.cancel_at_period_end,
        cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
        canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
        ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : new Date().toISOString(),
      })
      .eq('id', existingSubscription.id);
      
    if (updateError) throw updateError;
    
    console.log(`Marked subscription as canceled: ${existingSubscription.id}`);

    // Also sync profile snapshot using the owning user
    const { data: subOwner } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', existingSubscription.id)
      .maybeSingle();
    if (subOwner?.user_id) {
      await updateProfileSubscription(subOwner.user_id, { status: 'canceled', expiry: new Date().toISOString() });
    }
    
    return {
      success: true,
      message: 'Subscription deleted event processed successfully'
    };
  } catch (error) {
    console.error('Error handling customer.subscription.deleted event:', error);
    throw error;
  }
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handleInvoicePaymentSucceeded(invoice: any) {
  try {
    console.log('Handling invoice.payment_succeeded event');
    
    // Get customer ID and subscription ID
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    // Ensure local customer exists before further processing
    await ensureCustomerExists(customerId as string);
    
    // Only process subscription invoices
    if (!invoice.subscription) {
      console.log('Invoice is not for a subscription, skipping');
      return {
        success: true,
        message: 'Non-subscription invoice skipped'
      };
    }
    
    // Get subscription details
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    
    // Find the existing subscription
    const { data: existingSubscription, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id, user_id')
      .eq('stripe_subscription_id', invoice.subscription)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    if (!existingSubscription) {
      console.log(`No existing subscription found with ID: ${invoice.subscription}, creating from subscription object`);
      return await handleSubscriptionCreated(subscription);
    }
    
    // Determine subscription tier from price ID
    let subscriptionTier = 'free';
    let priceId = '';
    
    if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
      priceId = subscription.items.data[0].price.id;
      subscriptionTier = PRICE_TO_TIER_MAP[priceId] || 'free';
    }
    
    // Update the subscription with the latest payment information
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: subscription.status,
        current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
        current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
        updated_at: new Date().toISOString(),
        credits_per_cycle: TIER_CREDITS[subscriptionTier] || 0,
      })
      .eq('id', existingSubscription.id);
      
    if (updateError) throw updateError;
    
    console.log(`Updated subscription with payment info: ${existingSubscription.id}`);
    // Sync profile snapshot
    const { data: subOwner } = await supabase
      .from('subscriptions')
      .select('user_id')
      .eq('id', existingSubscription.id)
      .maybeSingle();
    if (subOwner?.user_id) {
      await updateProfileSubscription(subOwner.user_id, {
        status: subscription.status,
        tier: subscriptionTier,
        expiry: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
      });
    }
    
    return {
      success: true,
      message: 'Invoice payment succeeded event processed successfully'
    };
  } catch (error) {
    console.error('Error handling invoice.payment_succeeded event:', error);
    throw error;
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    console.log('Handling invoice.payment_failed event');
    
    // Get customer ID and subscription ID
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;

    // Ensure local customer exists before further processing
    await ensureCustomerExists(customerId as string);
    
    // Only process subscription invoices
    if (!invoice.subscription) {
      console.log('Invoice is not for a subscription, skipping');
      return {
        success: true,
        message: 'Non-subscription invoice skipped'
      };
    }
    
    // Find the existing subscription
    const { data: existingSubscription, error: lookupError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('stripe_subscription_id', invoice.subscription)
      .maybeSingle();
      
    if (lookupError) throw lookupError;
    
    if (!existingSubscription) {
      console.log(`No existing subscription found with ID: ${invoice.subscription}`);
      return {
        success: false,
        message: `No subscription found with ID: ${invoice.subscription}`
      };
    }
    
    // Update the subscription status to past_due
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'past_due',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingSubscription.id);
      
    if (updateError) throw updateError;
    
    console.log(`Updated subscription status to past_due: ${existingSubscription.id}`);
    // Sync profile snapshot (mark suspended/past_due)
    if (existingSubscription.user_id) {
      await updateProfileSubscription(existingSubscription.user_id, { status: 'past_due' });
    }
    
    return {
      success: true,
      message: 'Invoice payment failed event processed successfully'
    };
  } catch (error) {
    console.error('Error handling invoice.payment_failed event:', error);
    throw error;
  }
}

/**
 * Invalidate subscription cache for a user
 */
async function invalidateSubscriptionCache(userId: string) {
  try {
    if (!userId || !INTERNAL_API_KEY) return;
    
    console.log(`🔄 Invalidating subscription cache for user: ${userId}`);
    
    // Call the invalidate-subscription-cache function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/invalidate-subscription-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INTERNAL_API_KEY}`,
        'X-Webhook-Source': 'stripe'
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to invalidate subscription cache: ${response.status} ${errorText}`);
    } else {
      console.log('✅ Subscription cache invalidation triggered successfully');
    }
  } catch (e) {
    console.error('invalidateSubscriptionCache error:', e);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    console.log('🔍 DEBUG: Incoming webhook request - SUBSCRIPTIONS ONLY VERSION');
    
    // Get the signature from the header
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      console.error('❌ No stripe-signature header found');
      return new Response(JSON.stringify({
        error: 'No stripe-signature header'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Check if webhook secret exists
    if (!STRIPE_WEBHOOK_SECRET) {
      console.error('❌ No STRIPE_WEBHOOK_SECRET environment variable found');
      return new Response(JSON.stringify({
        error: 'Missing webhook secret configuration'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    
    // Get the raw request body for signature verification
    const rawBody = await req.text();
    let event: any;
    
    // Use custom async signature verification for Deno compatibility
    try {
      const isValid = await verifyStripeSignature(rawBody, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('❌ Webhook signature verification failed: Invalid signature');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      console.log('✅ Signature verified successfully (Custom async)');
      
      // Parse the event manually after verification
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    // Event is now parsed manually after custom signature verification
    
    // Process the verified event
    console.log(`🎯 Processing ${event.type} event`);
    let result;
    
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(event.data.object);
        break;
      case 'customer.subscription.created':
        result = await handleSubscriptionCreated(event.data.object);
        break;
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object);
        break;
      case 'invoice.payment_succeeded':
        result = await handleInvoicePaymentSucceeded(event.data.object);
        break;
      case 'invoice.payment_failed':
        result = await handleInvoicePaymentFailed(event.data.object);
        break;
      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
        result = {
          success: true,
          message: `Unhandled event type: ${event.type}`
        };
    }
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

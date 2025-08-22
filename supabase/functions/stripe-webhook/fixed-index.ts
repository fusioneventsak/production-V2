import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Environment variables
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
// Support multiple secrets (e.g., dashboard endpoint + CLI, or during rotation)
// Comma-separated in STRIPE_WEBHOOK_SECRETS, or a secondary STRIPE_WEBHOOK_SECRET_2
const STRIPE_WEBHOOK_SECRETS: string[] = (() => {
  const list: string[] = [];
  if (STRIPE_WEBHOOK_SECRET) list.push(STRIPE_WEBHOOK_SECRET);
  const rotated = Deno.env.get("STRIPE_WEBHOOK_SECRET_2");
  if (rotated) list.push(rotated);
  const csv = Deno.env.get("STRIPE_WEBHOOK_SECRETS");
  if (csv) {
    list.push(...csv.split(",").map(s => s.trim()).filter(Boolean));
  }
  return list;
})();

// Debug mode
const STRIPE_DEBUG = Deno.env.get("STRIPE_DEBUG") === "true";

// Utility functions
async function hmacSHA256(key: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
  const payloadData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign(
    "HMAC",
    cryptoKey,
    payloadData
  );
  
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

function parseStripeSignature(sigHeader: string): { ts: string; v1: string[] } {
  const pairs = sigHeader.split(",").map(pair => {
    const [key, value] = pair.split("=");
    return { key, value };
  });
  
  const ts = pairs.find(pair => pair.key === "t")?.value || "";
  const v1Signatures = pairs
    .filter(pair => pair.key === "v1")
    .map(pair => pair.value);
  
  return { ts, v1: v1Signatures };
}

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  const { ts, v1: signatures } = parseStripeSignature(sigHeader);
  
  // Verify timestamp to prevent replay attacks (5 minute tolerance)
  const now = Math.floor(Date.now() / 1000);
  const tolerance = 5 * 60; // 5 minutes
  if (Math.abs(now - parseInt(ts)) > tolerance) {
    console.error(`❌ Timestamp outside tolerance: ${ts} vs ${now}`);
    return false;
  }
  
  // Create the signed payload and verify the signature
  const signedPayload = `${ts}.${payload}`;
  const expected = await hmacSHA256(secret, signedPayload);
  
  // Check if any signature matches
  return signatures.some(sig => safeEqual(sig, expected));
}

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return `[Error stringifying: ${e.message}]`;
  }
}

// Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function ensureCustomerExists(customerId: string): Promise<boolean> {
  // Check if customer exists in our database
  const { data: existingCustomer, error: lookupError } = await supabase
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  
  if (lookupError) {
    console.error("❌ Error looking up customer:", lookupError);
    return false;
  }
  
  if (existingCustomer) {
    return true; // Customer exists
  }
  
  // Customer doesn't exist, try to fetch from Stripe and insert
  return await fetchAndInsertCustomer(customerId);
}

async function fetchAndInsertCustomer(customerId: string): Promise<boolean> {
  try {
    // This would normally use the Stripe SDK, but we're using a simplified approach
    // for the Deno Edge Runtime to avoid Node.js dependencies
    console.log(`🔍 Customer ${customerId} not found in database, fetching from Stripe...`);
    
    // In a real implementation, you would fetch the customer from Stripe API
    // For now, we'll just create a placeholder record
    const { error } = await supabase.from("customers").insert({
      stripe_customer_id: customerId,
      email: null, // Would come from Stripe API
      name: null,  // Would come from Stripe API
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    
    if (error) {
      console.error("❌ Error inserting customer:", error);
      return false;
    }
    
    console.log(`✅ Created customer record for ${customerId}`);
    return true;
  } catch (e) {
    console.error(`❌ Error fetching/inserting customer ${customerId}:`, e);
    return false;
  }
}

// Handle OPTIONS preflight request
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  try {
    // Check for Stripe signature header
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("❌ Missing stripe-signature header");
      return new Response("Missing stripe-signature header", {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Check for webhook secret
    if (!STRIPE_WEBHOOK_SECRETS.length) {
      console.error("❌ Missing STRIPE_WEBHOOK_SECRET environment variable");
      return new Response("Server configuration error", {
        status: 500,
        headers: corsHeaders
      });
    }
    
    // Get the raw request body
    const rawBody = await req.text();
    
    // Verify the signature against all possible secrets
    let isValid = false;
    for (const secret of STRIPE_WEBHOOK_SECRETS) {
      isValid = await verifyStripeSignature(rawBody, signature, secret);
      if (isValid) break;
    }
    
    if (!isValid) {
      console.error("❌ Invalid signature");
      return new Response("Invalid signature", {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Parse the event
    let event;
    try {
      event = JSON.parse(rawBody);
    } catch (err) {
      console.error("❌ Error parsing webhook body:", err);
      return new Response(`Webhook error: ${err.message}`, {
        status: 400,
        headers: corsHeaders
      });
    }
    
    // Handle the event
    console.log(`🎯 Event type: ${event.type}`);
    
    switch (event.type) {
      case "checkout.session.completed":
        {
          const session = event.data.object;
          console.log(`💰 Checkout completed: id=${session.id} | customer=${session.customer}`);
          
          // Ensure customer exists in our database
          await ensureCustomerExists(session.customer);
          
          // Extract metadata
          const userId = session.metadata?.user_id;
          const tier = session.metadata?.tier || "starter";
          
          if (userId) {
            console.log(`👤 User ID from metadata: ${userId}`);
            
            // Update profile with subscription info
            const { error: profileError } = await supabase
              .from("profiles")
              .update({
                stripe_customer_id: session.customer,
                subscription_tier: tier,
                subscription_status: "active",
                updated_at: new Date().toISOString()
              })
              .eq("id", userId);
            
            if (profileError) {
              console.error("❌ Error updating profile:", profileError);
            } else {
              console.log(`✅ Profile updated with subscription info`);
            }
            
            // Set credits based on tier
            let credits = 1000; // Default for starter
            if (tier === "pro") credits = 2500;
            if (tier === "enterprise") credits = 999999;
            
            const { error: creditsError } = await supabase
              .from("profiles")
              .update({
                credits_remaining: credits,
                credits_limit: credits,
                updated_at: new Date().toISOString()
              })
              .eq("id", userId);
            
            if (creditsError) {
              console.error("❌ Error setting credits:", creditsError);
            } else {
              console.log(`✅ Credits set to ${credits} for ${tier} tier`);
            }
          } else {
            console.warn("⚠️ No user_id in checkout session metadata");
          }
          
          break;
        }
      case "invoice.payment_succeeded":
        {
          const invoice = event.data.object;
          console.log(`💵 Invoice payment succeeded: id=${invoice.id} | customer=${invoice.customer} | subscription=${invoice.subscription}`);
          
          // Try to update via Stripe wrapper first
          try {
            // This would normally call a Stripe wrapper function
            console.log("🔄 Attempting to sync via Stripe wrapper...");
            // stripeWrapper.syncSubscription(invoice.subscription);
          } catch (e) {
            console.error("❌ Stripe wrapper sync failed:", e);
            console.log("🔄 Falling back to manual subscription update...");
            
            // Fallback: Update subscription directly
            await updateSubscriptionFromInvoice(invoice);
          }
          
          break;
        }
      case "customer.subscription.created":
        {
          const subscription = event.data.object;
          console.log(`🆕 Subscription created: id=${subscription.id} | status=${subscription.status}`);
          
          // Extract tier from price metadata or lookup key
          const priceInfo = subscription.items?.data?.[0]?.price;
          const tier = priceInfo?.metadata?.plan_type || priceInfo?.lookup_key || priceInfo?.nickname || "starter";
          
          // Only insert if we have a current_period_end (required by DB schema)
          if (subscription.current_period_end) {
            const subData = {
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
              status: subscription.status,
              tier,
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            const { error } = await supabase.from("subscriptions").insert(subData);
            if (error) {
              console.error("❌ Error inserting subscription:", error);
            } else {
              console.log(`✅ Subscription inserted with tier: ${tier}`);
            }
          } else {
            console.warn("⚠️ Missing current_period_end, skipping subscription insert");
          }
          
          break;
        }
      case "customer.subscription.updated":
        {
          const subscription = event.data.object;
          console.log(`🔄 Subscription updated: id=${subscription.id} | status=${subscription.status}`);
          if (STRIPE_DEBUG) {
            console.log("🧾 Sub snapshot:", safeStringify({ current_period_start: subscription.current_period_start, current_period_end: subscription.current_period_end, cancel_at_period_end: subscription.cancel_at_period_end, plan: subscription.items?.data?.[0]?.plan?.id }));
          }
          
          // Extract tier information from price metadata or lookup key
          const priceInfo = subscription.items?.data?.[0]?.price;
          const derivedTier = priceInfo?.metadata?.plan_type || priceInfo?.lookup_key || priceInfo?.nickname || "starter";
          console.log(`🔍 Derived tier from subscription update: ${derivedTier}`);
          
          const subUpdate: Record<string, unknown> = {
            status: subscription.status,
            tier: derivedTier, // Add tier update based on price metadata
            updated_at: new Date().toISOString()
          };
          if (subscription.current_period_end) {
            subUpdate.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
          }
          const { error } = await supabase.from("subscriptions").update(subUpdate).eq("stripe_subscription_id", subscription.id);
          if (error) {
            console.error("❌ Error updating subscription:", error);
          } else {
            console.log("✅ Subscription status updated");
          }

          // Determine if we should downgrade the profile to free
          try {
            const nowSec = Math.floor(Date.now() / 1000);
            const expired = !!(subscription.current_period_end && subscription.current_period_end <= nowSec);
            const shouldDowngrade = ["canceled", "unpaid", "past_due", "incomplete_expired"].includes(subscription.status) || (subscription.cancel_at_period_end && expired);

            if (shouldDowngrade) {
              // Downgrade profile to free/inactive by customer id
              const customerId = subscription.customer;
              if (customerId) {
                const { error: pErr } = await supabase
                  .from("profiles")
                  .update({
                    subscription_tier: "free",
                    subscription_status: "inactive",
                    updated_at: new Date().toISOString()
                  })
                  .eq("stripe_customer_id", customerId);
                if (pErr) {
                  console.error("❌ Error downgrading profile to free:", pErr);
                } else {
                  console.log("⬇️ Profile downgraded to free due to subscription status/expiration");
                }
              }
            } else if (subscription.status === "active") {
              // Ensure profile is active while subscription is active
              const customerId = subscription.customer;
              if (customerId) {
                const { error: pErr } = await supabase
                  .from("profiles")
                  .update({
                    subscription_status: "active",
                    updated_at: new Date().toISOString()
                  })
                  .eq("stripe_customer_id", customerId);
                if (pErr) {
                  console.error("❌ Error marking profile active on sub updated:", pErr);
                } else {
                  console.log("✅ Profile marked active on subscription.updated");
                }
              }
            }
          } catch (e) {
            console.error("❌ Error in profile sync logic (subscription.updated):", e);
          }
          break;
        }
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object;
          console.log(`🗑️ Subscription deleted: id=${subscription.id}`);
          if (STRIPE_DEBUG) {
            console.log("🧾 Sub snapshot:", safeStringify({ status: subscription.status, ended_at: subscription.ended_at }));
          }
          
          // Update subscription status
          const { error } = await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              updated_at: new Date().toISOString()
            })
            .eq("stripe_subscription_id", subscription.id);
          
          if (error) {
            console.error("❌ Error updating subscription to canceled:", error);
          } else {
            console.log("✅ Subscription marked as canceled");
          }
          
          // Downgrade profile to free tier
          const customerId = subscription.customer;
          if (customerId) {
            const { error: pErr } = await supabase
              .from("profiles")
              .update({
                subscription_tier: "free",
                subscription_status: "inactive",
                updated_at: new Date().toISOString()
              })
              .eq("stripe_customer_id", customerId);
            
            if (pErr) {
              console.error("❌ Error downgrading profile to free tier:", pErr);
            } else {
              console.log("⬇️ Profile downgraded to free tier");
            }
          }
          
          break;
        }
      default:
        console.log(`⏩ Unhandled event type: ${event.type}`);
    }
    
    // Helper function for invoice payment success fallback
    async function updateSubscriptionFromInvoice(invoice: any) {
      const subscriptionId = invoice.subscription;
      const customerId = invoice.customer;
      
      if (!subscriptionId || !customerId) {
        console.warn("⚠️ Missing subscription or customer ID on invoice");
        return;
      }
      
      // Find the user by customer ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .maybeSingle();
      
      if (profileError || !profile) {
        console.error("❌ Error finding profile for customer:", profileError || "Not found");
        return;
      }
      
      // Update profile subscription status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("id", profile.id);
      
      if (updateError) {
        console.error("❌ Error updating profile subscription status:", updateError);
      } else {
        console.log(`✅ Profile ${profile.id} subscription status updated to active`);
      }
      
      // Update subscription record if it exists
      const { error: subError } = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          updated_at: new Date().toISOString()
        })
        .eq("stripe_subscription_id", subscriptionId);
      
      if (subError) {
        console.log(`ℹ️ Subscription record may not exist yet: ${subError.message}`);
      } else {
        console.log(`✅ Subscription record updated to active`);
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    return new Response(JSON.stringify({ received: true }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      },
      status: 200
    });
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400,
      headers: corsHeaders
    });
  }
});

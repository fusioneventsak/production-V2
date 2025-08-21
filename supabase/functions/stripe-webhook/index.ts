// PURE DENO VERSION - NO STRIPE SDK DEPENDENCY
// This version uses Web Crypto API for signature verification
// and has no npm:stripe import that could cause boot errors
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4?target=deno&pin=v135";


// Environment variables
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Custom async signature verification (no Stripe SDK dependency)
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    console.log(`🔍 Verifying signature: Header length=${sigHeader.length}, Secret length=${secret.length}, Payload length=${payload.length}`);
    
    // Parse signature header
    const elements = sigHeader.split(',');
    let timestamp = '';
    const signatures: string[] = [];
    
    console.log(`🔍 Signature header elements: ${elements.length}`);
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = value;
        console.log(`🔍 Found timestamp: ${timestamp}`);
      } else if (key === 'v1') {
        signatures.push(value);
        console.log(`🔍 Found signature: ${value.substring(0, 6)}...`);
      }
    }
    
    if (!timestamp || signatures.length === 0) {
      console.log("❌ Invalid signature format - Missing timestamp or signatures");
      return false;
    }
    
    // Check timestamp tolerance (5 minutes)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(now - timestampNum);
    console.log(`🔍 Timestamp check: Event=${timestampNum}, Now=${now}, Diff=${timeDiff}s`);
    
    if (timeDiff > 300) {
      console.log(`❌ Timestamp out of tolerance: ${timeDiff}s > 300s`);
      return false;
    }
    
    // Create signed payload
    const signedPayload = `${timestamp}.${payload}`;
    console.log(`🔍 Created signed payload: ${timestamp}.${payload.substring(0, 20)}...`);
    
    // Generate expected signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(signedPayload);
    
    console.log(`🔍 Importing crypto key: Secret starts with ${secret.substring(0, 3)}...`);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    console.log(`🔍 Generating HMAC signature`);
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    console.log(`🔍 Expected signature: ${expectedSignature.substring(0, 6)}...`);
    
    // Compare signatures
    for (const sig of signatures) {
      console.log(`🔍 Comparing with: ${sig.substring(0, 6)}...`);
      if (sig === expectedSignature) {
        console.log("✅ Signature verified successfully");
        return true;
      }
    }
    
    console.log("❌ No matching signature found");
    return false;
  } catch (error) {
    console.error("❌ Signature verification error:", error);
    return false;
  }
}

serve(async (req: Request) => {
  console.log("🔍 Webhook received:", req.method, req.url);
  
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    console.log("❌ Missing stripe-signature header");
    return new Response("Missing stripe-signature header", { status: 400 });
  }
  
  try {
    const body = await req.text();
    console.log("📦 Body length:", body.length);
    console.log("🔑 Secret length:", STRIPE_WEBHOOK_SECRET.length);
    
    // Verify signature
    const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
    if (!isValid) {
      return new Response("Invalid signature", { status: 400 });
    }
    
    // Parse event
    const event = JSON.parse(body);
    console.log("📧 Event type:", event.type, "ID:", event.id);
    
    // Handle specific event types
    switch (event.type) {
      case "checkout.session.completed":
        {
          const session = event.data.object;
          const customerId = session.customer;
          const subscriptionId = session.subscription;
          const userId = session.client_reference_id || session.metadata?.user_id;
          
          console.log(`✅ Checkout completed - User: ${userId}, Subscription: ${subscriptionId}`);
          
          if (userId && subscriptionId) {
            const { error } = await supabase.from("subscriptions").upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              status: "active",
              tier: session.metadata?.tier || "starter",
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            
            if (error) {
              console.error("❌ Error updating subscription:", error);
            } else {
              console.log("✅ Subscription updated successfully");
            }
          }
          break;
        }
      
      case "customer.subscription.updated":
        {
          const subscription = event.data.object;
          console.log(`🔄 Subscription updated: ${subscription.id}, Status: ${subscription.status}`);
          
          const { error } = await supabase.from("subscriptions").update({
            status: subscription.status,
            updated_at: new Date().toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
          }).eq("stripe_subscription_id", subscription.id);
          
          if (error) {
            console.error("❌ Error updating subscription:", error);
          } else {
            console.log("✅ Subscription status updated");
          }
          break;
        }
      
      case "customer.subscription.deleted":
        {
          const subscription = event.data.object;
          console.log(`🗑️ Subscription deleted: ${subscription.id}`);
          
          const { error } = await supabase.from("subscriptions").update({
            status: "canceled",
            updated_at: new Date().toISOString()
          }).eq("stripe_subscription_id", subscription.id);
          
          if (error) {
            console.error("❌ Error canceling subscription:", error);
          } else {
            console.log("✅ Subscription canceled");
          }
          break;
        }
      
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
    
    return new Response(JSON.stringify({ received: true, event_type: event.type }), {
      headers: { "Content-Type": "application/json" },
      status: 200
    });
    
  } catch (err) {
    console.error("❌ Webhook Error:", err.message);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }
});

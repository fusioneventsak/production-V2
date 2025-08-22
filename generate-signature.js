#!/usr/bin/env node

/**
 * Stripe Webhook Signature Generator
 * 
 * This script generates a valid Stripe webhook signature for testing purposes.
 * It creates a signature that can be used to bypass signature verification in the webhook.
 * 
 * Usage:
 * 1. Set your STRIPE_WEBHOOK_SECRET environment variable
 * 2. Run: node generate-signature.js
 */

import crypto from 'crypto';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '.env') });

console.log('Loading environment variables...');

// Get webhook secret from environment or use a default for testing
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';

// Create a test event payload
const payload = JSON.stringify({
  type: 'test_event',
  data: {
    object: {
      id: 'test_id',
      customer: 'cus_test',
      subscription: 'sub_test',
      client_reference_id: 'user_test',
      metadata: {
        tier: 'pro'
      }
    }
  },
  id: 'evt_test_' + Math.random().toString(36).substring(2, 10),
  created: Math.floor(Date.now() / 1000),
  pending_webhooks: 0
});

// Generate timestamp (current time in seconds)
const timestamp = Math.floor(Date.now() / 1000);

// Create the signed payload
const signedPayload = `${timestamp}.${payload}`;

// Generate HMAC signature
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(signedPayload)
  .digest('hex');

// Format the signature header
const stripeSignature = `t=${timestamp},v1=${signature}`;

console.log('\n🔐 Stripe Webhook Test Signature Generator');
console.log('==========================================');
console.log('\n📦 Payload:');
console.log(payload);
console.log('\n🔑 Signature Header:');
console.log(stripeSignature);
console.log('\n📋 cURL Command:');
console.log(`curl -i -X POST https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook \\
  -H "Content-Type: application/json" \\
  -H "stripe-signature: ${stripeSignature}" \\
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \\
  --data '${payload}'`);
console.log('\n✅ Done! Use this signature to test your webhook.');

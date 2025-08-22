#!/usr/bin/env node

/**
 * Simple Stripe Webhook Test
 * 
 * This script sends a test webhook event with a valid signature
 * and checks the logs for proper processing.
 */

import crypto from 'crypto';
import fetch from 'node-fetch';

// Configuration
const WEBHOOK_URL = 'https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook';
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxZ3R1dnpscnZid3dlc3V2aXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4NjAxMjksImV4cCI6MjA2NjQzNjEyOX0.VFyhaVnD93HJ-xG-hxIITM4koUT8sLkgmei5Os3l1sc';

// Create a test event payload
const payload = JSON.stringify({
  id: 'evt_test_' + Date.now(),
  object: 'event',
  api_version: '2023-10-16',
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: 'cs_test_' + crypto.randomBytes(16).toString('hex'),
      object: 'checkout.session',
      client_reference_id: 'user_test_123',
      customer: 'cus_test_' + crypto.randomBytes(8).toString('hex'),
      subscription: 'sub_test_' + crypto.randomBytes(8).toString('hex'),
      metadata: {
        tier: 'pro'
      }
    }
  },
  type: 'checkout.session.completed',
  pending_webhooks: 1
});

// Generate timestamp (current time in seconds)
const timestamp = Math.floor(Date.now() / 1000);

// Create the signed payload
const signedPayload = `${timestamp}.${payload}`;

// Generate HMAC signature
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(signedPayload)
  .digest('hex');

// Format the signature header
const stripeSignature = `t=${timestamp},v1=${signature}`;

async function sendWebhook() {
  console.log('🚀 Sending test webhook event...');
  console.log(`📦 Event type: checkout.session.completed`);
  
  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: payload
    });
    
    const status = response.status;
    const text = await response.text();
    
    console.log(`📊 Response status: ${status}`);
    console.log(`📝 Response body: ${text}`);
    
    if (status === 200) {
      console.log('✅ Webhook test successful!');
      console.log('🔍 Check Supabase logs for detailed processing information.');
    } else {
      console.log('❌ Webhook test failed.');
    }
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
  }
}

// Execute the test
sendWebhook();

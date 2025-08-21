# Stripe Webhook Implementation Guide

## Overview

This document describes the implementation of the Stripe webhook for handling subscription events in the Photosphere application. The webhook is implemented as a Supabase Edge Function using Deno runtime.

## Architecture

The webhook is designed to:
1. Receive events from Stripe
2. Verify the signature of incoming requests
3. Process different event types (checkout.session.completed, customer.subscription.updated, customer.subscription.deleted)
4. Update the Supabase database accordingly

## Implementation Details

### Technology Stack
- **Runtime**: Deno (via Supabase Edge Functions)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: JWT verification disabled for webhook endpoint
- **Signature Verification**: Custom implementation using Web Crypto API

### Key Files
- `/supabase/functions/stripe-webhook/index.ts` - Main webhook handler
- `/supabase/functions/stripe-webhook/config.toml` - Configuration for JWT verification
- `/test-webhook.sh` - Test script for webhook testing

### Environment Variables
The webhook requires the following environment variables:
- `STRIPE_SECRET_KEY` - Stripe API secret key
- `STRIPE_WEBHOOK_SECRET` - Secret for verifying webhook signatures
- `SUPABASE_URL` - URL of the Supabase project
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database operations

## Signature Verification

The webhook uses a custom implementation of Stripe signature verification compatible with Deno's async-only crypto API:

1. Parse the `stripe-signature` header to extract timestamp and signature
2. Verify the timestamp is within tolerance (5 minutes)
3. Create a signed payload by concatenating timestamp and request body
4. Generate an HMAC-SHA256 signature using the webhook secret
5. Compare the generated signature with the one provided in the header

```typescript
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    // Parse signature header
    const elements = sigHeader.split(',');
    let timestamp = '';
    const signatures: string[] = [];
    
    for (const element of elements) {
      const [key, value] = element.split('=');
      if (key === 't') {
        timestamp = value;
      } else if (key === 'v1') {
        signatures.push(value);
      }
    }
    
    // Check timestamp tolerance (5 minutes)
    const timestampNum = parseInt(timestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampNum) > 300) {
      return false;
    }
    
    // Create signed payload
    const signedPayload = `${timestamp}.${payload}`;
    
    // Generate expected signature using Web Crypto API
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const payloadData = encoder.encode(signedPayload);
    
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
    const expectedSignature = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    // Compare signatures
    for (const sig of signatures) {
      if (sig === expectedSignature) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}
```

## Event Handling

The webhook handles the following Stripe events:

### `checkout.session.completed`
When a customer completes a checkout session:
1. Extract customer ID, subscription ID, and tier information
2. Update the user's subscription status in the database
3. Set the subscription expiration date based on the subscription period

### `customer.subscription.updated`
When a subscription is updated:
1. Extract subscription status and period end
2. Update the subscription status and expiration date in the database

### `customer.subscription.deleted`
When a subscription is canceled:
1. Update the subscription status to "canceled" in the database
2. Clear the subscription ID and expiration date

## Deployment

The webhook is deployed using the Supabase CLI:

```bash
supabase functions deploy stripe-webhook --project-ref <project-ref> --no-verify-jwt
```

The `--no-verify-jwt` flag is required to allow unauthenticated requests from Stripe.

## Testing

### Using the Test Script

The repository includes an enhanced test script (`test-webhook.sh`) that can be used to test the webhook with different event types and authentication methods:

```bash
./test-webhook.sh --secret "your_webhook_secret" --event checkout.session.completed
```

Options:
- `--mode`: Test mode (signature, auth, or both)
- `--event`: Event type to simulate
- `--secret`: Webhook secret for signature verification
- `--auth`: Authorization token

### Using Stripe Dashboard

1. Go to the Stripe Dashboard > Developers > Webhooks
2. Click on the webhook endpoint
3. Click "Send test webhook"
4. Select the event type and click "Send test webhook"

### Using Stripe CLI

```bash
stripe listen --forward-to https://your-project-ref.supabase.co/functions/v1/stripe-webhook
```

## Troubleshooting

### Common Issues

1. **Signature Verification Failure**
   - Check that the correct webhook secret is set in the environment variables
   - Ensure the request body is not modified before verification
   - Verify the timestamp is within tolerance

2. **401 Unauthorized**
   - Ensure JWT verification is disabled for the webhook endpoint
   - Check that the `config.toml` file is in the correct location

3. **Runtime Errors**
   - Avoid using Node.js-specific APIs or libraries
   - Use Deno-compatible imports with proper flags

### Debugging

The webhook includes detailed logging for troubleshooting:
- Environment variable values (masked for security)
- Signature verification steps
- Event processing details

To view logs:
1. Go to the Supabase Dashboard
2. Navigate to Edge Functions > stripe-webhook > Logs

## Best Practices

1. **Security**
   - Always verify the signature of incoming webhook events
   - Use environment variables for sensitive information
   - Use the service role key only when necessary

2. **Error Handling**
   - Implement proper error handling for all operations
   - Return appropriate HTTP status codes
   - Log errors for debugging

3. **Performance**
   - Respond to webhook events quickly to avoid timeouts
   - Process events asynchronously when possible
   - Minimize database operations

## Future Improvements

1. Implement retry mechanism for failed database operations
2. Add more detailed logging for subscription status changes
3. Implement webhook event queueing for high-volume scenarios
4. Add metrics and monitoring for webhook performance

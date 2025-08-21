# Stripe Webhook Testing Guide

This document provides instructions for testing the Stripe webhook integration with Supabase Edge Functions.

## Webhook Implementation Details

- **Function URL**: `https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook`
- **Project ID**: `xqgtuvzlrvbwwesuvitp`
- **Implementation**: Pure Deno with Web Crypto API for signature verification
- **JWT Verification**: Disabled via `config.toml`

## Testing Methods

### 1. Stripe Dashboard Testing (Recommended)

The most reliable way to test the webhook is through the Stripe Dashboard:

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **Webhooks**
3. Click on your webhook endpoint
4. Click **Send test event**
5. Select an event type (e.g., `checkout.session.completed`)
6. Click **Send test event**
7. Check the webhook logs in Supabase dashboard

### 2. Stripe CLI Testing

To test using the Stripe CLI:

```bash
# Login to Stripe CLI
stripe login

# Listen for events and forward to your webhook
stripe listen --forward-to https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

### 3. Manual Testing with curl

For manual testing with proper signature:

```bash
# You need a valid Stripe webhook secret for this to work
STRIPE_WEBHOOK_SECRET="your_webhook_secret"
PAYLOAD='{"type":"checkout.session.completed","data":{"object":{"id":"cs_test_123","customer":"cus_test_123","subscription":"sub_test_123","client_reference_id":"user_test_123","metadata":{"tier":"starter"}}}}'
TIMESTAMP=$(date +%s)
SIGNED_PAYLOAD="${TIMESTAMP}.${PAYLOAD}"

# Generate signature (requires OpenSSL)
SIGNATURE=$(echo -n "$SIGNED_PAYLOAD" | openssl dgst -sha256 -hmac "$STRIPE_WEBHOOK_SECRET" | cut -d' ' -f2)

# Send request with proper signature
curl -X POST https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook \
  -H "Content-Type: application/json" \
  -H "stripe-signature: t=${TIMESTAMP},v1=${SIGNATURE}" \
  -d "$PAYLOAD"
```

## Expected Behavior

### Successful Request

A successful webhook request will:

1. Verify the Stripe signature using Web Crypto API
2. Process the event based on its type
3. Update the appropriate database tables
4. Return a 200 OK response with JSON: `{"received": true, "event_type": "event_type"}`

### Common Errors

- **401 Unauthorized**: This is expected when testing without proper authentication
  - Solution: Use Stripe Dashboard or CLI for testing with valid signatures
  
- **400 Bad Request**: Invalid signature
  - Solution: Ensure webhook secret matches between Stripe and Supabase environment variables

## Monitoring and Debugging

### Supabase Logs

To view webhook execution logs:

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Select your project: `xqgtuvzlrvbwwesuvitp`
3. Navigate to **Edge Functions** > **stripe-webhook**
4. Click on **Logs** tab

### Stripe Dashboard Logs

To view webhook delivery attempts:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** > **Webhooks**
3. Click on your webhook endpoint
4. View the **Recent events** section

## Supported Event Types

The webhook currently handles the following Stripe events:

- `checkout.session.completed`: Processes new subscription purchases
- `customer.subscription.updated`: Updates subscription status
- `customer.subscription.deleted`: Handles subscription cancellations

## Database Updates

Successful webhook events update the following tables:

- `subscriptions`: Creates or updates subscription records
- `profiles`: Updates user subscription status and credits

## Troubleshooting

If you encounter issues with the webhook:

1. **Check Environment Variables**: Ensure `STRIPE_WEBHOOK_SECRET` is correctly set in Supabase
2. **Verify JWT Configuration**: Confirm `config.toml` has `verify_jwt = false` for the webhook function
3. **Check Logs**: Review both Supabase and Stripe logs for detailed error messages
4. **Test with Stripe Dashboard**: Use the Stripe Dashboard to send test events with valid signatures

# Stripe Webhook Edge Function

This is a modular implementation of the Stripe webhook handler for PhotoSphere's subscription system. The code has been restructured into smaller, focused modules to improve maintainability and debugging.

## Structure

```
stripe-webhook/
├── main.ts                   # Main entry point (new modular version)
├── index.ts                  # Original monolithic version (kept for reference)
├── utils/
│   ├── config.ts             # Configuration constants (price mappings, tier credits)
│   ├── customer-management.ts # Customer handling functions
│   ├── signature-verification.ts # Stripe signature verification
│   └── subscription-management.ts # Subscription handling utilities
└── handlers/
    ├── checkout-session.ts   # Checkout session event handler
    ├── subscription-events.ts # Subscription lifecycle event handlers
    └── invoice-events.ts     # Invoice payment event handlers
```

## Key Features

- **Foreign Key Constraint Fix**: Properly links customers to users/profiles
- **Timestamp Validation**: Null-safe timestamp handling
- **Deno-compatible**: Uses Web Crypto API for signature verification
- **Comprehensive Event Handling**: Handles all subscription lifecycle events
- **Fallback Mechanisms**: Stripe wrapper with manual fallback for reliability
- **Detailed Logging**: Comprehensive logging for debugging

## Deployment Instructions

1. **Deploy the Edge Function**:

```bash
# Navigate to the project directory
cd /home/raymond/Desktop/CodeBase/Photospherev2/production-V2

# Deploy using Supabase CLI
supabase functions deploy stripe-webhook --project-ref xqgtuvzlrvbwwesuvitp
```

2. **Update Environment Variables**:
   - `STRIPE_WEBHOOK_SECRET`: Secret for verifying Stripe webhook signatures
   - `STRIPE_SECRET_KEY`: Stripe API secret key
   - `SUPABASE_URL`: Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key

3. **Configure Stripe Webhook**:
   - In Stripe Dashboard: Developers > Webhooks > Add endpoint
   - URL: `https://xqgtuvzlrvbwwesuvitp.supabase.co/functions/v1/stripe-webhook`
   - Events to send: 
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

4. **Update Price IDs**:
   - Check `utils/config.ts` and update the `PRICE_TO_TIER_MAP` with your actual Stripe price IDs

## Testing

To test the webhook:

1. Use Stripe CLI to trigger test events:
```bash
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
```

2. Monitor logs in Supabase Dashboard:
```
Functions > stripe-webhook > Logs
```

## Troubleshooting

- **401 Authorization Errors**: Check that the webhook secret is correctly set
- **Foreign Key Constraint Errors**: The customer handler now properly links to users
- **Timestamp Errors**: All timestamp conversions now have null checks
- **Signature Verification Errors**: Using custom async verification compatible with Deno

## Next Steps

1. Update price IDs in `utils/config.ts` with your actual Stripe price IDs
2. Configure Stripe wrapper if using that approach
3. Test webhook with all event types
4. Monitor logs for any errors

# Stripe Wrapper Setup Guide for PhotoSphere

This guide will help you migrate from the current webhook-based Stripe integration to the new Supabase Stripe Wrapper approach, which provides better data consistency and eliminates complex webhook handling.

## Overview

The Stripe Wrapper allows you to:
- Query Stripe data directly from your Postgres database
- Eliminate complex webhook handling for basic subscription queries
- Get real-time access to Stripe subscription data
- Simplify data management with foreign tables
- Reduce data synchronization issues

## Step 1: Run Database Migrations

First, apply the new database migrations to set up the wrapper and tables:

```bash
# Navigate to your project directory
cd /home/raymond/Desktop/CodeBase/Photospherev2/production-V2

# Apply the migrations (if using Supabase CLI)
supabase db push

# Or apply them manually in your Supabase dashboard SQL editor
```

## Step 2: Configure Stripe API Key in Vault

In your Supabase SQL editor, run these commands to securely store your Stripe API key:

```sql
-- Store your Stripe API key in Vault (replace with your actual key)
SELECT vault.create_secret(
  'sk_live_your_actual_stripe_secret_key_here', 
  'stripe_api_key', 
  'Stripe API key for PhotoSphere'
);
```

**Important:** Replace `sk_live_your_actual_stripe_secret_key_here` with your actual Stripe secret key.

The function will return a `key_id` - copy this for the next step.

## Step 3: Create Stripe Server Connection

Using the `key_id` from the previous step, create the Stripe server connection:

```sql
-- Create Stripe server (replace 'your_key_id_here' with the actual key_id from step 2)
CREATE SERVER stripe_server 
FOREIGN DATA WRAPPER stripe_wrapper 
OPTIONS (
  api_key_id 'your_key_id_here',
  api_url 'https://api.stripe.com/v1/',
  api_version '2024-06-20'
);
```

## Step 4: Enable Stripe Wrapper in Dashboard

1. Go to your Supabase dashboard
2. Navigate to **Integrations** → **Wrappers**
3. Find and enable the **Stripe Wrapper**
4. Follow the dashboard setup wizard

## Step 5: Apply Foreign Tables Migration

After setting up the server connection, apply the foreign tables migration:

```sql
-- Run the contents of 20250806000002_stripe_foreign_tables.sql
-- This creates the foreign tables for Stripe objects
```

## Step 6: Update Price IDs

Update the price IDs in the webhook to match your actual Stripe price IDs:

```typescript
// In /supabase/functions/stripe-webhook/index.ts
const PRICE_TO_TIER_MAP = {
  'price_your_starter_price_id': 'starter',   // Replace with actual price ID
  'price_your_pro_price_id': 'pro',           // Replace with actual price ID  
  'price_your_enterprise_price_id': 'enterprise' // Replace with actual price ID
};
```

## Step 7: Deploy Updated Webhook

Deploy the updated webhook function:

```bash
# Using Supabase CLI
supabase functions deploy stripe-webhook

# Or deploy through the Supabase dashboard
```

## Step 8: Test the Integration

### Test Database Queries

Test that you can query Stripe data directly:

```sql
-- Test querying customers
SELECT * FROM stripe.customers LIMIT 5;

-- Test querying subscriptions
SELECT * FROM stripe.subscriptions LIMIT 5;

-- Test the subscription details view
SELECT * FROM stripe_subscription_details LIMIT 5;
```

### Test Webhook Functionality

1. Create a test subscription in Stripe
2. Check the webhook logs in Supabase
3. Verify that the `profiles` and `subscriptions` tables are updated correctly

## Step 9: Update Frontend Code (Optional)

You can now query subscription data directly from your database instead of relying solely on webhooks:

```typescript
// Example: Get real-time subscription status
const { data, error } = await supabase
  .rpc('get_realtime_subscription_status', { user_uuid: userId });

// Example: Query subscription details with Stripe data
const { data: subscriptionDetails } = await supabase
  .from('stripe_subscription_details')
  .select('*')
  .eq('customer_email', userEmail)
  .single();
```

## Benefits of This Approach

### 1. **Simplified Data Management**
- No more complex webhook handling for basic queries
- Direct access to Stripe data from your database
- Automatic data synchronization

### 2. **Better Data Consistency**
- Real-time access to Stripe data
- Reduced risk of data getting out of sync
- Single source of truth for subscription data

### 3. **Enhanced Querying Capabilities**
- Join Stripe data with your local data
- Complex queries across Stripe and local tables
- Better analytics and reporting

### 4. **Reduced Complexity**
- Fewer webhook endpoints to maintain
- Less error-prone data synchronization
- Cleaner codebase

## New Database Schema

### profiles table
- Stores user subscription information
- Links to Stripe customer data
- Tracks credits and usage limits

### subscriptions table
- Detailed subscription tracking
- Links to Stripe subscription data
- Subscription lifecycle management

### subscription_features table
- Feature management per subscription
- Flexible feature configuration
- Easy feature toggling

## Available Functions

### `sync_subscription_from_stripe(subscription_id)`
Syncs subscription data from Stripe foreign tables to local tables.

### `get_realtime_subscription_status(user_uuid)`
Gets real-time subscription status comparing local and Stripe data.

### `check_feature_access(user_uuid, feature_name)`
Checks if a user has access to a specific feature based on their subscription tier.

## Troubleshooting

### Common Issues

1. **"stripe_wrapper not found"**
   - Ensure the wrappers extension is enabled
   - Check that the stripe_wrapper FDW is created

2. **"Permission denied for foreign table"**
   - Verify the Stripe API key is correctly stored in Vault
   - Check the server connection configuration

3. **"Subscription not found in Stripe wrapper"**
   - Ensure the foreign tables are created correctly
   - Check that your Stripe API key has the correct permissions

### Debug Queries

```sql
-- Check if wrappers extension is enabled
SELECT * FROM pg_extension WHERE extname = 'wrappers';

-- Check foreign data wrappers
SELECT * FROM pg_foreign_data_wrapper WHERE fdwname = 'stripe_wrapper';

-- Check foreign server
SELECT * FROM pg_foreign_server WHERE srvname = 'stripe_server';

-- Test Stripe connection
SELECT COUNT(*) FROM stripe.customers;
```

## Migration Checklist

- [ ] Apply database migrations
- [ ] Store Stripe API key in Vault
- [ ] Create Stripe server connection
- [ ] Enable Stripe wrapper in dashboard
- [ ] Apply foreign tables migration
- [ ] Update price IDs in webhook
- [ ] Deploy updated webhook
- [ ] Test database queries
- [ ] Test webhook functionality
- [ ] Update frontend code (optional)

## Next Steps

After completing this setup, you can:

1. **Enhance Analytics**: Create views and queries that combine Stripe and local data
2. **Implement Real-time Features**: Use the foreign tables for real-time subscription status
3. **Simplify Billing Logic**: Query Stripe data directly instead of maintaining local copies
4. **Add Advanced Features**: Implement usage-based billing, metered subscriptions, etc.

## Support

If you encounter any issues during setup:

1. Check the Supabase logs for error messages
2. Verify your Stripe API key permissions
3. Test the foreign table connections
4. Review the webhook logs for any errors

The new system provides a much more robust and maintainable approach to handling Stripe subscriptions in your PhotoSphere application.

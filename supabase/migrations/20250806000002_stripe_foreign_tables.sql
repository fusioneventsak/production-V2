/*
  # Stripe Foreign Tables Setup
  
  This migration creates the foreign tables for Stripe objects.
  
  IMPORTANT: Before running this migration, you need to:
  1. Store your Stripe API key in Vault
  2. Create the Stripe server connection
  
  Run these commands in your Supabase SQL editor first:
  
  -- Store Stripe API key in Vault (replace with your actual key)
  SELECT vault.create_secret(
    'sk_live_your_stripe_secret_key_here', 
    'stripe_api_key', 
    'Stripe API key for PhotoSphere'
  );
  
  -- Create Stripe server (replace key_id with the ID returned above)
  CREATE SERVER stripe_server 
  FOREIGN DATA WRAPPER stripe_wrapper 
  OPTIONS (
    api_key_id 'your_key_id_here',
    api_url 'https://api.stripe.com/v1/',
    api_version '2024-06-20'
  );
*/

-- 1. Create foreign table for Stripe customers
CREATE FOREIGN TABLE IF NOT EXISTS stripe.customers (
  id text,
  email text,
  name text,
  description text,
  created timestamp,
  updated timestamp,
  attrs jsonb
) SERVER stripe_server
OPTIONS (
  object 'customers',
  rowid_column 'id'
);

-- 2. Create foreign table for Stripe subscriptions
CREATE FOREIGN TABLE IF NOT EXISTS stripe.subscriptions (
  id text,
  customer text,
  status text,
  current_period_start timestamp,
  current_period_end timestamp,
  cancel_at_period_end boolean,
  created timestamp,
  attrs jsonb
) SERVER stripe_server
OPTIONS (
  object 'subscriptions',
  rowid_column 'id'
);

-- 3. Create foreign table for Stripe prices
CREATE FOREIGN TABLE IF NOT EXISTS stripe.prices (
  id text,
  product text,
  active boolean,
  currency text,
  unit_amount bigint,
  recurring jsonb,
  created timestamp,
  attrs jsonb
) SERVER stripe_server
OPTIONS (
  object 'prices'
);

-- 4. Create foreign table for Stripe products
CREATE FOREIGN TABLE IF NOT EXISTS stripe.products (
  id text,
  name text,
  description text,
  active boolean,
  created timestamp,
  updated timestamp,
  attrs jsonb
) SERVER stripe_server
OPTIONS (
  object 'products',
  rowid_column 'id'
);

-- 5. Create foreign table for Stripe payment intents
CREATE FOREIGN TABLE IF NOT EXISTS stripe.payment_intents (
  id text,
  customer text,
  amount bigint,
  currency text,
  status text,
  created timestamp,
  attrs jsonb
) SERVER stripe_server
OPTIONS (
  object 'payment_intents'
);

-- 6. Create foreign table for Stripe invoices
CREATE FOREIGN TABLE IF NOT EXISTS stripe.invoices (
  id text,
  customer text,
  subscription text,
  status text,
  amount_due bigint,
  amount_paid bigint,
  currency text,
  created timestamp,
  attrs jsonb
) SERVER stripe_server
OPTIONS (
  object 'invoices'
);

-- 7. Create views for easier querying
CREATE OR REPLACE VIEW stripe_subscription_details AS
SELECT 
  s.id as subscription_id,
  s.customer as customer_id,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  c.email as customer_email,
  c.name as customer_name,
  p.name as product_name,
  pr.unit_amount,
  pr.currency,
  pr.recurring->>'interval' as billing_interval
FROM stripe.subscriptions s
LEFT JOIN stripe.customers c ON s.customer = c.id
LEFT JOIN stripe.prices pr ON s.attrs->>'default_price_id' = pr.id
LEFT JOIN stripe.products p ON pr.product = p.id;

-- 8. Create view for active subscriptions with user profiles
CREATE OR REPLACE VIEW active_subscriptions_with_profiles AS
SELECT 
  prof.id as user_id,
  prof.email,
  prof.subscription_tier,
  prof.subscription_status as local_status,
  ssd.subscription_id,
  ssd.status as stripe_status,
  ssd.current_period_start,
  ssd.current_period_end,
  ssd.cancel_at_period_end,
  ssd.product_name,
  ssd.unit_amount,
  ssd.currency,
  ssd.billing_interval
FROM profiles prof
LEFT JOIN stripe_subscription_details ssd ON prof.stripe_customer_id = ssd.customer_id
WHERE prof.subscription_status = 'active' OR ssd.status = 'active';

-- 9. Create function to sync subscription data from Stripe
CREATE OR REPLACE FUNCTION sync_subscription_from_stripe(stripe_subscription_id text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stripe_sub record;
  user_profile record;
  tier_mapping jsonb := '{
    "price_1starter": "starter",
    "price_1pro": "pro", 
    "price_1enterprise": "enterprise"
  }'::jsonb;
  subscription_tier text;
BEGIN
  -- Get subscription data from Stripe foreign table
  SELECT * INTO stripe_sub
  FROM stripe.subscriptions
  WHERE id = stripe_subscription_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Subscription not found in Stripe: %', stripe_subscription_id;
  END IF;
  
  -- Find user by customer ID
  SELECT * INTO user_profile
  FROM profiles
  WHERE stripe_customer_id = stripe_sub.customer;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found for customer: %', stripe_sub.customer;
  END IF;
  
  -- Determine subscription tier from price ID
  subscription_tier := COALESCE(
    tier_mapping->>((stripe_sub.attrs->>'default_price_id')),
    'starter'
  );
  
  -- Update user profile
  UPDATE profiles SET
    subscription_id = stripe_sub.id,
    subscription_status = stripe_sub.status,
    subscription_tier = subscription_tier,
    subscription_expiry = stripe_sub.current_period_end,
    updated_at = now()
  WHERE id = user_profile.id;
  
  -- Update or insert subscription record
  INSERT INTO subscriptions (
    user_id,
    stripe_subscription_id,
    stripe_customer_id,
    price_id,
    status,
    tier,
    current_period_start,
    current_period_end,
    cancel_at_period_end
  ) VALUES (
    user_profile.id,
    stripe_sub.id,
    stripe_sub.customer,
    stripe_sub.attrs->>'default_price_id',
    stripe_sub.status,
    subscription_tier,
    stripe_sub.current_period_start,
    stripe_sub.current_period_end,
    stripe_sub.cancel_at_period_end
  )
  ON CONFLICT (stripe_subscription_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_period_start = EXCLUDED.current_period_start,
    current_period_end = EXCLUDED.current_period_end,
    cancel_at_period_end = EXCLUDED.cancel_at_period_end,
    updated_at = now();
    
  RAISE NOTICE 'Successfully synced subscription % for user %', stripe_subscription_id, user_profile.id;
END;
$$;

-- 10. Create function to get real-time subscription status
CREATE OR REPLACE FUNCTION get_realtime_subscription_status(user_uuid uuid)
RETURNS TABLE (
  local_status text,
  stripe_status text,
  sync_needed boolean,
  subscription_tier text,
  current_period_end timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile record;
  stripe_sub record;
BEGIN
  -- Get user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = user_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User profile not found: %', user_uuid;
  END IF;
  
  -- Get Stripe subscription if exists
  IF user_profile.stripe_customer_id IS NOT NULL THEN
    SELECT s.* INTO stripe_sub
    FROM stripe.subscriptions s
    WHERE s.customer = user_profile.stripe_customer_id
    AND s.status IN ('active', 'trialing', 'past_due')
    ORDER BY s.created DESC
    LIMIT 1;
  END IF;
  
  RETURN QUERY SELECT
    user_profile.subscription_status,
    COALESCE(stripe_sub.status, 'none'),
    (user_profile.subscription_status != COALESCE(stripe_sub.status, 'inactive')),
    user_profile.subscription_tier,
    COALESCE(stripe_sub.current_period_end, user_profile.subscription_expiry);
END;
$$;

-- 11. Grant permissions
GRANT SELECT ON stripe.customers TO authenticated, service_role;
GRANT SELECT ON stripe.subscriptions TO authenticated, service_role;
GRANT SELECT ON stripe.prices TO authenticated, service_role;
GRANT SELECT ON stripe.products TO authenticated, service_role;
GRANT SELECT ON stripe.payment_intents TO authenticated, service_role;
GRANT SELECT ON stripe.invoices TO authenticated, service_role;

GRANT SELECT ON stripe_subscription_details TO authenticated, service_role;
GRANT SELECT ON active_subscriptions_with_profiles TO authenticated, service_role;

/*
  # Fix Security Definer Views
  
  This migration fixes security advisor issues related to views that are implicitly
  using SECURITY DEFINER. The views will be recreated with SECURITY INVOKER explicitly
  specified to ensure they respect row-level security policies.
  
  Views affected:
  1. subscription_analytics
  2. stripe_subscription_details
  3. active_subscriptions_with_profiles
*/

-- 1. Fix subscription_analytics view
DROP VIEW IF EXISTS subscription_analytics;
CREATE OR REPLACE VIEW subscription_analytics
WITH (security_invoker = true)
AS
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_count,
  AVG(credits_remaining) as avg_credits_remaining,
  SUM(total_credits_used) as total_credits_used,
  AVG(photospheres_created) as avg_photospheres_created
FROM profiles
GROUP BY subscription_tier;

-- 2. Fix stripe_subscription_details view
DROP VIEW IF EXISTS stripe_subscription_details;
CREATE OR REPLACE VIEW stripe_subscription_details
WITH (security_invoker = true)
AS
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

-- 3. Fix active_subscriptions_with_profiles view
DROP VIEW IF EXISTS active_subscriptions_with_profiles;
CREATE OR REPLACE VIEW active_subscriptions_with_profiles
WITH (security_invoker = true)
AS
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

-- 4. Ensure proper permissions are maintained
GRANT SELECT ON subscription_analytics TO authenticated, service_role;
GRANT SELECT ON stripe_subscription_details TO authenticated, service_role;
GRANT SELECT ON active_subscriptions_with_profiles TO authenticated, service_role;

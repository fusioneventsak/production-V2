/*
  Test script to verify that the security invoker views still function correctly
  after the changes. This script should be run after applying the migration.
*/

-- Test 1: Check that subscription_analytics view returns data
SELECT * FROM subscription_analytics;

-- Test 2: Check that stripe_subscription_details view returns data
SELECT * FROM stripe_subscription_details LIMIT 5;

-- Test 3: Check that active_subscriptions_with_profiles view returns data
SELECT * FROM active_subscriptions_with_profiles LIMIT 5;

-- Test 4: Check that RLS is properly enforced on these views
-- This should be run as a non-admin user to verify that RLS is working
-- The user should only see their own data
SELECT * FROM active_subscriptions_with_profiles 
WHERE user_id = auth.uid() 
LIMIT 5;

-- Test 5: Verify that service_role can still access all data
-- This should be run with service_role token
SELECT COUNT(*) FROM subscription_analytics;
SELECT COUNT(*) FROM stripe_subscription_details;
SELECT COUNT(*) FROM active_subscriptions_with_profiles;

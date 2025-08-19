-- Test Stripe Wrapper Setup
-- Run these queries in your Supabase SQL editor to verify the setup

-- 1. Check if wrappers extension is enabled
SELECT 
  extname as extension_name,
  extversion as version,
  extrelocatable as relocatable
FROM pg_extension 
WHERE extname = 'wrappers';

-- 2. Check if stripe_wrapper FDW exists
SELECT 
  fdwname as wrapper_name,
  fdwhandler as handler,
  fdwvalidator as validator
FROM pg_foreign_data_wrapper 
WHERE fdwname = 'stripe_wrapper';

-- 3. Check if stripe_server exists
SELECT 
  srvname as server_name,
  srvtype as server_type,
  srvversion as server_version,
  srvacl as access_control,
  srvoptions as options
FROM pg_foreign_server 
WHERE srvname = 'stripe_server';

-- 4. List all foreign tables in stripe schema
SELECT 
  schemaname as schema_name,
  tablename as table_name,
  tableowner as owner
FROM pg_tables 
WHERE schemaname = 'stripe'
ORDER BY tablename;

-- 5. Test basic Stripe data access (will fail if not properly configured)
-- Uncomment these after setup is complete:

-- SELECT COUNT(*) as customer_count FROM stripe.customers;
-- SELECT COUNT(*) as subscription_count FROM stripe.subscriptions;
-- SELECT COUNT(*) as price_count FROM stripe.prices;

-- 6. Test the subscription details view
-- SELECT * FROM stripe_subscription_details LIMIT 5;

-- 7. Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 8. Check subscriptions table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'subscriptions' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 9. Test helper functions exist
SELECT 
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'sync_subscription_from_stripe',
    'get_realtime_subscription_status',
    'check_feature_access',
    'get_user_subscription_info'
  );

-- 10. Check RLS policies on new tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('profiles', 'subscriptions', 'subscription_features')
ORDER BY tablename, policyname;

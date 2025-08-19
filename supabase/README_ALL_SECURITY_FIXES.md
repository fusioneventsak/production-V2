# Supabase Security Fixes Documentation

This document outlines the security issues identified in the PhotoSphere application's Supabase database and the fixes applied.

## 1. Security Definer Views

### Issue
Three database views were flagged by the Supabase security advisor for using the default `SECURITY DEFINER` property:
- `subscription_analytics`
- `stripe_subscription_details`
- `active_subscriptions_with_profiles`

`SECURITY DEFINER` views execute with the permissions of the view creator rather than the querying user, potentially bypassing row-level security (RLS) policies.

### Fix
All views were recreated with explicit `SECURITY INVOKER` settings using:
```sql
CREATE OR REPLACE VIEW view_name
WITH (security_invoker = true)
AS SELECT...
```

### Impact on Application
This fix ensures proper enforcement of row-level security without affecting application functionality. Queries that worked before will continue to work, but now with proper security context.

## 2. Function Search Path Mutable

### Issue
Several PostgreSQL functions were flagged for not having an explicitly set `search_path` parameter:
- `update_user_subscription_metadata`
- `handle_subscription_change`
- `is_user_in_trial`
- `get_trial_days_remaining`
- `fix_missing_free_trials`
- `initialize_user_free_trial`
- `apply_free_trial_to_user`
- `update_updated_at_column`
- `create_trial_subscription`

When a function's search path is mutable (not explicitly set), it uses the search path of the calling role, which can lead to potential "search path injection" attacks.

### Fix
Added `SET search_path = public, pg_temp` clause to each function definition:
```sql
CREATE OR REPLACE FUNCTION function_name(...)
    RETURNS ...
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
AS $function$
...
$function$;
```

### Impact on Application
This fix is purely defensive and improves security without changing behavior. The application functionality remains unchanged.

## 3. Auth Security Warnings

### Issues
1. **Auth OTP Long Expiry**: The email provider has OTP expiry set to more than an hour.
2. **Leaked Password Protection Disabled**: The feature to check passwords against HaveIBeenPwned.org is currently disabled.

### Recommended Fixes
1. **Auth OTP Expiry**: Reduce the OTP expiry time to less than one hour in the Supabase Auth settings.
2. **Leaked Password Protection**: Enable this feature in the Supabase Auth settings.

### Impact on Application
- **OTP Expiry**: Users will need to request new verification codes more frequently if they don't complete verification within the shorter timeframe.
- **Leaked Password Protection**: Users will be prevented from using known compromised passwords, enhancing security.

## How to Apply Fixes

### Security Definer Views Fix
Run the `fix_security_definer_views.sql` script in the Supabase SQL Editor.

### Function Search Path Fix
Run the `fix_function_search_paths_simplified.sql` script in the Supabase SQL Editor.

### Auth Settings Fix
1. Navigate to the Supabase Dashboard > Authentication > Providers
2. Update the Email OTP expiry time to less than 3600 seconds (1 hour)
3. Enable the "Check for compromised passwords" option

## Verification

After applying the fixes, run these verification queries:

### For Security Definer Views
```sql
SELECT n.nspname as schema, c.relname as view_name, pg_catalog.pg_get_userbyid(c.relowner) as owner
FROM pg_catalog.pg_class c
JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
AND c.reloptions::text LIKE '%security_definer%'
AND n.nspname = 'public';
```

### For Function Search Path
```sql
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_functiondef(p.oid) LIKE '%SET search_path%' as has_search_path
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN (
    'update_user_subscription_metadata',
    'handle_subscription_change',
    'is_user_in_trial',
    'get_trial_days_remaining',
    'fix_missing_free_trials',
    'initialize_user_free_trial',
    'apply_free_trial_to_user',
    'update_updated_at_column',
    'create_trial_subscription'
);
```

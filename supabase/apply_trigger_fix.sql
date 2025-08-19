-- Fix for handle_subscription_change trigger function
-- This script drops the trigger, recreates the function with correct column references,
-- and then recreates the trigger

BEGIN;

-- 1. Drop the existing trigger
DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;

-- 2. Drop and recreate the function with correct column references
DROP FUNCTION IF EXISTS handle_subscription_change();
CREATE FUNCTION handle_subscription_change()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Update user's subscription metadata in profiles table
    -- Using NEW.tier and NEW.status instead of NEW.subscription_tier and NEW.subscription_status
    UPDATE profiles
    SET subscription_tier = NEW.tier,
        subscription_status = NEW.status,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$function$;

-- 3. Recreate the trigger
CREATE TRIGGER on_subscription_change
AFTER INSERT OR UPDATE
ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION handle_subscription_change();

-- 4. Verify the function definition
SELECT pg_get_functiondef(oid) 
FROM pg_proc 
WHERE proname = 'handle_subscription_change';

COMMIT;

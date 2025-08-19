-- Fix Function Search Path Mutable warnings
-- Run this SQL in the Supabase Dashboard SQL Editor

BEGIN;

-- 1. Fix update_user_subscription_metadata function
DROP FUNCTION IF EXISTS update_user_subscription_metadata(uuid, text, text);
CREATE FUNCTION update_user_subscription_metadata(user_id uuid, subscription_tier text, subscription_status text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    UPDATE profiles
    SET 
        subscription_tier = update_user_subscription_metadata.subscription_tier,
        subscription_status = update_user_subscription_metadata.subscription_status,
        updated_at = now()
    WHERE id = user_id;
END;
$function$;

-- 2. Fix handle_subscription_change function
-- First, save the trigger definition
DO $$
DECLARE
    trigger_def text;
BEGIN
    SELECT pg_get_triggerdef(t.oid)
    INTO trigger_def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE t.tgname = 'on_subscription_change'
    AND n.nspname = 'public';
    
    -- Store the trigger definition in a temporary table for later use
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_trigger_defs (name text, definition text);
    INSERT INTO temp_trigger_defs VALUES ('on_subscription_change', trigger_def);
    
    IF trigger_def IS NOT NULL THEN
        -- Drop the trigger
        EXECUTE 'DROP TRIGGER IF EXISTS on_subscription_change ON subscriptions;';
    END IF;
END $$;

-- Now drop and recreate the function
DROP FUNCTION IF EXISTS handle_subscription_change();
CREATE FUNCTION handle_subscription_change()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Update user's subscription metadata in profiles table
    UPDATE profiles
    SET subscription_tier = NEW.tier,
        subscription_status = NEW.status,
        updated_at = now()
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$function$;

-- 3. Fix is_user_in_trial function
DROP FUNCTION IF EXISTS is_user_in_trial(uuid);
CREATE FUNCTION is_user_in_trial(user_uuid uuid) -- Using user_uuid to match existing parameter name
    RETURNS boolean
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = public, pg_temp
AS $function$
DECLARE
    trial_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM subscriptions
        WHERE user_id = is_user_in_trial.user_uuid
        AND subscription_tier = 'trial'
        AND status = 'active'
        AND trial_end > now()
    ) INTO trial_exists;
    
    RETURN trial_exists;
END;
$function$;

-- 4. Fix get_trial_days_remaining function
DROP FUNCTION IF EXISTS get_trial_days_remaining(uuid);
CREATE FUNCTION get_trial_days_remaining(user_uuid uuid) -- Using user_uuid to match existing parameter name
    RETURNS integer
    LANGUAGE plpgsql
    SECURITY INVOKER
    SET search_path = public, pg_temp
AS $function$
DECLARE
    days_remaining integer;
BEGIN
    SELECT 
        CASE 
            WHEN trial_end IS NULL THEN 0
            WHEN trial_end < now() THEN 0
            ELSE EXTRACT(DAY FROM trial_end - now())::integer
        END
    INTO days_remaining
    FROM subscriptions
    WHERE user_id = get_trial_days_remaining.user_uuid
    AND subscription_tier = 'trial'
    AND status = 'active'
    ORDER BY trial_end DESC
    LIMIT 1;
    
    RETURN COALESCE(days_remaining, 0);
END;
$function$;

-- 5. Fix fix_missing_free_trials function
DROP FUNCTION IF EXISTS fix_missing_free_trials();
CREATE FUNCTION fix_missing_free_trials()
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Find users without active trials
    INSERT INTO subscriptions (user_id, subscription_tier, status, trial_start, trial_end)
    SELECT 
        p.id, 
        'trial', 
        'active', 
        now(), 
        now() + interval '14 days'
    FROM profiles p
    WHERE NOT EXISTS (
        SELECT 1 
        FROM subscriptions s 
        WHERE s.user_id = p.id 
        AND s.subscription_tier = 'trial'
        AND s.status = 'active'
    )
    AND p.subscription_tier = 'free';
END;
$function$;

-- 6. Fix initialize_user_free_trial function
DROP FUNCTION IF EXISTS initialize_user_free_trial();
CREATE FUNCTION initialize_user_free_trial()
    RETURNS trigger
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Create a free trial subscription for the new user
    INSERT INTO subscriptions (user_id, subscription_tier, status, trial_start, trial_end)
    VALUES (NEW.id, 'trial', 'active', now(), now() + interval '14 days');
    
    RETURN NEW;
END;
$function$;

-- 7. Fix apply_free_trial_to_user function
DROP FUNCTION IF EXISTS apply_free_trial_to_user(uuid);
CREATE FUNCTION apply_free_trial_to_user(user_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Check if user already has an active trial
    IF NOT EXISTS (
        SELECT 1 
        FROM subscriptions 
        WHERE user_id = apply_free_trial_to_user.user_id 
        AND subscription_tier = 'trial'
        AND status = 'active'
        AND trial_end > now()
    ) THEN
        -- Create a free trial subscription for the user
        INSERT INTO subscriptions (user_id, subscription_tier, status, trial_start, trial_end)
        VALUES (user_id, 'trial', 'active', now(), now() + interval '14 days');
    END IF;
END;
$function$;

-- 8. Fix update_updated_at_column function
-- First, save all trigger definitions that use this function
DO $$
DECLARE
    trigger_rec record;
BEGIN
    -- Create a temporary table to store trigger definitions
    CREATE TEMPORARY TABLE IF NOT EXISTS temp_updated_at_triggers (
        table_name text,
        trigger_name text,
        definition text
    );
    
    -- Find and store all triggers that use update_updated_at_column
    FOR trigger_rec IN (
        SELECT 
            n.nspname as schema_name,
            c.relname as table_name,
            t.tgname as trigger_name,
            pg_get_triggerdef(t.oid) as definition
        FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE p.proname = 'update_updated_at_column'
        AND n.nspname = 'public'
    ) LOOP
        -- Store the trigger info
        INSERT INTO temp_updated_at_triggers VALUES (
            trigger_rec.table_name,
            trigger_rec.trigger_name,
            trigger_rec.definition
        );
        
        -- Drop the trigger
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_rec.trigger_name) || ' ON ' || quote_ident(trigger_rec.table_name) || ';';
    END LOOP;
END $$;

-- Now drop and recreate the function
DROP FUNCTION IF EXISTS update_updated_at_column();
CREATE FUNCTION update_updated_at_column()
    RETURNS trigger
    LANGUAGE plpgsql
    SET search_path = public, pg_temp
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- 9. Fix create_trial_subscription function
DROP FUNCTION IF EXISTS create_trial_subscription(uuid);
CREATE FUNCTION create_trial_subscription(user_id uuid)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
AS $function$
BEGIN
    -- Create a trial subscription
    INSERT INTO subscriptions (user_id, subscription_tier, status, trial_start, trial_end)
    VALUES (user_id, 'trial', 'active', now(), now() + interval '14 days');
    
    -- Update user's profile
    UPDATE profiles
    SET 
        subscription_tier = 'trial',
        subscription_status = 'active',
        updated_at = now()
    WHERE id = user_id;
END;
$function$;

-- Recreate all triggers after all functions are fixed
DO $$
DECLARE
    trigger_rec record;
    trigger_def text;
BEGIN
    -- First recreate the subscription change trigger
    SELECT definition INTO trigger_def FROM temp_trigger_defs WHERE name = 'on_subscription_change';
    
    IF trigger_def IS NOT NULL THEN
        EXECUTE 'CREATE TRIGGER on_subscription_change
                 AFTER INSERT OR UPDATE
                 ON subscriptions
                 FOR EACH ROW
                 EXECUTE FUNCTION handle_subscription_change();';
    END IF;
    
    -- Now recreate all the updated_at triggers
    FOR trigger_rec IN (SELECT * FROM temp_updated_at_triggers) LOOP
        -- Create a standardized trigger that follows the same pattern
        -- All these triggers are BEFORE UPDATE/INSERT triggers that call update_updated_at_column
        EXECUTE format(
            'CREATE TRIGGER %I
             BEFORE UPDATE OR INSERT ON %I
             FOR EACH ROW
             EXECUTE FUNCTION update_updated_at_column();',
            trigger_rec.trigger_name,
            trigger_rec.table_name
        );
    END LOOP;
    
    -- Clean up the temporary tables
    DROP TABLE IF EXISTS temp_trigger_defs;
    DROP TABLE IF EXISTS temp_updated_at_triggers;
END $$;

-- Verify the changes
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

COMMIT;

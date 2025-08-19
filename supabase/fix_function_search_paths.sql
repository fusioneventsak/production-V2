-- Fix Function Search Path Mutable warnings
-- Run this SQL in the Supabase Dashboard SQL Editor

BEGIN;

-- Get the function definitions first to preserve their exact logic
DO $$
DECLARE
    func_record RECORD;
    func_def TEXT;
    new_def TEXT;
    functions_to_fix TEXT[] := ARRAY[
        'update_user_subscription_metadata',
        'handle_subscription_change',
        'is_user_in_trial',
        'get_trial_days_remaining',
        'fix_missing_free_trials',
        'initialize_user_free_trial',
        'apply_free_trial_to_user',
        'update_updated_at_column',
        'create_trial_subscription'
    ];
BEGIN
    FOREACH func_name IN ARRAY functions_to_fix LOOP
        -- Get the function definition
        SELECT pg_get_functiondef(p.oid)
        INTO func_def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' AND p.proname = func_name;
        
        IF func_def IS NOT NULL THEN
            -- Check if the function already has SET search_path
            IF func_def NOT LIKE '%SET search_path%' THEN
                -- Add SET search_path clause before the AS keyword
                new_def := regexp_replace(
                    func_def,
                    '(.*)\s+AS\s+(.*)$',
                    E'\\1\n    SET search_path = public, pg_temp\n    AS \\2',
                    'si'
                );
                
                -- Execute the new definition
                EXECUTE new_def;
                
                RAISE NOTICE 'Fixed search_path for function: %', func_name;
            ELSE
                RAISE NOTICE 'Function % already has search_path set', func_name;
            END IF;
        ELSE
            RAISE NOTICE 'Function % not found', func_name;
        END IF;
    END LOOP;
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

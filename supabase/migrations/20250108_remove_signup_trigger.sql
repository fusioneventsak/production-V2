-- Remove the signup trigger that's causing 500 errors
-- This will allow clean signup without database operations
-- User initialization will now happen on first login instead

-- Drop the trigger that runs on user signup
DROP TRIGGER IF EXISTS on_auth_user_created_free_trial ON auth.users;

-- Drop the function as well since we're not using it anymore
DROP FUNCTION IF EXISTS public.handle_new_user_free_trial();

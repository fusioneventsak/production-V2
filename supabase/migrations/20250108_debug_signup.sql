-- Temporarily disable the signup trigger for debugging
-- Run this to disable the trigger and test if signup works without it

DROP TRIGGER IF EXISTS on_auth_user_created_free_trial ON auth.users;

-- To re-enable later, run:
-- CREATE TRIGGER on_auth_user_created_free_trial
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_free_trial();

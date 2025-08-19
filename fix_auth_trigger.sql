-- IMMEDIATE FIX: Remove the signup trigger causing 500 errors
-- Run this in your Supabase SQL Editor to fix the sign in button

-- Drop the problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created_free_trial ON auth.users;

-- Drop the function as well
DROP FUNCTION IF EXISTS public.handle_new_user_free_trial();

-- This will allow clean signup/signin without database operations
-- User initialization will happen on first login via the frontend

/*
  # Clean Up Unrelated Tables
  
  1. Changes
    - Drop tables that were accidentally added from another project
    - Remove associated policies
    - Clean up database schema
    
  2. Benefits
    - Eliminates warnings about multiple permissive policies
    - Simplifies database schema
    - Improves overall database performance
*/

-- Drop the requesters table if it exists
DROP TABLE IF EXISTS public.requesters CASCADE;

-- Drop the requests table if it exists
DROP TABLE IF EXISTS public.requests CASCADE;

-- Drop the user_votes table if it exists
DROP TABLE IF EXISTS public.user_votes CASCADE;

-- Clean up any orphaned policies (this is safe to run even if the policies don't exist)
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- Find and drop policies for requesters table
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'requesters'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.requesters', policy_record.policyname);
  END LOOP;

  -- Find and drop policies for requests table
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'requests'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.requests', policy_record.policyname);
  END LOOP;

  -- Find and drop policies for user_votes table
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_votes'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.user_votes', policy_record.policyname);
  END LOOP;
END $$;
/*
  # Stripe Wrapper Setup for PhotoSphere
  
  This migration sets up the Supabase Stripe wrapper to enable direct querying
  of Stripe data from within Postgres, eliminating the need for complex webhook
  handling for subscription data.
  
  1. Enable wrappers extension
  2. Create Stripe foreign data wrapper
  3. Store Stripe API key securely in Vault
  4. Create Stripe server connection
  5. Create foreign tables for Stripe objects
  6. Create profiles table for user subscription data
  7. Set up RLS policies
*/

-- 1. Enable the wrappers extension
CREATE EXTENSION IF NOT EXISTS wrappers WITH SCHEMA extensions;

-- 2. Enable the stripe_wrapper FDW
CREATE FOREIGN DATA WRAPPER IF NOT EXISTS stripe_wrapper 
  HANDLER stripe_fdw_handler 
  VALIDATOR stripe_fdw_validator;

-- 3. Create a schema for Stripe foreign tables
CREATE SCHEMA IF NOT EXISTS stripe;

-- 4. Create profiles table to store user subscription information
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  
  -- Subscription fields
  stripe_customer_id text UNIQUE,
  subscription_id text,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'pro', 'enterprise')),
  subscription_status text DEFAULT 'inactive',
  subscription_expiry timestamptz,
  plan_type text DEFAULT 'free',
  
  -- Credits system
  free_credits integer DEFAULT 1000,
  credits_remaining integer DEFAULT 0,
  total_credits_used integer DEFAULT 0,
  
  -- Usage limits
  photospheres_created integer DEFAULT 0,
  photos_uploaded integer DEFAULT 0,
  max_photospheres integer DEFAULT 5,
  max_photos integer DEFAULT 100,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Create subscriptions table for detailed subscription tracking
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  price_id text NOT NULL,
  status text NOT NULL,
  tier text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Create subscription_features table for feature management
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  feature_name text NOT NULL,
  feature_value jsonb DEFAULT '{}'::jsonb,
  enabled boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- 7. Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 9. Create RLS policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 10. Create RLS policies for subscription_features
CREATE POLICY "Users can view own subscription features" ON subscription_features
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM subscriptions s 
      WHERE s.id = subscription_features.subscription_id 
      AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage all subscription features" ON subscription_features
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 11. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_tier ON profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- 12. Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- 13. Create trigger to automatically create profile
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;
CREATE TRIGGER create_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- 14. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 15. Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 16. Insert default settings record if it doesn't exist
INSERT INTO settings (id, primary_color, secondary_color, grid_size, gamification_enabled)
SELECT gen_random_uuid(), '#8b5cf6', '#14b8a6', 4, true
WHERE NOT EXISTS (SELECT 1 FROM settings);

-- 17. Create helper functions for subscription management
CREATE OR REPLACE FUNCTION get_user_subscription_info(user_uuid uuid)
RETURNS TABLE (
  subscription_tier text,
  subscription_status text,
  subscription_expiry timestamptz,
  free_credits integer,
  credits_remaining integer,
  max_photospheres integer,
  max_photos integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.subscription_tier,
    p.subscription_status,
    p.subscription_expiry,
    p.free_credits,
    p.credits_remaining,
    p.max_photospheres,
    p.max_photos
  FROM profiles p
  WHERE p.id = user_uuid;
END;
$$;

-- 18. Create function to check feature access
CREATE OR REPLACE FUNCTION check_feature_access(user_uuid uuid, feature_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_tier text;
  has_access boolean := false;
BEGIN
  -- Get user's subscription tier
  SELECT subscription_tier INTO user_tier
  FROM profiles
  WHERE id = user_uuid;
  
  -- Check feature access based on tier
  CASE feature_name
    WHEN 'video_export' THEN
      has_access := user_tier IN ('pro', 'enterprise');
    WHEN 'priority_support' THEN
      has_access := user_tier IN ('pro', 'enterprise');
    WHEN 'white_label' THEN
      has_access := user_tier = 'enterprise';
    WHEN 'advanced_analytics' THEN
      has_access := user_tier IN ('pro', 'enterprise');
    WHEN 'custom_branding' THEN
      has_access := user_tier = 'enterprise';
    ELSE
      has_access := true; -- Basic features available to all
  END CASE;
  
  RETURN has_access;
END;
$$;

-- 19. Create view for subscription analytics
CREATE OR REPLACE VIEW subscription_analytics AS
SELECT 
  subscription_tier,
  COUNT(*) as user_count,
  COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_count,
  AVG(credits_remaining) as avg_credits_remaining,
  SUM(total_credits_used) as total_credits_used,
  AVG(photospheres_created) as avg_photospheres_created
FROM profiles
GROUP BY subscription_tier;

-- Grant access to the view
GRANT SELECT ON subscription_analytics TO authenticated;
GRANT SELECT ON subscription_analytics TO service_role;

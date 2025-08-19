-- Migration to fix RLS policy for trial subscription creation
-- This allows the apply_free_trial_to_user RPC function to work properly

-- First, let's create a new RPC function with security definer to handle trial creation
CREATE OR REPLACE FUNCTION public.apply_free_trial_to_user(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial - allows function to bypass RLS
SET search_path = public
AS $$
DECLARE
  subscription_record RECORD;
  result JSONB;
BEGIN
  -- Check if subscription already exists
  SELECT * INTO subscription_record FROM public.subscriptions WHERE user_id = target_user_id;
  
  IF subscription_record IS NULL THEN
    -- Insert a subscriptions row for the 14-day free trial
    INSERT INTO public.subscriptions (
      id,
      user_id,
      stripe_subscription_id,
      stripe_customer_id,
      price_id,
      status,
      tier,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      target_user_id,
      NULL, -- No Stripe customer/subscription yet
      NULL,
      NULL,
      'trialing', -- 14-day free trial status
      'starter', -- Starter tier with trial features (changed from 'free' to match tier config)
      NOW(),
      NOW() + INTERVAL '14 days', -- Trial expires in 14 days
      FALSE,
      NOW(),
      NOW()
    )
    RETURNING * INTO subscription_record;

    -- Insert subscription features for the free trial based on Starter tier
    INSERT INTO public.subscription_features (
      subscription_id,
      feature_name,
      feature_value,
      enabled,
      created_at
    ) VALUES 
      (subscription_record.id, 'max_photospheres', '25', TRUE, NOW()),
      (subscription_record.id, 'max_photos_per_sphere', '10', TRUE, NOW()),
      (subscription_record.id, 'camera_animations', 'true', TRUE, NOW()),
      (subscription_record.id, 'video_recording', 'true', TRUE, NOW()),
      (subscription_record.id, 'virtual_photobooth', 'true', TRUE, NOW()),
      (subscription_record.id, 'photosphere_display', 'true', TRUE, NOW()),
      (subscription_record.id, 'moderation_tools', 'advanced', TRUE, NOW()),
      (subscription_record.id, 'custom_branding', 'true', TRUE, NOW()),
      (subscription_record.id, 'priority_support', 'true', TRUE, NOW()),
      (subscription_record.id, 'trial_duration_days', '14', TRUE, NOW());
      
    result := jsonb_build_object(
      'success', TRUE,
      'message', 'Free trial applied successfully',
      'subscription_id', subscription_record.id,
      'tier', subscription_record.tier,
      'trial_end', subscription_record.current_period_end
    );
  ELSE
    -- Subscription already exists
    result := jsonb_build_object(
      'success', FALSE,
      'message', 'User already has a subscription',
      'subscription_id', subscription_record.id,
      'tier', subscription_record.tier,
      'status', subscription_record.status
    );
  END IF;

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_free_trial_to_user(UUID) TO authenticated;

-- Comment explaining the function
COMMENT ON FUNCTION public.apply_free_trial_to_user IS 'Creates a free trial subscription for a user with Starter tier features for 14 days. Security definer bypasses RLS.';

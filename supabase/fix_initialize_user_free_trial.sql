-- Fix for initialize_user_free_trial function to add search_path parameter
-- This addresses the function_search_path_mutable warning

BEGIN;

-- Drop the function with the correct signature
DROP FUNCTION IF EXISTS public.initialize_user_free_trial(uuid, text);

-- Recreate with proper search_path parameter
CREATE OR REPLACE FUNCTION public.initialize_user_free_trial(user_id uuid, user_email text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
declare
  existing_profile record;
  subscription_record record;
  result json;
begin
  -- Check if profile already exists
  select * into existing_profile from public.profiles where id = user_id;
  
  if existing_profile is null then
    -- Create basic profile (minimal, no subscription fields)
    insert into public.profiles (
      id, 
      email, 
      created_at, 
      updated_at
    )
    values (
      user_id,
      user_email,
      now(),
      now()
    );
  else
    -- Update email if changed
    update public.profiles 
    set email = user_email, updated_at = now()
    where id = user_id;
  end if;

  -- Check if subscription already exists
  select * into subscription_record from public.subscriptions where user_id = user_id;
  
  if subscription_record is null then
    -- Insert a subscriptions row for the 14-day free trial
    -- This is the source of truth for subscription status
    insert into public.subscriptions (
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
    ) values (
      gen_random_uuid(),
      user_id,
      null, -- No Stripe customer/subscription yet
      null,
      null,
      'trialing', -- 14-day free trial status
      'free', -- Free tier with trial features
      now(),
      now() + interval '14 days', -- Trial expires in 14 days
      false,
      now(),
      now()
    )
    returning * into subscription_record;

    -- Insert subscription features for the free trial
    insert into public.subscription_features (
      subscription_id,
      feature_name,
      feature_value,
      enabled,
      created_at
    ) values 
      (subscription_record.id, 'max_photospheres', '5', true, now()),
      (subscription_record.id, 'max_photos_per_sphere', '5', true, now()),
      (subscription_record.id, 'camera_animations', 'true', true, now()),
      (subscription_record.id, 'video_recording', 'true', true, now()),
      (subscription_record.id, 'virtual_photobooth', 'true', true, now()),
      (subscription_record.id, 'photosphere_display', 'true', true, now()),
      (subscription_record.id, 'moderation_tools', 'advanced', true, now()),
      (subscription_record.id, 'custom_branding', 'true', true, now()),
      (subscription_record.id, 'priority_support', 'true', true, now()),
      (subscription_record.id, 'trial_duration_days', '14', true, now());
  end if;

  -- Return success result with subscription info
  result := json_build_object(
    'success', true,
    'profile_created', existing_profile is null,
    'subscription_created', subscription_record is not null,
    'subscription_status', subscription_record.status,
    'subscription_tier', subscription_record.tier,
    'trial_ends', subscription_record.current_period_end
  );

  return result;
exception
  when others then
    -- Return error result
    result := json_build_object(
      'success', false,
      'error', SQLERRM
    );
    return result;
end;
$$;

COMMIT;

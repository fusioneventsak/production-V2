-- Fix missing free trial features for users
-- This migration will find users without a subscription and create free trial subscriptions for them

-- Create a function to fix missing free trials
create or replace function public.fix_missing_free_trials()
returns table (
  user_id uuid,
  email text,
  subscription_created boolean
)
language plpgsql
security definer
as $$
declare
  user_record record;
  subscription_record record;
begin
  -- Find all users with profiles but no subscription
  for user_record in 
    select p.id, p.email 
    from public.profiles p
    left join public.subscriptions s on s.user_id = p.id
    where s.id is null
      and p.email is not null
  loop
    -- Insert a subscriptions row for the 14-day free trial
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
      user_record.id,
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
    
    -- Return the user info and success status
    user_id := user_record.id;
    email := user_record.email;
    subscription_created := true;
    return next;
  end loop;
  
  return;
end;
$$;

-- Also fix the initialize_user_free_trial function to handle null emails better
create or replace function public.initialize_user_free_trial(user_id uuid, user_email text)
returns json
language plpgsql
security definer
as $$
declare
  existing_profile record;
  subscription_record record;
  result json;
  safe_email text;
begin
  -- Ensure we have a valid email (handle null case)
  safe_email := coalesce(user_email, 'user@example.com');
  
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
      safe_email,
      now(),
      now()
    );
  else
    -- Update email if provided and different
    if user_email is not null then
      update public.profiles 
      set email = safe_email, updated_at = now()
      where id = user_id;
    end if;
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

-- Create a function to manually apply free trial to a specific user
create or replace function public.apply_free_trial_to_user(target_user_id uuid)
returns json
language plpgsql
security definer
as $$
declare
  user_record record;
  subscription_record record;
  result json;
begin
  -- Find the user
  select * into user_record from public.profiles where id = target_user_id;
  
  if user_record is null then
    return json_build_object(
      'success', false,
      'error', 'User not found'
    );
  end if;
  
  -- Check if subscription already exists
  select * into subscription_record from public.subscriptions where user_id = target_user_id;
  
  if subscription_record is not null then
    return json_build_object(
      'success', false,
      'error', 'User already has a subscription',
      'subscription_id', subscription_record.id,
      'subscription_status', subscription_record.status,
      'subscription_tier', subscription_record.tier
    );
  end if;
  
  -- Insert a subscriptions row for the 14-day free trial
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
    target_user_id,
    null,
    null,
    null,
    'trialing',
    'free',
    now(),
    now() + interval '14 days',
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
  
  -- Return success result
  return json_build_object(
    'success', true,
    'user_id', target_user_id,
    'email', user_record.email,
    'subscription_id', subscription_record.id,
    'subscription_status', subscription_record.status,
    'subscription_tier', subscription_record.tier,
    'trial_ends', subscription_record.current_period_end
  );
exception
  when others then
    return json_build_object(
      'success', false,
      'error', SQLERRM
    );
end;
$$;

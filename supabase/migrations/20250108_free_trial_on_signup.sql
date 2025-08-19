-- Free trial on signup: 14 days
-- Creates basic profile and inserts subscriptions row as source of truth
-- Frontend reads from subscriptions table for plan/status

create extension if not exists pgcrypto;

-- Function to handle new user signup - focus on subscriptions table
create or replace function public.handle_new_user_free_trial()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Create basic profile (minimal, no subscription fields)
  insert into public.profiles (
    id, 
    email, 
    created_at, 
    updated_at
  )
  values (
    new.id,
    new.email,
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    updated_at = now();

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
    new.id,
    null, -- No Stripe customer/subscription yet
    null,
    null,
    'trialing', -- 14-day free trial status
    'pro', -- Trial gives pro-level features (with frontend restrictions)
    now(),
    now() + interval '14 days',
    false,
    now(),
    now()
  );

  return new;
end;
$$;

-- Recreate trigger cleanly
drop trigger if exists on_auth_user_created_free_trial on auth.users;
create trigger on_auth_user_created_free_trial
  after insert on auth.users
  for each row execute function public.handle_new_user_free_trial();

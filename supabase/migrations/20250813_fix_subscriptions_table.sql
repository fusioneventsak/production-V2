-- Fix subscriptions table to match webhook expectations
-- Add missing columns that the Stripe webhook is trying to write to

ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS quantity integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS cancel_at timestamptz,
ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
ADD COLUMN IF NOT EXISTS ended_at timestamptz,
ADD COLUMN IF NOT EXISTS trial_start timestamptz,
ADD COLUMN IF NOT EXISTS trial_end timestamptz,
ADD COLUMN IF NOT EXISTS credits_per_cycle integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_type text;

-- Add comments for clarity
COMMENT ON COLUMN subscriptions.quantity IS 'Subscription quantity (usually 1)';
COMMENT ON COLUMN subscriptions.cancel_at IS 'Timestamp when subscription will be canceled';
COMMENT ON COLUMN subscriptions.canceled_at IS 'Timestamp when subscription was canceled';
COMMENT ON COLUMN subscriptions.ended_at IS 'Timestamp when subscription ended';
COMMENT ON COLUMN subscriptions.trial_start IS 'Trial period start timestamp';
COMMENT ON COLUMN subscriptions.trial_end IS 'Trial period end timestamp';
COMMENT ON COLUMN subscriptions.credits_per_cycle IS 'Credits allocated per billing cycle';
COMMENT ON COLUMN subscriptions.plan_type IS 'Plan type (starter, pro, enterprise)';

-- Update RLS policies to ensure proper access
-- (existing policies should already cover these new columns)

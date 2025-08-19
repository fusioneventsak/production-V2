-- Update subscription_features table to accommodate new plan structure
-- First, let's alter the table to add new columns

-- Add new columns for the updated feature set
ALTER TABLE subscription_features 
ADD COLUMN IF NOT EXISTS max_photos_per_sphere integer,
ADD COLUMN IF NOT EXISTS camera_animations boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS video_recording boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS virtual_photobooth boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS moderation_tools text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS custom_branding boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS white_label boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS dedicated_support boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_training boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_duration_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS duration_days integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS single_use boolean DEFAULT false;

-- Rename max_photos to maintain backward compatibility but clarify its purpose
COMMENT ON COLUMN subscription_features.max_photos IS 'Total number of photos allowed across all photospheres';
COMMENT ON COLUMN subscription_features.max_photos_per_sphere IS 'Maximum number of photos allowed per individual photosphere';

-- Update existing columns with comments for clarity
COMMENT ON COLUMN subscription_features.max_photospheres IS 'Maximum number of photospheres allowed (-1 for unlimited)';
COMMENT ON COLUMN subscription_features.has_video IS 'Legacy field, use video_recording instead';
COMMENT ON COLUMN subscription_features.has_priority_support IS 'Legacy field, use priority_support instead';
COMMENT ON COLUMN subscription_features.has_white_label IS 'Legacy field, use white_label instead';
COMMENT ON COLUMN subscription_features.has_dedicated_manager IS 'Legacy field, use dedicated_support instead';

-- Add new columns for the updated feature set
ALTER TABLE subscription_features 
ADD COLUMN IF NOT EXISTS priority_support boolean DEFAULT false;

-- Create or replace function to initialize default subscription features
CREATE OR REPLACE FUNCTION initialize_subscription_features()
RETURNS TRIGGER AS $$
BEGIN
    -- Set default features based on subscription tier
    CASE NEW.subscription_tier
        WHEN 'free' THEN
            IF NEW.subscription_status = 'trialing' THEN
                -- Free Trial (14 days)
                INSERT INTO subscription_features (
                    subscription_id, 
                    max_photospheres,
                    max_photos,
                    max_photos_per_sphere,
                    camera_animations,
                    video_recording,
                    virtual_photobooth,
                    moderation_tools,
                    custom_branding,
                    priority_support,
                    trial_duration_days,
                    has_video,
                    has_priority_support,
                    has_white_label,
                    has_dedicated_manager
                ) VALUES (
                    NEW.id,
                    3,
                    1500, -- 3 spheres × 500 photos
                    500,
                    true,
                    true,
                    true,
                    'advanced',
                    true,
                    true,
                    14,
                    true,
                    true,
                    false,
                    false
                );
            ELSE
                -- Regular Free Plan (no trial)
                INSERT INTO subscription_features (
                    subscription_id, 
                    max_photospheres,
                    max_photos,
                    max_photos_per_sphere,
                    camera_animations,
                    video_recording,
                    virtual_photobooth,
                    moderation_tools,
                    custom_branding,
                    priority_support,
                    has_video,
                    has_priority_support,
                    has_white_label,
                    has_dedicated_manager
                ) VALUES (
                    NEW.id,
                    1,
                    100,
                    100,
                    false,
                    false,
                    true,
                    'basic',
                    false,
                    false,
                    false,
                    false,
                    false,
                    false
                );
            END IF;
            
        WHEN 'starter' THEN
            INSERT INTO subscription_features (
                subscription_id, 
                max_photospheres,
                max_photos,
                max_photos_per_sphere,
                camera_animations,
                video_recording,
                virtual_photobooth,
                moderation_tools,
                custom_branding,
                priority_support,
                has_video,
                has_priority_support,
                has_white_label,
                has_dedicated_manager
            ) VALUES (
                NEW.id,
                5,
                1000, -- 5 spheres × 200 photos
                200,
                false,
                false,
                true,
                'basic',
                false,
                false,
                false,
                false,
                false,
                false
            );
            
        WHEN 'pro' THEN
            INSERT INTO subscription_features (
                subscription_id, 
                max_photospheres,
                max_photos,
                max_photos_per_sphere,
                camera_animations,
                video_recording,
                virtual_photobooth,
                moderation_tools,
                custom_branding,
                priority_support,
                has_video,
                has_priority_support,
                has_white_label,
                has_dedicated_manager
            ) VALUES (
                NEW.id,
                20,
                10000, -- 20 spheres × 500 photos
                500,
                true,
                true,
                true,
                'advanced',
                true,
                true,
                true,
                true,
                false,
                false
            );
            
        WHEN 'enterprise' THEN
            INSERT INTO subscription_features (
                subscription_id, 
                max_photospheres,
                max_photos,
                max_photos_per_sphere,
                camera_animations,
                video_recording,
                virtual_photobooth,
                moderation_tools,
                custom_branding,
                priority_support,
                white_label,
                dedicated_support,
                custom_training,
                has_video,
                has_priority_support,
                has_white_label,
                has_dedicated_manager
            ) VALUES (
                NEW.id,
                -1, -- unlimited
                -1, -- unlimited
                -1, -- unlimited
                true,
                true,
                true,
                'enterprise',
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true,
                true
            );
            
        WHEN 'event' THEN
            INSERT INTO subscription_features (
                subscription_id, 
                max_photospheres,
                max_photos,
                max_photos_per_sphere,
                camera_animations,
                video_recording,
                virtual_photobooth,
                moderation_tools,
                custom_branding,
                priority_support,
                duration_days,
                single_use,
                has_video,
                has_priority_support,
                has_white_label,
                has_dedicated_manager
            ) VALUES (
                NEW.id,
                1,
                500,
                500,
                false,
                false,
                true,
                'basic',
                false,
                false,
                30,
                true,
                false,
                false,
                false,
                false
            );
            
        ELSE
            -- Default case (should not happen, but just in case)
            INSERT INTO subscription_features (
                subscription_id, 
                max_photospheres,
                max_photos
            ) VALUES (
                NEW.id,
                1,
                100
            );
    END CASE;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_subscription_created ON subscriptions;

-- Create the trigger
CREATE TRIGGER on_subscription_created
AFTER INSERT ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION initialize_subscription_features();

-- Update existing subscription features for each tier
-- Free tier
UPDATE subscription_features sf
SET 
    max_photos_per_sphere = 100,
    camera_animations = false,
    video_recording = false,
    virtual_photobooth = true,
    moderation_tools = 'basic',
    custom_branding = false,
    priority_support = false
FROM subscriptions s
WHERE sf.subscription_id = s.id
AND s.subscription_tier = 'free'
AND s.subscription_status != 'trialing';

-- Free trial
UPDATE subscription_features sf
SET 
    max_photospheres = 3,
    max_photos = 1500,
    max_photos_per_sphere = 500,
    camera_animations = true,
    video_recording = true,
    virtual_photobooth = true,
    moderation_tools = 'advanced',
    custom_branding = true,
    priority_support = true,
    trial_duration_days = 14
FROM subscriptions s
WHERE sf.subscription_id = s.id
AND s.subscription_tier = 'free'
AND s.subscription_status = 'trialing';

-- Starter tier
UPDATE subscription_features sf
SET 
    max_photospheres = 5,
    max_photos = 1000,
    max_photos_per_sphere = 200,
    camera_animations = false,
    video_recording = false,
    virtual_photobooth = true,
    moderation_tools = 'basic',
    custom_branding = false,
    priority_support = false
FROM subscriptions s
WHERE sf.subscription_id = s.id
AND s.subscription_tier = 'starter';

-- Pro tier
UPDATE subscription_features sf
SET 
    max_photospheres = 20,
    max_photos = 10000,
    max_photos_per_sphere = 500,
    camera_animations = true,
    video_recording = true,
    virtual_photobooth = true,
    moderation_tools = 'advanced',
    custom_branding = true,
    priority_support = true
FROM subscriptions s
WHERE sf.subscription_id = s.id
AND s.subscription_tier = 'pro';

-- Enterprise tier
UPDATE subscription_features sf
SET 
    max_photospheres = -1,
    max_photos = -1,
    max_photos_per_sphere = -1,
    camera_animations = true,
    video_recording = true,
    virtual_photobooth = true,
    moderation_tools = 'enterprise',
    custom_branding = true,
    priority_support = true,
    white_label = true,
    dedicated_support = true,
    custom_training = true
FROM subscriptions s
WHERE sf.subscription_id = s.id
AND s.subscription_tier = 'enterprise';

-- Add the 'event' subscription plan type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_plan_type') THEN
        -- Create the type
        CREATE TYPE subscription_plan_type AS ENUM ('free', 'starter', 'pro', 'enterprise', 'event');
    ELSE
        -- Type exists, check if 'event' is in the enum
        BEGIN
            ALTER TYPE subscription_plan_type ADD VALUE 'event' IF NOT EXISTS;
        EXCEPTION
            WHEN duplicate_object THEN
                -- Value already exists, do nothing
        END;
    END IF;
END$$;

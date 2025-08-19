import { supabase } from './supabase';

export type EffectiveTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface SubscriptionRow {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: string | null;
  tier: EffectiveTier | null;
  price_id: string | null;
  quantity: number | null;
  cancel_at_period_end: boolean | null;
  cancel_at: string | null;
  canceled_at: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string | null;
  updated_at: string | null;
  ended_at: string | null;
  trial_start: string | null;
  trial_end: string | null;
  credits_per_cycle: number | null;
  plan_type: string | null;
}

export interface ProfileSnapshot {
  subscription_tier: EffectiveTier | null;
  subscription_status: string | null;
  subscription_expiry: string | null;
  stripe_customer_id?: string | null;
}

export interface SubscriptionFeature {
  id: string;
  subscription_id: string;
  max_photospheres: number | null;
  max_photos: number | null;
  max_photos_per_sphere: number | null;
  has_video: boolean | null;
  has_priority_support: boolean | null;
  has_white_label: boolean | null;
  has_dedicated_manager: boolean | null;
  camera_animations: boolean | null;
  video_recording: boolean | null;
  virtual_photobooth: boolean | null;
  moderation_tools: 'basic' | 'advanced' | 'enterprise' | null;
  custom_branding: boolean | null;
  duration_days: number | null;
  single_use: boolean | null;
  enabled: boolean;
  // Additional properties that might be used in the store
  priority_support?: boolean | null;
  white_label?: boolean | null;
  dedicated_support?: boolean | null;
  custom_training?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface SubscriptionBundleResult {
  subscription: SubscriptionRow | null;
  features: SubscriptionFeature[];
  profileSnapshot: ProfileSnapshot | null;
  effectiveTier: EffectiveTier;
  effectiveStatus: string;
  periodEnd: string | null;
  // App-level free trial flags (new users, 14 days, only when no active subscription)
  isAppFreeTrial: boolean;
  trialEndsAt: string | null;
}

/**
 * Fetches the canonical subscription row, the user's feature overrides, and the profile snapshot.
 * Derives an effective tier/status prioritizing the canonical subscription when present.
 */
// Which tier features to grant during the app-level 14-day free trial
export const TRIAL_TIER: EffectiveTier = 'starter';

// Duration of the app-level free trial in days
export const TRIAL_DAYS = 0; // Trials disabled

export async function fetchSubscriptionBundle(): Promise<SubscriptionBundleResult> {
  // 1) Auth
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error('Not authenticated');
  const userId = user.id;

  // 2) Fetch subscription first, then features based on subscription_id
  const subRes = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'trialing'])
    .order('current_period_end', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle<SubscriptionRow>();


  // 3) Fetch features and profile in parallel
  const [featRes, profRes] = await Promise.all([
    // Only fetch features if we have a subscription
    subRes.data ? 
      supabase
        .from('subscription_features')
        .select('*')
        .eq('subscription_id', subRes.data.id)
        .maybeSingle<SubscriptionFeature>() :
      Promise.resolve({ data: null, error: null }),
    supabase
      .from('profiles')
      .select('subscription_tier, subscription_status, subscription_expiry, stripe_customer_id')
      .eq('id', userId)
      .maybeSingle<ProfileSnapshot>(),
  ]);

  if (subRes.error) throw subRes.error;
  if (featRes.error) throw featRes.error;
  if (profRes.error && (profRes.error as any).code !== 'PGRST116') throw profRes.error;

  const subscription = subRes.data ?? null;
  const features = featRes.data ? [featRes.data] : [];
  const profileSnapshot = profRes.data ?? null;

  // 3) App-level free trial disabled globally
  const hasActiveSubscription = !!subscription; // We only fetched active/trialing; non-null means active
  const isAppFreeTrial = false;

  // 4) Effective tier/status
  // Ignore Stripe trialing; use app-level free trial only
  const tierFromSub = (subscription?.tier as EffectiveTier | null) || null;
  const tierFromProfile = (profileSnapshot?.subscription_tier as EffectiveTier | null) || null;
  const effectiveTier: EffectiveTier = (tierFromSub || tierFromProfile || 'free');

  const effectiveStatus = hasActiveSubscription
    ? (subscription?.status || 'active')
    : (profileSnapshot?.subscription_status || 'inactive');

  const periodEnd = subscription?.current_period_end || profileSnapshot?.subscription_expiry || null;

  return {
    subscription,
    features,
    profileSnapshot,
    effectiveTier,
    effectiveStatus,
    periodEnd,
    isAppFreeTrial,
    trialEndsAt: null,
  };
}

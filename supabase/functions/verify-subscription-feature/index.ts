import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.21.0';
import { corsHeaders } from '../_shared/cors.ts';

// Define subscription tier features mapping
const TIER_FEATURES = {
  free: {
    max_photospheres: 1,
    max_photos: 100,
    max_photos_per_sphere: 100,
    camera_animations: false,
    video_recording: false,
    virtual_photobooth: true,
    moderation_tools: 'basic',
    custom_branding: false,
    priority_support: false
  },
  starter: {
    max_photospheres: 5,
    max_photos: 1000,
    max_photos_per_sphere: 200,
    camera_animations: true,
    video_recording: false,
    virtual_photobooth: true,
    moderation_tools: 'basic',
    custom_branding: false,
    priority_support: false
  },
  pro: {
    max_photospheres: 20,
    max_photos: 10000,
    max_photos_per_sphere: 500,
    camera_animations: true,
    video_recording: true,
    virtual_photobooth: true,
    moderation_tools: 'advanced',
    custom_branding: true,
    priority_support: true
  },
  enterprise: {
    max_photospheres: -1, // unlimited
    max_photos: -1, // unlimited
    max_photos_per_sphere: -1, // unlimited
    camera_animations: true,
    video_recording: true,
    virtual_photobooth: true,
    moderation_tools: 'enterprise',
    custom_branding: true,
    priority_support: true,
    white_label: true,
    dedicated_support: true,
    custom_training: true
  },
  event: {
    max_photospheres: 1,
    max_photos: 500,
    max_photos_per_sphere: 500,
    camera_animations: false,
    video_recording: false,
    virtual_photobooth: true,
    moderation_tools: 'basic',
    custom_branding: false,
    priority_support: false,
    duration_days: 30,
    single_use: true
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Authenticate user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing Authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse request body
    const { feature, resourceId } = await req.json();
    
    if (!feature) {
      return new Response(
        JSON.stringify({ error: 'Missing feature parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Fetch the user's subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('id, tier, status, current_period_end, trial_end')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (subError && subError.code !== 'PGRST116') { // PGRST116 is "no rows returned" which just means no subscription
      console.error('Error fetching subscription:', subError);
      return new Response(
        JSON.stringify({ error: 'Error fetching subscription data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Default to free tier if no subscription found
    const tier = subscription?.tier || 'free';
    const status = subscription?.status || 'active'; // Assume active for free tier
    
    // Check if subscription is active or in trial period
    const isActive = status === 'active' || status === 'trialing';
    
    if (!isActive) {
      return new Response(
        JSON.stringify({ 
          hasAccess: false, 
          reason: 'inactive_subscription',
          tier,
          status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if subscription has expired
    const now = new Date();
    const periodEnd = subscription?.current_period_end 
      ? new Date(subscription.current_period_end) 
      : null;
    const trialEnd = subscription?.trial_end 
      ? new Date(subscription.trial_end) 
      : null;
    
    if ((status === 'trialing' && trialEnd && now > trialEnd) || 
        (status === 'active' && periodEnd && now > periodEnd)) {
      return new Response(
        JSON.stringify({ 
          hasAccess: false, 
          reason: 'subscription_expired',
          tier,
          status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get features for the subscription tier
    const tierFeatures = TIER_FEATURES[tier as keyof typeof TIER_FEATURES] || TIER_FEATURES.free;
    
    // Special handling for numeric features (limits)
    if (['max_photospheres', 'max_photos', 'max_photos_per_sphere'].includes(feature)) {
      // For unlimited features (-1)
      if (tierFeatures[feature] === -1) {
        return new Response(
          JSON.stringify({ 
            hasAccess: true, 
            limit: -1, // Unlimited
            current: null, // Will be calculated on frontend
            tier,
            status
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For limited features, check current usage
      let current = 0;
      
      if (feature === 'max_photospheres') {
        // Count user's photospheres
        const { count, error: countError } = await supabase
          .from('photospheres')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id);
          
        if (countError) {
          console.error('Error counting photospheres:', countError);
        } else {
          current = count || 0;
        }
      } else if (feature === 'max_photos' && resourceId) {
        // Count photos in specific photosphere
        const { count, error: countError } = await supabase
          .from('photos')
          .select('id', { count: 'exact', head: true })
          .eq('photosphere_id', resourceId);
          
        if (countError) {
          console.error('Error counting photos:', countError);
        } else {
          current = count || 0;
        }
      }
      
      return new Response(
        JSON.stringify({ 
          hasAccess: current < tierFeatures[feature], 
          limit: tierFeatures[feature],
          current,
          tier,
          status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // For boolean or string features
    const hasAccess = Boolean(tierFeatures[feature]);
    
    return new Response(
      JSON.stringify({ 
        hasAccess, 
        tier,
        status,
        value: tierFeatures[feature] // Return the actual value for string features like moderation_tools
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

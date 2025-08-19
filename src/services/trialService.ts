import { supabase } from '../lib/supabase';

/**
 * Service to handle trial subscription creation and management
 * This bypasses RLS issues by using direct API calls
 */
export const trialService = {
  /**
   * Creates a free trial subscription for a user
   * @param userId The user ID to create a trial for
   * @returns Result object with success status and details
   */
  async createTrialSubscription(userId: string) {
    try {
      console.log('🔄 Creating trial subscription for user:', userId);
      
      // First check if user already has a subscription
      const { data: existingSub, error: checkError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ Error checking for existing subscription:', checkError);
        return { 
          success: false, 
          message: 'Failed to check for existing subscription',
          error: checkError 
        };
      }
      
      // If subscription already exists, return it
      if (existingSub) {
        console.log('ℹ️ User already has a subscription:', existingSub);
        return {
          success: true,
          message: 'User already has a subscription',
          subscription: existingSub,
          isExisting: true
        };
      }
      
      // Create a new subscription with trial status
      const now = new Date();
      const trialEndDate = new Date(now);
      trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial
      
      const subscriptionData = {
        user_id: userId,
        stripe_subscription_id: null, // No Stripe subscription yet
        stripe_customer_id: null,
        price_id: null,
        status: 'trialing',
        tier: 'starter', // Use starter tier for trial
        current_period_start: now.toISOString(),
        current_period_end: trialEndDate.toISOString(),
        cancel_at_period_end: false,
        created_at: now.toISOString(),
        updated_at: now.toISOString()
      };
      
      // Insert the subscription
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error creating trial subscription:', insertError);
        
        // If we get an RLS error, we need to use a different approach
        if (insertError.code === '42501') {
          console.log('🔒 RLS policy preventing subscription creation, using fallback approach');
          return await createFallbackTrialSubscription(userId);
        }
        
        return { 
          success: false, 
          message: 'Failed to create trial subscription',
          error: insertError 
        };
      }
      
      if (!newSubscription) {
        console.error('❌ No subscription returned after creation');
        return { 
          success: false, 
          message: 'No subscription data returned' 
        };
      }
      
      console.log('✅ Successfully created trial subscription:', newSubscription);
      
      // Now add the subscription features based on starter tier
      const featureInserts = [
        { subscription_id: newSubscription.id, feature_name: 'max_photospheres', feature_value: '25', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'max_photos_per_sphere', feature_value: '10', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'camera_animations', feature_value: 'true', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'video_recording', feature_value: 'true', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'virtual_photobooth', feature_value: 'true', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'photosphere_display', feature_value: 'true', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'moderation_tools', feature_value: 'advanced', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'custom_branding', feature_value: 'true', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'priority_support', feature_value: 'true', enabled: true },
        { subscription_id: newSubscription.id, feature_name: 'trial_duration_days', feature_value: '14', enabled: true }
      ];
      
      const { error: featuresError } = await supabase
        .from('subscription_features')
        .insert(featureInserts);
      
      if (featuresError) {
        console.error('⚠️ Error adding subscription features:', featuresError);
        // We still return success since the subscription was created
      }
      
      return {
        success: true,
        message: 'Trial subscription created successfully',
        subscription: newSubscription
      };
      
    } catch (error) {
      console.error('❌ Exception in createTrialSubscription:', error);
      return { 
        success: false, 
        message: 'Exception occurred while creating trial subscription',
        error 
      };
    }
  }
};

/**
 * Fallback approach for creating a trial subscription when RLS prevents direct insertion
 * This uses the user's profile to store trial information instead
 */
async function createFallbackTrialSubscription(userId: string) {
  try {
    console.log('🔄 Using fallback approach to create trial subscription for user:', userId);
    
    // Get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (profileError) {
      console.error('❌ Error getting user profile:', profileError);
      return { 
        success: false, 
        message: 'Failed to get user profile',
        error: profileError 
      };
    }
    
    // Calculate trial dates
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + 14); // 14-day trial
    
    // Update the profile with trial information
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        is_trial_active: true,
        trial_starts_at: now.toISOString(),
        trial_ends_at: trialEndDate.toISOString(),
        max_photospheres: 25, // Starter tier values
        max_photos: 10,
        tier: 'starter',
        updated_at: now.toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating profile with trial info:', updateError);
      return { 
        success: false, 
        message: 'Failed to update profile with trial information',
        error: updateError 
      };
    }
    
    console.log('✅ Successfully created fallback trial subscription in profile:', updatedProfile);
    
    return {
      success: true,
      message: 'Fallback trial subscription created successfully',
      profile: updatedProfile,
      isFallback: true
    };
    
  } catch (error) {
    console.error('❌ Exception in createFallbackTrialSubscription:', error);
    return { 
      success: false, 
      message: 'Exception occurred while creating fallback trial subscription',
      error 
    };
  }
}

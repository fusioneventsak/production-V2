import { supabase } from '../lib/supabase';
import { useSubscriptionStore } from '../store/subscriptionStore';

/**
 * This is a simple test script to verify the enhanced subscription feature fetching
 * Run this script with: npx ts-node src/tests/subscriptionFeatureTest.ts
 */

async function testSubscriptionFeatureFetching() {
  console.log('🧪 Testing enhanced subscription feature fetching...');
  
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('❌ No authenticated user found. Please login first.');
    return;
  }
  
  console.log(`👤 Testing with user: ${user.email}`);
  
  // Initialize the subscription store
  const subscriptionStore = useSubscriptionStore.getState();
  
  // Fetch subscription data
  console.log('🔄 Fetching subscription data...');
  await subscriptionStore.fetchSubscription();
  
  // Get the updated state
  const updatedState = useSubscriptionStore.getState();
  
  // Check if subscription was fetched successfully
  if (!updatedState.subscription) {
    console.error('❌ Failed to fetch subscription data.');
    if (updatedState.error) {
      console.error(`Error: ${updatedState.error}`);
    }
    return;
  }
  
  // Log subscription data
  console.log('\n📊 Subscription Data:');
  console.log(`ID: ${updatedState.subscription.id}`);
  console.log(`Tier: ${updatedState.subscription.subscription_tier}`);
  console.log(`Status: ${updatedState.subscription.subscription_status}`);
  
  // Log feature data
  console.log('\n🔑 Feature Data:');
  const features = updatedState.subscription.features;
  
  console.log('\n📏 Core Limits:');
  console.log(`Max PhotoSpheres: ${features.max_photospheres}`);
  console.log(`Max Photos: ${features.max_photos}`);
  console.log(`Max Photos Per Sphere: ${features.max_photos_per_sphere}`);
  
  console.log('\n✨ Features:');
  console.log(`Camera Animations: ${features.camera_animations}`);
  console.log(`Video Recording: ${features.video_recording}`);
  console.log(`Virtual PhotoBooth: ${features.virtual_photobooth}`);
  console.log(`Moderation Tools: ${features.moderation_tools}`);
  console.log(`Custom Branding: ${features.custom_branding}`);
  console.log(`Priority Support: ${features.priority_support}`);
  console.log(`White Label: ${features.white_label}`);
  console.log(`Dedicated Support: ${features.dedicated_support}`);
  console.log(`Custom Training: ${features.custom_training}`);
  
  console.log('\n⏱️ Trial Properties:');
  console.log(`Trial Duration Days: ${features.trial_duration_days}`);
  console.log(`Duration Days: ${features.duration_days}`);
  console.log(`Single Use: ${features.single_use}`);
  
  console.log('\n🔄 Legacy Fields:');
  console.log(`Has Video: ${features.has_video}`);
  console.log(`Has Priority Support: ${features.has_priority_support}`);
  console.log(`Has White Label: ${features.has_white_label}`);
  console.log(`Has Dedicated Manager: ${features.has_dedicated_manager}`);
  
  // Test helper functions
  console.log('\n🧰 Testing Helper Functions:');
  console.log(`Can Create PhotoSphere: ${subscriptionStore.canCreatePhotosphere(0)}`);
  console.log(`Can Upload Photos: ${subscriptionStore.canUploadPhotos('test-sphere-id', 0)}`);
  console.log(`Has Camera Animations: ${subscriptionStore.hasCameraAnimations()}`);
  console.log(`Has Video Recording: ${subscriptionStore.hasVideoRecording()}`);
  console.log(`Has Virtual PhotoBooth: ${subscriptionStore.hasVirtualPhotobooth()}`);
  console.log(`Has Custom Branding: ${subscriptionStore.hasCustomBranding()}`);
  console.log(`Has Priority Support: ${subscriptionStore.hasPrioritySupport()}`);
  console.log(`Has White Label: ${subscriptionStore.hasWhiteLabel()}`);
  console.log(`Has Dedicated Support: ${subscriptionStore.hasDedicatedSupport()}`);
  console.log(`Has Custom Training: ${subscriptionStore.hasCustomTraining()}`);
  console.log(`Is Single Use Event: ${subscriptionStore.isSingleUseEvent()}`);
  console.log(`Get Duration Days: ${subscriptionStore.getDurationDays()}`);
  console.log(`Is Subscription Suspended: ${subscriptionStore.isSubscriptionSuspended()}`);
  
  console.log('\n✅ Test completed!');
}

// Run the test
testSubscriptionFeatureFetching()
  .catch(error => {
    console.error('❌ Test failed with error:', error);
  })
  .finally(() => {
    // Exit after test completes
    setTimeout(() => process.exit(0), 1000);
  });

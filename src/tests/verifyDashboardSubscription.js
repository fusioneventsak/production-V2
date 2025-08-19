// Script to verify dashboard subscription tier display based on subscription_features
// Run this in the browser console after logging in to the dashboard

async function verifyDashboardSubscriptionTier() {
  // Import the subscription store
  const { useSubscriptionStore } = await import('../store/subscriptionStore.js');
  
  console.log('🔍 Verifying dashboard subscription tier display...');
  
  // Get the current subscription state
  const currentState = useSubscriptionStore.getState();
  console.log('Current subscription state:', currentState);
  
  // Force a fresh fetch of subscription data
  console.log('Fetching fresh subscription data...');
  await useSubscriptionStore.getState().fetchSubscription(true); // Force refresh
  
  // Get the updated state
  const updatedState = useSubscriptionStore.getState();
  console.log('Updated subscription state:', updatedState);
  
  if (!updatedState.subscription) {
    console.error('❌ No subscription data found');
    return;
  }
  
  // Log the subscription details
  console.log('📊 Subscription Details:');
  console.log(`Tier from database: ${updatedState.subscription.subscription_tier}`);
  console.log(`Status: ${updatedState.subscription.subscription_status}`);
  
  // Log the features that determine the tier
  console.log('🔑 Feature Details that determine tier:');
  const features = updatedState.subscription.features;
  
  console.log('Core Limits:');
  console.log(`- Max PhotoSpheres: ${features.max_photospheres}`);
  console.log(`- Max Photos: ${features.max_photos}`);
  console.log(`- Max Photos Per Sphere: ${features.max_photos_per_sphere}`);
  
  console.log('Premium Features:');
  console.log(`- Camera Animations: ${features.camera_animations}`);
  console.log(`- Video Recording: ${features.video_recording}`);
  console.log(`- White Label: ${features.white_label || features.has_white_label}`);
  console.log(`- Dedicated Support: ${features.dedicated_support || features.has_dedicated_manager}`);
  console.log(`- Single Use: ${features.single_use}`);
  console.log(`- Duration Days: ${features.duration_days}`);
  
  // Determine expected tier based on features
  let expectedTier = 'free';
  
  if (features.white_label || features.dedicated_support || features.has_white_label || features.has_dedicated_manager) {
    expectedTier = 'enterprise';
  } else if ((features.max_photospheres >= 20 || features.camera_animations || features.video_recording) && 
             (features.max_photos >= 500 || features.max_photos_per_sphere >= 500)) {
    expectedTier = 'pro';
  } else if ((features.max_photospheres >= 5 && features.max_photospheres < 20) && 
             (features.max_photos >= 200 || features.max_photos_per_sphere >= 200)) {
    expectedTier = 'starter';
  } else if (features.single_use && features.duration_days) {
    expectedTier = 'event';
  }
  
  console.log(`Expected tier based on features: ${expectedTier}`);
  console.log(`Actual tier displayed: ${updatedState.subscription.subscription_tier}`);
  
  if (expectedTier === updatedState.subscription.subscription_tier) {
    console.log('✅ Tier display is correct!');
  } else {
    console.error('❌ Tier display mismatch!');
  }
  
  // Check if the dashboard UI is displaying the correct tier
  const tierElement = document.querySelector('.subscription-status .capitalize');
  if (tierElement) {
    console.log(`Tier displayed in UI: ${tierElement.textContent}`);
    if (tierElement.textContent.toLowerCase() === updatedState.subscription.subscription_tier) {
      console.log('✅ UI tier display is correct!');
    } else {
      console.error('❌ UI tier display mismatch!');
    }
  } else {
    console.warn('⚠️ Could not find tier element in UI');
  }
  
  console.log('✅ Verification complete!');
}

// Run the verification
verifyDashboardSubscriptionTier().catch(error => {
  console.error('❌ Verification failed:', error);
});

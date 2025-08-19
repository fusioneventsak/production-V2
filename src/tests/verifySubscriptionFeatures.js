// Comprehensive script to verify subscription features are correctly fetched and displayed
// Run this in the browser console after logging in

async function verifySubscriptionFeatures() {
  // Import the subscription store and required components
  const { useSubscriptionStore } = await import('../store/subscriptionStore.js');
  
  console.log('🔍 Verifying subscription features...');
  console.log('============================================');
  
  // Get the current subscription state
  const currentState = useSubscriptionStore.getState();
  console.log('Current subscription state:', currentState);
  
  // Force a fresh fetch of subscription data
  console.log('Fetching fresh subscription data...');
  currentState.invalidateCache(); // Clear cache
  await useSubscriptionStore.getState().fetchSubscription(); // Force refresh
  
  // Get the updated state
  const updatedState = useSubscriptionStore.getState();
  console.log('Updated subscription state:', updatedState);
  
  if (!updatedState.subscription) {
    console.error('❌ No subscription data found');
    return;
  }
  
  // Log the subscription details
  console.log('📊 Subscription Details:');
  console.log(`Tier: ${updatedState.subscription.subscription_tier}`);
  console.log(`Status: ${updatedState.subscription.subscription_status}`);
  console.log(`ID: ${updatedState.subscription.id}`);
  
  // Log the features
  console.log('🔑 Feature Details:');
  const features = updatedState.subscription.features;
  
  console.log('Core Limits:');
  console.log(`- Max PhotoSpheres: ${features.max_photospheres}`);
  console.log(`- Max Photos: ${features.max_photos}`);
  console.log(`- Max Photos Per Sphere: ${features.max_photos_per_sphere}`);
  
  console.log('Features:');
  console.log(`- Camera Animations: ${features.camera_animations}`);
  console.log(`- Video Recording: ${features.video_recording}`);
  console.log(`- Virtual PhotoBooth: ${features.virtual_photobooth}`);
  console.log(`- Moderation Tools: ${features.moderation_tools}`);
  console.log(`- Custom Branding: ${features.custom_branding}`);
  console.log(`- Priority Support: ${features.priority_support}`);
  console.log(`- White Label: ${features.white_label}`);
  console.log(`- Dedicated Support: ${features.dedicated_support}`);
  console.log(`- Custom Training: ${features.custom_training}`);
  
  console.log('Legacy Fields:');
  console.log(`- Has Video: ${features.has_video}`);
  console.log(`- Has Priority Support: ${features.has_priority_support}`);
  console.log(`- Has White Label: ${features.has_white_label}`);
  console.log(`- Has Dedicated Manager: ${features.has_dedicated_manager}`);
  
  // Test helper functions
  console.log('Helper Functions:');
  const store = useSubscriptionStore.getState();
  console.log(`- Can Create PhotoSphere: ${store.canCreatePhotosphere(0)}`);
  console.log(`- Has Camera Animations: ${store.hasCameraAnimations()}`);
  console.log(`- Has Video Recording: ${store.hasVideoRecording()}`);
  console.log(`- Has Virtual PhotoBooth: ${store.hasVirtualPhotobooth()}`);
  console.log(`- Has Custom Branding: ${store.hasCustomBranding()}`);
  console.log(`- Has Priority Support: ${store.hasPrioritySupport()}`);
  console.log(`- Has White Label: ${store.hasWhiteLabel()}`);
  console.log(`- Has Dedicated Support: ${store.hasDedicatedSupport()}`);
  console.log(`- Has Custom Training: ${store.hasCustomTraining()}`);
  console.log(`- Is Single Use Event: ${store.isSingleUseEvent()}`);
  
  // Verify database consistency
  await verifyDatabaseConsistency(updatedState.subscription.id);
  
  // Verify UI components
  await verifyUIComponents(updatedState.subscription);
  
  // Test subscription cache invalidation
  await testSubscriptionCacheInvalidation();
  
  console.log('✅ Verification complete!');
}

async function verifyDatabaseConsistency(subscriptionId) {
  console.log('\n🔍 Verifying database consistency...');
  
  // Import supabase
  const { supabase } = await import('../lib/supabase.js');
  
  // Fetch subscription from database
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('id, tier, status')
    .eq('id', subscriptionId)
    .single();
  
  if (subError) {
    console.error('❌ Error fetching subscription:', subError);
    return;
  }
  
  console.log('Subscription from database:', subscription);
  
  // Fetch subscription features from database
  const { data: features, error: featError } = await supabase
    .from('subscription_features')
    .select('*')
    .eq('subscription_id', subscriptionId)
    .single();
  
  if (featError) {
    console.error('❌ Error fetching subscription features:', featError);
    return;
  }
  
  console.log('Subscription features from database:', features);
  
  // Check if subscription_features record exists
  if (!features) {
    console.error('❌ No subscription_features record found for subscription ID:', subscriptionId);
  } else {
    console.log('✅ subscription_features record exists');
  }
  
  // Verify foreign key constraint
  const { count, error: countError } = await supabase
    .from('subscription_features')
    .select('*', { count: 'exact', head: true })
    .eq('subscription_id', subscriptionId);
  
  if (countError) {
    console.error('❌ Error checking foreign key constraint:', countError);
  } else {
    console.log(`Foreign key check: ${count} feature records found for subscription ID ${subscriptionId}`);
  }
}

async function verifyUIComponents(subscription) {
  console.log('\n🔍 Verifying UI components...');
  
  // Verify SubscriptionManager component
  await verifySubscriptionManager(subscription);
  
  // Verify SubscriptionStatus component
  await verifySubscriptionStatus(subscription);
  
  // Verify UsageMeter component
  await verifyUsageMeter(subscription);
  
  // Verify DowngradeButton component
  await verifyDowngradeButton(subscription);
  
  // Verify SubscriptionFeatures component
  await verifySubscriptionFeatures(subscription);
  
  console.log('✅ UI component verification complete!');
}

async function verifySubscriptionManager(subscription) {
  console.log('\n🔍 Verifying SubscriptionManager component...');
  
  // Find the SubscriptionManager component
  const managerElement = document.querySelector('.space-y-4');
  
  if (!managerElement) {
    console.warn('⚠️ Could not find SubscriptionManager element');
    return;
  }
  
  const managerText = managerElement.textContent;
  console.log('SubscriptionManager text:', managerText);
  
  // Check if subscription tier is displayed correctly
  const tierDisplayed = managerText.includes(subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1));
  console.log(`Tier displayed correctly: ${tierDisplayed}`);
  
  // Check if feature limits are displayed correctly
  const limitsDisplayed = managerText.includes(subscription.features.max_photospheres.toString()) && 
                         managerText.includes(subscription.features.max_photos.toString());
  console.log(`Limits displayed correctly: ${limitsDisplayed}`);
  
  // Check if features are displayed correctly
  const { useSubscriptionStore } = await import('../store/subscriptionStore.js');
  const store = useSubscriptionStore.getState();
  
  // Check camera animations display
  const cameraAnimationsCorrect = 
    (store.hasCameraAnimations() && managerText.includes('Camera Animations')) || 
    (!store.hasCameraAnimations() && !managerText.includes('Camera Animations enabled'));
  console.log(`Camera animations displayed correctly: ${cameraAnimationsCorrect}`);
  
  // Check video recording display
  const videoRecordingCorrect = 
    (store.hasVideoRecording() && managerText.includes('Video Recording')) || 
    (!store.hasVideoRecording() && !managerText.includes('Video Recording enabled'));
  console.log(`Video recording displayed correctly: ${videoRecordingCorrect}`);
}

async function verifySubscriptionStatus(subscription) {
  console.log('\n🔍 Verifying SubscriptionStatus component...');
  
  // Find the subscription status element
  const statusElement = document.querySelector('.bg-gray-800\/50.rounded-lg.p-4');
  
  if (!statusElement) {
    console.warn('⚠️ Could not find SubscriptionStatus element');
    return;
  }
  
  const statusText = statusElement.textContent;
  console.log('SubscriptionStatus text:', statusText);
  
  // Check if tier is displayed correctly
  const tierDisplayed = statusText.includes(subscription.subscription_tier);
  console.log(`Tier displayed correctly: ${tierDisplayed}`);
  
  // Check if status is displayed correctly
  const statusDisplayed = statusText.includes(subscription.subscription_status);
  console.log(`Status displayed correctly: ${statusDisplayed}`);
  
  // Check if trial status is displayed correctly if applicable
  if (subscription.subscription_status === 'trialing') {
    const trialDisplayed = statusText.includes('Trial');
    console.log(`Trial status displayed correctly: ${trialDisplayed}`);
    
    // Check if trial days remaining is displayed
    if (subscription.features.trial_duration_days) {
      const trialDaysDisplayed = statusText.includes('days');
      console.log(`Trial days remaining displayed: ${trialDaysDisplayed}`);
    }
  }
  
  // Check if billing info is displayed correctly
  if (subscription.current_period_end) {
    const billingDisplayed = statusText.includes('Next billing') || statusText.includes('Renews');
    console.log(`Billing info displayed: ${billingDisplayed}`);
  }
  
  // Check if cancellation status is displayed correctly
  if (subscription.cancel_at_period_end) {
    const cancellationDisplayed = statusText.includes('Cancel') || statusText.includes('End');
    console.log(`Cancellation status displayed: ${cancellationDisplayed}`);
  }
}

async function verifyUsageMeter(subscription) {
  console.log('\n🔍 Verifying UsageMeter component...');
  
  // Find UsageMeter components
  const usageMeterElements = document.querySelectorAll('.bg-gray-800\/50.rounded-lg.p-4');
  let photospheresMeter = null;
  let photosMeter = null;
  
  for (const element of usageMeterElements) {
    const text = element.textContent;
    if (text.includes('PhotoSpheres')) {
      photospheresMeter = element;
    } else if (text.includes('Photos') && !text.includes('PhotoSpheres')) {
      photosMeter = element;
    }
  }
  
  if (!photospheresMeter) {
    console.warn('⚠️ Could not find PhotoSpheres UsageMeter');
  } else {
    const meterText = photospheresMeter.textContent;
    console.log('PhotoSpheres UsageMeter text:', meterText);
    
    // Check if limit is displayed correctly
    const limitDisplayed = meterText.includes(subscription.features.max_photospheres.toString()) || 
                          (subscription.features.max_photospheres === -1 && meterText.includes('Unlimited'));
    console.log(`PhotoSpheres limit displayed correctly: ${limitDisplayed}`);
    
    // Check if progress bar exists
    const progressBar = photospheresMeter.querySelector('.rounded-full');
    console.log(`PhotoSpheres progress bar exists: ${!!progressBar}`);
  }
  
  if (!photosMeter) {
    console.warn('⚠️ Could not find Photos UsageMeter');
  } else {
    const meterText = photosMeter.textContent;
    console.log('Photos UsageMeter text:', meterText);
    
    // Check if limit is displayed correctly
    const limitDisplayed = meterText.includes(subscription.features.max_photos.toString()) || 
                          (subscription.features.max_photos === -1 && meterText.includes('Unlimited'));
    console.log(`Photos limit displayed correctly: ${limitDisplayed}`);
    
    // Check if progress bar exists
    const progressBar = photosMeter.querySelector('.rounded-full');
    console.log(`Photos progress bar exists: ${!!progressBar}`);
  }
}

async function verifyDowngradeButton(subscription) {
  console.log('\n🔍 Verifying DowngradeButton component...');
  
  // Only check for downgrade button if user has a paid subscription
  if (subscription.subscription_tier === 'free') {
    console.log('User has free tier, no downgrade button expected');
    return;
  }
  
  // Find the downgrade button
  const downgradeButton = Array.from(document.querySelectorAll('button')).find(button => 
    button.textContent.includes('Downgrade to Free'));
  
  if (!downgradeButton) {
    console.warn('⚠️ Could not find DowngradeButton for paid subscription');
    return;
  }
  
  console.log('DowngradeButton found:', downgradeButton.textContent);
  console.log('DowngradeButton is visible for paid subscription: ✅');
  
  // Check if button is enabled
  const isDisabled = downgradeButton.disabled;
  console.log(`DowngradeButton is ${isDisabled ? 'disabled' : 'enabled'}`);
}

async function verifySubscriptionFeatures(subscription) {
  console.log('\n🔍 Verifying SubscriptionFeatures component...');
  
  // Find the SubscriptionFeatures component (features grid)
  const featuresGrid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.gap-3');
  
  if (!featuresGrid) {
    console.warn('⚠️ Could not find SubscriptionFeatures grid');
    return;
  }
  
  const featureItems = featuresGrid.querySelectorAll('div[class*="flex items-center p-3 rounded-lg border"]');
  console.log(`Found ${featureItems.length} feature items`);
  
  // Import the store to check feature status
  const { useSubscriptionStore } = await import('../store/subscriptionStore.js');
  const store = useSubscriptionStore.getState();
  
  // Map of feature names to their helper functions
  const featureChecks = {
    'Camera Animations': store.hasCameraAnimations(),
    'Video Recording': store.hasVideoRecording(),
    'Virtual Photobooth': store.hasVirtualPhotobooth(),
    'Custom Branding': store.hasCustomBranding(),
    'Priority Support': store.hasPrioritySupport(),
    'White Label': store.hasWhiteLabel(),
    'Dedicated Support': store.hasDedicatedSupport(),
    'Custom Training': store.hasCustomTraining()
  };
  
  // Check each feature item
  for (const item of featureItems) {
    const text = item.textContent;
    const featureName = Object.keys(featureChecks).find(name => text.includes(name));
    
    if (featureName) {
      const expectedEnabled = featureChecks[featureName];
      const actualEnabled = item.classList.contains('bg-green-900/20');
      console.log(`Feature "${featureName}": Expected ${expectedEnabled}, Actual ${actualEnabled}, Match: ${expectedEnabled === actualEnabled ? '✅' : '❌'}`);
    }
  }
}

async function testSubscriptionCacheInvalidation() {
  console.log('\n🔍 Testing subscription cache invalidation...');
  
  // Import required modules
  const { useSubscriptionStore } = await import('../store/subscriptionStore.js');
  const { supabase } = await import('../lib/supabase.js');
  
  // Get current timestamp for cache tracking
  const initialLastFetchedAt = useSubscriptionStore.getState().lastFetchedAt;
  console.log(`Initial lastFetchedAt: ${new Date(initialLastFetchedAt).toISOString()}`);
  
  // Test invalidateCache function
  console.log('Testing invalidateCache function...');
  useSubscriptionStore.getState().invalidateCache();
  const afterInvalidation = useSubscriptionStore.getState().lastFetchedAt;
  console.log(`After invalidation lastFetchedAt: ${afterInvalidation}`);
  console.log(`Cache was invalidated: ${afterInvalidation === 0 ? '✅' : '❌'}`);
  
  // Test cache refresh after invalidation
  console.log('Testing cache refresh after invalidation...');
  await useSubscriptionStore.getState().fetchSubscription();
  const afterRefresh = useSubscriptionStore.getState().lastFetchedAt;
  console.log(`After refresh lastFetchedAt: ${new Date(afterRefresh).toISOString()}`);
  console.log(`Cache was refreshed: ${afterRefresh > 0 ? '✅' : '❌'}`);
  
  // Test broadcast channel functionality (simulate only)
  console.log('\nSimulating broadcast channel invalidation event...');
  console.log('Note: This is a simulation only. In a real environment, the event would come from Supabase.');
  
  // Create a mock payload
  const mockPayload = {
    payload: {
      user_id: useSubscriptionStore.getState().subscription?.user_id || 'current-user'
    }
  };
  
  // Log the expected behavior
  console.log('Expected behavior when receiving a real broadcast event:');
  console.log('1. SubscriptionCacheListener would receive the event');
  console.log('2. invalidateCache() would be called');
  console.log('3. fetchSubscription() would be called automatically');
  console.log('4. UI would update with fresh subscription data');
  
  console.log('\n✅ Cache invalidation test complete!');
}

// Run the verification
verifySubscriptionFeatures().catch(error => {
  console.error('❌ Verification failed:', error);
});

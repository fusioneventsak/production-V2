import React, { useEffect } from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { supabase } from '../../lib/supabase';

/**
 * Component that listens for subscription cache invalidation events
 * and refreshes the subscription data when needed.
 * 
 * This component should be mounted high in the component tree,
 * ideally in the main App component or a layout wrapper.
 */
const SubscriptionCacheListener: React.FC = () => {
  const { fetchSubscription, invalidateCache } = useSubscriptionStore();

  useEffect(() => {
    // Set up realtime subscription to the subscription_cache_invalidations channel
    const channel = supabase
      .channel('subscription_cache_invalidations')
      .on('broadcast', { event: 'invalidate_subscription_cache' }, (payload) => {
        console.log('Received subscription cache invalidation event:', payload);
        
        // Check if this invalidation is for the current user
        if (payload.payload?.user_id) {
          // We'll let the store handle the user ID check
          invalidateCache();
        } else {
          // If no specific user ID, refresh for all users
          // This is a global invalidation (rare)
          fetchSubscription();
        }
      })
      .subscribe((status) => {
        console.log('Subscription cache invalidation channel status:', status);
      });

    // Clean up the subscription when the component unmounts
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSubscription, invalidateCache]);

  // This component doesn't render anything
  return null;
};

export default SubscriptionCacheListener;

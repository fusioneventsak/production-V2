import React, { useEffect, useState } from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { useCollageStore } from '../../store/collageStore';
import { supabase } from '../../lib/supabase';
import { Clock, Image, Layout, Calendar, Loader2, HelpCircle, AlertTriangle } from 'lucide-react';
import { Tooltip } from '../../components/ui/tooltip';
import { FREE_TRIAL_CONFIG } from '../../config/subscription';

interface TrialUsageStatsProps {
  className?: string;
}

const TrialUsageStats: React.FC<TrialUsageStatsProps> = ({ className = '' }) => {
  const { 
    subscription, 
    getTrialDaysRemaining,
    getTrialEndDate
  } = useSubscriptionStore();
  
  const { collages } = useCollageStore();
  const [totalPhotos, setTotalPhotos] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch total photos count across all collages
  useEffect(() => {
    const fetchTotalPhotos = async () => {
      if (!collages.length) return;
      
      setLoading(true);
      try {
        // Get the count of photos for each collage
        const { count, error } = await supabase
          .from('photos')
          .select('*', { count: 'exact', head: true })
          .in('collage_id', collages.map(collage => collage.id));
        
        if (error) {
          console.error('Error fetching photo count:', error);
          return;
        }
        
        setTotalPhotos(count || 0);
      } catch (error) {
        console.error('Error in fetchTotalPhotos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTotalPhotos();
  }, [collages]);

  // Only show if user is in trial period
  if (!subscription || subscription.subscription_status !== 'trialing') {
    return null;
  }
  
  // Use FREE_TRIAL_CONFIG as fallback if subscription features are incomplete
  const trialFeatures = subscription.features || FREE_TRIAL_CONFIG;
  
  // Log subscription data for debugging
  console.log('Trial subscription data:', subscription);

  const daysRemaining = getTrialDaysRemaining();
  const trialEndDate = getTrialEndDate();
  
  // Calculate trial duration (use trial_duration_days from features if available)
  const trialStartDate = subscription.trial_start ? new Date(subscription.trial_start) : null;
  const totalTrialDays = trialFeatures.trial_duration_days || 
    (trialStartDate && trialEndDate ? 
      Math.ceil((trialEndDate.getTime() - trialStartDate.getTime()) / (1000 * 60 * 60 * 24)) : 
      14);
  
  // Calculate days used
  const daysUsed = totalTrialDays - daysRemaining;
  
  // Calculate percentage used
  const daysPercentage = Math.min(100, Math.max(0, (daysUsed / totalTrialDays) * 100));
  
  // Calculate PhotoSphere usage
  const maxPhotospheres = trialFeatures.max_photospheres;
  const photosphereUsage = collages.length;
  const photospherePercentage = maxPhotospheres > 0 && maxPhotospheres !== -1 ? 
    Math.min(100, Math.max(0, (photosphereUsage / maxPhotospheres) * 100)) : 
    0; // If maxPhotospheres is -1 (unlimited), percentage is 0
  const photospheresRemaining = maxPhotospheres === -1 ? 'Unlimited' : Math.max(0, maxPhotospheres - photosphereUsage);
  
  // Calculate photos usage from our fetched data
  const maxPhotos = trialFeatures.max_photos;
  const photoUsage = totalPhotos;
  const photoPercentage = maxPhotos > 0 && maxPhotos !== -1 ? 
    Math.min(100, Math.max(0, (photoUsage / maxPhotos) * 100)) : 
    0; // If maxPhotos is -1 (unlimited), percentage is 0
  const photosRemaining = maxPhotos === -1 ? 'Unlimited' : Math.max(0, maxPhotos - photoUsage);
  
  // Get photos per sphere limit
  const maxPhotosPerSphere = trialFeatures.max_photos_per_sphere;

  return (
    <div className={`bg-gray-800/50 rounded-lg p-5 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Trial Usage</h3>
        <div className="text-sm bg-blue-900/40 text-blue-300 px-3 py-1 rounded-full border border-blue-700/50">
          {subscription.subscription_tier === 'event' ? 'Event Plan' : 
           subscription.subscription_tier === 'starter' ? 'Starter Trial' : 
           subscription.subscription_tier === 'pro' ? 'Pro Trial' : 
           subscription.subscription_tier === 'enterprise' ? 'Enterprise Trial' : 
           'Free Trial'}
        </div>
      </div>
      
      {/* Trial Timeline */}
      <div className="mb-6 bg-gray-900/50 rounded-lg p-3 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-2 text-blue-400" />
            <h4 className="text-sm font-medium text-white">Trial Timeline</h4>
          </div>
          <div className="text-sm text-blue-300">{daysRemaining} days remaining</div>
        </div>
        
        <div className="flex items-center text-xs text-gray-400 mb-2">
          <div>Start</div>
          <div className="flex-grow mx-2 text-center">Today</div>
          <div>{trialEndDate?.toLocaleDateString() || 'End'}</div>
        </div>
        
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500" 
            style={{ width: `${daysPercentage}%` }}
          ></div>
        </div>
        
        <div className="text-xs text-gray-400 mt-2">
          Day {daysUsed} of {totalTrialDays} • {Math.round(daysPercentage)}% complete
        </div>
      </div>
      
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-white flex items-center">
          <Layout className="w-4 h-4 mr-2 text-amber-400" />
          Resource Usage
        </h4>
        <Tooltip 
          content={
            <p className="text-xs">These are the resources included in your free trial. Once your trial ends, you'll need to upgrade to continue using PhotoSphere with these limits.</p>
          } 
          side="top" 
          className="bg-gray-900 border-gray-700 text-white p-3 max-w-xs"
        >
          <button className="text-gray-400 hover:text-gray-300">
            <HelpCircle className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
      
      <div className="space-y-4">
        
        {/* PhotoSpheres Usage */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Layout className="w-4 h-4 mr-2 text-purple-400" />
              <h5 className="text-sm font-medium text-white">PhotoSpheres</h5>
            </div>
            <div className="text-xs text-gray-400">
              {photosphereUsage} of {maxPhotospheres === -1 ? '∞' : maxPhotospheres}
            </div>
          </div>
          
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-purple-500" 
              style={{ width: `${photospherePercentage}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between text-xs">
            <div className="text-gray-400">Used: {photosphereUsage}</div>
            <div className="text-gray-400">
              Remaining: {photospheresRemaining === 'Unlimited' ? '∞' : photospheresRemaining}
            </div>
          </div>
        </div>
        
        {/* Photos Per Sphere */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center">
              <Image className="w-4 h-4 mr-2 text-emerald-400" />
              <h5 className="text-sm font-medium text-white">Photos Per Sphere</h5>
            </div>
            <div className="text-xs text-gray-400">
              {maxPhotosPerSphere === -1 ? '∞' : maxPhotosPerSphere} max
            </div>
          </div>
        </div>
        
        {/* Total Photos Usage */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <Image className="w-4 h-4 mr-2 text-blue-400" />
              <h5 className="text-sm font-medium text-white">Photos</h5>
            </div>
            <div className="text-xs text-gray-400">
              {photoUsage} of {maxPhotos === -1 ? '∞' : maxPhotos}
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-2">
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
              <span className="text-xs text-gray-400 ml-2">Loading...</span>
            </div>
          ) : (
            <>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden mb-2">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${photoPercentage}%` }}
                ></div>
              </div>
              
              <div className="flex justify-between text-xs">
                <div className="text-gray-400">Used: {photoUsage}</div>
                <div className="text-gray-400">
                  Remaining: {photosRemaining === 'Unlimited' ? '∞' : photosRemaining}
                </div>
              </div>
            </>
          )}
          
        </div>
        
        {/* Plan Features */}
        <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-800 mt-4">
          <h4 className="text-sm font-medium text-white mb-3">Plan Features:</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {trialFeatures.video_recording && (
              <div className="flex items-center text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                Video Recording
              </div>
            )}
            {trialFeatures.virtual_photobooth && (
              <div className="flex items-center text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                Virtual Photobooth
              </div>
            )}
            {trialFeatures.custom_branding && (
              <div className="flex items-center text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                Custom Branding
              </div>
            )}
            {trialFeatures.priority_support && (
              <div className="flex items-center text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                Priority Support
              </div>
            )}
            {trialFeatures.white_label && (
              <div className="flex items-center text-emerald-300">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5"></span>
                White Label
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Trial End Information */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="flex flex-col space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm">
              <Clock className="w-4 h-4 mr-2 text-amber-400" />
              <span className="text-amber-300">
                Trial ends on {trialEndDate?.toLocaleDateString() || 'Unknown'}
              </span>
            </div>
            
            <a 
              href="/dashboard/profile" 
              className="text-xs bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center"
            >
              Upgrade Now
            </a>
          </div>
          
          {/* Usage recommendation */}
          {(daysRemaining < 5 || photospherePercentage > 80 || photoPercentage > 80) && (
            <div className="flex items-start p-3 bg-amber-900/20 border border-amber-800/30 rounded-lg text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-amber-200 font-medium">Usage Alert</p>
                <p className="text-amber-100/80 mt-1">
                  {daysRemaining < 5 ? (
                    <>Your trial is ending soon. To avoid service interruption, please upgrade your plan.</>  
                  ) : photospherePercentage > 80 ? (
                    <>You're approaching your PhotoSphere limit. Consider upgrading to continue creating new PhotoSpheres.</>  
                  ) : (
                    <>You're approaching your photo limit. Consider upgrading to add more photos to your PhotoSpheres.</>  
                  )}
                </p>
              </div>
            </div>
          )}
          
          {/* Single-use event plan notice */}
          {trialFeatures.single_use && (
            <div className="flex items-start p-3 mt-3 bg-blue-900/20 border border-blue-800/30 rounded-lg text-xs">
              <HelpCircle className="w-4 h-4 text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-200 font-medium">Event Plan</p>
                <p className="text-blue-100/80 mt-1">
                  This is a single-use event plan valid for {trialFeatures.duration_days || 30} days. 
                  You can create 1 PhotoSphere with up to {trialFeatures.max_photos_per_sphere} photos.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrialUsageStats;

import React from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { Clock, AlertTriangle, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FreeTrialBannerProps {
  className?: string;
}

const FreeTrialBanner: React.FC<FreeTrialBannerProps> = ({ className = '' }) => {
  const { 
    subscription, 
    getTrialDaysRemaining, 
    getTrialEndDate 
  } = useSubscriptionStore();

  // Only show banner if user is in an active trial period
  // We now support trials for all subscription tiers
  if (!subscription || subscription.subscription_status !== 'trialing') {
    return null;
  }

  const daysRemaining = getTrialDaysRemaining();
  const trialEndDate = getTrialEndDate();
  const formattedEndDate = trialEndDate ? trialEndDate.toLocaleDateString() : 'Unknown';
  
  // Determine urgency level based on days remaining
  const isUrgent = daysRemaining <= 3;
  const isWarning = daysRemaining <= 7 && !isUrgent;
  
  // Get the current trial plan name
  const trialPlan = subscription.subscription_tier.charAt(0).toUpperCase() + subscription.subscription_tier.slice(1);
  
  // Get trial duration from features or default to 14 days
  const trialDuration = subscription.features.trial_duration_days || 14;

  return (
    <div 
      className={`
        rounded-lg p-4 border transition-all
        ${isUrgent 
          ? 'bg-red-900/30 border-red-700 text-red-100' 
          : isWarning 
            ? 'bg-amber-900/30 border-amber-700 text-amber-100'
            : 'bg-blue-900/30 border-blue-700 text-blue-100'
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isUrgent ? (
            <AlertTriangle className="w-5 h-5 mr-2" />
          ) : (
            <Clock className="w-5 h-5 mr-2" />
          )}
          <div>
            <h3 className="font-medium">
              {isUrgent 
                ? `${trialPlan} Trial Ending Soon!` 
                : isWarning 
                  ? `${trialPlan} Trial - Limited Time Remaining`
                  : `${trialPlan} Trial Active`
              }
            </h3>
            <p className="text-sm opacity-90">
              {daysRemaining === 0 
                ? `Your ${trialPlan.toLowerCase()} trial ends today! Upgrade to keep all features.` 
                : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining (ends ${formattedEndDate})`
              }
            </p>
          </div>
        </div>
        
        <Link 
          to="/dashboard/profile" 
          className={`
            px-4 py-2 rounded-lg text-sm font-medium flex items-center
            ${isUrgent 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : isWarning 
                ? 'bg-amber-600 hover:bg-amber-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }
            transition-colors
          `}
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade Now
        </Link>
      </div>
      
      <div className="mt-3">
        <div className="w-full bg-black/30 rounded-full h-1.5">
          <div 
            className={`h-1.5 rounded-full ${
              isUrgent 
                ? 'bg-red-500' 
                : isWarning 
                  ? 'bg-amber-500'
                  : 'bg-blue-500'
            }`}
            style={{ width: `${Math.max(0, Math.min(100, (daysRemaining / trialDuration) * 100))}%` }}
          ></div>
        </div>
      </div>
      
      <div className="mt-2 text-xs opacity-80 flex justify-between">
        <span>{trialPlan} Trial</span>
        <span>
          {subscription?.features.max_photospheres === -1 ? '∞' : subscription?.features.max_photospheres} PhotoSpheres &bull; 
          {subscription?.features.max_photos === -1 ? '∞' : subscription?.features.max_photos} Photos
        </span>
      </div>
    </div>
  );
};

export default FreeTrialBanner;

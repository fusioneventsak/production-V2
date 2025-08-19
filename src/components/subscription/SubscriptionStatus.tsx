import React from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { AlertTriangle, Crown, Clock, CheckCircle, Calendar, Star } from 'lucide-react';

interface SubscriptionStatusProps {
  showDetails?: boolean;
  className?: string;
  compact?: boolean;
}

const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({ 
  showDetails = false, 
  className = '',
  compact = false
}) => {
  const {
    subscription,
    loading,
    getTrialDaysRemaining,
    isSingleUseEvent,
    getDurationDays
  } = useSubscriptionStore();
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-800/50 rounded-lg p-3 ${className}`}>
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </div>
    );
  }
  
  // Early return if no subscription
  if (!subscription) {
    return (
      <div className={`bg-gray-900/20 border border-gray-700/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center text-gray-300">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">You have no subscription</span>
        </div>
        {showDetails && (
          <p className="text-xs text-gray-400 mt-1">
            Subscribe to access premium features
          </p>
        )}
      </div>
    );
  }
  
  // Determine subscription status
  const isActive = subscription.subscription_status === 'active';
  const isTrialing = subscription.subscription_status === 'trialing';
  const isPastDue = subscription.subscription_status === 'past_due';
  const isCanceled = subscription.subscription_status === 'canceled';
  const isEvent = isSingleUseEvent();
  
  // Get plan name with proper capitalization
  const planName = subscription.subscription_tier;
  const formattedPlanName = planName.charAt(0).toUpperCase() + planName.slice(1);
  
  // Get next billing date
  const nextBilling = subscription.current_period_end ? new Date(subscription.current_period_end) : null;
  const willCancel = subscription.cancel_at_period_end || false;

  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-800/50 rounded-lg p-3 ${className}`}>
        <div className="h-4 bg-gray-700 rounded w-24"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={`bg-gray-900/20 border border-gray-700/50 rounded-lg p-3 ${className}`}>
        <div className="flex items-center text-gray-300">
          <AlertTriangle className="w-4 h-4 mr-2" />
          <span className="text-sm font-medium">You have no subscription</span>
        </div>
        {showDetails && (
          <p className="text-xs text-gray-400 mt-1">
            Subscribe to access premium features
          </p>
        )}
      </div>
    );
  }

  const getStatusColor = () => {
    if (isEvent) return 'text-purple-300 bg-purple-900/20 border-purple-800/50';
    if (isActive) return 'text-green-300 bg-green-900/20 border-green-800/50';
    if (isTrialing) return 'text-blue-300 bg-blue-900/20 border-blue-800/50';
    if (isPastDue) return 'text-orange-300 bg-orange-900/20 border-orange-800/50';
    if (isCanceled) return 'text-red-300 bg-red-900/20 border-red-800/50';
    return 'text-gray-300 bg-gray-900/20 border-gray-800/50';
  };

  const getStatusIcon = () => {
    if (isEvent) return <Star className="w-4 h-4" />;
    if (isActive) return <CheckCircle className="w-4 h-4" />;
    if (isTrialing) return <Clock className="w-4 h-4" />;
    if (isPastDue) return <AlertTriangle className="w-4 h-4" />;
    if (isCanceled) return <AlertTriangle className="w-4 h-4" />;
    return <Crown className="w-4 h-4" />;
  };

  const getStatusText = () => {
    if (isEvent) {
      const durationDays = getDurationDays();
      return `Event Plan (${durationDays} day${durationDays !== 1 ? 's' : ''})`;
    }
    if (isTrialing) {
      const daysRemaining = getTrialDaysRemaining();
      return `${formattedPlanName} Trial (${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left)`;
    }
    if (isActive) return `${formattedPlanName} Plan`;
    if (isPastDue) return 'Payment Past Due';
    if (isCanceled) return 'Plan Canceled';
    return subscription.subscription_status.charAt(0).toUpperCase() + subscription.subscription_status.slice(1);
  };



  return (
    <div className={`border rounded-lg ${compact ? 'p-2' : 'p-3'} ${getStatusColor()} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {getStatusIcon()}
          <span className={`${compact ? 'text-xs' : 'text-sm'} font-medium ml-2`}>{getStatusText()}</span>
        </div>
        {compact && (
          <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full">
            {formattedPlanName}
          </span>
        )}
      </div>
      
      {showDetails && !compact && (
        <div className="mt-2 space-y-1">
          {isTrialing && (
            <p className="text-xs opacity-80">
              {formattedPlanName} trial includes {subscription.features.max_photospheres === -1 ? 'unlimited' : subscription.features.max_photospheres} PhotoSpheres 
              and {subscription.features.max_photos === -1 ? 'unlimited' : subscription.features.max_photos} photos
            </p>
          )}
          
          {isEvent && (
            <p className="text-xs opacity-80">
              Single-use event plan valid for {subscription.features.duration_days || 30} days
            </p>
          )}
          
          {nextBilling && !willCancel && subscription.subscription_status !== 'trialing' && !isEvent && (
            <p className="text-xs opacity-80">
              Next billing: {new Date(nextBilling).toLocaleDateString()}
            </p>
          )}
          
          {willCancel && nextBilling && (
            <p className="text-xs opacity-80">
              Cancels on: {new Date(nextBilling).toLocaleDateString()}
            </p>
          )}
          
          {isPastDue && (
            <p className="text-xs opacity-80">
              Please update your payment method
            </p>
          )}
          
          {isActive && !isEvent && !willCancel && (
            <p className="text-xs opacity-80 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              Active subscription
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;

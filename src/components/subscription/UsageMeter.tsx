import React from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { AlertTriangle, Infinity } from 'lucide-react';

interface UsageMeterProps {
  type: 'photospheres' | 'photos';
  currentUsage: number;
  label: string;
  className?: string;
}

const UsageMeter: React.FC<UsageMeterProps> = ({ 
  type, 
  currentUsage, 
  label, 
  className = '' 
}) => {
  const { subscription, canCreatePhotosphere, canUploadPhotos } = useSubscriptionStore();
  
  if (!subscription) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 ${className}`}>
        <div className="text-sm text-gray-400">Loading subscription data...</div>
      </div>
    );
  }
  
  // Determine limits and usage based on type
  const limit = type === 'photospheres' 
    ? subscription.features.max_photospheres 
    : subscription.features.max_photos;
    
  const usage = currentUsage;
  const remaining = limit === -1 ? -1 : Math.max(0, limit - usage);
  const isUnlimited = limit === -1;
  
  // Check if user can use this resource
  const canUse = type === 'photospheres'
    ? canCreatePhotosphere()
    : canUploadPhotos('', currentUsage); // Empty string as we're just checking general ability
    
  const requiresUpgrade = !canUse && !isUnlimited;

  const getProgressColor = () => {
    if (requiresUpgrade) return 'bg-red-500';
    if (isUnlimited) return 'bg-green-500';
    
    const percentage = (usage / (limit as number)) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getProgressPercentage = () => {
    if (isUnlimited) return 100;
    if (requiresUpgrade) return 100;
    return Math.min((usage / limit) * 100, 100);
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg p-4 border border-gray-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white">{label}</span>
        <div className="flex items-center text-xs text-gray-400">
          {isUnlimited ? (
            <div className="flex items-center">
              <Infinity className="w-3 h-3 mr-1" />
              <span>Unlimited</span>
            </div>
          ) : (
            <span>{usage} / {limit}</span>
          )}
        </div>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        {isUnlimited ? (
          <span className="text-green-400">Unlimited usage</span>
        ) : requiresUpgrade ? (
          <div className="flex items-center text-red-400">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>Upgrade required</span>
          </div>
        ) : (
          <span className="text-gray-400">
            {remaining} remaining
          </span>
        )}
        
        {!canUse && !isUnlimited && (
          <span className="text-red-400 font-medium">Limit reached</span>
        )}
      </div>
    </div>
  );
};

export default UsageMeter;

import React, { useState } from 'react';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { Loader2, X, TrendingDown } from 'lucide-react';

export const DowngradeButton: React.FC = () => {
  const { subscription, loading, downgradeToFree } = useSubscriptionStore();
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Only show the button if user has an active subscription that's not already free
  const showDowngradeButton = subscription?.subscription_tier !== 'free' && 
    subscription?.subscription_status === 'active' && 
    !loading;

  if (!showDowngradeButton) {
    return null;
  }

  const handleDowngrade = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const result = await downgradeToFree();
      if (result.success) {
        setIsOpen(false);
        // Optional: Show success message or redirect
      } else {
        setError(result.error || 'Failed to process downgrade');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Error in handleDowngrade:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <button 
        className="inline-flex items-center px-4 py-2 bg-transparent text-amber-500 border border-amber-500 hover:bg-amber-500/10 font-medium rounded-lg transition-colors disabled:opacity-50"
        onClick={() => setIsOpen(true)}
        disabled={loading}
      >
        <TrendingDown className="w-4 h-4 mr-2" />
        {loading ? 'Loading...' : 'Downgrade to Free'}
      </button>

      {/* Custom Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="relative bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Confirm Downgrade
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to downgrade to the Free plan?
              </p>
              
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-md border border-amber-200 dark:border-amber-800">
                <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">What changes:</h4>
                <ul className="list-disc pl-5 space-y-1 text-amber-700 dark:text-amber-300 text-sm">
                  <li>Maximum 3 PhotoSpheres</li>
                  <li>100 photos total limit</li>
                  <li>Basic moderation tools</li>
                  <li>Email support only</li>
                  <li>No advanced camera animations</li>
                  <li>No video recording</li>
                  <li>No custom branding</li>
                </ul>
              </div>
              
              {error && (
                <div className="text-red-500 text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsOpen(false)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDowngrade}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Confirm Downgrade'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

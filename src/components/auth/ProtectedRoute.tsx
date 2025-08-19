import React, { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { TIERS } from '../../config/tiers';
import { SubscriptionTier } from '../../types/user';

type ProtectedRouteProps = {
  children: React.ReactNode;
  /**
   * Required subscription tier to access this route
   * If not provided, only authentication is required
   */
  requiredTier?: SubscriptionTier;
  /**
   * Required feature to access this route
   * If not provided, only the tier is checked
   */
  requiredFeature?: string;
  /**
   * If true, shows an upgrade prompt instead of redirecting
   */
  showUpgradePrompt?: boolean;
};

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredTier,
  requiredFeature,
  showUpgradePrompt = false,
}) => {
  const { user, loading, initialized, hasFeature } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Log auth state for debugging
  useEffect(() => {
    console.log('🔑 ProtectedRoute auth state:', { 
      user, 
      loading, 
      initialized,
      requiredTier,
      requiredFeature,
      currentTier: user?.subscriptionTier
    });
  }, [user, loading, initialized, requiredTier, requiredFeature]);

  // Show loading state while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <Loader2 className="h-12 w-12 animate-spin text-purple-500 mb-4" />
        <p className="text-gray-400">Loading your session...</p>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!user) {
    console.log('🔑 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required tier
  const hasRequiredTier = !requiredTier || 
    (user.subscriptionTier && 
     Object.values(TIERS).findIndex(t => t.name === user.subscriptionTier) >= 
     Object.values(TIERS).findIndex(t => t.name === requiredTier));

  // Check if user has the required feature
  const hasRequiredFeature = !requiredFeature || hasFeature(requiredFeature);

  // If user doesn't have required access
  if (!hasRequiredTier || !hasRequiredFeature) {
    console.log('🔑 ProtectedRoute: Insufficient permissions', {
      hasRequiredTier,
      hasRequiredFeature,
      userTier: user.subscriptionTier,
      requiredTier,
      requiredFeature,
    });

    // Show upgrade prompt if enabled
    if (showUpgradePrompt) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-4">
          <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Upgrade Required</h2>
            <p className="text-gray-300 mb-6">
              {!hasRequiredTier
                ? `This feature requires the ${requiredTier} plan or higher.`
                : `The "${requiredFeature}" feature is not included in your current plan.`}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => navigate('/pricing')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                View Plans
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(-1)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Go Back
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Otherwise redirect to home or dashboard
    return <Navigate to="/" replace />;
  }

  // If user has required access, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;

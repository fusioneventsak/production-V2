import React, { useEffect } from 'react';
import { useSimpleAuth } from '../../contexts/SimpleAuthContext';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { Loader2, CreditCard, CheckCircle, AlertCircle, Crown, ArrowRight, Clock } from 'lucide-react';
import DashboardLayout from '../layout/DashboardLayout';
import { Link, useNavigate } from 'react-router-dom';
import { DowngradeButton } from '../subscription/DowngradeButton';

const Profile: React.FC = () => {
  const { user, signOut, loading: authLoading } = useSimpleAuth();
  const navigate = useNavigate();
  const { 
    subscription, 
    loading: subscriptionLoading, 
    fetchSubscription,
    isSubscriptionSuspended
  } = useSubscriptionStore();
  
  const loading = authLoading || subscriptionLoading;

  // Debugging logs
  useEffect(() => {
    console.log('🔑 Profile auth state:', { 
      user: user ? { id: user.id, email: user.email } : null, // Only log safe user data
      authLoading, 
      subscription, 
      subscriptionLoading 
    });
    
    if (subscription) {
      console.log('🔑 Subscription data:', subscription);
    }
  }, [user, authLoading, subscription, subscriptionLoading]);
  
  useEffect(() => {
    if (!user) {
      console.log('🔑 No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    fetchSubscription();
    
    // Check for success or canceled URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const canceled = urlParams.get('canceled');
    
    if (success === 'true') {
      // Clear URL parameters and refresh subscription data
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🔑 Subscription success, refreshing data...');
      fetchSubscription();
    } else if (canceled === 'true') {
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      console.log('🔑 Subscription canceled');
    }
  }, [user, fetchSubscription, navigate]);

  const handleSignOut = async () => {
    console.log('🔑 Logging out from profile...');
    await signOut();
    navigate('/login');
  };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-white sm:truncate sm:text-3xl sm:tracking-tight">
              Account Settings
            </h2>
          </div>
        </div>

        {/* Suspended banner */}
        {subscription && isSubscriptionSuspended() && (
          <div className="rounded-md border border-red-700/50 bg-red-900/20 p-3 text-sm text-red-200">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                <div>
                  <p className="font-medium text-red-100">Subscription Suspended</p>
                  <p className="text-xs text-red-200/90 mt-0.5">
                    Your subscription is inactive or past due. Please renew to restore access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* User Profile Section */}
            <div className="bg-gray-800/50 rounded-lg p-3 shadow border border-gray-700">
              <div className="border-b border-gray-700 pb-3 mb-4">
                <h3 className="text-sm font-medium text-white">Profile Information</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Account details and preferences</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium">
                      {user?.fullName || user?.email?.split('@')[0] || 'User'}
                    </h4>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-2 pt-1">
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Full Name</p>
                    <p className="text-white text-xs">
                      {user?.fullName || 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-400 mb-0.5">Email Address</p>
                    <p className="text-white text-xs">{user?.email || 'No email'}</p>
                  </div>
                </div>
                {/* Account Created removed to keep compact and avoid relying on non-existent field */}
                <div className="pt-1">
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>

            {/* Subscription Status */}
            <div className="bg-gray-800/50 rounded-lg p-3 shadow border border-gray-700">
              <div className="border-b border-gray-700 pb-3 mb-4">
                <h3 className="text-sm font-medium text-white">Subscription Status</h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Manage your subscription</p>
              </div>
            
            {subscription ? (
              <div className="space-y-2.5">
                <div className="flex items-center">
                  <span className="px-2 py-0.5 text-[11px] font-medium bg-purple-500/20 text-purple-300 rounded-full capitalize">
                    {subscription.subscription_tier}
                  </span>
                  {subscription.is_app_free_trial ? (
                    <span className="ml-2 text-[11px] text-blue-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      Trial
                    </span>
                  ) : (
                    <span className="ml-2 text-[11px] text-green-400 flex items-center">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  )}
                </div>
                <div>
                  {subscription.is_app_free_trial ? (
                    <>
                      <p className="text-[11px] text-gray-400">Trial Period</p>
                      <p className="text-white text-xs">
                        {subscription.trial_end ? `Ends ${formatDate(subscription.trial_end)}` : 'Free trial'}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-[11px] text-gray-400">Subscription</p>
                      <p className="text-white text-xs">Monthly Plan</p>
                      {subscription.current_period_end && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          Next renewal: <span className="text-white">{formatDate(subscription.current_period_end)}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
                <div className="pt-1">
                  <Link
                    to="/dashboard/subscription"
                    className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                  >
                    <CreditCard className="w-3 h-3 mr-1" />
                    Manage Subscription
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-gray-400 text-xs flex items-center">
                <AlertCircle className="w-3 h-3 mr-1 flex-shrink-0" />
                <span>You have no subscription</span>
              </div>
              )}
            </div>
          </div>

          {/* Subscription Plans */}
          <div className="space-y-4 mt-6">
            <div>
              <h2 className="text-lg font-bold text-white">Upgrade Your Plan</h2>
              <p className="text-xs text-gray-400">Choose the plan that best fits your needs</p>
            </div>

            <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-800/50 rounded-lg p-5 text-center">
              <div className="flex justify-center mb-4">
                <div className="bg-purple-600/20 rounded-full p-3">
                  <Crown className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              
              <h3 className="text-base font-semibold text-white mb-2">
                {subscription?.subscription_status === 'active' 
                  ? 'Manage Your Subscription' 
                  : 'Unlock Premium Features'
                }
              </h3>
              <p className="text-gray-300 text-sm mb-5">
                {subscription?.subscription_status === 'active'
                  ? 'View plans, manage billing, or make changes to your subscription.'
                  : 'Get access to advanced features, unlimited usage, and priority support.'
                }
              </p>
              
              <div className="space-y-3">
                <Link
                  to="/dashboard/subscription"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {subscription?.subscription_status === 'active' ? 'Manage Subscription' : 'View Plans'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
                
                {subscription?.subscription_status === 'active' && (
                  <DowngradeButton />
                )}
              </div>
            </div>
            
            <div className="text-center text-xs text-gray-500 mt-3">
              <p>Need a custom plan? <a href="mailto:support@photosphere.com" className="text-purple-400 hover:underline">Contact sales</a></p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscriptionFeatures } from '../hooks/useSubscriptionFeatures';
import AuthForm from '../components/auth/AuthForm';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import SubscriptionFeatures from '../components/subscription/SubscriptionFeatures';
import SignupButtonDebug from '../components/auth/SignupButtonDebug';
import { Button } from '../components/ui/button';
import { User, Settings, Shield, Crown } from 'lucide-react';

const AuthTest: React.FC = () => {
  const { user, loading, logout, refreshUser } = useAuth();
  const {
    canAccess,
    hasReached,
    isOnTrial,
    getTrialDaysLeft,
    currentTier,
    isFreeTier,
    isProTier,
    isEnterpriseTier
  } = useSubscriptionFeatures();
  
  const [activeTab, setActiveTab] = useState<'auth' | 'features' | 'debug'>('auth');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Authentication & User Tier System Test</h1>
            <p className="text-gray-400">Test all authentication features and subscription tiers</p>
          </div>

          {/* User Status Bar */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-purple-400" />
                  <span className="font-medium">
                    {user ? `${user.email} (${user.subscriptionTier})` : 'Not authenticated'}
                  </span>
                </div>
                {user && (
                  <div className="flex items-center space-x-2">
                    {isOnTrial() && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                        Trial: {getTrialDaysLeft()} days left
                      </span>
                    )}
                    <span className={`px-2 py-1 rounded text-xs ${
                      isEnterpriseTier ? 'bg-purple-500/20 text-purple-400' :
                      isProTier ? 'bg-blue-500/20 text-blue-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {currentTier.name}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {user && (
                  <>
                    <Button
                      onClick={refreshUser}
                      size="sm"
                      variant="outline"
                      className="text-xs"
                    >
                      Refresh
                    </Button>
                    <Button
                      onClick={logout}
                      size="sm"
                      variant="destructive"
                      className="text-xs"
                    >
                      Logout
                    </Button>

                  </>
                )}
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
            {[
              { id: 'auth', label: 'Authentication', icon: Shield },
              { id: 'features', label: 'Subscription Features', icon: Crown },
              { id: 'debug', label: 'Debug Tools', icon: Settings }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded transition-colors ${
                  activeTab === id
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'auth' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h2 className="text-xl font-semibold mb-4">Authentication Form</h2>
                  {!user ? (
                    <AuthForm isLogin={false} />
                  ) : (
                    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-medium">{user.fullName || 'User'}</h3>
                          <p className="text-sm text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Subscription:</span>
                          <span className="capitalize">{user.subscriptionTier}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="capitalize">{user.subscriptionStatus || 'Active'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Photospheres:</span>
                          <span>{user.photospheresCreated}/{currentTier.maxPhotospheres === Infinity ? '∞' : currentTier.maxPhotospheres}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Photos:</span>
                          <span>{user.photosUploaded}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold mb-4">Feature Access Tests</h2>
                  <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 space-y-4">
                    {[
                      'cameraAnimations',
                      'videoRecording',
                      'virtualPhotobooth',
                      'customBranding',
                      'prioritySupport'
                    ].map(feature => (
                      <div key={feature} className="flex items-center justify-between">
                        <span className="text-sm capitalize">
                          {feature.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          canAccess(feature)
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-red-500/20 text-red-400'
                        }`}>
                          {canAccess(feature) ? 'Allowed' : 'Blocked'}
                        </span>
                      </div>
                    ))}
                    
                    <div className="pt-4 border-t border-gray-700">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Photosphere Limit Reached</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          hasReached('photospheres')
                            ? 'bg-red-500/20 text-red-400'
                            : 'bg-green-500/20 text-green-400'
                        }`}>
                          {hasReached('photospheres') ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Subscription Features</h2>
                <SubscriptionFeatures />
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Protected Route Tests</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-medium mb-2">Pro Feature Test</h4>
                      <ProtectedRoute 
                        requiredTier="pro" 
                        showUpgradePrompt={true}
                      >
                        <div className="text-green-400 text-sm">
                          ✅ You have access to Pro features!
                        </div>
                      </ProtectedRoute>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-medium mb-2">Enterprise Feature Test</h4>
                      <ProtectedRoute 
                        requiredTier="enterprise" 
                        showUpgradePrompt={true}
                      >
                        <div className="text-green-400 text-sm">
                          ✅ You have access to Enterprise features!
                        </div>
                      </ProtectedRoute>
                    </div>
                    
                    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                      <h4 className="font-medium mb-2">Custom Branding Test</h4>
                      <ProtectedRoute 
                        requiredFeature="customBranding" 
                        showUpgradePrompt={true}
                      >
                        <div className="text-green-400 text-sm">
                          ✅ Custom branding is available!
                        </div>
                      </ProtectedRoute>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'debug' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Debug Tools</h2>
                <SignupButtonDebug />
                
                <div className="mt-6 bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <h3 className="text-lg font-medium mb-4">System Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Authentication State</h4>
                      <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify({
                          authenticated: !!user,
                          loading,
                          userId: user?.id,
                          email: user?.email,
                          tier: user?.subscriptionTier,
                          status: user?.subscriptionStatus
                        }, null, 2)}
                      </pre>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-300 mb-2">Feature Access</h4>
                      <pre className="bg-gray-900 p-3 rounded text-xs overflow-auto">
                        {JSON.stringify({
                          currentTier: currentTier.name,
                          isFreeTier,
                          isProTier,
                          isEnterpriseTier,
                          isOnTrial: isOnTrial(),
                          trialDaysLeft: getTrialDaysLeft(),
                          videoRecording: canAccess('videoRecording'),
                          customBranding: canAccess('customBranding')
                        }, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthTest;

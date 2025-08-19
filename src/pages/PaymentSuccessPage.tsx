import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useSubscriptionStore } from '../store/subscriptionStore';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const { fetchSubscription } = useSubscriptionStore();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Refresh subscription data immediately
    fetchSubscription();

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [fetchSubscription, navigate]);

  const handleContinue = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-gray-600">
            Your subscription has been activated successfully.
          </p>
        </div>

        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 font-medium">
            🎉 Welcome to PhotoSphere Pro!
          </p>
          <p className="text-green-700 text-sm mt-1">
            You now have access to all premium features.
          </p>
        </div>

        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-4">
            Redirecting to dashboard in {countdown} seconds...
          </p>
          
          <button
            onClick={handleContinue}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            Continue to Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-gray-400">
          <p>Need help? Contact our support team</p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;

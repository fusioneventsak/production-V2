import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, initialized } = useAuth();
  
  // Log component mount and auth state for debugging
  useEffect(() => {
    console.log('🔑 SignupPage MOUNTED - Component is rendering');
  }, []);
  
  useEffect(() => {
    console.log('🔑 SignupPage auth state:', { user, loading, initialized });
  }, [user, loading, initialized]);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (user) {
      console.log('🔑 User already logged in, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);
  
  // Show loading state while auth is initializing
  if (loading || !initialized) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-purple-500" />
            <p className="text-gray-400">Loading authentication state...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <AuthForm isLogin={false} />
      </div>
    </Layout>
  );
};

export default SignupPage;
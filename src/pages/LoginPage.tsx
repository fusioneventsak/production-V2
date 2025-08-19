import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AuthForm from '../components/auth/AuthForm';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, initialized } = useAuth();
  
  // Log auth state for debugging
  useEffect(() => {
    console.log('🔑 LoginPage auth state:', { user, loading, initialized });
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-gray-400">Loading authentication state...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <AuthForm isLogin={true} />
      </div>
    </Layout>
  );
};

export default LoginPage;
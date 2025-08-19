import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../contexts/SimpleAuthContext';
import { SimpleAuthForm } from '../components/auth/SimpleAuthForm';
import Layout from '../components/layout/Layout';

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, initialized } = useSimpleAuth();

  // Determine initial tab based on current route
  const getInitialTab = (): 'login' | 'register' => {
    if (location.pathname === '/signup' || location.pathname === '/register') {
      return 'register';
    }
    return 'login';
  };

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (initialized && user && !loading) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, initialized, navigate]);

  // Show loading while initializing
  if (!initialized) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-160px)] flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            <p className="text-gray-400">Initializing...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-160px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <SimpleAuthForm initialTab={getInitialTab()} />
      </div>
    </Layout>
  );
};

export default AuthPage;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock, Mail, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import GoogleButton from './GoogleButton';
import { Button } from '../../components/ui/button';

type AuthFormProps = {
  isLogin?: boolean;
};

interface FormData {
  email: string;
  password: string;
  name: string;
}

const AuthForm: React.FC<AuthFormProps> = ({ isLogin = true }) => {
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    name: ''
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get auth context for auth operations
  const { login, signup, loginWithGoogle, loading, user } = useAuth();
  
  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Check for success/error messages in location state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the location state to prevent showing the message again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Log auth state on mount to debug issues
  useEffect(() => {
    console.log('🔑 AuthForm mounted - State:', { 
      hasUser: !!user,
      loading, 
      isLogin,
      currentPath: window.location.pathname,
      localStorageAuth: Boolean(localStorage.getItem('supabase.auth.token')),
      sessionStorageAuth: Boolean(sessionStorage.getItem('supabase.auth.token'))
    });
    
    return () => {
      console.log('🔑 AuthForm unmounting');
    };
  }, []);

  // Log whenever isLogin prop changes
  useEffect(() => {
    console.log('🔑 AuthForm isLogin prop changed:', { isLogin, currentPath: window.location.pathname });
  }, [isLogin]);
  
  // Handle successful login redirect
  useEffect(() => {
    if (user) {
      console.log('🔑 User authenticated, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }
    
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        // Ensure name is provided for signup
        if (!formData.name.trim()) {
          setErrorMessage('Please enter your name');
          setIsSubmitting(false);
          return;
        }
        await signup(formData.email, formData.password, formData.name);
      }
      
      // Navigate to dashboard on successful login/signup
      navigate('/dashboard');
    } catch (err) {
      console.error('Auth error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Authentication failed';
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center bg-transparent pt-16 pb-12 px-6">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-gray-700/30 w-full">
          <div className="p-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-gray-400">
                {isLogin ? 'Sign in to continue to PhotoSphere' : 'Get started with your free account'}
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm flex items-start">
                <AlertCircle className="flex-shrink-0 h-5 w-5 mr-2 mt-0.5" />
                <div>{errorMessage}</div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300 text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-gray-800/70 text-white block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Name Field (Signup only) */}
              {!isLogin && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                    Full name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      required={!isLogin}
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-800/70 text-white block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                      placeholder="Your name"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  {isLogin && (
                    <a href="/forgot-password" className="text-xs text-purple-400 hover:text-purple-300">
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-gray-800/70 text-white block w-full pl-10 pr-3 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-500"
                    placeholder={isLogin ? '••••••••' : 'Create a password (min 6 characters)'}
                  />
                </div>
              </div>

              {/* Remember Me (Login only) */}
              {isLogin && (
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-600 rounded bg-gray-700/50"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Processing...
                    </>
                  ) : isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In */}
              <div className="mt-6">
                <GoogleButton 
                  onClick={loginWithGoogle} 
                  loading={loading}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Toggle between Login/Signup */}
          <div className="bg-gray-900/40 px-8 py-5 text-center border-t border-gray-800">
            <p className="text-sm text-gray-300">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                onClick={() => navigate(isLogin ? '/signup' : '/login')}
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
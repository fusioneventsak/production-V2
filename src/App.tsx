import { createBrowserRouter, RouterProvider, Route, createRoutesFromElements, Navigate, Outlet } from 'react-router-dom';
import { SimpleProtectedRoute } from './components/auth/SimpleProtectedRoute';
import SubscriptionCacheListener from './components/subscription/SubscriptionCacheListener';
import { SimpleAuthProvider } from './contexts/SimpleAuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import PhotoSpheresPage from './pages/PhotoSpheresPage';
import Profile from './components/dashboard/Profile';
import CollageEditorPage from './pages/CollageEditorPage';
import CollageViewerPage from './pages/CollageViewerPage';
import PhotoboothPage from './pages/PhotoboothPage';
import PhotoboothSettingsPage from './pages/PhotoboothSettingsPage';
import CollageModerationPage from './pages/CollageModerationPage';
import PricingPage from './pages/PricingPage';
import FAQPage from './pages/FAQPage';
import JoinCollage from './pages/JoinCollage';
import Custom404Page from './pages/404';
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import BlogPostAI from './pages/BlogPostAI';
import BlogPostPricing from './pages/BlogPostPricing';
import ShowcasePage from './pages/ShowcasePage';
import SimpleSubscriptionPlans from './components/subscription/SimpleSubscriptionPlans';
import SubscriptionSuccess from './components/subscription/SubscriptionSuccess';
import AuthTest from './pages/AuthTest';

// Admin Components

// Create router with future flag enabled
// Root component that will be wrapped with AuthProvider
const Root = () => {
  return <Outlet />;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<SimpleAuthProvider><Root /></SimpleAuthProvider>}>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/showcase" element={<ShowcasePage />} /> {/* ADD THIS LINE */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage />} />
      <Route path="/register" element={<AuthPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/faq" element={<FAQPage />} />
      <Route path="/auth-test" element={<AuthTest />} />
      <Route path="/join" element={<JoinCollage />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/photobooth-businesses-double-revenue-photosphere-case-study" element={<BlogPost />} />
      <Route path="/blog/ai-revolution-photo-activations-photobooth-software-future" element={<BlogPostAI />} />
      <Route path="/blog/photobooth-pricing-strategies-premium-rates" element={<BlogPostPricing />} />
      <Route path="/collage/:code" element={<CollageViewerPage />} />
      <Route path="/photobooth/:code" element={<PhotoboothPage />} />
      
      {/* Redirect for common typo */}
      <Route path="/dashbaord" element={<Navigate to="/dashboard" replace />} />
      
      {/* Protected routes - require authentication */}
      <Route path="/dashboard" element={<SimpleProtectedRoute><DashboardPage /></SimpleProtectedRoute>} />
      <Route path="/dashboard/photospheres" element={<SimpleProtectedRoute><PhotoSpheresPage /></SimpleProtectedRoute>} />
      <Route path="/dashboard/profile" element={<SimpleProtectedRoute><Profile /></SimpleProtectedRoute>} />
      <Route path="/dashboard/subscription" element={<SimpleProtectedRoute><SimpleSubscriptionPlans /></SimpleProtectedRoute>} />
      <Route path="/subscription/success" element={<SimpleProtectedRoute><SubscriptionSuccess /></SimpleProtectedRoute>} />
      <Route path="/dashboard/collage/:id" element={<SimpleProtectedRoute><CollageEditorPage /></SimpleProtectedRoute>} />
      <Route path="/dashboard/collage/:id/photobooth-settings" element={<SimpleProtectedRoute><PhotoboothSettingsPage /></SimpleProtectedRoute>} />
      <Route path="/collage/:id/moderation" element={<SimpleProtectedRoute><CollageModerationPage /></SimpleProtectedRoute>} />
      <Route path="/moderation/:id" element={<SimpleProtectedRoute><CollageModerationPage /></SimpleProtectedRoute>} />
      
      {/* 404 Page - This must be the VERY LAST route */}
      <Route path="*" element={<Custom404Page />} />
      
     
    </Route>
  ),
  {
    future: {
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <ErrorBoundary>
      <SubscriptionCacheListener />
      <RouterProvider router={router} />
    </ErrorBoundary>
  );
}

export default App;
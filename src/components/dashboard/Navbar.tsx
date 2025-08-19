import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSimpleAuth } from '../../contexts/SimpleAuthContext';
import { User, LogOut, ChevronDown, Bell, Loader2 } from 'lucide-react';

const DashboardNavbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const { user, signOut, loading, initialized } = useSimpleAuth();
  const location = useLocation();
  
  // Log auth state for debugging
  useEffect(() => {
    console.log('🔑 Navbar auth state:', { user, loading, initialized });
  }, [user, loading, initialized]);
  
  // Show loading state while auth is initializing
  if (loading || !initialized) {
    return (
      <nav className="bg-gray-900 border-b border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        </div>
      </nav>
    );
  }
  
  // Don't render if no user is logged in
  if (!user) {
    console.log('🔑 Navbar: No user, not rendering');
    return null;
  }
  
  // Close dropdowns when route changes
  useEffect(() => {
    setIsProfileOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);
  
  // Handle logout
  const handleLogout = async () => {
    console.log('🔑 Logging out...');
    await signOut();
    // No need to navigate here - SimpleAuthContext's signOut handles navigation
  };
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const profileMenu = document.getElementById('profile-menu');
      const profileButton = document.getElementById('profile-button');
      const notificationsMenu = document.getElementById('notifications-menu');
      const notificationsButton = document.getElementById('notifications-button');
      
      if (profileMenu && profileButton && 
          !profileMenu.contains(event.target as Node) && 
          !profileButton.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      
      if (notificationsMenu && notificationsButton && 
          !notificationsMenu.contains(event.target as Node) && 
          !notificationsButton.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <nav className="bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
             
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-6 md:flex md:items-center md:space-x-4">
           </div>
          </div>
          
          {/* Right side - user menu, notifications */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {/* Notifications dropdown */}
            <div className="relative">
              <button
                id="notifications-button"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-gray-900"></span>
              </button>
              
              {/* Notifications dropdown menu */}
              {isNotificationsOpen && (
                <div 
                  id="notifications-menu"
                  className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">Notifications</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    <div className="px-4 py-3 hover:bg-gray-700 transition-colors">
                      <p className="text-sm text-white">New comment on your PhotoSphere</p>
                      <p className="text-xs text-gray-400 mt-1">5 minutes ago</p>
                    </div>
                    <div className="px-4 py-3 hover:bg-gray-700 transition-colors">
                      <p className="text-sm text-white">Your PhotoSphere was shared 3 times</p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-700 px-4 py-2">
                    <Link to="/dashboard/notifications" className="text-xs text-blue-400 hover:text-blue-300">View all notifications</Link>
                  </div>
                </div>
              )}
            </div>
            
            {/* Profile dropdown */}
            <div className="relative ml-3">
              <button
                id="profile-button"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center max-w-xs bg-gray-800 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-medium">
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
              </button>
              
              {/* Profile dropdown menu */}
              {isProfileOpen && (
                <div 
                  id="profile-menu"
                  className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
                >
                  <div className="px-4 py-3 border-b border-gray-700">
                    <p className="text-sm font-medium text-white truncate">{user?.email}</p>
                  </div>
                  <Link 
                    to="/dashboard/profile" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Your Profile
                    </div>
                  </Link>
                  <Link 
                    to="/dashboard/settings" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Settings
                    </div>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    <div className="flex items-center">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign out
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
    </nav>
  );
};

export default DashboardNavbar;
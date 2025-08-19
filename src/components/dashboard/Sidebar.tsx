import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, Image, User, LogOut, Loader2 } from 'lucide-react';
import { useSimpleAuth } from '../../contexts/SimpleAuthContext';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut, loading, initialized } = useSimpleAuth();
  
  // Log auth state for debugging
  useEffect(() => {
    console.log('🔑 Sidebar auth state:', { user, loading, initialized });
  }, [user, loading, initialized]);
  
  // Show loading state while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="hidden md:flex md:flex-shrink-0 w-64 bg-gray-900/50 backdrop-blur-sm border-r border-gray-800 items-center justify-center">
        <div className="flex flex-col items-center space-y-2">
          <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
          <span className="text-sm text-gray-400">Loading...</span>
        </div>
      </div>
    );
  }
  
  // Don't render if no user is logged in
  if (!user) {
    console.log('🔑 Sidebar: No user, not rendering');
    return null;
  }

  const navItems = [
    { 
      name: 'Dashboard', 
      icon: <LayoutGrid className="w-5 h-5" />, 
      path: '/dashboard' 
    },
    { 
      name: 'My PhotoSpheres', 
      icon: <Image className="w-5 h-5" />, 
      path: '/dashboard/photospheres' 
    },
   
    { 
      name: 'Profile', 
      icon: <User className="w-5 h-5" />, 
      path: '/dashboard/profile' 
    }
  ];

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-700 bg-gray-900/50 backdrop-blur-sm">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-800">
          <Link to="/" className="flex items-center">
            <img 
              src="https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png" 
              alt="Fusion Events Logo" 
              className="h-10 w-auto"
            />
          </Link>
        </div>
        
        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="px-2 py-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg mx-2 transition-colors ${
                  location.pathname === item.path
                    ? 'bg-purple-600/20 text-white border border-purple-500/30'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        
        {/* User section */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={async () => {
              console.log('🔑 Logging out from sidebar...');
              await signOut();
              // No need to navigate here - SimpleAuthContext's signOut handles navigation
            }}
            className="flex items-center w-full px-4 py-2 text-sm text-red-300 hover:text-white hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
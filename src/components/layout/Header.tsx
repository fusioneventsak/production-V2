import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Menu, X, Home, DollarSign, LogIn, HelpCircle } from 'lucide-react';
import DemoRequestModal from '../modals/DemoRequestModal';

const Header: React.FC = () => {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Prevent body scrolling when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
  };

  // Clean up body style when component unmounts
  React.useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <React.Fragment>
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <img 
                  src="https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png" 
                  alt="Fusion Events Logo" 
                  className="h-12 w-auto"
                />
              </Link>
            </div>
            
            {/* Mobile menu button */}
            <div className="flex items-center space-x-3">
              <Link
                to="/join"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-purple-500/20 hover:text-white transition-colors flex items-center"
              >
                <Users className="h-4 w-4 mr-1" />
                Join Collage
              </Link>
              
              <Link
                to="/login"
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-purple-500/20 hover:text-white transition-colors flex items-center"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Login
              </Link>
              
              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-blue-500 rounded-md hover:from-purple-700 hover:to-blue-600 transition-colors"
              >
                Request Demo
              </button>
              
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-200 hover:text-white hover:bg-purple-500/20 transition-colors"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Full screen menu overlay - moved outside header to ensure it's truly fullscreen */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ease-in-out ${
          isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
        {/* Frosted glass background */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md"></div>
        
        {/* Centered content container */}
        <div className="relative h-full flex flex-col items-center justify-center">
          {/* Close button - positioned absolutely in top right */}
          <button
            onClick={toggleMenu}
            className="absolute top-6 right-6 p-3 rounded-full text-white hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-8 w-8" />
          </button>
          
          {/* Logo - positioned absolutely in top left */}
          <Link to="/" className="absolute top-6 left-6" onClick={() => setIsMenuOpen(false)}>
            <img 
              src="https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png" 
              alt="Fusion Events Logo" 
              className="h-12 w-auto"
            />
          </Link>
          
          {/* Centered navigation */}
          <nav className="flex flex-col items-center space-y-8 mb-12">
            <Link 
              to="/" 
              className="flex items-center text-3xl font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <Home className="h-8 w-8 mr-4" />
              Home
            </Link>
            <Link 
              to="/faq" 
              className="flex items-center text-3xl font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <HelpCircle className="h-8 w-8 mr-4" />
              FAQ
            </Link>
            <Link 
              to="/blog" 
              className="flex items-center text-3xl font-medium text-white hover:text-purple-300 transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <svg className="h-8 w-8 mr-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Blog
            </Link>
          </nav>

          {/* Join Collage button - positioned at bottom */}
          <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <div className="flex space-x-4">
              <Link
                to="/join"
                className="flex items-center justify-center px-4 py-2 bg-purple-600/90 hover:bg-purple-700 text-white rounded-md text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-purple-500/20 backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-4 w-4 mr-2" />
                Join Collage
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/30 rounded-md text-sm font-medium transition-all duration-200 backdrop-blur-sm"
                onClick={() => setIsMenuOpen(false)}
              >
                <LogIn className="h-4 w-4 mr-2" />
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Request Modal */}
      <DemoRequestModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </React.Fragment>
  );
};

export default Header;
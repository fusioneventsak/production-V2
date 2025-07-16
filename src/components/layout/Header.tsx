import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Menu, X, Home, DollarSign } from 'lucide-react';
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
    <>
      <header className="sticky top-0 z-10 backdrop-blur-md bg-black/30 border-b border-white/10">
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
            <div className="flex items-center space-x-2">
              <Link
                to="/join"
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-200 hover:bg-purple-500/20 hover:text-white transition-colors flex items-center"
              >
                <Users className="h-4 w-4 mr-1" />
                Join Collage
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
        
        {/* Full screen menu overlay */}
        <div
          className={`fixed inset-0 bg-black z-50 transition-transform duration-300 ease-in-out ${
            isMenuOpen ? 'transform translate-x-0' : 'transform translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            {/* Menu header with close button */}
            <div className="p-4 border-b border-white/10">
              <div className="flex justify-between items-center">
                <Link to="/" className="flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <img 
                    src="https://www.fusion-events.ca/wp-content/uploads/2025/06/Untitled-design-15.png" 
                    alt="Fusion Events Logo" 
                    className="h-12 w-auto"
                  />
                </Link>
                <button
                  onClick={toggleMenu}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            {/* Menu items */}
            <div className="flex-1 overflow-y-auto py-8 px-4">
              <nav className="flex flex-col space-y-6">
                <Link 
                  to="/" 
                  className="flex items-center text-xl font-medium text-white py-2 border-b border-white/10 pb-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-6 w-6 mr-3" />
                  Home
                </Link>
                <Link 
                  to="/pricing" 
                  className="flex items-center text-xl font-medium text-white py-2 border-b border-white/10 pb-4"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <DollarSign className="h-6 w-6 mr-3" />
                  Pricing
                </Link>
              </nav>
            </div>
            
            {/* Menu footer with login button */}
            <div className="p-6 border-t border-white/10">
              <Link
                to="/join"
                className="flex items-center justify-center w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5 mr-2" />
                Join Collage
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Demo Request Modal */}
      <DemoRequestModal 
        isOpen={isDemoModalOpen} 
        onClose={() => setIsDemoModalOpen(false)} 
      />
    </>
  );
};

export default Header;
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Heart, Github, Twitter } from 'lucide-react';
import PrivacyPolicyModal from '../modals/PrivacyPolicyModal';
import TermsAndConditionsModal from '../modals/TermsAndConditionsModal';

const Footer: React.FC = () => {
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = React.useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = React.useState(false);
  const location = useLocation();

  // Close modals when location changes (page navigation)
  React.useEffect(() => {
    setIsPrivacyModalOpen(false);
    setIsTermsModalOpen(false);
  }, [location]);
  return (
    <footer className="mt-auto py-6 bg-black/20 backdrop-blur-md border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} PhotoSphere. All rights reserved.
            </p>
          </div>
          
          <div className="flex space-x-4 text-gray-400">
            <Link to="/" className="text-sm hover:text-purple-400 transition-colors">
              Home
            </Link>
            <Link to="/about" className="text-sm hover:text-purple-400 transition-colors">
              About
            </Link>
            <button 
              onClick={() => setIsPrivacyModalOpen(true)}
              className="text-sm hover:text-purple-400 transition-colors"
            >
              Privacy
            </button>
            <button 
              onClick={() => setIsTermsModalOpen(true)}
              className="text-sm hover:text-purple-400 transition-colors"
            >
              Terms
            </button>
          </div>
          
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Github className="h-5 w-5" />
            </a>
            <a 
              href="https://twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
        
        {/* New bottom section with Fusion Events credit */}
        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-gray-400 text-sm flex items-center justify-center">
            <span className="mr-1">Made with</span>
            <Heart className="h-4 w-4 text-red-500 mx-1" fill="currentColor" />
            <span className="mr-1">by</span>
            <a 
              href="https://www.fusion-events.ca" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              Fusion Events
            </a>
          </p>
        </div>
      </div>
      
      {/* Privacy Policy Modal */}
      {isPrivacyModalOpen && (
        <PrivacyPolicyModal 
          isOpen={isPrivacyModalOpen} 
          onClose={() => setIsPrivacyModalOpen(false)} 
        />
      )}
      
      {/* Terms and Conditions Modal */}
      {isTermsModalOpen && (
        <TermsAndConditionsModal 
          isOpen={isTermsModalOpen} 
          onClose={() => setIsTermsModalOpen(false)} 
        />
      )}
    </footer>
  );
};

export default Footer;
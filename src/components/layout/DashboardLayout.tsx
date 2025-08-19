import React from 'react';
import Navbar from '../dashboard/Navbar';
import Sidebar from '../dashboard/Sidebar';
// import { useSubscriptionStore } from '../../store/subscriptionStore';

interface DashboardLayoutProps {
  children: React.ReactNode;
};

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  // Subscription store no longer needed after removing trial usage stats
  // const { isInTrialPeriod } = useSubscriptionStore();
  
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto pb-12">
          {/* Trial usage stats removed */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
        <footer className="bg-gray-900 border-t border-gray-800 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-400">
              &copy; {new Date().getFullYear()} PhotoSphere. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default DashboardLayout;

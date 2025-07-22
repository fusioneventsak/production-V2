import React, { useState } from 'react';
import Layout from '../components/layout/Layout';
import CollageForm from '../components/collage/CollageForm';
import CollageList from '../components/collage/CollageList';
import { Camera } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('collages');

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-400">
              Manage your 3D photo collages and photobooth settings
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8 border-b border-gray-700/50">
            <button
              onClick={() => setActiveTab('collages')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'collages'
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 hover:text-white border-transparent hover:border-gray-400'
              }`}
            >
              My Collages
            </button>
            <button
              onClick={() => setActiveTab('photobooth')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'photobooth'
                  ? 'text-purple-400 border-purple-400'
                  : 'text-gray-400 hover:text-white border-transparent hover:border-gray-400'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>PhotoBooth Settings</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        {activeTab === 'collages' ? (
          // Your existing collages content
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div>
              <CollageForm />
            </div>
            
            <div className="lg:col-span-3">
              <CollageList />
            </div>
          </div>
        ) : (
          // PhotoBooth Settings content placeholder for now
          <div className="bg-black/20 backdrop-blur-sm rounded-xl border border-white/10 p-8 text-center">
            <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">PhotoBooth Settings</h2>
            <p className="text-gray-400 mb-6">
              Customize frames, branding, and photobooth experience for your collages
            </p>
            <p className="text-sm text-gray-500">
              PhotoBooth settings page will be implemented here
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DashboardPage;
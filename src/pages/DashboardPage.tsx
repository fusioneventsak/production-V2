import React, { useEffect } from 'react';
import { Image, ExternalLink, Edit, Trash2, Pencil, Camera, Settings, Eye, Calendar, Users } from 'lucide-react';

// Mock types for demonstration - replace with your actual types
interface Collage {
  id: string;
  name: string;
  code: string;
  photoCount?: number;
  created_at: string;
  createdAt?: string;
}

// Mock store hooks - replace with your actual store
const useCollageStore = () => ({
  collages: [
    { id: '1', name: 'Wedding Celebration', code: 'WED123', photoCount: 47, created_at: '2024-01-15' },
    { id: '2', name: 'Corporate Event', code: 'CORP24', photoCount: 23, created_at: '2024-01-10' },
    { id: '3', name: 'Birthday Party', code: 'BIRTH1', photoCount: 89, created_at: '2024-01-08' }
  ],
  loading: false,
  error: null,
  fetchCollages: () => {},
  deleteCollage: async (id: string) => {}
});

// Mock modal component - replace with your actual component
const CollageNameModal = ({ collage, isOpen, onClose }: any) => null;

const CollageList: React.FC = () => {
  const { collages, loading, error, fetchCollages, deleteCollage } = useCollageStore();
  const [selectedCollage, setSelectedCollage] = React.useState<Collage | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  useEffect(() => {
    fetchCollages();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this collage? This action cannot be undone.')) {
      return;
    }
    
    setIsDeleting(id);
    try {
      await deleteCollage(id);
    } catch (error) {
      console.error('Failed to delete collage:', error);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleRename = (collage: Collage, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedCollage(collage);
    setIsRenameModalOpen(true);
  };

  if (loading && collages.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
        <p className="mt-4 text-white/60">Loading your collages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-400">Error loading collages. Please try again later.</p>
      </div>
    );
  }

  if (collages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-purple-500/20 mb-6">
          <Image className="w-8 h-8 text-purple-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">No Collages Yet</h3>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Create your first 3D photo collage to get started! Your guests will be able to upload photos in real-time.
        </p>
        <button className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl">
          <Image className="w-5 h-5 mr-2" />
          Create Your First Collage
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid of Collage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collages.map((collage) => (
          <div 
            key={collage.id} 
            className="group bg-gradient-to-br from-gray-800/40 to-gray-900/40 backdrop-blur-sm rounded-xl border border-gray-700/50 overflow-hidden hover:border-purple-500/30 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:scale-105"
          >
            {/* Card Header with Thumbnail */}
            <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-blue-900/20 flex items-center justify-center overflow-hidden">
              {/* 3D Scene Preview Placeholder */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10" />
              
              {/* Floating Elements Animation */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-4 left-4 w-8 h-8 bg-purple-500/20 rounded-lg rotate-12 group-hover:rotate-45 transition-transform duration-500" />
                <div className="absolute top-8 right-6 w-6 h-6 bg-blue-500/20 rounded-full group-hover:scale-110 transition-transform duration-500 delay-100" />
                <div className="absolute bottom-6 left-8 w-10 h-6 bg-pink-500/20 rounded-lg -rotate-12 group-hover:rotate-12 transition-transform duration-500 delay-200" />
                <div className="absolute bottom-4 right-4 w-4 h-4 bg-yellow-500/20 rounded-full group-hover:scale-125 transition-transform duration-500 delay-300" />
              </div>

              {/* 3D Icon */}
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-600/30 to-blue-600/30 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 mx-auto border border-white/10 group-hover:scale-110 transition-transform duration-300">
                  <Image className="w-8 h-8 text-white/80" />
                </div>
                <p className="text-white/60 text-sm font-medium">3D Photo Collage</p>
              </div>

              {/* Quick Stats Overlay */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg">
                <div className="flex items-center space-x-2 text-xs text-white/80">
                  <Camera className="w-3 h-3" />
                  <span>{collage.photoCount || 0}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="absolute bottom-4 left-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse" />
                  Live
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="p-6">
              {/* Title and Code */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors line-clamp-1">
                  {collage.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span className="text-xs font-mono bg-gray-800/60 px-2 py-1 rounded border border-gray-600/50">
                      {collage.code}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-xs">
                      {new Date(collage.created_at || collage.createdAt || '').toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center justify-between text-sm text-gray-400 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Camera className="w-4 h-4 text-blue-400" />
                    <span>{collage.photoCount || 0} photos</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-green-400" />
                    <span>Live</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {/* Primary Actions */}
                <div className="flex items-center justify-between">
                  <button className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-center mr-2">
                    <Edit className="w-4 h-4 inline mr-2" />
                    Edit Collage
                  </button>
                  
                  <button className="px-4 py-2.5 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-lg text-sm transition-colors border border-gray-600/50">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <button className="flex items-center justify-center px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 hover:text-purple-200 rounded-lg text-xs font-medium transition-colors border border-purple-500/30">
                    <Camera className="w-3 h-3 mr-1" />
                    Photobooth
                  </button>
                  
                  <button
                    onClick={(e) => handleRename(collage, e)}
                    className="flex items-center justify-center px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 hover:text-blue-200 rounded-lg text-xs font-medium transition-colors border border-blue-500/30"
                  >
                    <Pencil className="w-3 h-3 mr-1" />
                    Rename
                  </button>
                  
                  <button
                    onClick={(e) => handleDelete(collage.id, e)}
                    disabled={isDeleting === collage.id}
                    className="flex items-center justify-center px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-red-200 rounded-lg text-xs font-medium transition-colors border border-red-500/30 disabled:opacity-50"
                  >
                    {isDeleting === collage.id ? (
                      <div className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {selectedCollage && (
        <CollageNameModal
          collage={selectedCollage}
          isOpen={isRenameModalOpen}
          onClose={() => {
            setIsRenameModalOpen(false);
            setSelectedCollage(null);
          }}
        />
      )}
    </div>
  );
};

export default CollageList;
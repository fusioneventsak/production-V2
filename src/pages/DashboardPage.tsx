import React, { useEffect } from 'react';
import { useCollageStore, type Collage } from '../store/collageStore';
import { Image, ExternalLink, Edit, Trash2, Pencil, Camera } from 'lucide-react';
import CollageNameModal from '../components/collage/CollageNameModal';

const DashboardPage: React.FC = () => {
  const { collages, loading, error, fetchCollages, deleteCollage } = useCollageStore();
  const [selectedCollage, setSelectedCollage] = React.useState<Collage | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState<string | null>(null);

  useEffect(() => {
    fetchCollages();
  }, [fetchCollages]);

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

  // Navigation helper functions (you'll need to implement these with your router)
  const navigateToEdit = (id: string) => {
    // Replace with your navigation: navigate(`/dashboard/collage/${id}`)
    console.log('Navigate to edit:', id);
  };

  const navigateToView = (code: string) => {
    // Replace with your navigation: window.open(`/collage/${code}`, '_blank')
    console.log('Navigate to view:', code);
  };

  const navigateToPhotobooth = (id: string) => {
    // Replace with your navigation: navigate(`/dashboard/collage/${id}/photobooth-settings`)
    console.log('Navigate to photobooth settings:', id);
  };

  if (loading && collages.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20 mx-auto"></div>
        <p className="mt-4 text-white/60">Loading your collages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-400">Error loading collages. Please try again later.</p>
      </div>
    );
  }

  if (collages.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 mb-4">
          <Image className="w-6 h-6 text-white/40" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Collages Yet</h3>
        <p className="text-white/60 mb-4">Create your first collage to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Improved grid layout for better organization of many collages */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {collages.map((collage) => (
          <div 
            key={collage.id} 
            className="relative group rounded-lg overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-200 hover:border-white/20"
          >
            {/* Improved card content with better spacing */}
            <div className="p-5">
              {/* Header section - name and code with better layout */}
              <div className="mb-4">
                <h3 className="text-lg font-medium text-white mb-2 truncate group-hover:text-purple-300 transition-colors">
                  {collage.name}
                </h3>
                <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                  <div className="inline-flex items-center px-2 py-1 rounded bg-white/5 text-white/60 text-xs">
                    <Image className="w-3 h-3 mr-1" />
                    Code: {collage.code}
                  </div>
                  {collage.photoCount !== undefined && (
                    <span className="text-xs">{collage.photoCount} photos</span>
                  )}
                </div>
                <p className="text-xs text-gray-400">
                  Created: {new Date(collage.created_at || collage.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              {/* Reorganized action buttons with better hierarchy */}
              <div className="space-y-3">
                {/* Primary actions - larger and more prominent */}
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateToEdit(collage.id)}
                    className="flex-1 inline-flex items-center justify-center text-sm text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-2.5 rounded border border-purple-500/20 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </button>
                  
                  <button
                    onClick={() => navigateToView(collage.code)}
                    className="flex-1 inline-flex items-center justify-center text-sm text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-2.5 rounded border border-blue-500/20 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </button>
                </div>

                {/* Secondary actions - smaller, organized in grid */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => navigateToPhotobooth(collage.id)}
                    className="inline-flex items-center justify-center text-xs text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-2 py-2 rounded border border-purple-500/20 transition-colors"
                  >
                    <Camera className="h-3 w-3 mr-1" />
                    Photobooth
                  </button>

                  <button
                    onClick={(e) => handleRename(collage, e)}
                    className="inline-flex items-center justify-center text-xs text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2 py-2 rounded border border-blue-500/20 transition-colors"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Rename
                  </button>
                  
                  <button
                    onClick={(e) => handleDelete(collage.id, e)}
                    disabled={isDeleting === collage.id}
                    className="inline-flex items-center justify-center text-xs text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-2 rounded border border-red-500/20 transition-colors disabled:opacity-50"
                  >
                    {isDeleting === collage.id ? (
                      <span className="h-3 w-3 mr-1 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3 mr-1" />
                    )}
                    Delete
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

export default DashboardPage;
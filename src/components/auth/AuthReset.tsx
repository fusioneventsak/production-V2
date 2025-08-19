import React from 'react';

export const AuthReset: React.FC = () => {
  const resetAuth = () => {
    // Clear all storage
    localStorage.clear();
    sessionStorage.clear();
    
    // Force reload
    window.location.href = '/login';
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={resetAuth}
        className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
      >
        Force Reset Auth
      </button>
    </div>
  );
};

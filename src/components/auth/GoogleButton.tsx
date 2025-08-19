import React from 'react';

interface GoogleButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

const GoogleButton: React.FC<GoogleButtonProps> = ({ 
  onClick, 
  disabled = false,
  loading = false 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-medium py-2.5 px-4 rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? (
        <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      ) : (
        <div className="w-5 h-5 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
            <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
              <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.524 55.029 -9.23074 56.159 -10.2143 56.879 L -10.2143 60.329 L -6.46426 60.329 C -3.75426 57.849 -3.264 53.949 -3.264 51.509 Z"/>
              <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.864 60.329 L -10.2143 56.879 C -11.2043 57.599 -12.564 58.079 -14.004 58.079 C -16.774 58.079 -19.134 56.549 -19.964 54.269 L -23.7143 54.269 C -21.964 58.819 -18.014 63.239 -14.754 63.239 Z"/>
              <path fill="#FBBC05" d="M -19.964 54.269 C -20.284 53.259 -20.464 52.179 -20.464 51.009 C -20.464 49.839 -20.284 48.759 -19.964 47.749 L -19.964 44.289 L -23.7143 44.289 C -24.884 46.659 -24.464 49.719 -22.984 51.009 L -19.964 54.269 Z"/>
              <path fill="#EA4335" d="M -14.754 43.939 C -12.984 43.939 -11.404 44.469 -10.0546 45.529 L -6.52426 42.079 C -8.49426 40.289 -11.444 39.499 -14.754 39.739 C -18.014 39.739 -21.004 40.999 -22.984 43.009 L -19.964 47.009 C -18.874 45.489 -16.994 43.939 -14.754 43.939 Z"/>
            </g>
          </svg>
        </div>
      )}
      <span>Continue with Google</span>
    </button>
  );
};

export default GoogleButton;

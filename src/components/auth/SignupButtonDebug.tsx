import React, { useState, useEffect } from 'react';

const SignupButtonDebug: React.FC = () => {
  const [showSignupForm, setShowSignupForm] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`🔍 DEBUG: ${message}`);
  };

  useEffect(() => {
    addLog('Component mounted');
    
    // Check for any existing form elements
    const forms = document.querySelectorAll('form');
    addLog(`Found ${forms.length} form(s) on page`);
    
    // Listen for any page navigation
    const handleBeforeUnload = () => {
      addLog('⚠️ Page is about to reload/navigate!');
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const handleSignupClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      addLog('Signup button clicked');
      
      // Prevent all default behaviors
      e.preventDefault();
      e.stopPropagation();
      addLog('Default behavior prevented');
      
      // Check current state
      addLog(`Current showSignupForm state: ${showSignupForm}`);
      
      // Toggle form visibility
      const newState = !showSignupForm;
      setShowSignupForm(newState);
      addLog(`Setting showSignupForm to: ${newState}`);
      
      // Verify DOM after state change
      setTimeout(() => {
        const formElement = document.querySelector('.debug-signup-form');
        addLog(`Form element in DOM: ${formElement ? 'YES' : 'NO'}`);
        if (formElement) {
          const styles = window.getComputedStyle(formElement);
          addLog(`Form display: ${styles.display}, visibility: ${styles.visibility}`);
        }
      }, 100);
      
    } catch (error) {
      addLog(`❌ Error in click handler: ${error}`);
      console.error('Signup click error:', error);
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
  };

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700 space-y-4">
      <h3 className="text-lg font-medium text-white">Signup Button Debug Tool</h3>
      
      {/* Debug Button */}
      <div>
        <button
          type="button" // Explicitly set type
          onClick={handleSignupClick}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          {showSignupForm ? 'Hide' : 'Show'} Signup Form
        </button>
      </div>

      {/* Conditional Signup Form */}
      {showSignupForm && (
        <div className="debug-signup-form bg-gray-700 p-4 rounded border border-gray-600">
          <h4 className="text-white font-medium mb-3">Signup Form</h4>
          <form onSubmit={(e) => { e.preventDefault(); addLog('Form submitted (prevented)'); }}>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full p-2 bg-gray-600 text-white rounded border border-gray-500"
              />
              <button
                type="submit"
                className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Debug Logs */}
      <div className="bg-gray-900 p-3 rounded border border-gray-600">
        <div className="flex justify-between items-center mb-2">
          <h4 className="text-sm font-medium text-gray-300">Debug Logs</h4>
          <button
            onClick={clearLogs}
            className="text-xs px-2 py-1 bg-gray-600 text-gray-300 rounded hover:bg-gray-500"
          >
            Clear
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto">
          {debugLogs.length === 0 ? (
            <p className="text-xs text-gray-500">No logs yet...</p>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index} className="text-xs text-gray-300 font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Browser Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
        <div>Current URL: {window.location.href}</div>
        <div>React Version: {React.version}</div>
      </div>
    </div>
  );
};

export default SignupButtonDebug;

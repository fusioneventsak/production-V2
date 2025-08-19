// Error handling utilities for development

// Suppress common development warnings and errors
export function initializeErrorHandling() {
  // Suppress React DevTools download prompt and other development messages
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('Download the React DevTools') ||
        message.includes('THREE.WebGLRenderer: Context Lost') ||
        message.includes('React DevTools')) {
      return; // Suppress these messages
    }
    originalConsoleLog.apply(console, args);
  };

  // Suppress React Router future flag warnings and texture loading warnings
  const originalConsoleWarn = console.warn;
  console.warn = (...args) => {
    const message = args.join(' ');
    if (message.includes('React Router Future Flag Warning') || 
        message.includes('v7_startTransition') ||
        message.includes('Failed to load texture') ||
        message.includes('THREE.WebGLRenderer: Context Lost') ||
        message.includes('Auth initialization timeout') ||
        message.includes('Input elements should have autocomplete attributes')) {
      return; // Suppress these warnings
    }
    originalConsoleWarn.apply(console, args);
  };

  // Handle duplicate custom element registration errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    if (message.includes('Failed to execute \'define\' on \'CustomElementRegistry\'') ||
        message.includes('already been defined')) {
      return; // Suppress custom element registration errors
    }
    originalConsoleError.apply(console, args);
  };

  // Handle unhandled promise rejections gracefully
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // Prevent the default behavior (which logs to console)
    event.preventDefault();
  });

  // Suppress specific development errors
  window.addEventListener('error', (event) => {
    if (event.message?.includes('ResizeObserver loop limit exceeded') ||
        event.message?.includes('WebGL context lost') ||
        event.message?.includes('Failed to load texture')) {
      event.preventDefault();
      return;
    }
  });
}

// Global error handler for React errors
export const handleGlobalError = (error: Error, errorInfo?: any) => {
  console.error('Application error:', error);
  if (errorInfo) {
    console.error('Error info:', errorInfo);
  }
  
  // You could send this to an error reporting service here
  // Example: Sentry.captureException(error);
};

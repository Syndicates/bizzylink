import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log detailed error information to help debugging
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    this.setState({ errorInfo });
    
    // Show alert for debugging
    // alert(`Error caught: ${error.message}`);
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI or use provided fallback prop if available
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="bg-gray-800 rounded-lg p-8 my-4 w-full border border-red-500 shadow-xl">
          <h1 className="text-2xl font-bold text-red-500 mb-4">Something went wrong</h1>
          <div className="p-4 bg-gray-900 rounded mb-4 overflow-auto max-h-60">
            <p className="text-white font-mono text-sm whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
            </p>
            {this.state.errorInfo && (
              <details className="mt-2">
                <summary className="text-gray-400 cursor-pointer">Component Stack Trace</summary>
                <p className="text-gray-400 font-mono text-xs mt-2 whitespace-pre-wrap">
                  {this.state.errorInfo.componentStack}
                </p>
              </details>
            )}
          </div>
          <div className="flex flex-col space-y-2">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded text-center text-white font-bold"
            >
              Reload Page
            </button>
            <button 
              onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
              className="bg-green-600 hover:bg-green-700 py-2 px-4 rounded text-center text-white font-bold"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
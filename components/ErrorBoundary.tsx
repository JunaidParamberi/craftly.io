import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });

    // Log to error reporting service (e.g., Sentry, LogRocket)
    if (process.env.NODE_ENV === 'production') {
      // Add error logging service here
      // Example: Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    this.handleReset();
    // Use window.location.hash for HashRouter compatibility
    // This works without needing Router context and doesn't cause page reload
    window.location.hash = '#/dashboard';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onReset: () => void;
  onGoHome: () => void;
}> = ({ error, errorInfo, onReset, onGoHome }) => {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-3xl p-8 lg:p-12 shadow-2xl">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center">
            <AlertTriangle size={40} className="text-rose-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tight text-[var(--text-primary)]">
              System Error Detected
            </h1>
            <p className="text-sm lg:text-base text-[var(--text-secondary)] font-semibold">
              An unexpected error occurred. Our team has been notified.
            </p>
          </div>

          {process.env.NODE_ENV === 'development' && error && (
            <div className="w-full mt-6 p-6 bg-[var(--bg-canvas)] border border-[var(--border-ui)] rounded-2xl text-left overflow-auto max-h-64">
              <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-2">
                Error Details
              </p>
              <p className="text-xs font-mono text-[var(--text-secondary)] break-all">
                {error.toString()}
              </p>
              {errorInfo && (
                <details className="mt-4">
                  <summary className="text-xs font-bold text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)]">
                    Stack Trace
                  </summary>
                  <pre className="mt-2 text-xs font-mono text-[var(--text-secondary)] overflow-auto">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8">
            <button
              onClick={onReset}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent)] text-white rounded-xl font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all active:scale-95 touch-manipulation"
            >
              <RefreshCw size={16} />
              Retry
            </button>
            <button
              onClick={onGoHome}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[var(--bg-card-muted)] border border-[var(--border-ui)] text-[var(--text-primary)] rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[var(--bg-canvas)] transition-all active:scale-95 touch-manipulation"
            >
              <Home size={16} />
              Go Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorBoundary;

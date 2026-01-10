import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProgressProps {
  progress?: number; // 0-100
  showSpinner?: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'linear' | 'circular' | 'dots';
  className?: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  showSpinner = true,
  message,
  size = 'md',
  variant = 'linear',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  const spinnerSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  if (variant === 'circular') {
    return (
      <div className={`flex flex-col items-center justify-center gap-4 p-8 ${className}`}>
        <div className="relative">
          <div className={`w-${size === 'sm' ? '12' : size === 'md' ? '16' : '20'} h-${size === 'sm' ? '12' : size === 'md' ? '16' : '20'} border-4 border-[var(--border-ui)] rounded-full`} />
          <div className={`absolute inset-0 w-${size === 'sm' ? '12' : size === 'md' ? '16' : '20'} h-${size === 'sm' ? '12' : size === 'md' ? '16' : '20'} border-4 border-transparent border-t-[var(--accent)] rounded-full animate-spin`} />
        </div>
        {message && (
          <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest text-center">
            {message}
          </p>
        )}
        {progress !== undefined && (
          <p className="text-[10px] font-black text-[var(--accent)] tabular-nums">
            {Math.round(progress)}%
          </p>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-[var(--accent)] rounded-full animate-pulse"
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: '1s',
              }}
            />
          ))}
        </div>
        {message && (
          <span className="ml-2 text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative w-full bg-[var(--bg-card-muted)] rounded-full overflow-hidden">
        {progress !== undefined ? (
          <>
            <div
              className={`${sizeClasses[size]} bg-[var(--accent)] rounded-full transition-all duration-300 ease-out relative progress-shimmer`}
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[9px] font-black text-[var(--accent)] tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </>
        ) : (
          <div className={`${sizeClasses[size]} bg-[var(--accent)] rounded-full animate-pulse`} style={{ width: '60%' }} />
        )}
      </div>
      {(showSpinner || message) && (
        <div className="flex items-center gap-3">
          {showSpinner && (
            <Loader2
              size={spinnerSizes[size]}
              className="text-[var(--accent)] animate-spin"
            />
          )}
          {message && (
            <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  return (
    <Loader2
      size={sizes[size]}
      className={`text-[var(--accent)] animate-spin ${className}`}
    />
  );
};

export const LoadingOverlay: React.FC<{
  message?: string;
  progress?: number;
  className?: string;
}> = ({ message, progress, className = '' }) => {
  return (
    <div className={`absolute inset-0 bg-[var(--bg-canvas)]/80 backdrop-blur-sm flex items-center justify-center z-50 ${className}`}>
      <div className="bg-[var(--bg-card)] border border-[var(--border-ui)] rounded-2xl p-8 shadow-2xl max-w-xs w-full mx-4">
        <LoadingProgress
          variant={progress !== undefined ? 'linear' : 'circular'}
          progress={progress}
          message={message || 'Loading...'}
          size="lg"
        />
      </div>
    </div>
  );
};

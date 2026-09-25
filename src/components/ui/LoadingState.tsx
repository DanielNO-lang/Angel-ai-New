/**
 * ANGEL AI Shared Design System — Loading State
 * Spinner, Skeleton Shimmer, and Full-Block Async Loader.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading workspace data...',
  size = 'md',
  className = '',
}) => {
  const spinnerSize = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-neutral-400 space-y-3 ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className={`${spinnerSize} animate-spin text-neutral-300`} />
      {message && <p className="text-xs font-mono text-neutral-400 tracking-tight">{message}</p>}
    </div>
  );
};

export interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-850 border border-neutral-800/40 ${className}`}
    />
  );
};

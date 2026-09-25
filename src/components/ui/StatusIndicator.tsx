/**
 * ANGEL AI Shared Design System — Status Indicator
 * Restrained semantic indicators without neon glow or flashy widgets.
 */

import React from 'react';

export type StatusType = 'connected' | 'pending' | 'idle' | 'error' | 'offline';

export interface StatusIndicatorProps {
  status: StatusType;
  label?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
  size = 'sm',
}) => {
  const dotColor: Record<StatusType, string> = {
    connected: 'bg-emerald-400',
    pending: 'bg-amber-400',
    idle: 'bg-neutral-500',
    error: 'bg-rose-400',
    offline: 'bg-neutral-600',
  };

  const dotSize: Record<'xs' | 'sm' | 'md', string> = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
  };

  const defaultLabel: Record<StatusType, string> = {
    connected: 'Connected',
    pending: 'Pending Configuration',
    idle: 'Idle',
    error: 'Error',
    offline: 'Offline',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 text-xs text-neutral-300 font-mono ${className}`}>
      <span className={`rounded-full shrink-0 ${dotColor[status]} ${dotSize[size]}`} />
      <span>{label || defaultLabel[status]}</span>
    </div>
  );
};

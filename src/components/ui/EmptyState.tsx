/**
 * ANGEL AI Shared Design System — Empty State
 * Thoughtful, explanatory empty state with clear iconography and actionable prompts.
 */

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 md:p-12 border border-neutral-800/80 rounded-xl bg-neutral-900/20 max-w-xl mx-auto space-y-4 ${className}`}
    >
      <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400">
        {icon}
      </div>

      <div className="space-y-1.5 max-w-md">
        <h3 className="text-sm md:text-base font-semibold text-neutral-200 tracking-tight">
          {title}
        </h3>
        <p className="text-xs md:text-sm text-neutral-400 leading-relaxed">
          {description}
        </p>
      </div>

      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          {actionLabel && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

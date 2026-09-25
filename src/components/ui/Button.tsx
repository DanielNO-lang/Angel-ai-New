/**
 * ANGEL AI Shared Design System — Button
 * Restrained monochrome styling with accessible loading and size variants.
 */

import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'sm',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none cursor-pointer focus:outline-hidden disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

    // Size styles
    const sizeStyles: Record<ButtonSize, string> = {
      xs: 'text-[11px] px-2 py-1 gap-1.5',
      sm: 'text-xs px-3 py-1.5 gap-2',
      md: 'text-sm px-4 py-2 gap-2.5',
      lg: 'text-base px-5 py-2.5 gap-3',
    };

    // Variant styles (black/white/neutral restrained theme)
    const variantStyles: Record<ButtonVariant, string> = {
      primary:
        'bg-neutral-100 text-neutral-950 hover:bg-white shadow-xs font-semibold border border-transparent',
      secondary:
        'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-neutral-100 border border-neutral-800 hover:border-neutral-700',
      outline:
        'bg-transparent hover:bg-neutral-900 text-neutral-300 hover:text-neutral-100 border border-neutral-750 hover:border-neutral-600',
      ghost:
        'bg-transparent hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-transparent',
      danger:
        'bg-neutral-900 hover:bg-red-950/60 text-red-400 hover:text-red-300 border border-red-900/40 hover:border-red-800/80',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

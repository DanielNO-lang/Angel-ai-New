/**
 * ANGEL AI Shared Design System — Input
 * Clean, restrained monochrome text input with label, icons, helper text, and error states.
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, errorText, leftIcon, rightIcon, className = '', id, ...props }, ref) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-neutral-300">
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 text-neutral-500 pointer-events-none flex items-center justify-center">
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`w-full bg-neutral-900/90 border rounded-lg py-2 text-xs md:text-sm text-neutral-100 placeholder-neutral-500 transition-colors focus:outline-hidden ${
              leftIcon ? 'pl-9' : 'pl-3'
            } ${rightIcon ? 'pr-9' : 'pr-3'} ${
              errorText
                ? 'border-red-800 focus:border-red-600 focus:ring-1 focus:ring-red-600'
                : 'border-neutral-800 hover:border-neutral-700 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400'
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 text-neutral-500 flex items-center justify-center">
              {rightIcon}
            </div>
          )}
        </div>

        {errorText ? (
          <p className="text-[11px] text-red-400">{errorText}</p>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';

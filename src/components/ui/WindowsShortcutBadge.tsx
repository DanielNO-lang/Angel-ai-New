import React from 'react';
import { useAngel } from '../../context/AppContext';

interface WindowsShortcutBadgeProps {
  shortcut?: string;
  className?: string;
}

/**
 * Windows Shortcut Badge (Replacing Apple ⌘ to eliminate generic AI-look)
 * Displays the 4-tile Windows logo + key (e.g. Win + K)
 */
export const WindowsShortcutBadge: React.FC<WindowsShortcutBadgeProps> = ({
  shortcut = 'K',
  className = '',
}) => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  return (
    <kbd
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide select-none ${
        isLight
          ? 'bg-slate-100 text-slate-600 border border-slate-200 shadow-2xs'
          : 'bg-neutral-900/90 text-neutral-300 border border-neutral-800/80 shadow-2xs'
      } ${className}`}
    >
      {/* 4-pane Windows Logo SVG */}
      <svg
        viewBox="0 0 16 16"
        className="w-2.5 h-2.5 fill-current shrink-0 opacity-80"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M0 2.25L6.5 1.35V7.45H0V2.25ZM7.5 1.22L16 0V7.45H7.5V1.22ZM0 8.55H6.5V14.65L0 13.75V8.55ZM7.5 8.55H16V16L7.5 14.78V8.55Z" />
      </svg>
      <span>+{shortcut}</span>
    </kbd>
  );
};

/**
 * ANGEL AI — BackdropLayer Component
 * Stable, non-shifting background layer (z-index: 0, fixed inset-0)
 * - Light mode: Stable, uniform #F8FAFC canvas with crisp rendering
 * - Dark mode: Stable, uniform #0B0E14 canvas
 * - Static and unchanging across views and tabs
 */

import React from 'react';
import { useAngel } from '../../context/AppContext';

interface BackdropLayerProps {
  className?: string;
  forceTheme?: 'dark' | 'light';
}

export const BackdropLayer: React.FC<BackdropLayerProps> = ({
  className = '',
  forceTheme,
}) => {
  const { settings } = useAngel();
  const isLight = forceTheme ? forceTheme === 'light' : settings.theme === 'light';

  return (
    <div
      aria-hidden="true"
      data-testid="backdrop-layer"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
      className={`backdrop-layer fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-colors duration-200 ${
        isLight
          ? 'bg-[#F8FAFC] text-slate-900'
          : 'bg-[#0B0E14] text-neutral-100'
      } ${className}`}
    >
      {isLight ? (
        <div className="absolute inset-0 w-full h-full bg-[#F8FAFC]" />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-[#0B0E14]" />
      )}
    </div>
  );
};

/**
 * ANGEL AI — Luminous Angelic Backdrop Layer
 * Uses the official 'Luminous Angelic A Emblem in Flowing Wings' artwork as the
 * clean ambient backdrop.
 * Discards all overlapping geometric boxes, prisms, ribbons, and grid overlays per user instruction.
 * Dynamically calibrated to theme:
 * - Midnight: Matte black, complete black (#000000)
 * - Dark: Deep cosmic black (#060813)
 * - Light: Ethereal luminous light (#F8FAFC)
 */

import React, { useState } from 'react';
import { useAngel } from '../../context/AppContext';
import angelBackdropImg from '../../assets/images/Luminous Angelic A Emblem in Flowing Wings.png';

interface BackdropLayerProps {
  className?: string;
  forceTheme?: 'dark' | 'light' | 'midnight';
}

export const BackdropLayer: React.FC<BackdropLayerProps> = ({
  className = '',
  forceTheme,
}) => {
  const { settings } = useAngel();
  const theme = forceTheme || settings.theme;
  const isLight = theme === 'light';
  const isMidnight = theme === 'midnight';
  const [imageError, setImageError] = useState(false);

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
      className={`backdrop-layer fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-colors duration-500 ${
        isLight
          ? 'bg-[#F8FAFC] text-slate-900'
          : isMidnight
          ? 'bg-black text-white'
          : 'bg-[#060813] text-neutral-100'
      } ${className}`}
    >
      {/* 1. Base Canvas Color adhering strictly to theme */}
      <div
        className={`absolute inset-0 transition-colors duration-500 ${
          isLight
            ? 'bg-[#F8FAFC]'
            : isMidnight
            ? 'bg-black'
            : 'bg-[#060813]'
        }`}
      />

      {/* 2. Official Luminous Angelic A Emblem in Flowing Wings Background Image */}
      {!imageError && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <img
            src={angelBackdropImg}
            onError={() => setImageError(true)}
            alt=""
            aria-hidden="true"
            className={`w-full h-full object-cover object-center select-none transition-all duration-700 ${
              isLight
                ? 'opacity-20 mix-blend-multiply filter contrast-125 saturate-110'
                : isMidnight
                ? 'opacity-75 mix-blend-screen filter brightness-100 contrast-125'
                : 'opacity-70 mix-blend-screen filter brightness-105 contrast-120'
            }`}
            style={{
              willChange: 'opacity',
            }}
          />
        </div>
      )}

      {/* 3. Subtle ambient vignette for high text contrast without adding boxes or grids */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isLight
            ? 'bg-gradient-to-b from-white/75 via-white/50 to-white/80'
            : isMidnight
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.1)_0%,rgba(0,0,0,0.5)_50%,rgba(0,0,0,0.95)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(6,8,19,0.15)_0%,rgba(6,8,19,0.55)_55%,rgba(6,8,19,0.9)_100%)]'
        }`}
      />
    </div>
  );
};

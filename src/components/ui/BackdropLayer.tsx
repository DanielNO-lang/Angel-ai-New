/**
 * ANGEL AI — BackdropLayer Component
 *
 * Full-screen, fixed-position bottom layer (z-index: -10).
 * - Dark mode: Near-black charcoal base with subtle deep-indigo/violet atmospheric glow
 * - Light mode: Off-white/lavender version with soft radiant ambience
 * - Remains completely static while other application content scrolls
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
      className={`backdrop-layer fixed inset-0 z-0 pointer-events-none select-none overflow-hidden transition-colors duration-300 ${
        isLight
          ? 'bg-[#F9FAFD] text-slate-800'
          : 'bg-[#080B11] text-neutral-100'
      } ${className}`}
    >
      {isLight ? (
        /* ==============================================================
           LIGHT MODE: Off-white / Lavender Base with Soft Atmospheric Glow
           ============================================================== */
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Subtle lavender gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#FAF8FF] via-[#F8FAFC] to-[#F3F4F9] opacity-90" />

          {/* Top-Left Ambient Indigo Orb */}
          <div
            className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[130px] pointer-events-none opacity-45 mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle, rgba(199, 210, 254, 0.6) 0%, rgba(224, 231, 255, 0.25) 50%, transparent 75%)',
            }}
          />

          {/* Center-Right Soft Violet / Lavender Atmospheric Glow */}
          <div
            className="absolute top-1/4 -right-28 w-[700px] h-[700px] rounded-full blur-[150px] pointer-events-none opacity-40 mix-blend-multiply"
            style={{
              background: 'radial-gradient(circle, rgba(233, 213, 255, 0.6) 0%, rgba(243, 232, 255, 0.25) 50%, transparent 75%)',
            }}
          />

          {/* Bottom-Center Gentle Lavender Mist */}
          <div
            className="absolute -bottom-40 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full blur-[160px] pointer-events-none opacity-35"
            style={{
              background: 'radial-gradient(ellipse, rgba(224, 231, 255, 0.5) 0%, rgba(245, 243, 255, 0.2) 60%, transparent 80%)',
            }}
          />

          {/* Very faint delicate vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 60%, rgba(226, 232, 240, 0.4) 100%)',
            }}
          />
        </div>
      ) : (
        /* ==============================================================
           DARK MODE: Near-black Charcoal Base with Deep-Indigo/Violet Glow
           ============================================================== */
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          {/* Near-black charcoal base gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#080B12] via-[#0A0D15] to-[#06080D]" />

          {/* Top-Left Deep-Indigo Cosmic Nebula Orb */}
          <div
            className="absolute -top-40 -left-40 w-[750px] h-[750px] rounded-full blur-[150px] pointer-events-none opacity-30"
            style={{
              background: 'radial-gradient(circle, rgba(49, 46, 129, 0.7) 0%, rgba(30, 27, 75, 0.35) 45%, transparent 75%)',
            }}
          />

          {/* Center-Right Atmospheric Deep-Violet Orb */}
          <div
            className="absolute top-1/4 -right-32 w-[800px] h-[800px] rounded-full blur-[160px] pointer-events-none opacity-25"
            style={{
              background: 'radial-gradient(circle, rgba(76, 29, 149, 0.65) 0%, rgba(59, 7, 100, 0.3) 50%, transparent 75%)',
            }}
          />

          {/* Bottom-Center Deep Atmospheric Indigo Glow */}
          <div
            className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[180px] pointer-events-none opacity-25"
            style={{
              background: 'radial-gradient(ellipse, rgba(67, 56, 202, 0.45) 0%, rgba(30, 27, 75, 0.2) 60%, transparent 80%)',
            }}
          />

          {/* Subtle cosmic vignette for depth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(3, 5, 8, 0.6) 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
};

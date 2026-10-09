/**
 * ANGEL AI — Luminous Angelic Backdrop Layer
 * Uses the official 'Luminous Angelic A Emblem in Flowing Wings' artwork as the
 * ambient backdrop, calibrated with atmospheric cosmic overlays, radiant wing flares,
 * and pristine glassmorphism ribbons matching the exact color palette of the image.
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
          ? 'bg-[#F4F6FC] text-slate-900'
          : isMidnight
          ? 'bg-[#030408] text-white'
          : 'bg-[#060813] text-neutral-100'
      } ${className}`}
    >
      {/* 1. Base Cosmic Canvas matching the image foundation */}
      {isLight ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#EEF2FB] via-[#F6F8FD] to-[#E9EFF9]" />
      ) : isMidnight ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#020306] via-[#04050A] to-[#070912]" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#050711] via-[#080B17] to-[#0D1123]" />
      )}

      {/* 2. Official Luminous Angelic A Emblem in Flowing Wings Backdrop Image */}
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
                ? 'opacity-80 mix-blend-screen filter brightness-100 contrast-125'
                : 'opacity-70 mix-blend-screen filter brightness-105 contrast-120'
            }`}
            style={{
              transform: 'scale(1.02)',
              willChange: 'transform, opacity',
            }}
          />
        </div>
      )}

      {/* 3. Celestial Vignette & Contrast Control — Preserves wing luminosity while ensuring UI readability */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-500 ${
          isLight
            ? 'bg-gradient-to-b from-white/70 via-white/50 to-white/75'
            : isMidnight
            ? 'bg-[radial-gradient(ellipse_at_center,rgba(3,4,8,0.2)_0%,rgba(2,3,6,0.68)_55%,rgba(0,0,0,0.92)_100%)]'
            : 'bg-[radial-gradient(ellipse_at_center,rgba(7,10,22,0.22)_0%,rgba(6,9,19,0.64)_55%,rgba(4,6,14,0.88)_100%)]'
        }`}
      />

      {/* 4. Radiant Wing Light Blooms — Sampling directly from the picture's cyan & violet hues */}
      {/* Cyan-ice wingtip aura bloom (top-left) */}
      <div
        className="absolute -top-[10%] -left-[10%] w-[65vw] h-[65vh] rounded-full pointer-events-none blur-[120px]"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)'
            : isMidnight
            ? 'radial-gradient(circle, rgba(56, 189, 248, 0.16) 0%, rgba(99, 102, 241, 0.1) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(99, 102, 241, 0.12) 45%, transparent 70%)',
        }}
      />

      {/* Ethereal violet-purple wing aura bloom (center-right) */}
      <div
        className="absolute top-[25%] -right-[10%] w-[70vw] h-[70vh] rounded-full pointer-events-none blur-[140px]"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.12) 0%, transparent 70%)'
            : isMidnight
            ? 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, rgba(139, 92, 246, 0.12) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(168, 85, 247, 0.22) 0%, rgba(139, 92, 246, 0.14) 45%, transparent 70%)',
        }}
      />

      {/* Central Luminous Core Spark aura */}
      <div
        className="absolute top-[40%] left-[30%] w-[40vw] h-[40vh] rounded-full pointer-events-none blur-[100px]"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(99, 102, 241, 0.1) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(129, 140, 248, 0.2) 0%, rgba(168, 85, 247, 0.1) 50%, transparent 75%)',
        }}
      />

      {/* 5. Prismatic Glass Ribbon 1 — Diagonal Top-Left to Bottom-Right */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[85vw] h-[45vh] rounded-[48px] transform -rotate-12 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(238, 242, 255, 0.55) 50%, rgba(255, 255, 255, 0.35) 100%)'
            : isMidnight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(99, 102, 241, 0.12) 40%, rgba(56, 189, 248, 0.06) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(99, 102, 241, 0.1) 50%, rgba(168, 85, 247, 0.05) 100%)',
          backdropFilter: 'blur(36px)',
          border: isLight
            ? '1px solid rgba(255, 255, 255, 0.85)'
            : isMidnight
            ? '1px solid rgba(139, 92, 246, 0.15)'
            : '1px solid rgba(99, 102, 241, 0.12)',
          boxShadow: isLight
            ? '0 20px 60px -15px rgba(99, 102, 241, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
            : isMidnight
            ? '0 25px 80px -20px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.14)'
            : '0 25px 80px -20px rgba(0, 0, 0, 0.7), inset 0 1px 1px rgba(255, 255, 255, 0.1)',
        }}
      />

      {/* 6. Prismatic Glass Ribbon 2 — Floating Center-Right */}
      <div
        className="absolute top-[35%] -right-[12%] w-[70vw] h-[35vh] rounded-[40px] transform rotate-8 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(120deg, rgba(255, 255, 255, 0.7) 0%, rgba(243, 232, 255, 0.45) 60%, rgba(255, 255, 255, 0.25) 100%)'
            : isMidnight
            ? 'linear-gradient(120deg, rgba(255, 255, 255, 0.05) 0%, rgba(56, 189, 248, 0.1) 50%, rgba(168, 85, 247, 0.05) 100%)'
            : 'linear-gradient(120deg, rgba(255, 255, 255, 0.04) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(56, 189, 248, 0.04) 100%)',
          backdropFilter: 'blur(30px)',
          border: isLight
            ? '1px solid rgba(255, 255, 255, 0.8)'
            : isMidnight
            ? '1px solid rgba(56, 189, 248, 0.15)'
            : '1px solid rgba(168, 85, 247, 0.12)',
          boxShadow: isLight
            ? '0 15px 50px -10px rgba(168, 85, 247, 0.09), inset 0 1px 2px rgba(255, 255, 255, 0.85)'
            : isMidnight
            ? '0 20px 60px -15px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.12)'
            : '0 20px 60px -15px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        }}
      />

      {/* 7. Bottom Horizontal Celestial Glass Prism */}
      <div
        className="absolute -bottom-[10%] left-[8%] w-[65vw] h-[30vh] rounded-[36px] transform -rotate-3 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(110deg, rgba(255, 255, 255, 0.7) 0%, rgba(224, 231, 255, 0.5) 60%, rgba(255, 255, 255, 0.25) 100%)'
            : isMidnight
            ? 'linear-gradient(110deg, rgba(255, 255, 255, 0.05) 0%, rgba(99, 102, 241, 0.09) 50%, rgba(0, 0, 0, 0.7) 100%)'
            : 'linear-gradient(110deg, rgba(255, 255, 255, 0.04) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(56, 189, 248, 0.04) 100%)',
          backdropFilter: 'blur(28px)',
          border: isLight
            ? '1px solid rgba(255, 255, 255, 0.8)'
            : isMidnight
            ? '1px solid rgba(139, 92, 246, 0.12)'
            : '1px solid rgba(99, 102, 241, 0.1)',
          boxShadow: isLight
            ? '0 10px 40px -10px rgba(99, 102, 241, 0.08)'
            : '0 15px 50px -15px rgba(0, 0, 0, 0.75)',
        }}
      />

      {/* 8. Architectural Glass Grid matching image ethereal grid */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${isLight ? '#4f46e5' : '#818cf8'} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? '#4f46e5' : '#818cf8'} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* 9. Celestial Specular Ray angled across the wings */}
      <div
        className="absolute -top-[30%] left-[25%] w-[40vw] h-[120vh] transform rotate-25 pointer-events-none opacity-20 dark:opacity-15"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.22) 50%, transparent 100%)',
          filter: 'blur(45px)',
        }}
      />
    </div>
  );
};


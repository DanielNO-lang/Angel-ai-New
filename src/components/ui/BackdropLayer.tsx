/**
 * ANGEL AI — Standard Constant Glass Backdrop Layer
 * Constant, standard static backdrop that does not move.
 * Visibly highlighted across every single page, tab, studio, chat, and incognito mode.
 * Seamlessly integrates with 'light', 'dark', and high-contrast 'midnight' themes.
 */

import React from 'react';
import { useAngel } from '../../context/AppContext';

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
          ? 'bg-[#F8FAFD] text-slate-900'
          : isMidnight
          ? 'bg-[#000000] text-white'
          : 'bg-[#0B0E14] text-neutral-100'
      } ${className}`}
    >
      {/* 1. Base Gradient Canvas */}
      {isLight ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#F4F6FB] via-[#F8FAFD] to-[#EDF2F9]" />
      ) : isMidnight ? (
        <div className="absolute inset-0 bg-[#000000]" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B0E14] via-[#0E121B] to-[#121622]" />
      )}

      {/* 2. Constant Glass Ribbon 1 — Diagonal Top-Left to Bottom-Right */}
      <div
        className="absolute -top-[15%] -left-[10%] w-[85vw] h-[45vh] rounded-[48px] transform -rotate-12 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(238, 242, 255, 0.55) 50%, rgba(255, 255, 255, 0.3) 100%)'
            : isMidnight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.06) 0%, rgba(99, 102, 241, 0.1) 40%, rgba(6, 182, 212, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(99, 102, 241, 0.08) 50%, rgba(168, 85, 247, 0.03) 100%)',
          backdropFilter: 'blur(36px)',
          border: isLight
            ? '1px solid rgba(255, 255, 255, 0.85)'
            : isMidnight
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.06)',
          boxShadow: isLight
            ? '0 20px 60px -15px rgba(99, 102, 241, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.95)'
            : isMidnight
            ? '0 25px 80px -20px rgba(0, 0, 0, 0.95), inset 0 1px 1px rgba(255, 255, 255, 0.12)'
            : '0 25px 80px -20px rgba(0, 0, 0, 0.65), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
        }}
      />

      {/* 3. Constant Glass Ribbon 2 — Floating Prismatic Glass across Center-Right */}
      <div
        className="absolute top-[35%] -right-[12%] w-[70vw] h-[35vh] rounded-[40px] transform rotate-8 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(120deg, rgba(255, 255, 255, 0.65) 0%, rgba(243, 232, 255, 0.45) 60%, rgba(255, 255, 255, 0.25) 100%)'
            : isMidnight
            ? 'linear-gradient(120deg, rgba(255, 255, 255, 0.05) 0%, rgba(14, 165, 233, 0.08) 50%, rgba(99, 102, 241, 0.04) 100%)'
            : 'linear-gradient(120deg, rgba(255, 255, 255, 0.04) 0%, rgba(168, 85, 247, 0.06) 50%, rgba(59, 130, 246, 0.03) 100%)',
          backdropFilter: 'blur(30px)',
          border: isLight
            ? '1px solid rgba(255, 255, 255, 0.8)'
            : isMidnight
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: isLight
            ? '0 15px 50px -10px rgba(168, 85, 247, 0.09), inset 0 1px 2px rgba(255, 255, 255, 0.85)'
            : isMidnight
            ? '0 20px 60px -15px rgba(0, 0, 0, 0.85), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
            : '0 20px 60px -15px rgba(0, 0, 0, 0.55), inset 0 1px 1px rgba(255, 255, 255, 0.06)',
        }}
      />

      {/* 4. Constant Glass Prism 3 — Bottom Horizontal Runner */}
      <div
        className="absolute -bottom-[10%] left-[8%] w-[65vw] h-[30vh] rounded-[36px] transform -rotate-3 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(110deg, rgba(255, 255, 255, 0.7) 0%, rgba(224, 231, 255, 0.5) 60%, rgba(255, 255, 255, 0.25) 100%)'
            : isMidnight
            ? 'linear-gradient(110deg, rgba(255, 255, 255, 0.05) 0%, rgba(99, 102, 241, 0.07) 50%, rgba(0, 0, 0, 0.6) 100%)'
            : 'linear-gradient(110deg, rgba(255, 255, 255, 0.04) 0%, rgba(99, 102, 241, 0.06) 50%, rgba(14, 165, 233, 0.03) 100%)',
          backdropFilter: 'blur(28px)',
          border: isLight
            ? '1px solid rgba(255, 255, 255, 0.8)'
            : isMidnight
            ? '1px solid rgba(255, 255, 255, 0.08)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: isLight
            ? '0 10px 40px -10px rgba(99, 102, 241, 0.08)'
            : '0 15px 50px -15px rgba(0, 0, 0, 0.75)',
        }}
      />

      {/* 5. Architectural Glass Grid & Specular Lines */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.045] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(${isLight ? '#4f46e5' : '#818cf8'} 1px, transparent 1px), linear-gradient(90deg, ${isLight ? '#4f46e5' : '#818cf8'} 1px, transparent 1px)`,
          backgroundSize: '80px 80px',
        }}
      />

      {/* 6. Constant Glass Specular Ray */}
      <div
        className="absolute -top-[30%] left-[25%] w-[40vw] h-[120vh] transform rotate-25 pointer-events-none opacity-25 dark:opacity-15"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.18) 50%, transparent 100%)',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
};

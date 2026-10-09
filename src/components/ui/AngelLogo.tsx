/**
 * ANGEL AI — Official Logo & App Icon
 * Uses the exact 'Glossy Iridescent A Ribbon Logo.png' image as the official logo,
 * with scalable responsive sizing, high-DPI rendering, and iridescent ambient glow.
 */

import React, { useState } from 'react';
import angelRibbonLogoImg from '../../assets/images/Glossy Iridescent A Ribbon Logo.png';

interface AngelLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const ANGEL_LOGO_URL = angelRibbonLogoImg;

export const AngelLogo: React.FC<AngelLogoProps> = ({
  className = '',
  size = 28,
  glow = false,
}) => {
  const [loadError, setLoadError] = useState(false);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl blur-md opacity-75 bg-gradient-to-tr from-purple-600 via-indigo-500 to-cyan-400 -z-10 animate-pulse pointer-events-none"
          style={{ transform: 'scale(1.2)' }}
        />
      )}

      {!loadError ? (
        <img
          src={angelRibbonLogoImg}
          onError={() => setLoadError(true)}
          alt="Angel AI Logo"
          className="w-full h-full object-contain drop-shadow-sm select-none pointer-events-none rounded-xl"
          style={{ width: size, height: size }}
          loading="eager"
        />
      ) : (
        /* Graceful vector fallback if image is missing */
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-sm"
        >
          <defs>
            <linearGradient id="fallbackGrad1" x1="20%" y1="90%" x2="80%" y2="10%">
              <stop offset="0%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#A855F7" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>
            <linearGradient id="fallbackGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#A855F7" />
              <stop offset="70%" stopColor="#7C3AED" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
          </defs>
          <path
            d="M 28 72 C 21 68, 20 58, 25 50 L 46 22 C 52 14, 63 15, 68 23 C 73 31, 71 40, 64 48 L 49 66 C 43 73, 34 76, 28 72 Z"
            fill="url(#fallbackGrad1)"
          />
          <path
            d="M 57 44 C 61 38, 70 38, 74 44 L 81 57 C 86 66, 83 76, 74 79 C 66 82, 57 76, 53 67 L 51 60 C 49 54, 52 48, 57 44 Z"
            fill="url(#fallbackGrad2)"
          />
        </svg>
      )}
    </div>
  );
};


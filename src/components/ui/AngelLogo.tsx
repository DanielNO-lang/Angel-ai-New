/**
 * ANGEL AI — Official Logo & App Icon
 * Accurately reproduces the stylized rounded-A violet/indigo emblem
 * from the user's uploaded "Favicon / App Icon" (Image 2) and UI/UX Design Board.
 * Features organic rounded overlapping strokes forming the iconic modern "A"
 * with subtle luminous ambient glow and clean vector scaling.
 */

import React from 'react';

interface AngelLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const AngelLogo: React.FC<AngelLogoProps> = ({
  className = '',
  size = 28,
  glow = false,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl blur-md opacity-70 bg-gradient-to-tr from-purple-600 via-indigo-500 to-violet-400 -z-10 animate-pulse"
          style={{ transform: 'scale(1.25)' }}
        />
      )}
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm transition-transform duration-200"
      >
        <defs>
          {/* Main violet-to-indigo gradient matching Image 2 */}
          <linearGradient id="angelPillGrad1" x1="20%" y1="90%" x2="80%" y2="10%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
          <linearGradient id="angelPillGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="70%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>
          <linearGradient id="angelSquircleBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Optional soft outer squircle accent if large enough */}
        {size >= 36 && (
          <rect
            x="4"
            y="4"
            width="92"
            height="92"
            rx="24"
            fill="#0F121C"
            fillOpacity="0.6"
            stroke="url(#angelSquircleBorder)"
            strokeWidth="2"
          />
        )}

        {/* 
          Official "A" Emblem Geometry (Image 2):
          Left Loop: Slanted upward-right pill, curving gracefully over the apex 
          and transitioning into the inward cross-bridge.
        */}
        <path
          d="M 28 72 
             C 21 68, 20 58, 25 50 
             L 46 22 
             C 52 14, 63 15, 68 23 
             C 73 31, 71 40, 64 48 
             L 49 66 
             C 43 73, 34 76, 28 72 Z"
          fill="url(#angelPillGrad1)"
        />

        {/* 
          Right Leg: Smooth rounded pill descending from below the apex 
          downward-right to complete the stylized 'A'
        */}
        <path
          d="M 57 44 
             C 61 38, 70 38, 74 44 
             L 81 57 
             C 86 66, 83 76, 74 79 
             C 66 82, 57 76, 53 67 
             L 51 60 
             C 49 54, 52 48, 57 44 Z"
          fill="url(#angelPillGrad2)"
        />

        {/* Subtle inner highlight shimmer */}
        <path
          d="M 33 54 L 48 30 C 51 25, 56 26, 58 30"
          stroke="#E9D5FF"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    </div>
  );
};

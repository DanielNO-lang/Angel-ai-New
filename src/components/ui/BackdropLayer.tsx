import React from 'react';
import { useAngel } from '../../context/AppContext';

interface BackdropLayerProps {
  className?: string;
  forceTheme?: 'dark' | 'light';
}

/**
 * Angel's canonical backdrop.
 * Fixed, non-scrolling and non-interactive so every workspace sits above the
 * same visual environment. The glow is intentionally subtle and slow-moving.
 */
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
      className={`backdrop-layer ${isLight ? 'backdrop-light' : 'backdrop-dark'} ${className}`}
    >
      <div className="angel-backdrop-aurora" />
      <div className="angel-backdrop-grid" />
      <div className="angel-backdrop-vignette" />
      <div className="angel-backdrop-orb angel-backdrop-orb-one" />
      <div className="angel-backdrop-orb angel-backdrop-orb-two" />
    </div>
  );
};

import React from 'react';
import { useAngel } from '../../context/AppContext';

interface BackdropLayerProps { className?: string; forceTheme?: 'dark' | 'light'; }

export const BackdropLayer: React.FC<BackdropLayerProps> = ({ className = '', forceTheme }) => {
  const { settings } = useAngel();
  const isLight = forceTheme ? forceTheme === 'light' : settings.theme === 'light';

  return (
    <div aria-hidden="true" data-testid="backdrop-layer" className={`backdrop-layer ${className}`}>
      <div className={`absolute inset-0 ${isLight ? 'angel-backdrop-light' : 'angel-backdrop-dark'}`} />
      <div className="absolute inset-0 angel-backdrop-grid opacity-30" />
      <div className={`angel-orb angel-orb-a ${isLight ? 'opacity-30' : 'opacity-55'}`} />
      <div className={`angel-orb angel-orb-b ${isLight ? 'opacity-20' : 'opacity-40'}`} />
      <div className="angel-backdrop-vignette" />
    </div>
  );
};

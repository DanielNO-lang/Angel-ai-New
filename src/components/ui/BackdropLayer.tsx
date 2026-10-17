import React from 'react';
import { useAngel } from '../../context/AppContext';
import { useIsLightTheme } from '../../utils/useIsLightTheme';
import angelBackdropImg from '../../assets/images/Luminous Angelic A Emblem in Flowing Wings.png';

interface BackdropLayerProps {
  className?: string;
  forceTheme?: 'dark' | 'light' | 'midnight';
}

/** One quiet, shared backdrop for every section. Artwork stays deliberately faint. */
export const BackdropLayer: React.FC<BackdropLayerProps> = ({ className = '', forceTheme }) => {
  const { settings } = useAngel();
  const theme = forceTheme || settings.theme;
  const isLight = useIsLightTheme(theme);
  const isMidnight = theme === 'midnight';
  return (
    <div aria-hidden="true" data-testid="backdrop-layer" className={`backdrop-layer fixed inset-0 z-0 pointer-events-none select-none overflow-hidden ${className}`} style={{ backgroundColor: isLight ? '#f8fafc' : isMidnight ? '#000000' : '#060813' }}>
      <img src={angelBackdropImg} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover object-center" style={{ opacity: isLight ? 0.025 : 0.045, mixBlendMode: isLight ? 'multiply' : 'screen' }} />
    </div>
  );
};

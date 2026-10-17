import React, { useEffect, useState } from 'react';
import { useAngel } from '../../context/AppContext';
import angelBackdropImg from '../../assets/images/Luminous Angelic A Emblem in Flowing Wings.png';

interface BackdropLayerProps {
  className?: string;
  forceTheme?: 'dark' | 'light' | 'midnight';
}

/**
 * One quiet branded layer shared across the app. The artwork is deliberately faint
 * so it never reduces text contrast or creates additional competing decorations.
 */
export const BackdropLayer: React.FC<BackdropLayerProps> = ({ className = '', forceTheme }) => {
  const { settings } = useAngel();
  const [systemDark, setSystemDark] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return true;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (settings.theme !== 'system' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemDark(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, [settings.theme]);

  const chosenTheme = forceTheme || settings.theme;
  const theme = chosenTheme === 'system' ? (systemDark ? 'dark' : 'light') : chosenTheme;
  const isLight = theme === 'light';
  const isMidnight = theme === 'midnight';

  return (
    <div
      aria-hidden="true"
      data-testid="backdrop-layer"
      className={`pointer-events-none fixed inset-0 z-0 select-none overflow-hidden ${className}`}
      style={{ backgroundColor: isLight ? '#F8FAFC' : isMidnight ? '#000000' : '#060813' }}
    >
      {!imageError && (
        <img
          src={angelBackdropImg}
          onError={() => setImageError(true)}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full select-none object-cover object-center"
          style={{
            opacity: isLight ? 0.035 : isMidnight ? 0.055 : 0.06,
            mixBlendMode: isLight ? 'multiply' : 'screen',
          }}
        />
      )}
    </div>
  );
};

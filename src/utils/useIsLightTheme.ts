import { useEffect, useState } from 'react';

/**
 * Resolve Angel's theme preference consistently across every section.
 * In "system" mode this follows operating-system theme changes while mounted.
 */
export function useIsLightTheme(theme: string | undefined | null): boolean {
  const preference = theme || 'dark';
  const [isLight, setIsLight] = useState(() => {
    if (preference === 'light') return true;
    if (preference !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
    return window.matchMedia('(prefers-color-scheme: light)').matches;
  });

  useEffect(() => {
    if (preference !== 'system' || typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      setIsLight(preference === 'light');
      return;
    }
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const update = () => setIsLight(query.matches);
    update();

    if (typeof query.addEventListener === 'function') {
      query.addEventListener('change', update);
      return () => query.removeEventListener('change', update);
    }
    query.addListener(update);
    return () => query.removeListener(update);
  }, [preference]);

  return isLight;
}

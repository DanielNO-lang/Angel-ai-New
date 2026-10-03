/**
 * ANGEL AI — Network Connectivity & Offline PWA Service Worker Listener
 * Alerts the user with a sleek toast when going offline or reconnecting,
 * indicating service worker offline cache and IndexedDB storage readiness.
 */

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X, Database } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const NetworkStatusToast: React.FC = () => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const [swReady, setSwReady] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  useEffect(() => {
    // Check service worker status
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      setSwReady(Boolean(navigator.serviceWorker.controller));
    }

    const handleOffline = () => {
      setIsOffline(true);
      setShowToast(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handlePwaUpdate = () => {
      setUpdateAvailable(true);
      setShowToast(true);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('angel-pwa-update-ready', handlePwaUpdate);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('angel-pwa-update-ready', handlePwaUpdate);
    };
  }, []);

  const handleApplyUpdate = () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  if (!showToast && !isOffline && !updateAvailable) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
          updateAvailable
            ? 'bg-purple-950/90 border-purple-500/40 text-purple-200 shadow-purple-900/30'
            : isOffline
            ? isLight
              ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/10'
              : 'bg-amber-950/90 border-amber-500/40 text-amber-200 shadow-amber-900/30'
            : isLight
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
            : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-900/30'
        }`}
      >
        <div
          className={`p-2 rounded-xl shrink-0 ${
            updateAvailable
              ? 'bg-purple-500/20 text-purple-300'
              : isOffline
              ? isLight
                ? 'bg-amber-100 text-amber-700'
                : 'bg-amber-500/20 text-amber-300'
              : isLight
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          {updateAvailable ? <Database className="w-4 h-4 text-purple-300" /> : isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0 pr-2">
          <p className="text-xs font-semibold tracking-tight">
            {updateAvailable ? 'New Angel Version Available' : isOffline ? 'You are offline' : 'Connection restored'}
          </p>
          <p className="text-[11px] opacity-80 flex items-center gap-1.5 mt-0.5 truncate">
            {updateAvailable ? (
              <span>Reload to run the latest compiled app code</span>
            ) : isOffline ? (
              <>
                <Database className="w-3 h-3 shrink-0" />
                <span>
                  {swReady
                    ? 'Service Worker offline cache & IndexedDB active'
                    : 'IndexedDB local workspace cache active'}
                </span>
              </>
            ) : (
              'Workspace syncing with server'
            )}
          </p>
        </div>

        {updateAvailable ? (
          <button
            onClick={handleApplyUpdate}
            className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
          >
            Reload
          </button>
        ) : (
          <button
            onClick={() => setShowToast(false)}
            className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity shrink-0 ${
              isOffline ? 'hover:bg-amber-500/20' : 'hover:bg-emerald-500/20'
            }`}
            aria-label="Dismiss network alert"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};

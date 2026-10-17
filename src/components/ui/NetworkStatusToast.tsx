/**
 * ANGEL AI — Network Connectivity & Offline Persistence Indicator
 * 
 * Features:
 * - Real-time network detection (online/offline)
 * - Persistent, non-intrusive indicator for unsynced changes accumulated offline
 * - Displays pending queue count for tasks, memories, and workspace entities
 * - One-click "Sync Now" button pushing pending mutations to Supabase
 * - Background Sync status listener with animated sync feedback
 * - PWA Service Worker caching and version update notifications
 * - Minimizable into a non-intrusive compact pill for uninterrupted productivity
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  WifiOff,
  X,
  Database,
  RefreshCw,
  CheckCircle2,
  CloudUpload,
  CloudCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { syncService, SyncStateEvent } from '../../services/syncService';

export const NetworkStatusToast: React.FC = () => {
  const { settings, sessionToken, isGuest } = useAngel();
  const isLight = settings.theme === 'light';

  const [isOffline, setIsOffline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? !navigator.onLine : false;
  });
  const [showToast, setShowToast] = useState<boolean>(false);
  const [swReady, setSwReady] = useState<boolean>(false);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);

  // Unsynced changes state tracked via syncService
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncStatus, setSyncStatus] = useState<string>('synced');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [justSynced, setJustSynced] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const prevPendingCountRef = useRef<number>(0);

  useEffect(() => {
    // Check service worker status
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      setSwReady(Boolean(navigator.serviceWorker.controller));
    }

    // Subscribe to SyncService events for real-time queue status
    const unsubscribeSync = syncService.subscribe((event: SyncStateEvent) => {
      setPendingCount(event.pendingCount);
      setSyncStatus(event.status);
      setIsSyncing(event.status === 'syncing');

      // Trigger brief success confirmation when items transition from > 0 to 0
      if (prevPendingCountRef.current > 0 && event.pendingCount === 0 && event.status === 'synced') {
        setJustSynced(true);
        const timer = setTimeout(() => {
          setJustSynced(false);
        }, 3500);
        return () => clearTimeout(timer);
      }
      prevPendingCountRef.current = event.pendingCount;
    });

    const handleOffline = () => {
      setIsOffline(true);
      setShowToast(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setShowToast(true);
      // Auto-trigger sync when returning online if pending items exist
      if (sessionToken) syncService.setSessionToken(sessionToken);
      syncService.processQueue().catch(() => {});

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
      unsubscribeSync();
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('angel-pwa-update-ready', handlePwaUpdate);
    };
  }, [sessionToken]);

  const handleApplyUpdate = () => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  const handleManualSync = async () => {
    if (isSyncing || isOffline) return;
    setIsSyncing(true);
    try {
      if (sessionToken) syncService.setSessionToken(sessionToken);
      await syncService.processQueue();
    } finally {
      setIsSyncing(false);
    }
  };

  // Determine visibility:
  // Persistent when there are unsynced changes (pendingCount > 0) or offline or update is ready
  const hasUnsyncedChanges = pendingCount > 0;
  const isVisible = showToast || isOffline || updateAvailable || hasUnsyncedChanges || justSynced;

  if (!isVisible) {
    return null;
  }

  // MINIMIZED VIEW: A compact, non-intrusive floating pill that preserves screen space
  if (isMinimized && !updateAvailable) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 animate-in fade-in zoom-in-95 duration-150"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-xl backdrop-blur-xl text-xs font-medium cursor-pointer transition-all hover:scale-105 ${
            isOffline
              ? isLight
                ? 'bg-amber-100/95 border-amber-300 text-amber-900 shadow-amber-500/10'
                : 'bg-[#151208]/90 border-amber-500/40 text-amber-200 shadow-amber-950/40'
              : hasUnsyncedChanges
              ? isLight
                ? 'bg-indigo-50/95 border-indigo-200 text-indigo-950 shadow-indigo-500/10'
                : 'bg-[#0B1020]/90 border-indigo-500/40 text-indigo-200 shadow-indigo-950/40'
              : isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
              : 'bg-[#0B0E14]/90 border-white/10 text-neutral-200 shadow-black/60'
          }`}
          title="Click to expand synchronization details"
        >
          {isOffline ? (
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          ) : isSyncing ? (
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
          ) : hasUnsyncedChanges ? (
            <CloudUpload className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
          )}

          <span>
            {isOffline
              ? hasUnsyncedChanges
                ? `${pendingCount} offline`
                : 'Offline'
              : isSyncing
              ? 'Syncing...'
              : hasUnsyncedChanges
              ? `${pendingCount} unsynced`
              : 'Online'}
          </span>
          <ChevronUp className="w-3 h-3 opacity-60 ml-0.5" />
        </button>
      </div>
    );
  }

  // FULL EXPANDED VIEW: Complete glass notification with rich action controls
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <div
        className={`flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all ${
          updateAvailable
            ? 'bg-purple-950/90 border-purple-500/40 text-purple-200 shadow-purple-950/40'
            : justSynced
            ? isLight
              ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
              : 'bg-[#081510]/95 border-emerald-500/40 text-emerald-200 shadow-emerald-950/40'
            : isOffline
            ? isLight
              ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/10'
              : 'bg-[#151208]/95 border-amber-500/40 text-amber-200 shadow-amber-950/40'
            : hasUnsyncedChanges
            ? isLight
              ? 'bg-indigo-50/95 border-indigo-200 text-indigo-950 shadow-indigo-500/10'
              : 'bg-[#0B1020]/95 border-indigo-500/40 text-indigo-200 shadow-indigo-950/40'
            : isLight
            ? 'bg-emerald-50/95 border-emerald-300 text-emerald-950 shadow-emerald-500/10'
            : 'bg-[#0B0E14]/95 border-white/10 text-neutral-200 shadow-black/60'
        }`}
      >
        {/* Status Icon */}
        <div
          className={`p-2 rounded-xl shrink-0 mt-0.5 ${
            updateAvailable
              ? 'bg-purple-500/20 text-purple-300'
              : justSynced
              ? isLight
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-emerald-500/20 text-emerald-300'
              : isOffline
              ? isLight
                ? 'bg-amber-100 text-amber-700'
                : 'bg-amber-500/20 text-amber-300'
              : isSyncing
              ? isLight
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-indigo-500/20 text-indigo-300'
              : hasUnsyncedChanges
              ? isLight
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-indigo-500/20 text-indigo-300'
              : isLight
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-emerald-500/20 text-emerald-300'
          }`}
        >
          {updateAvailable ? (
            <Database className="w-4 h-4 text-purple-300" />
          ) : justSynced ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : isOffline ? (
            <WifiOff className="w-4 h-4 text-amber-400" />
          ) : isSyncing ? (
            <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
          ) : hasUnsyncedChanges ? (
            <CloudUpload className="w-4 h-4 text-indigo-400" />
          ) : (
            <Wifi className="w-4 h-4 text-emerald-400" />
          )}
        </div>

        {/* Content & Details */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold tracking-tight">
              {updateAvailable
                ? 'New Angel Version Available'
                : justSynced
                ? 'All Changes Synced'
                : isOffline
                ? hasUnsyncedChanges
                  ? `Offline — ${pendingCount} Unsynced Change${pendingCount > 1 ? 's' : ''}`
                  : 'You are offline'
                : isSyncing
                ? `Syncing ${pendingCount} Change${pendingCount > 1 ? 's' : ''}...`
                : hasUnsyncedChanges
                ? `${pendingCount} Unsynced Change${pendingCount > 1 ? 's' : ''} Queued`
                : 'Connection Restored'}
            </p>
          </div>

          <p className="text-[11px] opacity-80 mt-0.5 leading-snug">
            {updateAvailable ? (
              <span>Reload to activate the latest workspace build.</span>
            ) : justSynced ? (
              <span>Local tasks, memories & workflows reconciled with Supabase.</span>
            ) : isOffline ? (
              hasUnsyncedChanges ? (
                <span>
                  Queued in IndexedDB. Will push to Supabase automatically via Background Sync once online.
                </span>
              ) : (
                <span>
                  {swReady
                    ? 'Service Worker cache & IndexedDB active.'
                    : 'Local workspace IndexedDB cache active.'}
                </span>
              )
            ) : isSyncing ? (
              <span>Reconciling queued actions with Supabase cloud database...</span>
            ) : hasUnsyncedChanges ? (
              <span>
                Changes saved locally. Ready to push to Supabase cloud.
              </span>
            ) : (
              <span>Workspace connected and in sync with cloud.</span>
            )}
          </p>

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-2">
            {updateAvailable ? (
              <button
                onClick={handleApplyUpdate}
                className="px-3 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold cursor-pointer shadow-xs transition-colors shrink-0"
              >
                Reload
              </button>
            ) : hasUnsyncedChanges && !isOffline ? (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isLight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs shadow-indigo-900/40'
                } ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
              </button>
            ) : null}

            {/* Minimize toggle button to make it non-intrusive */}
            {!updateAvailable && (
              <button
                onClick={() => setIsMinimized(true)}
                className="text-[10px] opacity-60 hover:opacity-100 transition-opacity flex items-center gap-0.5 cursor-pointer py-1"
                title="Minimize indicator to compact pill"
              >
                <ChevronDown className="w-3 h-3" />
                <span>Minimize</span>
              </button>
            )}
          </div>
        </div>

        {/* Close Button (for transient states) */}
        {!hasUnsyncedChanges && !isOffline && !updateAvailable && (
          <button
            onClick={() => setShowToast(false)}
            className={`p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity shrink-0 ${
              isLight ? 'hover:bg-slate-200/50' : 'hover:bg-white/10'
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

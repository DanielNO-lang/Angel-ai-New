/**
 * ANGEL AI — React Runtime Error Boundary Component
 * Catches unhandled exceptions anywhere in the component tree and renders
 * a sleek, graceful recovery screen instead of crashing the application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { AngelLogo } from './AngelLogo';
import { clearAllLocalIndexedDB } from '../../services/db/offlineDb';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
  showResetConfirm: boolean;
  isResetting: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
      showResetConfirm: false,
      isResetting: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[Angel AI ErrorBoundary] Uncaught runtime exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleOpenResetConfirm = (): void => {
    this.setState({ showResetConfirm: true });
  };

  handleCancelReset = (): void => {
    this.setState({ showResetConfirm: false });
  };

  handleExecuteWorkspaceReset = async (): Promise<void> => {
    this.setState({ isResetting: true });
    try {
      // 1. Reset local IndexedDB tables
      await clearAllLocalIndexedDB();

      // 2. Clear local application storage
      if (typeof localStorage !== 'undefined') {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('angel_') || key.startsWith('angel_ai_') || key === 'settings')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.clear();
      }
    } catch (err) {
      console.warn('[ErrorBoundary] Error during local workspace reset:', err);
    }

    // 3. Cleanly reload application
    window.location.reload();
  };

  handleTryAgain = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null, showResetConfirm: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isLight = typeof document !== 'undefined' && document.documentElement.classList.contains('light');

      return (
        <div
          className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 transition-colors ${
            isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
          }`}
        >
          <div
            className={`w-full max-w-xl p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 ${
              isLight
                ? 'bg-white border-slate-200/80 shadow-slate-300/50'
                : 'bg-[#121622] border-white/10 shadow-black/80'
            }`}
          >
            {/* Header Emblem */}
            <div className="flex items-center gap-3.5 mb-5 pb-5 border-b border-inherit/40">
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 shadow-xs">
                <AngelLogo size={36} glow={true} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold tracking-tight">Angel Workspace Alert</h1>
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-400 border border-red-500/20 font-semibold">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    Handled
                  </span>
                </div>
                <p className="text-xs opacity-70 mt-0.5">
                  An unexpected error occurred in the workspace interface.
                </p>
              </div>
            </div>

            {/* Error Message */}
            <div
              className={`p-3.5 rounded-2xl border text-xs font-medium mb-6 overflow-x-auto custom-scrollbar ${
                isLight
                  ? 'bg-red-50/60 border-red-200 text-red-900'
                  : 'bg-red-950/20 border-red-500/20 text-red-300'
              }`}
            >
              <p className="font-semibold">{this.state.error?.name || 'Error'}:</p>
              <p className="mt-1 opacity-90 break-words">
                {this.state.error?.message || 'An unknown runtime issue interrupted workspace execution.'}
              </p>
            </div>

            {/* Reset Confirmation Warning Box */}
            {this.state.showResetConfirm ? (
              <div
                className={`p-4 rounded-2xl border mb-5 space-y-3 ${
                  isLight ? 'bg-amber-50/80 border-amber-300 text-amber-950' : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Warning: Reset Local Workspace?</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  This will clear your local cached session data and IndexedDB storage to recover from corrupted states.
                  <strong className="block mt-1">Your remote Supabase account and cloud data will NOT be deleted.</strong>
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={this.handleExecuteWorkspaceReset}
                    disabled={this.state.isResetting}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {this.state.isResetting ? 'Resetting...' : 'Confirm Reset Workspace'}
                  </button>
                  <button
                    onClick={this.handleCancelReset}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      isLight ? 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                    }`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Recovery Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <button
                onClick={this.handleTryAgain}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleReload}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleOpenResetConfirm}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ml-auto cursor-pointer ${
                  isLight
                    ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    : 'bg-red-950/20 hover:bg-red-950/40 text-red-400 border-red-500/20'
                }`}
                title="Clears local cache and IndexedDB storage, then safely reloads"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Workspace</span>
              </button>
            </div>

            {/* Collapsible Error Stack Diagnostics */}
            {this.state.errorInfo && (
              <div className="pt-3 border-t border-inherit/40">
                <button
                  onClick={() => this.setState((prev) => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center justify-between w-full text-[11px] font-medium opacity-60 hover:opacity-100 transition-opacity py-1 cursor-pointer"
                >
                  <span>Technical Diagnostics</span>
                  {this.state.showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {this.state.showDetails && (
                  <pre
                    className={`mt-2 p-3 rounded-xl text-[10px] font-medium max-h-48 overflow-y-auto custom-scrollbar border ${
                      isLight
                        ? 'bg-slate-100 border-slate-200 text-slate-700'
                        : 'bg-[#0B0E14] border-white/5 text-neutral-400'
                    }`}
                  >
                    {this.state.error?.stack || 'No stack trace available.'}
                    {'\n\nComponent Stack:'}
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

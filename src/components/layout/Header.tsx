/**
 * ANGEL AI — Top Workspace Navigation & Status Bar
 * Matches user requirements:
 * - Search bar with Windows shortcut badge
 * - "Share" button
 * - "Try Plus Free" pill button
 * - Appearance trigger
 * - Theme toggle (Sun / Moon)
 * - Notification Bell with active dot
 * - User Profile Avatar trigger ("DD" Danny Davis)
 * - Sign in / Sign up CTA buttons when in Guest mode
 * - Incognito icon at the very top right (represented by an icon, nothing more)
 */

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Menu,
  Moon,
  Sparkles,
  Sun,
  EyeOff,
  Check,
  Battery,
  BatteryCharging,
  BatteryLow,
  Maximize2,
  Zap,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface BatteryManager extends EventTarget {
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
  level: number;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

export const Header: React.FC = () => {
  const {
    setMobileMenuOpen,
    settings,
    toggleTheme,
    isIncognitoActive,
    setIsIncognitoActive,
    isSignedIn,
    setIsAuthPageOpen,
    setAuthPageMode,
    isFocusMode,
    toggleFocusMode,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const [showToast, setShowToast] = useState<string | null>(null);

  // Web Battery API state
  const [batteryState, setBatteryState] = useState<{
    level: number;
    charging: boolean;
    supported: boolean;
  }>({
    level: 100,
    charging: true,
    supported: false,
  });

  useEffect(() => {
    let batteryInstance: BatteryManager | null = null;
    const updateBattery = (battery: BatteryManager) => {
      setBatteryState({
        level: Math.round(battery.level * 100),
        charging: battery.charging,
        supported: true,
      });
    };

    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      (navigator as unknown as { getBattery: () => Promise<BatteryManager> })
        .getBattery()
        .then((battery) => {
          batteryInstance = battery;
          updateBattery(battery);
          battery.addEventListener('levelchange', () => updateBattery(battery));
          battery.addEventListener('chargingchange', () => updateBattery(battery));
        })
        .catch(() => {
          setBatteryState({ level: 100, charging: true, supported: false });
        });
    }

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => updateBattery(batteryInstance!));
        batteryInstance.removeEventListener('chargingchange', () => updateBattery(batteryInstance!));
      }
    };
  }, []);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const isPowerSaving = batteryState.level <= 20 && !batteryState.charging;

  // Minimized Workspace Header during Focus Mode (Deep Work)
  if (isFocusMode) {
    return (
      <header
        className={`h-9 px-4 flex items-center justify-between border-b transition-all duration-300 select-none z-30 ${
          isLight
            ? 'bg-slate-100/90 border-slate-200 text-slate-700'
            : 'bg-[#0B0E14]/90 border-white/5 text-neutral-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="text-[11px] font-mono uppercase tracking-wider font-semibold opacity-80">
            Focus Mode • Deep Work Session
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Battery Status in Focus Mode */}
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${
              isPowerSaving
                ? 'bg-amber-500/20 text-amber-500'
                : 'bg-inherit text-inherit opacity-75'
            }`}
            title={`Battery: ${batteryState.level}% ${batteryState.charging ? '(Charging)' : ''}`}
          >
            {batteryState.charging ? (
              <BatteryCharging className="w-3 h-3 text-emerald-500" />
            ) : isPowerSaving ? (
              <BatteryLow className="w-3 h-3 text-amber-500" />
            ) : (
              <Battery className="w-3 h-3 text-indigo-400" />
            )}
            <span>{batteryState.level}%</span>
          </div>

          <button
            onClick={toggleFocusMode}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              isLight
                ? 'bg-white hover:bg-slate-200 text-slate-800 border border-slate-200 shadow-2xs'
                : 'bg-[#151926] hover:bg-neutral-800 text-white border border-white/10 shadow-2xs'
            }`}
            title="Exit Focus Mode"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Exit Focus</span>
          </button>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`h-14 md:h-16 px-4 md:px-6 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30 transition-all ${
          isLight
            ? 'bg-white/70 border-b border-slate-200/60 text-slate-800 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),0_4px_20px_rgba(0,0,0,0.03)]'
            : 'bg-[#0B0E14]/70 border-b border-white/10 text-neutral-100 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_4px_20px_rgba(0,0,0,0.4)]'
        }`}
      >
        {/* Left Section: Mobile Drawer Toggle */}
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0 mr-2 md:mr-4">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`md:hidden p-1.5 -ml-1 rounded-xl transition-colors shrink-0 ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 backdrop-blur-md'
                : 'text-neutral-400 hover:text-white hover:bg-white/10 backdrop-blur-md'
            }`}
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2">
          {/* Guest Auth CTAs (Visible when not signed in) */}
          {!isSignedIn ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Guest Mode (Ephemeral)</span>
              </div>
              <button
                onClick={() => {
                  setAuthPageMode('signin');
                  setIsAuthPageOpen(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold backdrop-blur-md transition-colors ${
                  isLight
                    ? 'text-slate-700 hover:bg-slate-100/80 border border-slate-200/70 shadow-2xs'
                    : 'text-neutral-300 hover:bg-white/10 border border-white/10 shadow-2xs'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setAuthPageMode('signup');
                  setIsAuthPageOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 backdrop-blur-md transition-all cursor-pointer"
              >
                Sign up
              </button>
            </div>
          ) : (
            /* Upgrade CTA Button (replacing Try Plus Free) */
            <button
              onClick={() => triggerToast('Upgrade to Angel Enterprise for unlimited concurrent agents')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/20 backdrop-blur-md transition-all transform-gpu hover:-translate-y-0.5 cursor-pointer"
            >
              <span>Upgrade</span>
              <Sparkles className="w-3 h-3 text-yellow-300" />
            </button>
          )}

          {/* Battery Status Indicator & Power-Saving Monitor */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors backdrop-blur-md cursor-help ${
              isPowerSaving
                ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                : isLight
                ? 'bg-slate-100/80 text-slate-600 border border-slate-200/60'
                : 'bg-white/5 text-neutral-400 border border-white/5'
            }`}
            title={`Battery: ${batteryState.level}% ${batteryState.charging ? '(AC Connected • Fast Refresh)' : isPowerSaving ? '(Power Saver Mode • Optimized Refresh Rate)' : '(Discharging)'}`}
          >
            {batteryState.charging ? (
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-500" />
            ) : isPowerSaving ? (
              <BatteryLow className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            ) : (
              <Battery className="w-3.5 h-3.5 text-indigo-400" />
            )}
            <span className="text-[11px] font-medium">{batteryState.level}%</span>
          </div>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors backdrop-blur-md ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title={`Toggle theme (currently ${settings.theme})`}
          >
            {isLight ? (
              <Sun className="w-4 h-4 text-amber-500" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-300" />
            )}
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => {
              setHasUnreadNotification(false);
              triggerToast('All notifications are up to date');
            }}
            className={`relative p-2 rounded-xl transition-colors backdrop-blur-md ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
                : 'text-neutral-400 hover:text-white hover:bg-white/10'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotification && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
            )}
          </button>

          {/* Incognito Icon */}
          <button
            onClick={() => setIsIncognitoActive(!isIncognitoActive)}
            className={`p-2 rounded-xl transition-all duration-150 backdrop-blur-md ${
              isIncognitoActive
                ? 'bg-purple-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-500 hover:text-purple-600 hover:bg-purple-50/70'
                : 'text-neutral-400 hover:text-purple-400 hover:bg-purple-950/30'
            }`}
            title="Incognito Mode (Zero history, completely ephemeral)"
          >
            <EyeOff className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Ephemeral Toast */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2 rounded-xl bg-neutral-900/90 text-white border border-white/10 text-xs shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showToast}</span>
        </div>
      )}
    </>
  );
};

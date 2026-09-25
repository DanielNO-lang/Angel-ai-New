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

import React, { useState } from 'react';
import {
  Bell,
  Menu,
  Moon,
  Search,
  Share2,
  Sparkles,
  Sun,
  Sliders,
  EyeOff,
  LogIn,
  Check,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { UserProfileMenu } from './UserProfileMenu';
import { AppearanceModal } from './AppearanceModal';
import { WindowsShortcutBadge } from '../ui/WindowsShortcutBadge';

export const Header: React.FC = () => {
  const {
    setMobileMenuOpen,
    openCommandPalette,
    userProfile,
    settings,
    toggleTheme,
    isIncognitoActive,
    setIsIncognitoActive,
    isSignedIn,
    setIsAuthPageOpen,
    setAuthPageMode,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [isUserProfileOpen, setIsUserProfileOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const [showToast, setShowToast] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setShowToast(msg);
    setTimeout(() => setShowToast(null), 2500);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    triggerToast('Workspace link copied to clipboard');
  };

  return (
    <>
      <header
        className={`h-14 md:h-16 px-3 md:px-6 backdrop-blur-md flex items-center justify-between sticky top-0 z-20 transition-colors duration-150 ${
          isLight
            ? 'bg-white/95 border-b border-slate-200/80 text-slate-800'
            : 'bg-[#0B0E14]/90 border-b border-white/5 text-neutral-100'
        }`}
      >
        {/* Left Section: Mobile Drawer Toggle & Workspace Search */}
        <div className="flex items-center gap-2 md:gap-4 flex-1 max-w-sm sm:max-w-md">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className={`md:hidden p-1.5 -ml-1 rounded-xl transition-colors ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
            aria-label="Open navigation drawer"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search anything... with Windows Shortcut Badge */}
          <button
            onClick={() => openCommandPalette('all')}
            className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 md:py-2 rounded-xl text-xs transition-all cursor-pointer group shadow-2xs ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-700'
                : 'bg-neutral-900/80 hover:bg-neutral-900 border border-white/5 text-neutral-400 hover:text-neutral-200'
            }`}
            title="Search workspace (Win + K)"
          >
            <div className="flex items-center gap-2 min-w-0">
              <Search
                className={`w-3.5 h-3.5 shrink-0 ${
                  isLight ? 'text-slate-400 group-hover:text-slate-700' : 'text-neutral-400 group-hover:text-white'
                }`}
              />
              <span className="truncate">Search anything...</span>
            </div>
            <WindowsShortcutBadge shortcut="K" />
          </button>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-2">
          {/* Guest Auth CTAs (Visible when not signed in) */}
          {!isSignedIn ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setAuthPageMode('signin');
                  setIsAuthPageOpen(true);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isLight
                    ? 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                    : 'text-neutral-300 hover:bg-neutral-800 border border-white/10'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => {
                  setAuthPageMode('signup');
                  setIsAuthPageOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xs transition-all"
              >
                Sign up
              </button>
            </div>
          ) : (
            <>
              {/* Share Button */}
              <button
                onClick={handleShare}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-neutral-900/80 hover:bg-neutral-900 text-neutral-300 hover:text-white border border-white/5'
                }`}
                title="Share current view"
              >
                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Share</span>
              </button>

              {/* Try Plus Free Pill */}
              <button
                onClick={() => triggerToast('Angel Pro is active with unlimited multi-agent executions')}
                className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-xs transition-all transform-gpu hover:-translate-y-0.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Try Plus Free</span>
              </button>
            </>
          )}

          {/* Appearance Modal Trigger */}
          <button
            onClick={() => setIsAppearanceOpen(true)}
            className={`p-2 rounded-xl transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
            title="Appearance settings"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Theme Toggle (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
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
            className={`relative p-2 rounded-xl transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
            }`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotification && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/20" />
            )}
          </button>

          {/* User Profile Avatar Trigger */}
          <button
            onClick={() => {
              if (!isSignedIn) {
                setAuthPageMode('signin');
                setIsAuthPageOpen(true);
              } else {
                setIsUserProfileOpen(true);
              }
            }}
            className="flex items-center gap-2 p-1 rounded-xl hover:opacity-90 transition-opacity"
            title={isSignedIn ? 'Danny Davis account settings' : 'Sign in'}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-xs shadow-xs">
              {isSignedIn ? (userProfile.initials || 'DD') : 'GU'}
            </div>
          </button>

          {/* ========================================================
              INCOGNITO ICON AT VERY TOP RIGHT
              User specification: "represented by an icon, nothing more"
              ======================================================== */}
          <button
            onClick={() => setIsIncognitoActive(!isIncognitoActive)}
            className={`p-2 rounded-xl transition-all duration-150 ${
              isIncognitoActive
                ? 'bg-purple-600 text-white shadow-xs'
                : isLight
                ? 'text-slate-500 hover:text-purple-600 hover:bg-purple-50'
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

      {/* Profile & Settings Drawer */}
      <UserProfileMenu
        isOpen={isUserProfileOpen}
        onClose={() => setIsUserProfileOpen(false)}
      />

      {/* Appearance Modal */}
      <AppearanceModal
        isOpen={isAppearanceOpen}
        onClose={() => setIsAppearanceOpen(false)}
      />
    </>
  );
};

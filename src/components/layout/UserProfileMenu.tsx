/**
 * ANGEL AI — User Profile & Workspace Account Menu
 * Matching Image 1 & Image 6 specifications with full Light and Dark theme responsiveness.
 */

import React, { useState } from 'react';
import {
  User,
  Sliders,
  Settings,
  HelpCircle,
  Sparkles,
  FileText,
  Download,
  Command,
  Shield,
  Bug,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface UserProfileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({
  isOpen,
  onClose,
}) => {
  const { userProfile, settings, updateSettings, toggleTheme, setActiveTab, signOut } = useAngel();
  const isLight = settings.theme === 'light';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-start justify-start p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      {/* Click outside to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Menu Card */}
      <div
        className={`relative z-10 w-full max-w-xs sm:w-80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh] ${
          isLight
            ? 'bg-white border border-slate-200 text-slate-800'
            : 'bg-[#0E121B] border border-white/10 text-neutral-100'
        }`}
        style={{ marginTop: 'auto', marginBottom: '4.5rem' }}
      >
        {/* User Card Header — Clicking opens unified Settings */}
        <div
          onClick={() => {
            setActiveTab('settings');
            onClose();
          }}
          className={`p-4 border-b cursor-pointer transition-colors ${
            isLight
              ? 'border-slate-100 bg-slate-50 hover:bg-slate-100/70'
              : 'border-white/5 bg-[#121622] hover:bg-[#161b2b]'
          }`}
          title="Open Settings"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-semibold text-white text-sm shadow-md">
                {userProfile.initials || 'DD'}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                  isLight ? 'border-white' : 'border-neutral-900'
                } ${
                  userProfile.status === 'online'
                    ? 'bg-emerald-500'
                    : userProfile.status === 'away'
                    ? 'bg-amber-500'
                    : 'bg-neutral-500'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-semibold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {userProfile.name}
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                  {userProfile.plan}
                </span>
              </div>
              <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {userProfile.email}
              </p>
            </div>
          </div>

          {/* Try Plus Free Banner Button */}
          <div className="mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab('settings');
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-semibold shadow-md transition-all group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Try Plus Free</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Navigation Options */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar text-xs">
          {/* Unified Settings Link */}
          <button
            onClick={() => {
              setActiveTab('settings');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
              isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <span className="font-semibold block">Settings</span>
                <span className={`text-[10px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                  Account, Appearance, Workspace
                </span>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <button
            onClick={() => {
              setActiveTab('settings');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors ${
              isLight ? 'text-slate-700 hover:bg-slate-100' : 'text-neutral-300 hover:text-white hover:bg-neutral-800/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-4 h-4 text-neutral-400" />
              <span>Help & Support</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </button>

          <div className={`pt-1 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`}>
            <button
              onClick={() => {
                signOut();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

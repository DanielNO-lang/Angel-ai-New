/**
 * ANGEL AI — Unified Settings Center
 * Categorized Sub-Navigation grouping:
 *  - Personal & Identity: 'Account', 'Profile'
 *  - Design & Display: 'Appearance', 'Theme'
 *  - Workspace & System: 'Workspace Settings'
 *  - Capabilities: 'Voice & Speech', 'Visual Multimodal', 'Memory Vault'
 *  - Security & Privacy: 'Privacy & Incognito', 'Notifications', 'Connections & SQL', 'Security & Reset'
 * Full Light & Dark mode support adhering to Angel AI visual identity.
 */

import React, { useEffect, useState } from 'react';
import {
  User,
  Palette,
  Sliders,
  Mic,
  Eye,
  Brain,
  Shield,
  Bell,
  Network,
  Lock,
  Sun,
  Moon,
  Laptop,
  Check,
  Save,
  Trash2,
  Copy,
  Flame,
  LogOut,
  Mail,
  CreditCard,
  Key,
  Globe,
  Github,
  CheckCircle2,
  SlidersHorizontal,
  LayoutGrid,
  Volume2,
  Monitor,
  Database,
  RefreshCw,
  Clock,
  Briefcase,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { SUPABASE_SCHEMA_SQL } from '../../data/supabaseSchema';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { ConnectionsWorkspace } from '../connections/ConnectionsWorkspace';
import { UserProfileSettings } from './UserProfileSettings';
import { playThemeSound } from '../../utils/themeAudio';

export type SettingsSubSection =
  | 'account'
  | 'profile'
  | 'appearance'
  | 'theme'
  | 'workspace'
  | 'voice'
  | 'visual'
  | 'memory'
  | 'privacy'
  | 'notifications'
  | 'connections'
  | 'security';

interface NavItem {
  id: SettingsSubSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

export const SettingsView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    settings,
    updateSettings,
    clearAllData,
    signOut,
    activeSettingsSection,
    setActiveSettingsSection,
    isFocusMode,
    setIsFocusMode,
    exportWorkspaceData,
    lastAutosavedAt,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Active Sub-Section from Context
  const activeSection = activeSettingsSection;
  const setActiveSection = setActiveSettingsSection;
  const [isSaved, setIsSaved] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Profile form states
  const [profileName, setProfileName] = useState(userProfile.name || 'Daniel Nwachukwu');
  const [profileEmail, setProfileEmail] = useState(userProfile.email || 'danielokohnwachukwu22@gmail.com');
  const [profileHandle, setProfileHandle] = useState('daniel');
  const [profileBio, setProfileBio] = useState('AI engineer and autonomous systems developer.');
  const [profileRole, setProfileRole] = useState('Lead Architect');
  const [profileTimezone, setProfileTimezone] = useState('UTC-07:00 (Pacific Time)');
  const [isProfileSaved, setIsProfileSaved] = useState(false);

  // Appearance states
  const [accentColor, setAccentColor] = useState('indigo');
  const [fontScale, setFontScale] = useState(() => {
    try { return localStorage.getItem('angel_font_scale') || 'comfortable'; } catch { return 'comfortable'; }
  });

  useEffect(() => {
    const fontSizes: Record<string, string> = { compact: '14px', medium: '16px', comfortable: '18px' };
    document.documentElement.style.fontSize = fontSizes[fontScale] || '18px';
    try { localStorage.setItem('angel_font_scale', fontScale); } catch {}
  }, [fontScale]);

  useEffect(() => {
    if (activeSection === 'visual' || activeSection === 'privacy') setActiveSection('account');
  }, [activeSection, setActiveSection]);
  const [animationEffects, setAnimationEffects] = useState(true);
  const [uiDensity, setUiDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [soundEffects, setSoundEffects] = useState(true);

  // Theme states
  const [backdropIntensity, setBackdropIntensity] = useState<'subtle' | 'standard' | 'vivid'>('standard');
  const [highContrast, setHighContrast] = useState(false);

  // Workspace settings states
  const [language, setLanguage] = useState('English (US)');
  const [startOnHome, setStartOnHome] = useState(true);
  const [autoSaveDrafts, setAutoSaveDrafts] = useState(true);
  const [defaultModel, setDefaultModel] = useState('Gemini 3.8 Flash');
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [streamResponses, setStreamResponses] = useState(true);
  const [codeHighlighting, setCodeHighlighting] = useState(true);

  // Voice states
  const [defaultVoice, setDefaultVoice] = useState('Nova (Balanced)');
  const [speechRate, setSpeechRate] = useState('1.0x');

  // Privacy & Notifications
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [telemetryOptOut, setTelemetryOptOut] = useState(true);
  const [zeroRetentionVoice, setZeroRetentionVoice] = useState(true);

  // Supabase SQL copy state
  const [copiedSql, setCopiedSql] = useState(false);

  // Categorized Sub-Navigation Structure
  const navigationCategories: NavCategory[] = [
    {
      category: 'Account & Profile',
      items: [
        {
          id: 'account',
          label: 'Account',
          icon: CreditCard,
          badge: userProfile.plan,
          description: 'Subscription, credentials, & billing',
        },
        {
          id: 'profile',
          label: 'Profile',
          icon: User,
          description: 'Identity, avatar, bio, & timezone',
        },
      ],
    },
    {
      category: 'Appearance & Theme',
      items: [
        {
          id: 'appearance',
          label: 'Appearance',
          icon: Palette,
          description: 'Typography, accents, & density',
        },
        {
          id: 'theme',
          label: 'Theme',
          icon: isLight ? Sun : Moon,
          description: 'Dark, light, & cosmic backdrop',
        },
      ],
    },
    {
      category: 'Workspace',
      items: [
        {
          id: 'workspace',
          label: 'Workspace Settings',
          icon: Sliders,
          description: 'Models, composer, & shortcuts',
        },
      ],
    },
    {
      category: 'AI Capabilities',
      items: [
        {
          id: 'voice',
          label: 'Voice & Speech',
          icon: Mic,
          description: 'TTS synthesis & voice models',
        },
        {
          id: 'memory',
          label: 'Memory Vault',
          icon: Brain,
          description: 'Context retention & episodic recall',
        },
      ],
    },
    {
      category: 'Security & System',
      items: [
        {
          id: 'notifications',
          label: 'Notifications',
          icon: Bell,
          description: 'Push alerts & background chimes',
        },
        {
          id: 'connections',
          label: 'Connections & SQL',
          icon: Network,
          description: 'Database schema & API webhooks',
        },
        {
          id: 'security',
          label: 'Security & Reset',
          icon: Lock,
          description: 'Credentials & factory wipe',
        },
      ],
    },
  ];

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name: profileName, email: profileEmail });
    setIsProfileSaved(true);
    setTimeout(() => setIsProfileSaved(false), 2000);
  };

  const handleSaveWorkspaceChanges = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const [isExporting, setIsExporting] = useState(false);
  const [isExportSuccess, setIsExportSuccess] = useState(false);

  const handleExportWorkspace = async () => {
    setIsExporting(true);
    try {
      await exportWorkspaceData();
      setIsExportSuccess(true);
      setTimeout(() => setIsExportSuccess(false), 2500);
    } catch (e) {
      console.warn('Workspace export error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Top Header - Fixed Non-Transparent */}
      <div
        className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex items-center justify-between shadow-xs ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#0B0E14] border-white/10 text-neutral-100'
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`p-2 rounded-2xl border ${
              isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Settings & Connections</h1>
            <span className="text-[11px] font-medium opacity-60">System Configuration & Integration Control</span>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Sub-Navigation Scroller */}
      <div className="md:hidden flex items-center gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
        {navigationCategories.flatMap((cat) => cat.items).map((item) => {
          const Icon = item.icon;
          const isSelected = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors border ${
                isSelected
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-700'
                  : 'bg-[#121622] border-white/10 text-neutral-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Dashboard Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Left Categorized Sub-Navigation Rail (Desktop/Tablet) */}
        <div
          className={`hidden md:block md:col-span-4 lg:col-span-3 rounded-2xl border p-2 space-y-2 shadow-xs sticky top-4 ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-slate-200/50'
              : 'bg-[#121622] border-white/5 shadow-black/40'
          }`}
        >
          <div className="px-2 pt-0.5 pb-0.5 flex items-center justify-between">
            <span className="text-[9.5px] font-medium uppercase tracking-wider opacity-60">
              Categorized Navigation
            </span>
            <span className="text-[9.5px] font-medium text-indigo-500 font-semibold">
              Angel Core
            </span>
          </div>

          <div className="space-y-2">
            {navigationCategories.map((group) => (
              <div key={group.category} className="space-y-0.5">
                {/* Category Header */}
                <div className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider opacity-50 flex items-center gap-1.5">
                  <span className="w-1 h-1 rounded-full bg-indigo-500" />
                  <span>{group.category}</span>
                </div>

                {/* Sub-Navigation Items */}
                <div className="space-y-0.5">
                  {group.items.map((sec) => {
                    const Icon = sec.icon;
                    const isSelected = activeSection === sec.id;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                          isSelected
                            ? isLight
                              ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-200 shadow-2xs'
                              : 'bg-indigo-600/20 text-white border border-indigo-500/40 font-bold shadow-2xs'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border border-transparent'
                            : 'text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isSelected ? 'text-indigo-500' : 'opacity-60'
                            }`}
                          />
                          <span className="truncate">{sec.label}</span>
                        </div>
                        {sec.badge && (
                          <span className="text-[8.5px] font-semibold px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                            {sec.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Active Sub-Section View Content */}
        <div
          className={`md:col-span-8 lg:col-span-9 rounded-3xl border p-6 sm:p-7 space-y-6 shadow-md ${
            isLight
              ? 'bg-white border-slate-200/90 shadow-slate-200/50'
              : 'bg-[#121622] border-white/5 shadow-black/60'
          }`}
        >
          {/* ==========================================================
              SUBSECTION 1: ACCOUNT (Categorized under Personal & Identity)
             ========================================================== */}
          {activeSection === 'account' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Account & Subscription</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Subscription tier, credential authentication, billing status, and third-party identity.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/50 border-white/10'}`}>
                <div className="text-xs font-semibold uppercase tracking-wider text-indigo-500">Current plan</div>
                <div className="mt-1 text-lg font-bold">{userProfile.plan}</div>
                <p className={`mt-1 text-sm ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                  Your current account tier. Billing management will appear here when a billing provider is connected.
                </p>
              </div>

              {/* Sign Out Action */}
              <div className="pt-4 border-t border-inherit flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-red-500 block">Sign Out</span>
                  <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                    Terminate current authenticated session on this browser
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut()}
                  className="px-3.5 py-2 rounded-xl border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 2: PROFILE (Categorized under Personal & Identity)
             ========================================================== */}
          {activeSection === 'profile' && (
            <UserProfileSettings />
          )}

          {/* ==========================================================
              SUBSECTION 3: APPEARANCE (Categorized under Appearance & Theme)
             ========================================================== */}
          {activeSection === 'appearance' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Appearance & Interface</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Accent color highlights, typography sizing scale, interface density, and glowing visual aura.
                </p>
              </div>

              {/* Accent Color Palette */}
              <div className="space-y-3">
                <label className="text-xs font-semibold block opacity-80">Accent Color Accentuation</label>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600' },
                    { id: 'purple', label: 'Violet', bg: 'bg-purple-600' },
                    { id: 'pink', label: 'Rose', bg: 'bg-pink-600' },
                    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600' },
                    { id: 'amber', label: 'Amber', bg: 'bg-amber-600' },
                  ].map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setAccentColor(c.id)}
                      className={`w-9 h-9 rounded-2xl ${c.bg} flex items-center justify-center transition-all ${
                        accentColor === c.id ? 'ring-4 ring-indigo-400/40 scale-105 shadow-md' : 'opacity-70 hover:opacity-100'
                      }`}
                      title={c.label}
                    >
                      {accentColor === c.id && <Check className="w-4 h-4 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Sizing Scale */}
              <div className="space-y-2">
                <label className="text-xs font-semibold block opacity-80">Font Sizing Scale</label>
                <div className="grid grid-cols-3 gap-2.5 max-w-sm">
                  {[
                    { id: 'compact', label: 'Compact (14px)' },
                    { id: 'medium', label: 'Medium (16px)' },
                    { id: 'comfortable', label: 'Comfortable (18px)' },
                  ].map((scale) => (
                    <button
                      key={scale.id}
                      onClick={() => setFontScale(scale.id)}
                      className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                        fontScale === scale.id
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold shadow-xs'
                          : 'border-inherit opacity-70 hover:opacity-100'
                      }`}
                    >
                      {scale.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Density */}
              <div className="space-y-2">
                <label className="text-xs font-semibold block opacity-80">Layout Density</label>
                <div className="grid grid-cols-2 gap-2.5 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setUiDensity('comfortable')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                      uiDensity === 'comfortable'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold'
                        : 'border-inherit opacity-70 hover:opacity-100'
                    }`}
                  >
                    Comfortable (Standard)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUiDensity('compact')}
                    className={`py-2 px-3 rounded-xl border text-xs text-center transition-all ${
                      uiDensity === 'compact'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold'
                        : 'border-inherit opacity-70 hover:opacity-100'
                    }`}
                  >
                    Compact (High Data)
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-3 border-t border-inherit">
                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block flex items-center gap-1.5">
                      <span>Focus Mode (Deep Work)</span>
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold">New</span>
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Hides the sidebar and minimizes the workspace header to eliminate distractions during deep work sessions.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isFocusMode}
                    onChange={(e) => setIsFocusMode(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Interactive Workspace Tour</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Revisit the guided walkthrough highlighting the sidebar, chat, and AI tools.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && (window as unknown as { startAngelTour?: () => void }).startAngelTour) {
                        (window as unknown as { startAngelTour: () => void }).startAngelTour();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-100 border-slate-200 text-slate-700' : 'hover:bg-neutral-800 border-white/10 text-neutral-300'
                    }`}
                  >
                    Start Tour
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Cosmic Ambient Glow Effects</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Enable smooth radial blur orbs and luminous gradient auras
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={animationEffects}
                    onChange={(e) => setAnimationEffects(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Interface Chimes & Audio Feedback</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Subtle tactile audio cues for button clicks and task completions
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={soundEffects}
                    onChange={(e) => setSoundEffects(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 4: THEME (Categorized under Appearance & Theme)
             ========================================================== */}
          {activeSection === 'theme' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Theme Mode & Lighting Treatment</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Choose between deep cosmic dark mode, soft lavender light mode, or system synchronization.
                </p>
              </div>

              {/* Theme Mode Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {/* System Auto Card */}
                <button
                  type="button"
                  onClick={() => {
                    playThemeSound('system');
                    updateSettings({ theme: 'system' });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    settings.theme === 'system'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-inherit hover:border-indigo-400/40 opacity-70 hover:opacity-100'
                  } ${isLight ? 'bg-white text-slate-900' : 'bg-neutral-900 text-white'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Laptop className="w-4 h-4 text-indigo-400" />
                    {settings.theme === 'system' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <h4 className="text-[11px] font-bold">System Default</h4>
                  <p className="text-[9.5px] opacity-60 mt-0.5 leading-relaxed">
                    Automatically match OS day/night preferences.
                  </p>
                </button>

                {/* Light Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    playThemeSound('light');
                    updateSettings({ theme: 'light' });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    settings.theme === 'light'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-inherit hover:border-indigo-400/40 opacity-70 hover:opacity-100'
                  } bg-[#F9FAFD] text-slate-900`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Sun className="w-4 h-4 text-amber-500" />
                    {settings.theme === 'light' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <h4 className="text-[11px] font-bold">Radiant Light</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5 leading-relaxed">
                    Crisp canvas with maximum readability.
                  </p>
                </button>

                {/* Dark Mode Card */}
                <button
                  type="button"
                  onClick={() => {
                    playThemeSound('dark');
                    updateSettings({ theme: 'dark' });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    settings.theme === 'dark'
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-inherit hover:border-indigo-400/40 opacity-70 hover:opacity-100'
                  } bg-[#0A0D15] text-white`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    {settings.theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                  <h4 className="text-[11px] font-bold">Cosmic Dark</h4>
                  <p className="text-[9.5px] text-neutral-400 mt-0.5 leading-relaxed">
                    Charcoal base with deep violet glass auras.
                  </p>
                </button>

                {/* Midnight High-Contrast Card */}
                <button
                  type="button"
                  onClick={() => {
                    playThemeSound('midnight');
                    updateSettings({ theme: 'midnight' });
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all relative overflow-hidden ${
                    settings.theme === 'midnight'
                      ? 'border-cyan-400 ring-2 ring-cyan-400/30 shadow-xs'
                      : 'border-inherit hover:border-cyan-400/40 opacity-70 hover:opacity-100'
                  } bg-[#000000] text-white`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 flex items-center justify-center text-[8px] font-bold text-black">
                        M
                      </div>
                      <span className="text-[8px] font-medium uppercase px-1 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                        OLED
                      </span>
                    </div>
                    {settings.theme === 'midnight' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <h4 className="text-[11px] font-bold">Midnight</h4>
                  <p className="text-[9.5px] text-neutral-300 mt-0.5 leading-relaxed">
                    Pure black with sharp electric accents.
                  </p>
                </button>
              </div>

              {/* Atmospheric Backdrop Lighting Treatment */}
              <div className="space-y-3 pt-3 border-t border-inherit">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold">Independent Backdrop Layer Intensity</h4>
                    <p className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Adjust the fixed atmospheric glow orbs rendered beneath the interface (z-index: 0)
                    </p>
                  </div>
                  <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-bold">
                    {backdropIntensity}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5 max-w-sm">
                  {(['subtle', 'standard', 'vivid'] as const).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => setBackdropIntensity(intensity)}
                      className={`py-2 px-3 rounded-xl border text-xs capitalize text-center transition-all ${
                        backdropIntensity === intensity
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold'
                          : 'border-inherit opacity-70 hover:opacity-100'
                      }`}
                    >
                      {intensity}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 5: WORKSPACE SETTINGS (Categorized under Workspace)
             ========================================================== */}
          {activeSection === 'workspace' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Workspace Settings</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Model inference intelligence, prompt composer behavior, keyboard dispatching, and localization.
                </p>
              </div>

              {/* Default Model Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold block opacity-80">Default Inference Model</label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className={`w-full max-w-sm px-3.5 py-2.5 rounded-xl text-xs border outline-none font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-neutral-900 border-white/10 text-neutral-200 focus:border-indigo-500'
                  }`}
                >
                  <option value="Gemini 3.8 Flash">Gemini 3.8 Flash (Recommended • Fast & Multimodal)</option>
                  <option value="GPT-4o">GPT-4o (Omni Reasoning)</option>
                  <option value="Claude 3.5 Sonnet">Claude 3.5 Sonnet (Code & Writing)</option>
                  <option value="Angel Core Autonomous">Angel Core Autonomous Orchestrator</option>
                </select>
              </div>

              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold block opacity-80">Language & Region</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`w-full max-w-sm px-3.5 py-2.5 rounded-xl text-xs border outline-none font-medium transition-colors ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-neutral-900 border-white/10 text-neutral-200 focus:border-indigo-500'
                  }`}
                >
                  <option value="English (US)">English (US)</option>
                  <option value="English (UK)">English (UK)</option>
                  <option value="Spanish (ES)">Español (ES)</option>
                  <option value="French (FR)">Français (FR)</option>
                  <option value="German (DE)">Deutsch (DE)</option>
                  <option value="Japanese (JA)">日本語 (JA)</option>
                </select>
              </div>

              {/* Startup & Editor Toggles */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Start on Home Workspace</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Launch Angel directly on the Home dashboard instead of the previous conversation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={startOnHome}
                    onChange={(e) => setStartOnHome(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Auto-save Message Drafts</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Persist in-progress chat input drafts automatically across page changes
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoSaveDrafts}
                    onChange={(e) => setAutoSaveDrafts(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Send Message on Enter</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Press Enter to dispatch immediately; Shift+Enter creates a new paragraph
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendOnEnter}
                    onChange={(e) => setSendOnEnter(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Real-time Token Streaming</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Stream generated tokens progressively with live fluid typing animation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={streamResponses}
                    onChange={(e) => setStreamResponses(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Code Syntax Highlighting</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Highlight TypeScript, Python, and SQL snippets with copy triggers
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={codeHighlighting}
                    onChange={(e) => setCodeHighlighting(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>

              {/* Workspace Data Export & Persistence */}
              <div
                className={`p-4 rounded-2xl border space-y-2.5 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-white/5'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-500" />
                      <span>Workspace Data Export (JSON)</span>
                    </h4>
                    <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                      Download a structured JSON backup containing your tasks, memories, chat history, projects, and workflow definitions.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportWorkspace}
                    disabled={isExporting}
                    className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isExportSuccess ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{isExportSuccess ? 'Exported!' : isExporting ? 'Exporting...' : 'Export JSON'}</span>
                  </button>
                </div>
                {lastAutosavedAt && (
                  <div
                    className={`text-[10px] ${
                      isLight ? 'text-slate-400' : 'text-neutral-500'
                    } flex items-center gap-1.5 pt-1.5 border-t border-inherit/40`}
                  >
                    <Clock className="w-3 h-3 text-indigo-400" />
                    <span>Centralized autosave active — Last snapshot: {new Date(lastAutosavedAt).toLocaleTimeString()}</span>
                  </div>
                )}
              </div>

              {/* Save workspace changes button */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={handleSaveWorkspaceChanges}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  {isSaved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
                  <span>{isSaved ? 'Changes saved!' : 'Save changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 6: VOICE & SPEECH (AI Capabilities)
             ========================================================== */}
          {activeSection === 'voice' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Voice & Speech Synthesis</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Configure synthesis voice models, conversational speech rate, and Web Speech API settings.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold block opacity-80">Active Voice Model</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {['Nova (Balanced)', 'Alloy (Direct)', 'Echo (Calm)', 'Shimmer (Warm)', 'Sol (Energetic)'].map((v) => (
                    <button
                      key={v}
                      onClick={() => setDefaultVoice(v)}
                      className={`p-3.5 rounded-2xl border text-left text-xs transition-all ${
                        defaultVoice === v
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold shadow-xs'
                          : 'border-inherit opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="font-bold">{v.split(' ')[0]}</div>
                      <div className="text-[10px] opacity-70">{v.split(' ')[1]}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold block opacity-80">Speech Cadence Rate</label>
                <div className="flex gap-2 max-w-xs">
                  {['0.9x', '1.0x', '1.15x', '1.25x'].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => setSpeechRate(rate)}
                      className={`flex-1 py-1.5 px-3 rounded-xl border text-xs text-center transition-all ${
                        speechRate === rate
                          ? 'bg-indigo-500/10 border-indigo-500 text-indigo-500 font-bold'
                          : 'border-inherit opacity-70 hover:opacity-100'
                      }`}
                    >
                      {rate}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 7: VISUAL MULTIMODAL (AI Capabilities)
             ========================================================== */}
          {activeSection === 'visual' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Visual Multimodal Perception</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Configure camera stream resolution, display capture FPS, and vision perception heuristics.
                </p>
              </div>

              <div
                className={`p-5 rounded-3xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-white/5'
                }`}
              >
                <h4 className="text-xs font-bold flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-indigo-500" />
                  <span>Real-time Screen & Webcam Pipeline</span>
                </h4>
                <p className="text-xs opacity-75 leading-relaxed">
                  Visual Mode operates real-time screen sharing and live camera capture directly feeding into Gemini 3.8 Flash multimodal reasoning for UI audits, code debugging, and diagram deconstruction.
                </p>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 8: MEMORY VAULT (AI Capabilities)
             ========================================================== */}
          {activeSection === 'memory' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Memory Vault Intelligence</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Inspect stored episodic context, memory recall accuracy, and persistent memory retention.
                </p>
              </div>

              <div
                className={`p-5 rounded-3xl border space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-white/5'
                }`}
              >
                <h4 className="text-xs font-bold flex items-center gap-2">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  <span>Cross-Session Knowledge Continuity</span>
                </h4>
                <p className="text-xs opacity-75 leading-relaxed">
                  Memories are indexed across sessions and conversations. You can view, search, export, and delete individual memory entities inside the dedicated Memories dashboard.
                </p>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 9: PRIVACY & INCOGNITO (Security & System)
             ========================================================== */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Privacy & Incognito Policies</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Manage anonymous sessions, telemetry opt-out, and zero-retention voice/visual guarantees.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Anonymous Diagnostic Telemetry</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Share crash stacks and latency metrics without personal identifiers
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={telemetryOptOut}
                    onChange={(e) => setTelemetryOptOut(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Strict Incognito Zero-Retention</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Never write transcripts or generated visual snapshots to local memory during Incognito
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={zeroRetentionVoice}
                    onChange={(e) => setZeroRetentionVoice(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 10: NOTIFICATIONS (Security & System)
             ========================================================== */}
          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Notifications & Alerts</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Configure workspace alert badges, sound chimes, and browser push notifications.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-inherit">
                  <div>
                    <span className="text-xs font-semibold block">Desktop Push Alerts</span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
                      Receive desktop notifications when background agent pipelines complete tasks
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={desktopNotifications}
                    onChange={(e) => setDesktopNotifications(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 11: CONNECTIONS & SQL (Security & System)
             ========================================================== */}
          {activeSection === 'connections' && (
            <div className="space-y-6">
              <ConnectionsWorkspace />
            </div>
          )}

          {/* ==========================================================
              SUBSECTION 12: SECURITY & RESET (Security & System)
             ========================================================== */}
          {activeSection === 'security' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Security & Factory Reset</h2>
                <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Passcode credentials, session authorizations, and local data factory wipe.
                </p>
              </div>

              <div className="p-5 rounded-3xl border border-red-500/20 bg-red-500/5 space-y-3">
                <div className="flex items-center gap-2 text-red-500 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Reset Local Storage & Cache</span>
                </div>
                <p className="text-xs opacity-80 leading-relaxed">
                  Clear all cached conversations, custom agent personas, tasks, and memory entries to restore factory defaults.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button
                    onClick={() => setIsResetDialogOpen(true)}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear & Reset Local Storage</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportWorkspace}
                    disabled={isExporting}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border cursor-pointer ${
                      isLight
                        ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                        : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                    }`}
                  >
                    {isExportSuccess ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
                    <span>{isExportSuccess ? 'Exported!' : isExporting ? 'Exporting...' : 'Backup Workspace (JSON)'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Dialog: Factory Reset */}
      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={() => {
          clearAllData();
          setIsResetDialogOpen(false);
        }}
        title="Reset All Local Workspace Data?"
        message="This will restore all conversations, agents, and workspace settings back to factory defaults. This action cannot be undone."
        confirmLabel="Reset Everything"
        isDestructive={true}
      />
    </div>
  );
};

/**
 * ANGEL AI — User Profile & Workspace Account View
 * Matches Image 2 Panel 13 & Image 3 Panel 13:
 * - Avatar: Daniel, daniel@example.com, Pro Plan
 * - Personal Information, Connected Accounts, Usage & Billing, Security, Help & Support, Log out
 * - Full Light Mode and Dark Mode support
 */

import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  CreditCard,
  Sliders,
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Check,
  Lock,
  Globe,
  Github,
  Key,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const ProfileView: React.FC = () => {
  const { userProfile, updateUserProfile, settings, signOut, isSignedIn, setIsAuthPageOpen } = useAngel();
  const isLight = settings.theme === 'light';

  const [activeSection, setActiveSection] = useState<'personal' | 'connected' | 'billing' | 'security'>('personal');
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name, email });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      {/* Top Header */}
      <div className="border-b pb-5 border-inherit">
        <div className="flex items-center gap-2">
          <span
            className={`p-1.5 rounded-xl border ${
              isLight
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
            }`}
          >
            <User className="w-4 h-4" />
          </span>
          <span
            className={`text-xs font-mono uppercase tracking-wider ${
              isLight ? 'text-indigo-600 font-semibold' : 'text-indigo-400'
            }`}
          >
            Account & Security
          </span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mt-1">Profile & Settings</h1>
        <p className={`text-xs sm:text-sm mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
          Manage your personal details, connected AI endpoints, authentication keys, and subscription tier.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card & Navigation */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`p-6 rounded-3xl border shadow-lg space-y-4 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-slate-200/50'
                : 'bg-[#121622] border-white/5 shadow-black/60'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-xl shadow-md">
                {userProfile.initials || 'DD'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold truncate">{userProfile.name}</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                    {userProfile.plan}
                  </span>
                </div>
                <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  {userProfile.email}
                </p>
              </div>
            </div>

            <div
              className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${
                isLight ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900' : 'bg-indigo-950/20 border-indigo-500/20 text-indigo-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <span>Unlimited Gemini 3.8 Flash queries active</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div
            className={`p-2 rounded-3xl border space-y-1 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#121622] border-white/5'
            }`}
          >
            {[
              { id: 'personal', label: 'Personal Information', icon: User },
              { id: 'connected', label: 'Connected Accounts', icon: Globe },
              { id: 'billing', label: 'Usage & Billing', icon: CreditCard },
              { id: 'security', label: 'Security & Passcode', icon: Shield },
            ].map((sec) => {
              const Icon = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id as any)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                    activeSection === sec.id
                      ? isLight
                        ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                        : 'bg-[#181D2C] text-white shadow-xs'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100'
                      : 'text-neutral-400 hover:bg-neutral-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span>{sec.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>
              );
            })}

            <div className="pt-2 border-t border-inherit">
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-semibold text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Log out (Switch to Guest)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active Setting Panel */}
        <div className="lg:col-span-8">
          <div
            className={`p-6 sm:p-8 rounded-3xl border shadow-lg space-y-6 ${
              isLight
                ? 'bg-white border-slate-200/90 shadow-slate-200/50'
                : 'bg-[#121622] border-white/5 shadow-black/60'
            }`}
          >
            {activeSection === 'personal' && (
              <form onSubmit={handleSave} className="space-y-4">
                <h3 className="text-base font-bold">Personal Information</h3>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Full Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
                          : 'bg-neutral-900 border-neutral-700 text-white focus:border-indigo-400'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
                          : 'bg-neutral-900 border-neutral-700 text-white focus:border-indigo-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-emerald-500 font-medium">{isSaved ? 'Changes saved!' : ''}</span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeSection === 'connected' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold">Connected Integrations</h3>
                <div className="space-y-2">
                  {[
                    { name: 'Google Cloud & Workspace', desc: 'Active • OAuth 2.0 Client Connected' },
                    { name: 'Supabase PostgreSQL', desc: 'Connected • Scalable Relational Backend' },
                    { name: 'Zapier Webhooks', desc: 'Configured • Automation Triggers Active' },
                  ].map((acc, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/5'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{acc.name}</div>
                        <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{acc.desc}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/10 text-emerald-500 font-medium">
                        Active
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'billing' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold">Usage & Billing</h3>
                <div
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">Current Plan</span>
                    <span className="text-indigo-500 font-bold">Angel Pro Tier</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span>Monthly Quota</span>
                    <span className="font-mono text-emerald-500">Unlimited Multi-Agent Autonomy</span>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-4">
                <h3 className="text-base font-bold">Security & Secrets Passcode</h3>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  Manage client-side hardware passcode protection for your Secrets Vault.
                </p>
                <div
                  className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900 border-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Secrets Vault Passcode Protection</span>
                  </div>
                  <span className="text-emerald-500 font-medium">Active (Default 1234)</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

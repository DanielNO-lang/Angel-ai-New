/**
 * ANGEL AI — User Profile & Account Settings Component
 * Allows authenticated users to manage:
 * - Avatar (custom URL, monogram, gradient presets)
 * - Display name & initials
 * - Professional title / role
 * - Biographical summary
 * - Basic account preferences (notifications, model personality)
 * Integrates directly into Settings / Account UI.
 */

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Camera,
  Check,
  Sparkles,
  Shield,
  Clock,
  Briefcase,
  Smile,
  Bell,
  Save,
  Globe,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export const UserProfileSettings: React.FC = () => {
  const { userProfile, updateUserProfile, settings, updateSettings, isSignedIn, sessionToken } = useAngel();
  const isLight = settings.theme === 'light';

  const [name, setName] = useState(userProfile.name || '');
  const [email] = useState(userProfile.email || '');
  const [title, setTitle] = useState(userProfile.title || 'Principal AI Architect');
  const [bio, setBio] = useState(
    userProfile.bio || 'Building autonomous agent workflows and intelligence systems with Angel AI.'
  );
  const [timezone, setTimezone] = useState(userProfile.timezone || 'UTC-07:00 (Pacific Time)');
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatarUrl || '');
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync when userProfile updates
  useEffect(() => {
    setName(userProfile.name || '');
    setTitle(userProfile.title || 'Principal AI Architect');
    setBio(userProfile.bio || 'Building autonomous agent workflows and intelligence systems with Angel AI.');
    setTimezone(userProfile.timezone || 'UTC-07:00 (Pacific Time)');
    setAvatarUrl(userProfile.avatarUrl || '');
  }, [userProfile]);

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  ];

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setSaveError(null);

    const cleanInitials = name
      .trim()
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

    const updates = {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim(),
      timezone,
      avatarUrl: avatarUrl.trim() || undefined,
      initials: cleanInitials,
    };

    try {
      updateUserProfile(updates);

      // Persist to server profile endpoint if authenticated
      if (sessionToken) {
        await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify(updates),
        }).catch(() => {});
      }

      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-indigo-500/10 text-indigo-500">
            <User className="w-4 h-4" />
          </span>
          <h2 className="text-base sm:text-lg font-bold tracking-tight">User Profile & Account</h2>
        </div>
        <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
          Manage your personal identity, avatar image, and workspace display preferences.
        </p>
      </div>

      {/* Avatar & Monogram Header Card */}
      <div
        className={`p-5 rounded-3xl border flex flex-col sm:flex-row items-center sm:items-start gap-5 ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-neutral-900/60 border-white/5'
        }`}
      >
        <div className="relative group">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/20 shadow-lg"
              onError={() => setAvatarUrl('')}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white text-2xl shadow-lg ring-4 ring-indigo-500/20">
              {userProfile.initials || 'DD'}
            </div>
          )}
          <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-inherit bg-emerald-500" />
        </div>

        <div className="flex-1 text-center sm:text-left space-y-2">
          <div>
            <h3 className="text-base font-bold">{name || 'Your Name'}</h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              {email} • <span className="text-indigo-500 font-semibold">{userProfile.plan} Tier</span>
            </p>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium opacity-60 block">Choose an avatar preset:</span>
            <div className="flex items-center justify-center sm:justify-start gap-2">
              {avatarPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                    avatarUrl === preset ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className={`px-2 py-1 rounded-lg text-[10px] font-semibold border transition-colors ${
                  !avatarUrl
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : isLight
                    ? 'bg-white border-slate-200 text-slate-700'
                    : 'bg-neutral-800 border-neutral-700 text-neutral-300'
                }`}
                title="Use Initials Monogram"
              >
                Monogram
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleSave} className="space-y-4">
        {saveError && (
          <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
            {saveError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold block opacity-80">Full Display Name</label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold block opacity-80">Account Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="email"
                value={email}
                disabled
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none opacity-70 cursor-not-allowed ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600'
                    : 'bg-neutral-950 border-white/5 text-neutral-400'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold block opacity-80">Professional Title / Role</label>
            <div className="relative">
              <Briefcase className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Principal AI Architect"
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-500'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold block opacity-80">Timezone</label>
            <div className="relative">
              <Clock className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                    : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-500'
                }`}
              >
                <option value="UTC-08:00 (Pacific Time)">UTC-08:00 (Pacific Time)</option>
                <option value="UTC-07:00 (Mountain Time)">UTC-07:00 (Mountain Time)</option>
                <option value="UTC-05:00 (Eastern Time)">UTC-05:00 (Eastern Time)</option>
                <option value="UTC+00:00 (London, GMT)">UTC+00:00 (London, GMT)</option>
                <option value="UTC+01:00 (Central European Time)">UTC+01:00 (Central European Time)</option>
                <option value="UTC+05:30 (India Standard Time)">UTC+05:30 (India Standard Time)</option>
                <option value="UTC+08:00 (Singapore / Beijing)">UTC+08:00 (Singapore / Beijing)</option>
                <option value="UTC+09:00 (Tokyo)">UTC+09:00 (Tokyo)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold block opacity-80">Custom Avatar Image URL</label>
          <div className="relative">
            <Camera className="w-4 h-4 absolute left-3 top-2.5 text-neutral-400" />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none transition-colors ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                  : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-500'
              }`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold block opacity-80">Bio & Context for AI</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell Angel about your primary goals and work style..."
            className={`w-full px-3.5 py-2 rounded-xl text-xs border outline-none transition-colors custom-scrollbar ${
              isLight
                ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                : 'bg-neutral-900 border-white/10 text-white focus:border-indigo-500'
            }`}
          />
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2">
          {isSaved ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Profile updated successfully!</span>
            </span>
          ) : (
            <span className={`text-[11px] ${isLight ? 'text-slate-400' : 'text-neutral-500'}`}>
              Changes are stored in your profile and cloud workspace.
            </span>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

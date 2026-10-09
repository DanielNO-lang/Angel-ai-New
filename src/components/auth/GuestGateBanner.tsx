/**
 * ANGEL AI — Guest Gate Banner
 * Displayed when an unauthenticated guest user accesses a persistent premium section
 * (Projects, Schedule, Library, Memories). Clearly explains session-only limitations
 * and offers a 1-click Google Sign-in to unlock persistent storage.
 */

import React from 'react';
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface GuestGateBannerProps {
  featureName: string;
  featureDescription: string;
}

export const GuestGateBanner: React.FC<GuestGateBannerProps> = ({
  featureName,
  featureDescription,
}) => {
  const { setIsAuthPageOpen, settings } = useAngel();
  const isLight = settings.theme === 'light';

  return (
    <div
      className={`mx-auto max-w-2xl my-6 p-6 rounded-3xl border text-center space-y-4 shadow-xl animate-in fade-in duration-200 ${
        isLight
          ? 'bg-gradient-to-b from-indigo-50/70 to-white border-indigo-200 text-slate-800'
          : 'bg-gradient-to-b from-[#141824] to-[#0E121B] border-indigo-500/30 text-white shadow-black/60'
      }`}
    >
      <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600/10 text-indigo-500 flex items-center justify-center border border-indigo-500/20 shadow-xs">
        <Lock className="w-6 h-6" />
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-500">
            Account Required
          </span>
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Guest Mode: Temporary Session
          </span>
        </div>
        <h3 className="text-lg font-bold tracking-tight">
          Unlock Persistent {featureName}
        </h3>
        <p className={`text-xs max-w-md mx-auto leading-relaxed ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
          {featureDescription} In Guest Mode, workspace changes are temporary. Sign in with Google to enable permanent encrypted cloud synchronization.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-4 text-xs pt-1">
        <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Google OAuth Verified
        </span>
        <span className="flex items-center gap-1.5 text-indigo-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5" /> End-to-End Encrypted
        </span>
      </div>

      <div className="pt-2">
        <button
          onClick={() => setIsAuthPageOpen(true)}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-all transform-gpu hover:-translate-y-0.5 inline-flex items-center gap-2 cursor-pointer"
        >
          <span>Sign In with Google</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

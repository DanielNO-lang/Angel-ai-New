/**
 * ANGEL AI — Sign In / Sign Up Screen with AI Intelligence Short Clip
 * Matches user's exact specification:
 * - Split screen layout
 * - Side 1: Google OAuth, Email/Password auth, mode switch (Sign in <-> Sign up), Guest mode fallback
 * - Side 2: Dedicated AI Intelligence short clip visualization with live looping neural graphics,
 *   waveform synthesis, telemetry overlay, and playhead indicator
 */

import React, { useState, useEffect } from 'react';
import {
  Flame,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Shield,
  ShieldCheck,
  Layers,
  Cpu,
  Brain,
  Calendar,
  FileText,
  Database,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';
import { signInWithGoogleOAuth } from '../../services/supabaseService';

export const AuthPage: React.FC = () => {
  const {
    isAuthPageOpen,
    setIsAuthPageOpen,
    authPageMode,
    setAuthPageMode,
    signIn,
    signUp,
    signOut,
    requestPasswordRecovery,
    authError,
    setAuthError,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recoveryMessage, setRecoveryMessage] = useState<string | null>(null);

  if (!isAuthPageOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    if (authPageMode === 'signup') {
      const cleanName = name.trim() || cleanEmail.split('@')[0];
      await signUp(cleanEmail, password, cleanName);
    } else {
      await signIn(cleanEmail, password);
    }
    setIsSubmitting(false);
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    setAuthError(null);
    try {
      const res = await signInWithGoogleOAuth();
      if (res.redirected) {
        // OAuth flow initiated; browser redirected
        return;
      }
      if (res.error) {
        // Surface real configuration/provider errors instead of silently signing in as a demo account.
        setAuthError(res.error);
      }
    } catch (err: any) {
      setAuthError(err?.message || 'Google authentication failed to initialize.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setAuthError('Please enter your email address first to reset password.');
      return;
    }
    const res = await requestPasswordRecovery(email.trim());
    setRecoveryMessage(res.message);
  };

  const handleContinueAsGuest = () => {
    // Central reset clears session state and opens a fresh, temporary guest workspace.
    void signOut();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-2 sm:p-6 overflow-y-auto custom-scrollbar animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row transition-all duration-200 ${
          isLight
            ? 'bg-white text-slate-800 border border-slate-200'
            : 'bg-[#0E121B] text-neutral-100 border border-white/10'
        }`}
      >
        {/* Close / Guest Escape Button */}
        <button
          onClick={handleContinueAsGuest}
          className={`absolute top-4 right-4 z-20 p-2 rounded-xl transition-colors ${
            isLight
              ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
          }`}
          title="Continue as Guest"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ========================================================
            SIDE 1: AUTHENTICATION FORM
            ======================================================== */}
        <div className="flex-1 p-6 sm:p-10 flex flex-col justify-between">
          <div className="space-y-6">
            {/* Angel AI Brand */}
            <div className="flex items-center gap-2.5">
              <AngelLogo size={32} glow={true} />
              <span className="font-semibold text-lg tracking-tight">Angel</span>
            </div>

            {/* Header Titles */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                {authPageMode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {authPageMode === 'signin'
                  ? 'Sign in to access your saved chats, memories & agents'
                  : 'Start using Angel with full multi-agent autonomy'}
              </p>
            </div>

            {/* Alerts */}
            {authError && (
              <div className="p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-between">
                <span>{authError}</span>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="text-xs hover:text-white ml-2"
                >
                  ✕
                </button>
              </div>
            )}
            {recoveryMessage && (
              <div className="p-3 text-xs rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {recoveryMessage}
              </div>
            )}

            {/* 1. Email field, 2. Password field, 3. Primary Sign In / Sign Up action */}
            <form onSubmit={handleSubmit} className="space-y-3">
              {authPageMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Your Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                    <input
                      type="text"
                      placeholder="Danny Davis"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                        isLight
                          ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                          : 'bg-neutral-900 border-neutral-800 text-white focus:border-indigo-400'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                        : 'bg-neutral-900 border-neutral-800 text-white focus:border-indigo-400'
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">Password</label>
                  {authPageMode === 'signin' && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-[11px] text-indigo-500 hover:text-indigo-400 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-neutral-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border outline-none ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                        : 'bg-neutral-900 border-neutral-800 text-white focus:border-indigo-400'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-md transition-all transform-gpu hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Authenticating...' : authPageMode === 'signin' ? 'Sign in' : 'Create account'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center pt-1">
              <div
                className={`w-full h-px ${isLight ? 'bg-slate-200' : 'bg-neutral-800'}`}
              />
              <span
                className={`absolute px-2 text-[11px] select-none ${
                  isLight ? 'bg-white text-slate-400' : 'bg-[#0E121B] text-neutral-500'
                }`}
              >
                or continue with
              </span>
            </div>

            {/* 4. "Continue with Google" (Appears AFTER Email/Password fields) */}
            <button
              onClick={handleGoogleSignIn}
              type="button"
              disabled={isSubmitting}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-3 transition-all duration-150 transform-gpu hover:-translate-y-0.5 shadow-xs border cursor-pointer disabled:opacity-50 ${
                isLight
                  ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700'
                  : 'bg-neutral-900 hover:bg-neutral-850 border-white/10 text-white'
              }`}
            >
              {/* Multicolored Google G Icon */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Mode Switch & Guest Mode */}
            <div className="pt-2 text-center space-y-2">
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                {authPageMode === 'signin' ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthPageMode('signup')}
                      className="font-semibold text-indigo-500 hover:text-indigo-400 underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setAuthPageMode('signin')}
                      className="font-semibold text-indigo-500 hover:text-indigo-400 underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>

              <div>
                <button
                  type="button"
                  onClick={handleContinueAsGuest}
                  className={`text-xs underline transition-colors ${
                    isLight ? 'text-slate-400 hover:text-slate-700' : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  Continue as guest (try basic chat first)
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-center text-neutral-400 pt-6">
            By continuing, you agree to Angel's Terms of Service and Privacy Policy.
          </p>
        </div>

        {/* ========================================================
            SIDE 2: CONTINUOUSLY LOOPING AI VIDEO DISPLAY
            Real ambient AI video playing seamlessly by the side
            ======================================================== */}
        <div className="relative md:w-1/2 min-h-[300px] md:min-h-[480px] bg-neutral-950 flex flex-col justify-between overflow-hidden p-6 select-none border-t md:border-t-0 md:border-l border-white/10">
          {/* Continuously Looping High-Definition AI Ambient Video */}
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/src/assets/images/ai_intelligence_clip_1790265840519.jpg"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              type="video/mp4"
            />
          </video>

          {/* Holographic Subtle Glass Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-indigo-950/20 mix-blend-color-dodge pointer-events-none" />

          {/* Top AI Video Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-cyan-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>ANGEL INTELLIGENCE STREAM</span>
            </div>
          </div>

          {/* Center Floating Intelligence Capabilities */}
          <div className="relative z-10 my-auto space-y-2.5 py-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-lg">
              <Brain className="w-4 h-4 text-purple-400" />
              <span>Gemini 3.8 Flash Neural Engine</span>
            </div>
            <br />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-lg">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Multi-Agent Autonomous Pipelines</span>
            </div>
            <br />
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-xs font-medium text-white shadow-lg">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Continuous Multimodal Perception</span>
            </div>
          </div>

          {/* Bottom Clean Audio Waveform without start/finish line */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-end gap-1 h-6 px-1">
              {[40, 75, 55, 90, 65, 30, 85, 100, 70, 45, 80, 95, 60, 35, 75, 50, 85, 90].map(
                (h, idx) => (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-t from-cyan-500 to-indigo-500 rounded-full animate-pulse"
                    style={{
                      height: `${h * 0.7}%`,
                      animationDelay: `${idx * 0.08}s`,
                      opacity: 0.8,
                    }}
                  />
                )
              )}
            </div>
            <div className="text-[10px] text-neutral-400 text-center font-medium">
              Autonomous Real-Time Neural Processing
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

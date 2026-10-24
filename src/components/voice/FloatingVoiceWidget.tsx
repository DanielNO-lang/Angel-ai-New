import React, { useState, useEffect } from 'react';
import { Headphones, Maximize2, Mic, MicOff, PhoneOff, Sparkles, Volume2, X } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';
import { voiceEngine } from '../../services/voice/voiceService';

export const FloatingVoiceWidget: React.FC = () => {
  const {
    isLiveVoiceOpen,
    setIsLiveVoiceOpen,
    isLiveVoiceMinimized,
    setIsLiveVoiceMinimized,
    setActiveTab,
    settings,
  } = useAngel();

  const isLight = settings.theme === 'light';
  const [isMuted, setIsMuted] = useState(false);
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (!isLiveVoiceOpen || !isLiveVoiceMinimized) return;
    const interval = setInterval(() => {
      setPulse((prev) => (prev + 1) % 60);
    }, 100);
    return () => clearInterval(interval);
  }, [isLiveVoiceOpen, isLiveVoiceMinimized]);

  if (!isLiveVoiceOpen || !isLiveVoiceMinimized) {
    return null;
  }

  const handleExpand = () => {
    setIsLiveVoiceMinimized(false);
    setActiveTab('chat');
  };

  const handleEndCall = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    voiceEngine.stopSpeaking();
    setIsLiveVoiceOpen(false);
    setIsLiveVoiceMinimized(false);
  };

  return (
    <div
      className={`fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 p-2 pr-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-200 animate-in slide-in-from-bottom-4 ${
        isLight
          ? 'bg-white/95 border-indigo-200 text-slate-800 shadow-indigo-200/40'
          : 'bg-[#0B1020]/95 border-indigo-500/40 text-neutral-100 shadow-black/80'
      }`}
    >
      {/* Interactive Orb Indicator */}
      <button
        onClick={handleExpand}
        className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white cursor-pointer group shadow-md"
        title="Expand Live Voice Studio"
      >
        <span
          className="absolute inset-0 rounded-xl bg-indigo-400 opacity-40 animate-ping"
          style={{ animationDuration: '2s' }}
        />
        <AngelLogo size={20} glow={true} />
      </button>

      {/* Voice Status Text */}
      <button
        onClick={handleExpand}
        className="flex flex-col text-left cursor-pointer min-w-[100px] max-w-[150px]"
        title="Click to open in chat"
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold tracking-tight truncate">Angel Live</span>
        </div>
        <span className={`text-[10px] truncate ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
          {isMuted ? 'Muted' : 'Connected • Active'}
        </span>
      </button>

      {/* Quick Audio Controls */}
      <div className="flex items-center gap-1 border-l border-inherit pl-2">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isMuted
              ? 'bg-red-500/15 text-red-400 border border-red-500/30'
              : isLight
              ? 'hover:bg-slate-100 text-slate-600'
              : 'hover:bg-neutral-800 text-neutral-300'
          }`}
          title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
        >
          {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={handleExpand}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight ? 'hover:bg-slate-100 text-slate-600' : 'hover:bg-neutral-800 text-neutral-300'
          }`}
          title="Expand Live Voice in Chat"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={handleEndCall}
          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 transition-colors cursor-pointer"
          title="End Live Voice session"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { Settings, HelpCircle, LogOut, ChevronRight, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface UserProfileMenuProps { isOpen: boolean; onClose: () => void; onOpenSettings?: () => void; }

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ isOpen, onClose }) => {
  const { userProfile, settings, toggleTheme, setActiveTab, signOut } = useAngel();
  if (!isOpen) return null;
  const isLight = settings.theme === 'light';
  const openSettings = () => { setActiveTab('settings'); onClose(); };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-3 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className={`w-full max-w-sm rounded-2xl border shadow-2xl overflow-hidden ${isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#10141d] border-white/10 text-white'}`}>
        <div className={`p-4 border-b ${isLight ? 'border-slate-100 bg-slate-50' : 'border-white/5 bg-[#121722]'}`}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">{userProfile.initials || 'GU'}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2"><h3 className="text-sm font-semibold truncate">{userProfile.name}</h3><span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">{userProfile.plan}</span></div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>{userProfile.plan === 'Free' ? 'Guest workspace' : 'Personal workspace'}</p>
            </div>
          </div>
        </div>
        <div className="p-2 space-y-1">
          <button onClick={openSettings} className={`w-full flex items-center justify-between p-3 rounded-xl ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}><span className="flex items-center gap-3"><Settings className="w-4 h-4 text-indigo-400" /><span className="text-xs font-semibold">Settings</span></span><ChevronRight className="w-4 h-4 opacity-40" /></button>
          <button onClick={openSettings} className={`w-full flex items-center justify-between p-3 rounded-xl ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}><span className="flex items-center gap-3"><HelpCircle className="w-4 h-4 text-neutral-400" /><span className="text-xs font-semibold">Help & Support</span></span><ChevronRight className="w-4 h-4 opacity-40" /></button>
          <button onClick={toggleTheme} className={`w-full flex items-center justify-between p-3 rounded-xl ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}><span className="flex items-center gap-3">{isLight ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-indigo-400" />}<span className="text-xs font-semibold">{isLight ? 'Light mode' : 'Dark mode'}</span></span><span className="text-[10px] opacity-50">Switch</span></button>
          <button onClick={openSettings} className={`w-full flex items-center justify-between p-3 rounded-xl ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'}`}><span className="flex items-center gap-3"><ShieldCheck className="w-4 h-4 text-emerald-500" /><span className="text-xs font-semibold">Privacy & Security</span></span><ChevronRight className="w-4 h-4 opacity-40" /></button>
          <div className={`my-1 border-t ${isLight ? 'border-slate-100' : 'border-white/5'}`} />
          <button onClick={() => { signOut(); onClose(); }} className="w-full flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-500/10 text-xs font-semibold"><LogOut className="w-4 h-4" />Log out</button>
        </div>
      </div>
    </div>
  );
};

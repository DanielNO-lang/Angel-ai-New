/**
 * ANGEL AI — Appearance Settings Modal
 * Matches Image 1 Appearance Card (Theme, Accent Color, Font Size, Compact Mode).
 * 100% Light Mode and Dark Mode Responsive.
 */

import React from 'react';
import { Moon, Sun, Laptop, X, Check } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AccentColor, FontSize, ThemeMode } from '../../types';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppearanceModal: React.FC<AppearanceModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAngel();
  const isLight = settings.theme === 'light';

  if (!isOpen) return null;

  const accentColors: Array<{ id: AccentColor; name: string; bg: string }> = [
    { id: 'indigo', name: 'Indigo', bg: 'bg-indigo-500' },
    { id: 'blue', name: 'Blue', bg: 'bg-blue-500' },
    { id: 'purple', name: 'Purple', bg: 'bg-purple-500' },
    { id: 'emerald', name: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'rose', name: 'Rose', bg: 'bg-rose-500' },
    { id: 'amber', name: 'Amber', bg: 'bg-amber-500' },
  ];

  const fontSizes: Array<{ id: FontSize; label: string; textClass: string }> = [
    { id: 'sm', label: 'A', textClass: 'text-xs' },
    { id: 'base', label: 'A', textClass: 'text-sm' },
    { id: 'lg', label: 'A', textClass: 'text-base font-medium' },
    { id: 'xl', label: 'A', textClass: 'text-lg font-semibold' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />

      <div
        className={`relative z-10 w-full max-w-md rounded-3xl border shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 ${
          isLight
            ? 'bg-white text-slate-800 border-slate-200 shadow-slate-300/50'
            : 'bg-[#0E121B] text-neutral-100 border-white/10 shadow-black/80'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3 border-inherit">
          <div>
            <h3 className="text-base font-bold">Appearance</h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Customize the visual styling of your Angel workspace
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isLight ? 'hover:bg-slate-100 text-slate-400' : 'hover:bg-neutral-800 text-neutral-400'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Theme Mode */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            Choose your preferred theme
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => updateSettings({ theme: 'light' })}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                settings.theme === 'light'
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md font-bold'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  : 'border-white/5 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Sun className="w-5 h-5 mb-1.5 text-amber-500" />
              <span className="text-xs">Light</span>
            </button>

            <button
              onClick={() => updateSettings({ theme: 'dark' })}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                settings.theme === 'dark'
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 shadow-md font-bold'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  : 'border-white/5 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Moon className="w-5 h-5 mb-1.5 text-indigo-400" />
              <span className="text-xs">Dark</span>
            </button>

            <button
              onClick={() => updateSettings({ theme: 'system' })}
              className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                settings.theme === 'system'
                  ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 shadow-md font-bold'
                  : isLight
                  ? 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  : 'border-white/5 bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Laptop className="w-5 h-5 mb-1.5 text-neutral-400" />
              <span className="text-xs">System</span>
            </button>
          </div>
        </div>

        {/* Accent Color */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            Accent Color
          </label>
          <div className="flex items-center gap-3">
            {accentColors.map((color) => {
              const isSelected = (settings.accentColor || 'indigo') === color.id;
              return (
                <button
                  key={color.id}
                  onClick={() => updateSettings({ accentColor: color.id })}
                  title={color.name}
                  className={`w-8 h-8 rounded-full ${color.bg} flex items-center justify-center transition-transform ${
                    isSelected
                      ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110 shadow-md'
                      : 'opacity-80 hover:opacity-100'
                  }`}
                >
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Font Size */}
        <div className="space-y-2">
          <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-neutral-300'}`}>
            Font Size
          </label>
          <div
            className={`grid grid-cols-4 gap-2 p-1.5 rounded-2xl border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-950 border-white/5'
            }`}
          >
            {fontSizes.map((size) => {
              const isSelected = (settings.fontSize || 'base') === size.id;
              return (
                <button
                  key={size.id}
                  onClick={() => updateSettings({ fontSize: size.id })}
                  className={`flex items-center justify-center py-2 rounded-xl transition-all ${
                    isSelected
                      ? isLight
                        ? 'bg-white text-indigo-600 shadow-xs font-bold'
                        : 'bg-neutral-800 text-white shadow-xs font-bold'
                      : isLight
                      ? 'text-slate-500 hover:text-slate-900'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span className={size.textClass}>{size.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Compact Mode */}
        <div className="flex items-center justify-between pt-2 border-t border-inherit">
          <div>
            <span className="text-xs font-semibold">Compact Mode</span>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Reduce spacing and padding across conversations and tools
            </p>
          </div>
          <button
            onClick={() => updateSettings({ compactMode: !settings.compactMode })}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
              settings.compactMode
                ? 'bg-indigo-600'
                : isLight
                ? 'bg-slate-300'
                : 'bg-neutral-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                settings.compactMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Done Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-2xl font-semibold text-xs shadow-md transition-colors ${
              isLight
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                : 'bg-white hover:bg-slate-100 text-neutral-950'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

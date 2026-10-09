/**
 * ANGEL AI — Notification Center Popover
 * Handles system notifications, task completion alerts, latest news briefings,
 * and background workflow updates.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  Sparkles,
  Flame,
  Info,
  ExternalLink,
  Trash2,
  Check,
  X,
  Bot,
  ImageIcon,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { NavigationTab } from '../../types';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'media' | 'news' | 'system';
  timestamp: string;
  read: boolean;
  actionTab?: NavigationTab;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [];

export const NotificationCenter: React.FC = () => {
  const { setActiveTab, settings } = useAngel();
  const isLight = settings.theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        const saved = localStorage.getItem('angel_notifications');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return INITIAL_NOTIFICATIONS;
  });

  const popoverRef = useRef<HTMLDivElement>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('angel_notifications', JSON.stringify(notifications));
    } catch {}
  }, [notifications]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    if (notif.actionTab) {
      setActiveTab(notif.actionTab);
      setIsOpen(false);
    }
  };

  const getNotificationIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'media':
        return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'news':
        return <Flame className="w-4 h-4 text-amber-400" />;
      default:
        return <Info className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl transition-colors backdrop-blur-md cursor-pointer ${
          isOpen
            ? isLight
              ? 'bg-slate-200 text-slate-900'
              : 'bg-white/15 text-white'
            : isLight
            ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/70'
            : 'text-neutral-400 hover:text-white hover:bg-white/10'
        }`}
        title="Notifications"
        aria-label="Open notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 ring-2 ring-indigo-500/20"></span>
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl shadow-2xl border backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/50'
              : 'bg-[#0E121B]/95 border-white/10 text-neutral-100 shadow-black/80'
          }`}
        >
          {/* Header */}
          <div
            className={`p-3.5 border-b flex items-center justify-between ${
              isLight ? 'border-slate-100 bg-slate-50/50' : 'border-white/5 bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs tracking-tight">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-500 text-white">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-[11px] text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>Mark all read</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1 rounded text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                  title="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto custom-scrollbar divide-y divide-inherit/20">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Bell className="w-6 h-6 text-neutral-400 mx-auto opacity-40" />
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
                  No notifications right now
                </p>
                <p className="text-[10px] opacity-60">You're completely up to date.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3 flex items-start gap-3 transition-colors cursor-pointer ${
                    !notif.read
                      ? isLight
                        ? 'bg-indigo-50/50 hover:bg-indigo-50'
                        : 'bg-indigo-950/20 hover:bg-indigo-950/30'
                      : isLight
                      ? 'hover:bg-slate-50'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isLight ? 'bg-slate-100' : 'bg-neutral-800'
                    }`}
                  >
                    {getNotificationIcon(notif.type)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-1">
                      <h4
                        className={`text-xs font-semibold truncate ${
                          !notif.read ? (isLight ? 'text-indigo-950' : 'text-white') : ''
                        }`}
                      >
                        {notif.title}
                      </h4>
                      <span className="text-[10px] text-neutral-400 shrink-0">
                        {notif.timestamp}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isLight ? 'text-slate-600' : 'text-neutral-300'}`}>
                      {notif.message}
                    </p>
                    {notif.actionTab && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-500 pt-0.5">
                        <span>View in {notif.actionTab.replace('_', ' ')}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {!notif.read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

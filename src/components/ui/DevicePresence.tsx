import React, { useEffect, useMemo, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getClientSupabase } from '../../services/supabaseService';
import { useAngel } from '../../context/AppContext';
import { useIsLightTheme } from '../../utils/useIsLightTheme';

type PresenceMeta = { deviceId?: string; label?: string; platform?: string; lastSeen?: string };

function getDeviceLabel(): { label: string; platform: string } {
  const ua = navigator.userAgent || '';
  const platform = /iPhone|iPad|iPod/i.test(ua) ? 'iOS' : /Android/i.test(ua) ? 'Android' : /Windows/i.test(ua) ? 'Windows' : /Mac/i.test(ua) ? 'macOS' : /Linux/i.test(ua) ? 'Linux' : 'Web';
  const kind = /Mobi|Android|iPhone|iPod/i.test(ua) ? 'phone' : /iPad|Tablet/i.test(ua) ? 'tablet' : 'computer';
  return { label: `${platform} ${kind}`, platform };
}

/**
 * Cross-device awareness only. This announces other authenticated Angel tabs/devices;
 * it does not grant remote camera, screen, microphone, or OS access.
 */
export const DevicePresence: React.FC = () => {
  const { isSignedIn, settings } = useAngel();
  const isLight = useIsLightTheme(settings.theme);
  const [otherDevices, setOtherDevices] = useState<PresenceMeta[]>([]);
  const [notice, setNotice] = useState('');
  const identity = useMemo(() => {
    const device = getDeviceLabel();
    let deviceId = '';
    try {
      deviceId = localStorage.getItem('angel_device_id') || '';
      if (!deviceId) {
        deviceId = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('angel_device_id', deviceId);
      }
    } catch {
      deviceId = `session-${Math.random().toString(36).slice(2)}`;
    }
    return { ...device, deviceId };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setOtherDevices([]); setNotice('');
    let channel: RealtimeChannel | null = null;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    const start = async () => {
      const supabase = getClientSupabase();
      if (!supabase) return;
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user || cancelled) return;
      const topic = `angel-devices:${user.id}`;
      channel = supabase.channel(topic, { config: { private: true, presence: { key: identity.deviceId } } });
      channel.on('presence', { event: 'sync' }, () => {
        if (cancelled || !channel) return;
        const state = channel.presenceState<PresenceMeta>();
        const devices = Object.entries(state)
          .flatMap(([key, entries]) => entries.map((entry) => ({ ...entry, deviceId: entry.deviceId || key })))
          .filter((entry) => entry.deviceId !== identity.deviceId);
        setOtherDevices(devices);
      });
      channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
        if (key === identity.deviceId || cancelled) return;
        const first = (newPresences as PresenceMeta[] | undefined)?.[0];
        const label = first?.label || 'another device';
        setNotice(`Angel is open on ${label} too.`);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          try { new Notification('Angel is active on another device', { body: `A new Angel session connected: ${label}.` }); } catch {}
        }
        window.setTimeout(() => setNotice(''), 6500);
      });
      channel.subscribe(async (status) => {
        if (status !== 'SUBSCRIBED' || cancelled || !channel) return;
        const track = () => channel?.track({ ...identity, lastSeen: new Date().toISOString() });
        await track();
        heartbeat = setInterval(() => { void track(); }, 60000);
      });
    };
    void start().catch(() => { /* Presence is optional; chat must keep working if Realtime is unavailable. */ });
    return () => {
      cancelled = true;
      if (heartbeat) clearInterval(heartbeat);
      if (channel) void getClientSupabase()?.removeChannel(channel);
    };
  }, [identity, isSignedIn]);

  if (!otherDevices.length && !notice) return null;
  return (
    <div className="fixed bottom-4 right-4 z-[80] max-w-[calc(100vw-2rem)] space-y-2" aria-live="polite">
      {otherDevices.length > 0 && <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur ${isLight ? 'border-slate-200 bg-white/95 text-slate-800' : 'border-white/10 bg-[#111522]/95 text-white'}`}><MonitorSmartphone className="h-4 w-4 text-indigo-300" /><span>Angel is open on {otherDevices.length + 1} devices</span></div>}
      {notice && <div className={`rounded-xl border px-3 py-2 text-xs shadow-xl backdrop-blur ${isLight ? 'border-indigo-200 bg-white/95 text-slate-800' : 'border-indigo-400/30 bg-[#111522]/95 text-white'}`}>{notice}</div>}
    </div>
  );
};

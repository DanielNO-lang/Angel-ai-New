import React, { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, CheckCircle2, LoaderCircle, RefreshCw, ShieldCheck, Smartphone } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';

type PushStatus = {
  configured: boolean;
  vapidConfigured: boolean;
  publicKey?: string;
  subscriptionCount: number | null;
  reason?: string;
};

function decodeApplicationServerKey(encoded: string): Uint8Array {
  const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

export const PushNotificationSettings: React.FC<{ isLight: boolean }> = ({ isLight }) => {
  const [token, setToken] = useState('');
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const card = isLight ? 'border-slate-200 bg-white' : 'border-white/10 bg-white/[0.03]';
  const muted = isLight ? 'text-slate-500' : 'text-neutral-400';

  useEffect(() => {
    const client = getClientSupabase();
    if (!client) return;
    let alive = true;
    void client.auth.getSession().then(({ data }) => {
      if (alive) setToken(data.session?.access_token || '');
    });
    const { data: listener } = client.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setToken(session?.access_token || '');
      setStatus(null);
      setSubscribed(false);
      setError('');
      setNotice('');
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const api = useCallback(async (path: string, init: RequestInit = {}) => {
    if (!token) throw new Error('Sign in to manage background push notifications.');
    const response = await fetch(path, {
      ...init,
      headers: {
        ...(init.headers || {}),
        Authorization: 'Bearer ' + token,
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
    });
    const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : `Request failed (${response.status}).`);
    return body;
  }, [token]);

  const refresh = useCallback(async () => {
    if (!token) { setStatus(null); setSubscribed(false); return; }
    setBusy(true);
    setError('');
    try {
      const data = await api('/api/push/status') as PushStatus;
      setStatus(data);
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.getRegistration();
        const subscription = await registration?.pushManager.getSubscription();
        setSubscribed(Boolean(subscription));
      } else {
        setSubscribed(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not load push notification status.');
    } finally {
      setBusy(false);
    }
  }, [api, token]);

  useEffect(() => { void refresh(); }, [refresh]);

  const enable = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    let createdSubscription: PushSubscription | null = null;
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        throw new Error('This browser does not support installed background push notifications. In-tab task alerts may still work.');
      }
      const configuration = await api('/api/push/status') as PushStatus;
      setStatus(configuration);
      if (!configuration.configured || !configuration.publicKey) {
        throw new Error(configuration.reason || 'Push delivery is not configured on the server.');
      }
      const permission = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
      if (permission !== 'granted') throw new Error('Notification permission was not granted. Enable it in this browser before subscribing.');

      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        try {
          // A VAPID key rotation requires a new browser subscription.
          const existingKey = subscription.options.applicationServerKey;
          const requestedKey = decodeApplicationServerKey(configuration.publicKey);
          const matches = existingKey && new Uint8Array(existingKey).every((value, index) => value === requestedKey[index]) &&
            new Uint8Array(existingKey).length === requestedKey.length;
          if (!matches) {
            const confirmed = window.confirm('This browser already has a push subscription created with a different server key. Replace that subscription for Angel on this device?');
            if (!confirmed) throw new Error('Existing notification subscription was left unchanged.');
            await api('/api/push/subscriptions', { method: 'DELETE', body: JSON.stringify({ endpoint: subscription.endpoint }) });
            await subscription.unsubscribe();
            subscription = null;
          }
        } catch (reason) {
          if (reason instanceof Error && reason.message === 'Existing notification subscription was left unchanged.') throw reason;
          throw reason;
        }
      }
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeApplicationServerKey(configuration.publicKey) as BufferSource,
        });
        createdSubscription = subscription;
      }
      const saved = await api('/api/push/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      });
      setSubscribed(true);
      setNotice('This browser is registered for private task-status push notifications. Angel sends a generic completion alert, not your task content.');
      if (typeof saved.subscriptionCount === 'number') {
        setStatus((current) => current ? { ...current, subscriptionCount: saved.subscriptionCount } : current);
      }
    } catch (reason) {
      if (createdSubscription) {
        try { await createdSubscription.unsubscribe(); } catch {}
      }
      setError(reason instanceof Error ? reason.message : 'Could not enable background push notifications.');
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  const disable = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();
      if (!subscription) {
        setSubscribed(false);
        setNotice('This browser has no active push subscription.');
        return;
      }
      await api('/api/push/subscriptions', {
        method: 'DELETE',
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
      await subscription.unsubscribe();
      setSubscribed(false);
      setNotice('Background push notifications have been disabled for this browser. Other registered devices are unchanged.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not disable background push notifications.');
    } finally {
      setBusy(false);
      void refresh();
    }
  };

  if (!token) {
    return <section className={`rounded-2xl border p-4 space-y-2 ${card}`}>
      <div className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4 text-indigo-400"/>Background push notifications</div>
      <p className={`text-xs ${muted}`}>Sign in to register this browser for task-status notifications when Angel is not open.</p>
    </section>;
  }

  return (
    <section className={`rounded-2xl border p-4 space-y-3 ${card}`}>
      <div className="flex items-start gap-3">
        <span className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 p-2 text-indigo-400"><Smartphone className="h-4 w-4"/></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold">Background push notifications</h3>
          <p className={`mt-1 text-xs leading-5 ${muted}`}>Register this browser to receive a generic alert when a scheduled or queued task finishes, even when Angel is closed. Task content is not included in the push payload.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={busy} aria-label="Refresh push notification status" className="rounded-lg border border-white/10 p-2 disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`}/></button>
      </div>

      <div className={`rounded-xl border p-3 text-xs ${status?.configured ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}>
        <div className="flex items-center gap-2 font-semibold">
          {status?.configured ? <CheckCircle2 className="h-4 w-4 text-emerald-500"/> : <ShieldCheck className="h-4 w-4 text-amber-500"/>}
          {status?.configured ? 'Server push is configured' : 'Setup required'}
        </div>
        {status?.reason && <p className={`mt-1 ${muted}`}>{status.reason}</p>}
        <p className={`mt-1 ${muted}`}>Registered devices on this account: {status?.subscriptionCount ?? 'not available'}.</p>
        {(!status?.vapidConfigured || status?.subscriptionCount === null) && <p className={`mt-2 ${muted}`}>The administrator must configure the server-only VAPID key pair and apply the Web Push database migration. Do not put the private key in a Vite/VITE_ variable.</p>}
      </div>

      {error && <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/5 p-2 text-xs text-red-500">{error}</p>}
      {notice && <p role="status" className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-2 text-xs text-indigo-500">{notice}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => void (subscribed ? disable() : enable())} disabled={busy || (!subscribed && !status?.configured)} className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-white disabled:opacity-50 ${subscribed ? 'bg-neutral-600 hover:bg-neutral-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}>
          {busy ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : subscribed ? <BellOff className="h-3.5 w-3.5"/> : <Bell className="h-3.5 w-3.5"/>}
          {subscribed ? 'Disable on this browser' : 'Enable on this browser'}
        </button>
        <span className={`text-[11px] ${muted}`}>{subscribed ? 'Browser subscription detected' : 'Not enabled on this browser'}</span>
      </div>
      <p className={`text-[11px] leading-5 ${muted}`}>Permission and subscriptions are per browser profile. Push delivery still depends on the task worker, a valid VAPID configuration, and a reachable browser push service. In-tab desktop alerts remain a separate setting above.</p>
    </section>
  );
};

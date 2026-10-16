import React, { useEffect, useRef, useState } from 'react';
import { Camera, MonitorUp, MonitorSmartphone, PhoneOff, Radio, ShieldCheck } from 'lucide-react';
import { getClientSupabase } from '../../services/supabaseService';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { useAngel } from '../../context/AppContext';

type Signal = { type: string; sessionId?: string; from?: string; to?: string; sdp?: RTCSessionDescriptionInit; candidate?: RTCIceCandidateInit; source?: 'camera' | 'screen'; label?: string };
const ICE: RTCConfiguration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

/**
 * Consent-first, same-account remote visual sessions.
 * Both devices must have Angel open and be signed into the same account.
 * The sharing device must approve the browser's own camera/screen permission prompt.
 * This streams media peer-to-peer; no frame data is sent through Supabase.
 */
export const RemoteVisualSessions: React.FC = () => {
  const { inspectVisualFrame, isSignedIn } = useAngel();
  const [ready, setReady] = useState(false);
  const [userId, setUserId] = useState('');
  const [session, setSession] = useState<{ id: string; source: 'camera' | 'screen'; label: string } | null>(null);
  const sessionRef = useRef<{ id: string; source: 'camera' | 'screen'; label: string } | null>(null);
  const [available, setAvailable] = useState<Array<{ id: string; source: 'camera' | 'screen'; label: string }>>([]);
  const [status, setStatus] = useState('');
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [remoteSource, setRemoteSource] = useState<'camera' | 'screen'>('screen');
  const [visualQuestion, setVisualQuestion] = useState('What should I notice or help with?');
  const [visualAnswer, setVisualAnswer] = useState('');
  const [analyzingFrame, setAnalyzingFrame] = useState(false);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const peersRef = useRef(new Map<string, RTCPeerConnection>());
  const localStreamRef = useRef<MediaStream | null>(null);
  const deviceIdRef = useRef('');

  useEffect(() => {
    setUserId('');
    setReady(false);
    setSession(null); sessionRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current = null;
    setAvailable([]); setRemoteStream(null); setStatus('');
    deviceIdRef.current = `device-${typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2)}`;
    let active = true;
    const client = getClientSupabase();
    if (!client) { setStatus('Sign in with Supabase to connect devices.'); return; }
    void client.auth.getUser().then(({ data }) => {
      if (!active || !data.user) { setStatus('Sign in on both devices to enable remote visual sessions.'); return; }
      setUserId(data.user.id);
      const channel = client.channel(`angel-devices:${data.user.id}`, { config: { private: true } });
      channelRef.current = channel;
      const send = (event: string, payload: Signal) => channel.send({ type: 'broadcast', event, payload: { ...payload, from: deviceIdRef.current } });
      const ensurePeer = (key: string) => {
        let peer = peersRef.current.get(key);
        if (!peer) {
          peer = new RTCPeerConnection(ICE);
          peer.onicecandidate = (event) => { if (event.candidate) void send('visual-ice', { type: 'ice', to: key, candidate: event.candidate.toJSON() }); };
          peer.ontrack = (event) => setRemoteStream(event.streams[0] || new MediaStream([event.track]));
          peer.onconnectionstatechange = () => {
            if (peer?.connectionState === 'failed' || peer?.connectionState === 'disconnected' || peer?.connectionState === 'closed') {
              setStatus('The remote visual connection ended. Reconnect from the sharing device.');
            }
          };
          peersRef.current.set(key, peer);
        }
        return peer;
      };
      channel
        .on('broadcast', { event: 'visual-available' }, ({ payload }) => {
          const p = payload as Signal;
          if (p.from === deviceIdRef.current || !p.sessionId || !p.source) return;
          setAvailable((old) => [...old.filter((x) => x.id !== p.sessionId), { id: p.sessionId!, source: p.source!, label: p.label || 'Another device' }]);
        })
        .on('broadcast', { event: 'visual-stop' }, ({ payload }) => {
          const p = payload as Signal;
          if (p.from === deviceIdRef.current) return;
          if (p.sessionId) setAvailable((old) => old.filter((x) => x.id !== p.sessionId));
          if (p.from) { peersRef.current.get(p.from)?.close(); peersRef.current.delete(p.from); }
          setRemoteStream(null);
          setStatus('The other device stopped sharing.');
        })
        .on('broadcast', { event: 'visual-request' }, async ({ payload }) => {
          const p = payload as Signal;
          const activeSession = sessionRef.current;
          if (!activeSession || !localStreamRef.current || p.sessionId !== activeSession.id || !p.from) return;
          const peer = ensurePeer(p.from);
          localStreamRef.current.getTracks().forEach((track) => peer.addTrack(track, localStreamRef.current!));
          const offer = await peer.createOffer();
          await peer.setLocalDescription(offer);
          await send('visual-offer', { type: 'offer', sessionId: activeSession.id, to: p.from, sdp: offer });
          setStatus('A signed-in device requested your stream. Your camera/screen is shared only while this session remains active.');
        })
        .on('broadcast', { event: 'visual-offer' }, async ({ payload }) => {
          const p = payload as Signal;
          if (p.to !== deviceIdRef.current || !p.from || !p.sdp) return;
          const peer = ensurePeer(p.from);
          await peer.setRemoteDescription(p.sdp);
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          await send('visual-answer', { type: 'answer', sessionId: p.sessionId, to: p.from, sdp: answer });
          setStatus('Connected to the other device. Its camera/screen is visible below.');
        })
        .on('broadcast', { event: 'visual-answer' }, async ({ payload }) => {
          const p = payload as Signal;
          if (p.to !== deviceIdRef.current || !p.from || !p.sdp) return;
          const peer = peersRef.current.get(p.from);
          if (peer) await peer.setRemoteDescription(p.sdp);
          setStatus('Remote visual connection established.');
        })
        .on('broadcast', { event: 'visual-ice' }, async ({ payload }) => {
          const p = payload as Signal;
          if (p.to !== deviceIdRef.current || !p.from || !p.candidate) return;
          try { await ensurePeer(p.from).addIceCandidate(p.candidate); } catch { /* stale candidate after disconnect */ }
        })
        .subscribe((state) => { if (state === 'SUBSCRIBED' && active) { setReady(true); setStatus('Private same-account device channel connected.'); } else if (state === 'CHANNEL_ERROR' || state === 'TIMED_OUT' || state === 'CLOSED') { setReady(false); setStatus('Secure device signaling is unavailable. Confirm the Supabase private-channel migration and network connection.'); } });
    }).catch(() => setStatus('Could not initialize secure device signaling.'));
    return () => {
      active = false;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peersRef.current.forEach((p) => p.close());
      peersRef.current.clear();
      if (channelRef.current) void getClientSupabase()?.removeChannel(channelRef.current);
      channelRef.current = null;
    };
  }, [isSignedIn]);

  useEffect(() => {
    if (!session || !ready || !channelRef.current) return;
    const announce = () => channelRef.current?.send({ type: 'broadcast', event: 'visual-available', payload: { type: 'available', sessionId: session.id, source: session.source, label: session.label, from: deviceIdRef.current } });
    void announce();
    const interval = window.setInterval(() => { void announce(); }, 10000);
    return () => window.clearInterval(interval);
  }, [session, ready]);

  const startSharing = async (source: 'camera' | 'screen') => {
    const channel = channelRef.current;
    if (!channel || !ready || !userId) { setStatus('Sign in and wait for the secure device channel to connect first.'); return; }
    try {
      if (sessionRef.current) await stopSharing();
      if (source === 'screen' && (!window.isSecureContext || !navigator.mediaDevices?.getDisplayMedia)) throw new Error('This browser does not support screen capture. Try the desktop browser or share a screenshot in chat.');
      if (source === 'camera' && !navigator.mediaDevices?.getUserMedia) throw new Error('Camera capture is not supported in this browser.');
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      const stream = source === 'camera'
        ? await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        : await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      localStreamRef.current = stream;
      const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `session-${Date.now()}`;
      const next = { id, source, label: /Mobi|Android|iPhone/i.test(navigator.userAgent) ? 'Phone' : 'Computer' };
      sessionRef.current = next;
      setSession(next);
      setStatus(`Sharing ${source} is ready. On the other signed-in device, choose Connect.`);
      stream.getVideoTracks()[0].onended = () => { void stopSharing(); };
      await channel.send({ type: 'broadcast', event: 'visual-available', payload: { type: 'available', sessionId: id, source, label: next.label, from: deviceIdRef.current } });
    } catch (e) {
      setStatus(e instanceof Error ? e.message : 'Could not start remote sharing.');
    }
  };

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      void remoteVideoRef.current.play().catch(() => undefined);
    }
  }, [remoteStream]);

  const analyzeRemoteFrame = async () => {
    const video = remoteVideoRef.current;
    if (!video || !remoteStream || !video.videoWidth || analyzingFrame) return;
    setAnalyzingFrame(true); setVisualAnswer('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth; canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not capture a frame from the remote device.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const result = await inspectVisualFrame(canvas.toDataURL('image/jpeg', 0.85), 'Analyze this frame received from another device. User asks: ' + (visualQuestion.trim() || 'Describe the important details and useful next steps.') + '. Use only visible evidence, distinguish facts from uncertainty, and never claim to have controlled the remote device.', remoteSource, { intent: 'general_scene', systemInstruction: 'You are Angel, a practical visual assistant. Analyze only this explicitly captured remote-device frame and the user question. State uncertainty and do not claim to have clicked, typed, changed settings, or seen outside the frame.' });
      setVisualAnswer(typeof result === 'string' ? result : result.analysis);
    } catch (error) { setVisualAnswer(error instanceof Error ? error.message : 'Angel could not analyze this remote frame.'); }
    finally { setAnalyzingFrame(false); }
  };

  const connect = async (item: { id: string; source: 'camera' | 'screen'; label: string }) => {
    const channel = channelRef.current;
    if (!channel) return;
    setRemoteSource(item.source); setVisualAnswer('');
    setStatus(`Requesting permission to view ${item.label}'s ${item.source}. The other device must be actively sharing.`);
    await channel.send({ type: 'broadcast', event: 'visual-request', payload: { type: 'request', sessionId: item.id, to: undefined, from: deviceIdRef.current } });
  };

  const stopSharing = async () => {
    const channel = channelRef.current;
    const activeSession = sessionRef.current;
    if (activeSession && channel) await channel.send({ type: 'broadcast', event: 'visual-stop', payload: { type: 'stop', sessionId: activeSession.id, from: deviceIdRef.current } });
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    peersRef.current.forEach((p) => p.close());
    peersRef.current.clear();
    sessionRef.current = null;
    setSession(null);
    setRemoteStream(null);
    setVisualAnswer('');
    setStatus('Remote sharing stopped.');
  };

  if (!userId) return null;
  return (
    <div className="fixed bottom-20 left-4 z-[75] max-w-[calc(100vw-2rem)]">
      <details className="group w-72 max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#101522]/95 text-white shadow-2xl backdrop-blur-xl">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 text-sm"><MonitorSmartphone className="h-4 w-4 text-indigo-300"/><span className="flex-1 font-medium">Connect another device</span><span className="text-xs opacity-60">{available.length}</span></summary>
        <div className="space-y-3 border-t border-white/10 p-3">
          <p className="text-xs leading-relaxed text-white/65"><ShieldCheck className="mr-1 inline h-3.5 w-3.5"/>Private to your signed-in account. Sharing always requires permission on the device providing the camera or screen.</p>
          <div className="grid grid-cols-2 gap-2">
            <button disabled={!!session} onClick={() => void startSharing('camera')} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-2 py-2 text-xs hover:bg-white/10 disabled:opacity-40"><Camera className="h-3.5 w-3.5"/>Share camera</button>
            <button disabled={!!session} onClick={() => void startSharing('screen')} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 px-2 py-2 text-xs hover:bg-white/10 disabled:opacity-40"><MonitorUp className="h-3.5 w-3.5"/>Share screen</button>
          </div>
          {session && <button onClick={() => void stopSharing()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold"><PhoneOff className="h-3.5 w-3.5"/>Stop remote sharing</button>}
          {available.length > 0 && <div className="space-y-2"><p className="text-xs font-semibold">Available from your other devices</p>{available.map((item) => <div key={item.id} className="flex items-center gap-2 rounded-xl bg-white/5 p-2"><Radio className="h-4 w-4 text-emerald-300"/><div className="min-w-0 flex-1"><p className="truncate text-xs">{item.label}</p><p className="text-[11px] opacity-60">{item.source === 'camera' ? 'Camera' : 'Screen'}</p></div><button onClick={() => void connect(item)} className="rounded-lg bg-indigo-500 px-2 py-1.5 text-xs">Connect</button></div>)}</div>}
          {remoteStream && <div className="space-y-2"><video ref={remoteVideoRef} autoPlay playsInline controls className="aspect-video w-full rounded-xl bg-black object-contain" aria-label="Remote device camera or screen"/><textarea value={visualQuestion} onChange={(e) => setVisualQuestion(e.target.value)} rows={2} placeholder="Ask Angel about the remote screen or camera…" className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none focus:border-indigo-400"/><button disabled={analyzingFrame} onClick={() => void analyzeRemoteFrame()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold disabled:opacity-50">{analyzingFrame ? <LoaderCircle className="h-3.5 w-3.5 animate-spin"/> : <Camera className="h-3.5 w-3.5"/>}Ask Angel about this frame</button>{visualAnswer && <div className="max-h-40 overflow-auto whitespace-pre-wrap rounded-xl bg-white/5 p-2.5 text-xs leading-relaxed">{visualAnswer}</div>}</div>}
          {status && <p role="status" className="text-[11px] leading-relaxed text-white/65">{status}</p>}
        </div>
      </details>
    </div>
  );
};

const RemoteVideo: React.FC<{ stream: MediaStream }> = ({ stream }) => {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (ref.current) { ref.current.srcObject = stream; void ref.current.play().catch(() => undefined); } }, [stream]);
  return <video ref={ref} autoPlay playsInline controls className="aspect-video w-full rounded-xl bg-black object-contain" aria-label="Remote device camera or screen" />;
};

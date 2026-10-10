import React, { useEffect, useRef, useState } from 'react';
import { Camera, MonitorUp, Square, X, Eye, LoaderCircle } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

type Source = 'camera' | 'screen';

interface VisualModePopupProps {
  onClose: () => void;
}

export const VisualModePopup: React.FC<VisualModePopupProps> = ({ onClose }) => {
  const { inspectVisualFrame, settings } = useAngel();
  const isLight = settings.theme === 'light';
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [busy, setBusy] = useState(false);

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSource(null);
  };

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  const start = async (nextSource: Source) => {
    setError('');
    setResult('');
    if (!navigator.mediaDevices) {
      setError('This browser does not support device capture. Open Angel using HTTPS in a current browser.');
      return;
    }
    try {
      stopStream();
      let stream: MediaStream;
      if (nextSource === 'camera') {
        if (!navigator.mediaDevices.getUserMedia) {
          setError('Camera capture is not supported by this browser.');
          return;
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } else {
        if (!window.isSecureContext || !navigator.mediaDevices.getDisplayMedia) {
          setError('Live screen sharing is not supported by this browser or device. Try a supported browser, or share a screenshot in chat.');
          return;
        }
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setSource(nextSource);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        await videoRef.current.play().catch(() => undefined);
      }
      const track = stream.getVideoTracks()[0];
      if (track) track.onended = () => {
        stopStream();
        setError(nextSource === 'screen' ? 'Screen sharing has ended.' : 'Camera has been stopped.');
      };
    } catch (captureError) {
      const e = captureError instanceof Error ? captureError : new Error(String(captureError));
      if (e.name === 'NotAllowedError' || e.name === 'SecurityError') {
        setError(nextSource === 'screen' ? 'Screen sharing was cancelled or permission was denied.' : 'Camera permission was denied. Allow camera access in your browser settings.');
      } else if (e.name === 'NotFoundError') {
        setError(nextSource === 'screen' ? 'No shareable screen was found.' : 'No camera was found on this device.');
      } else {
        setError(e.message || 'Could not start capture.');
      }
    }
  };

  const analyze = async () => {
    const video = videoRef.current;
    if (!video || !source || !video.videoWidth || busy) return;
    setBusy(true);
    setError('');
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not read the captured frame.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const image = canvas.toDataURL('image/jpeg', 0.88);
      const response = await inspectVisualFrame(
        image,
        source === 'camera'
          ? 'Describe what you see in the camera view and answer the user’s likely visual questions. Be specific and grounded in the image.'
          : 'Inspect the shared screen. Explain the visible content and help the user with what is shown.',
        source,
        { intent: 'scene_analysis', systemInstruction: 'You are Angel. Analyze only the captured visual frame. Be concise, accurate, and do not claim to see anything outside the image.' }
      );
      setResult(typeof response === 'string' ? response : response.analysis);
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'Angel could not analyze this frame.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 p-3 sm:p-5" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="visual-mode-title" className={`relative flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl ${isLight ? 'border-slate-200 bg-white text-slate-900' : 'border-white/10 bg-[#0e1220] text-white'}`}>
        <header className="flex items-center justify-between gap-3 border-b border-current/10 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-400" />
            <div>
              <h2 id="visual-mode-title" className="text-sm font-semibold">Visual Mode</h2>
              <p className="text-xs opacity-60">Let Angel see your camera or shared screen</p>
            </div>
          </div>
          <button type="button" onClick={() => { stopStream(); onClose(); }} className="rounded-lg p-2 opacity-70 hover:bg-current/10 hover:opacity-100" aria-label="Close Visual Mode"><X className="h-5 w-5" /></button>
        </header>

        <div className="space-y-3 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => void start('camera')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${source === 'camera' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400' : 'border-current/15 hover:bg-current/5'}`}>
              <Camera className="h-4 w-4" /> Camera
            </button>
            <button type="button" onClick={() => void start('screen')} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-medium transition-colors ${source === 'screen' ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400' : 'border-current/15 hover:bg-current/5'}`}>
              <MonitorUp className="h-4 w-4" /> Share screen
            </button>
          </div>

          {error && <p role="alert" className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-500">{error}</p>}

          {source && (
            <div className="space-y-3">
              <video ref={videoRef} autoPlay muted playsInline className="max-h-[42dvh] w-full rounded-xl bg-black object-contain" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => void analyze()} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                  {busy ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                  {busy ? 'Angel is looking…' : 'Ask Angel to analyze'}
                </button>
                <button type="button" onClick={stopStream} className="flex items-center justify-center gap-2 rounded-xl border border-current/15 px-3 py-3 text-sm hover:bg-current/5">
                  <Square className="h-4 w-4" /> Stop
                </button>
              </div>
            </div>
          )}

          {result && <div className="whitespace-pre-wrap rounded-xl border border-current/10 bg-current/[0.03] p-3 text-sm leading-relaxed">{result}</div>}
          {!source && !error && <p className="py-3 text-center text-sm opacity-60">Choose Camera or Share screen. Your browser will ask for permission before Angel can access it.</p>}
        </div>
      </section>
    </div>
  );
};

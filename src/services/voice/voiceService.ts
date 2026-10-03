/**
 * ANGEL AI — Client-Side Voice Engine
 * Handles low-latency voice interaction, server-side neural TTS,
 * model-backed transcription, barge-in / interruption, and device enumeration.
 */

export interface VoicePreference {
  voiceName: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | string;
  rate: number;
  pitch: number;
  autoListenAfterSpeech: boolean;
}

class VoiceEngine {
  private activeAudio: HTMLAudioElement | null = null;
  private isSpeaking = false;

  async getAudioInputDevices(): Promise<MediaDeviceInfo[]> {
    if (!navigator.mediaDevices?.enumerateDevices) return [];
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch {
      return [];
    }
  }

  /**
   * Transcribe an audio Blob using server-side Gemini 3.5 Transcribe
   */
  async transcribeAudioBlob(blob: Blob, prompt?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const res = await fetch('/api/voice/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Audio: base64Data,
              mimeType: blob.type || 'audio/webm',
              prompt,
            }),
          });
          if (!res.ok) {
            throw new Error('Transcription request failed');
          }
          const data = await res.json();
          resolve(data.text || '');
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Speak text using server-side Gemini 3.8 Flash Lite TTS or browser fallback
   */
  async speakText(
    text: string,
    voiceName: string = 'Kore',
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<void> {
    this.stopSpeaking();

    try {
      // 1. Attempt server-side neural TTS
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceName }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          this.activeAudio = audio;
          this.isSpeaking = true;

          audio.onplay = () => onStart?.();
          audio.onended = () => {
            this.isSpeaking = false;
            this.activeAudio = null;
            onEnd?.();
          };
          audio.onerror = () => {
            this.isSpeaking = false;
            this.activeAudio = null;
            // Fallback to browser speech
            this.fallbackBrowserSpeech(text, onStart, onEnd);
          };

          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Fallback to browser SpeechSynthesis
    this.fallbackBrowserSpeech(text, onStart, onEnd);
  }

  private fallbackBrowserSpeech(text: string, onStart?: () => void, onEnd?: () => void) {
    if (!window.speechSynthesis) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      this.isSpeaking = true;
      onStart?.();
    };
    utterance.onend = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    utterance.onerror = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Barge-in interruption: immediately halts playback if user speaks
   */
  stopSpeaking(): void {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking = false;
  }

  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const voiceEngine = new VoiceEngine();

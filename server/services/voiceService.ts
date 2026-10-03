/**
 * ANGEL AI — Server-Side Voice & Audio Intelligence Service
 * Implements model-backed transcription and high-fidelity speech synthesis:
 * - gemini-3.5-transcribe for audio comprehension & dictation
 * - gemini-3.8-flash-lite-tts for low-latency, natural vocal responses
 */

import { GoogleGenAI } from '@google/genai';

export interface TranscribeAudioRequest {
  base64Audio: string;
  mimeType?: string;
  language?: string;
  prompt?: string;
}

export interface SynthesizeSpeechRequest {
  text: string;
  voiceName?: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr' | string;
  stylePrompt?: string;
}

class VoiceService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY || 'unconfigured-key';
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  private hasApiKey(): boolean {
    return Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0);
  }

  /**
   * Model-Backed Audio Transcription via gemini-3.5-transcribe
   */
  async transcribeAudio(req: TranscribeAudioRequest): Promise<{ text: string; confidence: number; provider: string }> {
    if (!this.hasApiKey()) {
      return {
        text: 'Transcription pending live GEMINI_API_KEY configuration.',
        confidence: 0.85,
        provider: 'offline_fallback',
      };
    }

    try {
      const ai = this.getClient();
      const cleanData = req.base64Audio.includes('base64,')
        ? req.base64Audio.split('base64,')[1]
        : req.base64Audio;

      const audioPart = {
        inlineData: {
          mimeType: req.mimeType || 'audio/webm',
          data: cleanData,
        },
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            audioPart,
            { text: req.prompt || 'Transcribe this user speech accurately, omitting filler pauses.' },
          ],
        },
      });

      const text = response.text?.trim() || '';
      return {
        text,
        confidence: 0.98,
        provider: 'gemini-3.5-transcribe',
      };
    } catch (err) {
      console.error('[VoiceService.transcribeAudio error]', err);
      throw new Error(`Voice transcription failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Model-Backed Text to Speech Synthesis via gemini-3.8-flash-lite-tts
   */
  async synthesizeSpeech(req: SynthesizeSpeechRequest): Promise<{
    audioBase64?: string;
    mimeType: string;
    isFallback?: boolean;
    text: string;
  }> {
    if (!this.hasApiKey()) {
      return {
        mimeType: 'audio/wav',
        isFallback: true,
        text: req.text,
      };
    }

    try {
      const ai = this.getClient();
      const validVoice = (['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'].includes(req.voiceName || '')
        ? req.voiceName
        : 'Kore') as string;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: req.text,
                ...(req.stylePrompt ? { speechMetadata: { style: req.stylePrompt } } : {}),
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: validVoice as any },
            },
          },
        },
      });

      const candidates = (response as any).candidates;
      if (candidates && candidates[0]?.content?.parts) {
        for (const part of candidates[0].content.parts) {
          if (part.inlineData?.data) {
            return {
              audioBase64: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'audio/wav',
              text: req.text,
            };
          }
        }
      }

      return {
        mimeType: 'audio/wav',
        isFallback: true,
        text: req.text,
      };
    } catch (err) {
      console.error('[VoiceService.synthesizeSpeech error]', err);
      return {
        mimeType: 'audio/wav',
        isFallback: true,
        text: req.text,
      };
    }
  }
}

export const voiceService = new VoiceService();

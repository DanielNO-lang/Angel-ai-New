/**
 * ANGEL AI — High-Fidelity Voice Dictation Hook
 * Solves the repetitive text echo bug in Web Speech API:
 * 1. Distinguishes between finalized results and interim hypotheses.
 * 2. Employs word-level sliding window deduplication to prevent repeated tokens.
 * 3. Supports debounced continuous stream listening with automatic cleanup.
 */

import { useState, useRef, useCallback, useEffect } from 'react';

interface VoiceDictationOptions {
  onResult?: (finalText: string, interimText: string) => void;
  onFinal?: (finalText: string) => void;
  onError?: (error: string) => void;
  lang?: string;
}

export function useVoiceDictation(options: VoiceDictationOptions = {}) {
  const { onResult, onFinal, onError, lang = 'en-US' } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>('');
  const lastProcessedIndexRef = useRef<number>(0);
  const recentWordsBufferRef = useRef<string[]>([]);

  // Stop listening helper
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Safe ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Word deduplication helper: prevents repeating the exact sequence
  const deduplicateTokens = (existing: string, incoming: string): string => {
    const existingTokens = existing.trim().split(/\s+/).filter(Boolean);
    const incomingTokens = incoming.trim().split(/\s+/).filter(Boolean);

    if (existingTokens.length === 0) return incoming.trim();
    if (incomingTokens.length === 0) return existing.trim();

    // Check maximum overlap between end of existing and start of incoming
    let maxOverlap = 0;
    const maxCheck = Math.min(existingTokens.length, incomingTokens.length, 6);

    for (let len = 1; len <= maxCheck; len++) {
      const existingSlice = existingTokens
        .slice(existingTokens.length - len)
        .join(' ')
        .toLowerCase();
      const incomingSlice = incomingTokens.slice(0, len).join(' ').toLowerCase();

      if (existingSlice === incomingSlice) {
        maxOverlap = len;
      }
    }

    const nonOverlapping = incomingTokens.slice(maxOverlap).join(' ');
    if (!nonOverlapping) return existing;
    return `${existing} ${nonOverlapping}`.trim();
  };

  /**
   * Intelligent Speech Structure Formatter:
   * Detects spoken phrasing and arranges content according to how it was spoken:
   * - Mentions & bullets: "bullet", "bullet point", "mention", "for mentions", "dash" -> '- ...'
   * - Numbering & ordered points: "first", "second", "third", "number 1", "point 1" -> '1. ...', '2. ...'
   * - Paragraphs & sentence flow: "new paragraph", "paragraph", punctuation detection, and proper capitalization.
   */
  const formatSpokenStructure = (raw: string): string => {
    if (!raw) return '';

    let text = raw;

    // 1. Spoken punctuation phrases
    text = text
      .replace(/\b(period|full stop)\b/gi, '.')
      .replace(/\b(comma)\b/gi, ',')
      .replace(/\b(question mark)\b/gi, '?')
      .replace(/\b(exclamation mark|exclamation point)\b/gi, '!')
      .replace(/\b(colon)\b/gi, ':')
      .replace(/\b(semi colon|semicolon)\b/gi, ';')
      .replace(/\b(new line|newline|line break)\b/gi, '\n')
      .replace(/\b(new paragraph|next paragraph|paragraph)\b/gi, '\n\n');

    // 2. Mentions & Bullet points
    text = text.replace(
      /(?:^|\s+)(?:bullet point|bullet|for mentions|mention:?|dash)\s+/gi,
      '\n- '
    );

    // 3. Numbered lists & ordered points
    text = text.replace(/(?:^|\s+)(?:number\s+one|point\s+one|firstly|first:?|step\s+one|step\s+1|number\s+1|point\s+1)\s+/gi, '\n1. ');
    text = text.replace(/(?:^|\s+)(?:number\s+two|point\s+two|secondly|second:?|step\s+two|step\s+2|number\s+2|point\s+2)\s+/gi, '\n2. ');
    text = text.replace(/(?:^|\s+)(?:number\s+three|point\s+three|thirdly|third:?|step\s+three|step\s+3|number\s+3|point\s+3)\s+/gi, '\n3. ');
    text = text.replace(/(?:^|\s+)(?:number\s+four|point\s+four|fourthly|fourth:?|step\s+four|step\s+4|number\s+4|point\s+4)\s+/gi, '\n4. ');
    text = text.replace(/(?:^|\s+)(?:number\s+five|point\s+five|fifthly|fifth:?|step\s+five|step\s+5|number\s+5|point\s+5)\s+/gi, '\n5. ');
    text = text.replace(/(?:^|\s+)(?:number\s+six|point\s+six|sixthly|step\s+6|number\s+6)\s+/gi, '\n6. ');
    text = text.replace(/(?:^|\s+)(?:number\s+seven|point\s+seven|seventhly|step\s+7|number\s+7)\s+/gi, '\n7. ');
    text = text.replace(/(?:^|\s+)(?:number\s+eight|point\s+eight|step\s+8|number\s+8)\s+/gi, '\n8. ');
    text = text.replace(/(?:^|\s+)(?:number\s+nine|point\s+nine|step\s+9|number\s+9)\s+/gi, '\n9. ');
    text = text.replace(/(?:^|\s+)(?:number\s+ten|point\s+ten|step\s+10|number\s+10)\s+/gi, '\n10. ');
    text = text.replace(/(?:^|\s+)(?:number|point|step)\s+(\d+)\s*[:.]?\s+/gi, '\n$1. ');

    // 4. Spacing cleanup
    text = text
      .replace(/\s+([.,?!;:])/g, '$1')
      .replace(/([.,?!;:])([^\s\d\n])/g, '$1 $2');

    // 5. Capitalization per line and list item
    text = text
      .split('\n')
      .map((line) => {
        const trimmed = line.trimStart();
        if (!trimmed) return '';

        const numMatch = trimmed.match(/^(\d+\.\s*)(.*)$/);
        if (numMatch) {
          const rest = numMatch[2];
          return numMatch[1] + (rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '');
        }

        const bulletMatch = trimmed.match(/^(-\s*)(.*)$/);
        if (bulletMatch) {
          const rest = bulletMatch[2];
          return bulletMatch[1] + (rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : '');
        }

        return trimmed
          .replace(/(^\w)/, (c) => c.toUpperCase())
          .replace(/([.?!]\s+)(\w)/g, (_, p1, p2) => p1 + p2.toUpperCase());
      })
      .join('\n');

    return text.replace(/\n{3,}/g, '\n\n').trim();
  };

  const startListening = useCallback(
    (initialText: string = '') => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        const err = 'Speech recognition is not supported in this browser.';
        setError(err);
        onError?.(err);
        return false;
      }

      stopListening();
      setError(null);
      finalTranscriptRef.current = initialText;
      lastProcessedIndexRef.current = 0;
      recentWordsBufferRef.current = [];
      setTranscript(initialText);
      setInterimTranscript('');

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = lang;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const res = event.results[i];
            const transcriptPiece = res[0]?.transcript || '';

            if (res.isFinal) {
              finalTranscriptRef.current = formatSpokenStructure(
                deduplicateTokens(finalTranscriptRef.current, transcriptPiece)
              );
              currentInterim = '';
              onFinal?.(finalTranscriptRef.current);
            } else {
              currentInterim += transcriptPiece;
            }
          }

          setTranscript(finalTranscriptRef.current);
          setInterimTranscript(currentInterim);
          onResult?.(
            finalTranscriptRef.current,
            currentInterim ? formatSpokenStructure(currentInterim) : ''
          );
        };

        recognition.onerror = (event: any) => {
          if (event.error !== 'no-speech') {
            console.warn('[VoiceDictation] Error:', event.error);
            setError(event.error);
            onError?.(event.error);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        return true;
      } catch (err: any) {
        console.error('[VoiceDictation] Start error:', err);
        setError(err.message || 'Failed to start speech recognition');
        setIsListening(false);
        return false;
      }
    },
    [lang, onError, onFinal, onResult, stopListening]
  );

  const reset = useCallback(() => {
    stopListening();
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, [stopListening]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullTranscript: interimTranscript
      ? `${transcript} ${interimTranscript}`.trim()
      : transcript,
    error,
    startListening,
    stopListening,
    reset,
    isSupported:
      typeof window !== 'undefined' &&
      !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition),
  };
}

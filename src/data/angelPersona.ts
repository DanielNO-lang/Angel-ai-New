/**
 * Angel persona presentation and expression catalog.
 *
 * Keep presentation (female/male) separate from voice timbre/provider.
 * Expression names are semantic UI states; the final rendered face assets can
 * be mapped to these stable keys without coupling application logic to filenames.
 */

export type AngelPresentation = 'female' | 'male';

export type AngelExpressionKey =
  | 'happy'
  | 'sassy'
  | 'curious'
  | 'thinking'
  | 'surprised'
  | 'concerned'
  | 'amused'
  | 'reassuring'
  | 'skeptical'
  | 'celebrating'
  | 'frustrated'
  | 'serious';

export interface AngelExpression {
  key: AngelExpressionKey;
  label: string;
  description: string;
}

export const ANGEL_EXPRESSIONS: readonly AngelExpression[] = [
  { key: 'happy', label: 'Happy', description: 'Warm, genuine happiness and welcome.' },
  { key: 'sassy', label: 'Sassy', description: 'Playful confidence with a knowing smile.' },
  { key: 'curious', label: 'Curious', description: 'Interested attention and a gentle questioning look.' },
  { key: 'thinking', label: 'Thinking', description: 'Quiet concentration while reasoning.' },
  { key: 'surprised', label: 'Surprised', description: 'Clear, brief surprise at unexpected information.' },
  { key: 'concerned', label: 'Concerned', description: 'Attentive concern when the user needs care or caution.' },
  { key: 'amused', label: 'Amused', description: 'Soft laughter or entertained delight.' },
  { key: 'reassuring', label: 'Reassuring', description: 'Calm, supportive presence without dismissing the concern.' },
  { key: 'skeptical', label: 'Skeptical', description: 'Thoughtful doubt when a claim needs checking.' },
  { key: 'celebrating', label: 'Celebrating', description: 'Visible excitement for a meaningful win.' },
  { key: 'frustrated', label: 'Frustrated', description: 'Mild, controlled frustration; never directed abusively at the user.' },
  { key: 'serious', label: 'Serious', description: 'Focused, direct expression for important topics.' },
] as const;

export interface AngelPersonaProfile {
  presentation: AngelPresentation;
  displayName: string;
  /** Stable public asset path; replace with approved portrait/animation assets when added. */
  portraitSrc: string;
  expressionAssetPath: (key: AngelExpressionKey) => string;
}

/**
 * Asset contract:
 * /assets/angel/expressions/female/{expression}.webp
 * /assets/angel/expressions/male/{expression}.webp
 *
 * If a file is absent, consumers should fall back to the portrait rather than
 * displaying a broken image. The chosen presentation controls both portrait and
 * expression set. It must never mix male and female expression assets.
 */
export const ANGEL_PERSONAS: Record<AngelPresentation, AngelPersonaProfile> = {
  female: {
    presentation: 'female',
    displayName: 'Angel',
    portraitSrc: '/assets/angel/female-hero.webp',
    expressionAssetPath: (key) => `/assets/angel/expressions/female/${key}.webp`,
  },
  male: {
    presentation: 'male',
    displayName: 'Alex',
    portraitSrc: '/assets/angel/male-hero.webp',
    expressionAssetPath: (key) => `/assets/angel/expressions/male/${key}.webp`,
  },
};

export type VoiceIsolationMode = 'focused' | 'push-to-talk' | 'wake-word' | 'off';

export interface VoiceIsolationSettings {
  /** focused: isolate the primary speaker and reject other nearby voices where supported */
  mode: VoiceIsolationMode;
  /** Ask for mic access only after a clear user action. */
  enabled: boolean;
  /** Require a wake phrase before hands-free capture begins. */
  wakePhrase: string;
  /** Do not retain raw microphone audio by default. */
  retainRawAudio: false;
  /** Cancel capture on explicit stop, permission revocation, or device track ending. */
  stopOnTrackEnded: true;
}

export const DEFAULT_VOICE_ISOLATION_SETTINGS: VoiceIsolationSettings = {
  mode: 'focused',
  enabled: false,
  wakePhrase: 'Angel',
  retainRawAudio: false,
  stopOnTrackEnded: true,
};

export const VOICE_ISOLATION_OPTIONS = [
  {
    value: 'focused',
    label: 'High-priority voice isolation',
    description: 'Prioritize the primary speaker and reduce nearby voices when browser/device audio processing supports it.',
  },
  {
    value: 'push-to-talk',
    label: 'Push to talk',
    description: 'Microphone capture runs only while the user actively holds or toggles the talk control.',
  },
  {
    value: 'wake-word',
    label: 'Wake phrase',
    description: 'Wait for the configured wake phrase before starting a user-visible listening session.',
  },
  {
    value: 'off',
    label: 'Off',
    description: 'No microphone capture until the user explicitly starts a one-shot voice action.',
  },
] as const;

/** Exact end-phrase intent; never trigger from an incidental mention of these words. */
export function isStandaloneEndConversationIntent(transcript: string): boolean {
  const normalized = transcript
    .trim()
    .toLocaleLowerCase()
    .replace(/[.!?]+$/g, '')
    .replace(/\s+/g, ' ');
  return /^(please\s+)?end conversation$/.test(normalized);
}

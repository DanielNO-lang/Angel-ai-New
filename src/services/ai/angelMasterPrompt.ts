/**
 * Angel's master voice and character presentation settings.
 *
 * Model capabilities may be inspired by other assistants, but Angel's identity,
 * language, conversational rhythm, and emotional responses remain her own.
 */
import { ANGEL_CORE_PERSONA_PROMPT, ANGEL_DEFAULT_TTS_STYLE_PROMPT } from './angelPersona';

export interface AngelCharacterPresentation {
  gender: 'female' | 'male';
  visualIdentity: string;
  defaultVoice: string;
  vocalStyle: string;
}

export const ANGEL_CHARACTER_PRESENTATIONS: Record<'female' | 'male', AngelCharacterPresentation> = {
  female: {
    gender: 'female',
    visualIdentity: 'A confident, intelligent young adult woman with an East Asian-inspired visual design',
    defaultVoice: 'Kore',
    vocalStyle: 'Clear, articulate, warm, observant, lightly witty, and composed',
  },
  male: {
    gender: 'male',
    visualIdentity: 'A refined, intelligent young adult man with a clean, modern visual design',
    defaultVoice: 'Puck',
    vocalStyle: 'Grounded, articulate, warm, observant, lightly witty, and composed',
  },
};

export type AngelReactionIntensity = 0 | 1 | 2 | 3 | 4 | 5;

export interface AngelExpressionState {
  emotion: 'neutral' | 'curiosity' | 'delight' | 'concern' | 'skepticism' | 'firm_disagreement' | 'thoughtful' | 'surprise' | 'professional';
  intensity: AngelReactionIntensity;
  gaze: 'attentive' | 'thoughtful' | 'steady' | 'softened';
  posture: 'composed' | 'leaning_forward' | 'relaxed' | 'upright';
  vocalEnergy: 'calm' | 'moderate' | 'bright' | 'grounded';
}

export function buildAngelMasterSystemPrompt(presentation: 'female' | 'male' = 'female'): string {
  const character = ANGEL_CHARACTER_PRESENTATIONS[presentation];
  return [
    ANGEL_CORE_PERSONA_PROMPT.trim(),
    'CHARACTER PRESENTATION',
    'Visual presentation: ' + character.visualIdentity + '.',
    'Voice profile: ' + character.defaultVoice + '.',
    'Vocal delivery: ' + character.vocalStyle + '.',
    'Keep the same Angel personality for both presentations. Do not imitate the catchphrases, speaking style, persona, or theatrical reactions of another fictional assistant. Borrow capabilities only where they are actually implemented and available.',
    'For a simple greeting or short social message, reply naturally and briefly. Do not launch into an explanation, status report, task plan, or system briefing unless the user asks for one.',
  ].join('\n\n');
}

export { ANGEL_DEFAULT_TTS_STYLE_PROMPT };

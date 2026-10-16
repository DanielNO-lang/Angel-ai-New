/**
 * Browser-safe, intent-aware voice routing inspired by Wheelhouse's utterance-boundary model.
 * This router intentionally handles Angel workspace commands only; it never executes OS-level input.
 */
export type AngelWorkspaceTab = 'home' | 'chat' | 'tasks' | 'memories' | 'projects' | 'settings' | 'agent_lab' | 'media_studio';

export type AngelVoiceRoute =
  | { kind: 'end-session' }
  | { kind: 'navigate'; target: AngelWorkspaceTab; newChat?: boolean }
  | { kind: 'control'; action: 'pause-listening' | 'resume-listening' | 'mute' | 'unmute' | 'stop-speaking' }
  | { kind: 'prompt'; prompt: string }
  | { kind: 'ignore' };

const END_SESSION = /^(?:(?:okay|ok|alright)[,\s]+)?(?:bye|goodbye|good bye|see you later|end conversation|end section|end this session|end the session)[.!?\s]*$/i;

const NAVIGATION: Array<[RegExp, AngelWorkspaceTab]> = [
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?home(?: page)?[.!?]*$/i, 'home'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?chat(?: page)?[.!?]*$/i, 'chat'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?tasks?(?: page)?[.!?]*$/i, 'tasks'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?(?:memories|memory vault)(?: page)?[.!?]*$/i, 'memories'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?projects?(?: page)?[.!?]*$/i, 'projects'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?settings?(?: page)?[.!?]*$/i, 'settings'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?(?:agent lab|agents)(?: page)?[.!?]*$/i, 'agent_lab'],
  [/^(?:please\s+)?(?:open|go to|go|switch to|navigate to)\s+(?:the\s+)?(?:media studio|media)[.!?]*$/i, 'media_studio'],
];

export function routeAngelVoiceUtterance(raw: string): AngelVoiceRoute {
  if (typeof raw !== 'string' || !raw.trim()) return { kind: 'ignore' };
  let text = raw.trim().replace(/\s+/g, ' ');
  if (END_SESSION.test(text)) return { kind: 'end-session' };

  // Remove an optional natural greeting/address at utterance start but preserve the request.
  text = text.replace(/^(?:(?:hey|hello|hi|okay|ok)[,\s]+)?angel\b[\s,.:;-]*/i, '').trim();
  if (!text) return { kind: 'ignore' };
  // Apply ending intent after removing the wake/address prefix, but still require
  // a standalone farewell rather than a keyword embedded in a longer sentence.
  if (END_SESSION.test(text)) return { kind: 'end-session' };

  if (/^(?:pause listening|pause voice|stop listening)[.!?]*$/i.test(text)) {
    return { kind: 'control', action: 'pause-listening' };
  }
  if (/^(?:resume listening|resume voice|start listening)[.!?]*$/i.test(text)) {
    return { kind: 'control', action: 'resume-listening' };
  }
  if (/^(?:mute|mute microphone|mute mic)[.!?]*$/i.test(text)) {
    return { kind: 'control', action: 'mute' };
  }
  if (/^(?:unmute|unmute microphone|unmute mic)[.!?]*$/i.test(text)) {
    return { kind: 'control', action: 'unmute' };
  }
  if (/^(?:stop speaking|stop talking|interrupt)[.!?]*$/i.test(text)) {
    return { kind: 'control', action: 'stop-speaking' };
  }
  if (/^(?:new chat|start a new chat|new conversation)[.!?]*$/i.test(text)) {
    return { kind: 'navigate', target: 'chat', newChat: true };
  }

  for (const [pattern, target] of NAVIGATION) {
    if (pattern.test(text)) return { kind: 'navigate', target };
  }

  // A keyword inside a longer request (for example, "I want to end this") is not
  // interpreted as a session-ending command; it remains ordinary language.
  return { kind: 'prompt', prompt: text };
}

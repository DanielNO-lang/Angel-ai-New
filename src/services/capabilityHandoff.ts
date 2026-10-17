export type CapabilityHandoffTarget = 'media_studio' | 'automation';

interface CapabilityHandoff {
  target: CapabilityHandoffTarget;
  prompt: string;
  createdAt: number;
}

const STORAGE_KEY = 'angel_pending_capability_prompt';
const MAX_AGE_MS = 15 * 60 * 1000;

/** Store a short-lived prompt for the destination workspace; never runs a task by itself. */
export function saveCapabilityHandoff(target: CapabilityHandoffTarget, prompt: string): void {
  if (typeof localStorage === 'undefined') return;
  const normalized = prompt.trim().slice(0, 2000);
  if (!normalized) return;
  try {
    const handoff: CapabilityHandoff = { target, prompt: normalized, createdAt: Date.now() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(handoff));
  } catch {
    // Navigation still works if storage is blocked; only prompt prefill is lost.
  }
}

/** Consume only a fresh handoff intended for this capability, and do not execute it. */
export function consumeCapabilityHandoff(target: CapabilityHandoffTarget): string | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const handoff = JSON.parse(raw) as Partial<CapabilityHandoff>;
    if (handoff.target !== target) return null;
    localStorage.removeItem(STORAGE_KEY);
    if (typeof handoff.createdAt !== 'number' || Date.now() - handoff.createdAt > MAX_AGE_MS || Date.now() < handoff.createdAt) return null;
    return typeof handoff.prompt === 'string' ? handoff.prompt.trim().slice(0, 2000) || null : null;
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
}

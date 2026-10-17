export type ScheduleType = 'once' | 'interval';

export interface ParsedScheduledTaskInput {
  title: string;
  taskPrompt: string;
  scheduleType: ScheduleType;
  scheduledAt: string;
  intervalMinutes: number | null;
  maxRuns: number;
  notifyOnCompletion: boolean;
}

export type ScheduleInputResult =
  | { ok: true; value: ParsedScheduledTaskInput }
  | { ok: false; error: string };

/** Validate and normalize user-created schedules at the server trust boundary. */
export function parseScheduledTaskInput(input: unknown, nowMs = Date.now()): ScheduleInputResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, error: 'A schedule request object is required.' };
  }
  const body = input as Record<string, unknown>;
  const scheduleType = body.scheduleType;
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const taskPrompt = typeof body.taskPrompt === 'string' ? body.taskPrompt.trim() : '';
  const scheduledMs = typeof body.scheduledAt === 'string' ? Date.parse(body.scheduledAt) : NaN;

  if (scheduleType !== 'once' && scheduleType !== 'interval') {
    return { ok: false, error: 'Choose a one-time or repeating interval schedule.' };
  }
  if (!title || title.length > 160) {
    return { ok: false, error: 'Schedule names must contain 1–160 characters.' };
  }
  if (!taskPrompt || taskPrompt.length > 20000) {
    return { ok: false, error: 'Scheduled prompts must contain 1–20,000 characters.' };
  }
  if (!Number.isFinite(scheduledMs) || scheduledMs < nowMs + 30_000 ||
      scheduledMs > nowMs + 365 * 24 * 60 * 60 * 1000) {
    return { ok: false, error: 'The first run must be between 30 seconds and one year from now.' };
  }
  if (body.notifyOnCompletion !== undefined && typeof body.notifyOnCompletion !== 'boolean') {
    return { ok: false, error: 'notifyOnCompletion must be a boolean.' };
  }

  let intervalMinutes: number | null = null;
  let maxRuns = 1;
  if (scheduleType === 'interval') {
    if (!Number.isInteger(body.intervalMinutes) || Number(body.intervalMinutes) < 15 || Number(body.intervalMinutes) > 43200) {
      return { ok: false, error: 'Repeating schedules must run every 15 minutes to 30 days.' };
    }
    if (!Number.isInteger(body.maxRuns) || Number(body.maxRuns) < 1 || Number(body.maxRuns) > 100) {
      return { ok: false, error: 'Repeating schedules must stop after 1–100 runs.' };
    }
    intervalMinutes = Number(body.intervalMinutes);
    maxRuns = Number(body.maxRuns);
  }

  return {
    ok: true,
    value: {
      title,
      taskPrompt,
      scheduleType,
      scheduledAt: new Date(scheduledMs).toISOString(),
      intervalMinutes,
      maxRuns,
      notifyOnCompletion: body.notifyOnCompletion !== false,
    },
  };
}

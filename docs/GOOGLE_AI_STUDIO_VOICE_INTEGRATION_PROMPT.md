# Google AI Studio Prompt: Repair and Complete Angel's Voice Connection

You are working on the existing Angel AI project in GitHub repository `DanielNO-lang/Angel-ai-New`. This is a targeted engineering task, not permission to rebuild the app or redefine Angel.

## Operating constraints
- Inspect the current code first. Preserve working features and current architecture.
- The active development branch is `feat/angel-persona-voice-foundation-2026-10-18`. Do not merge into `main`.
- Do not deploy to Netlify or any production host.
- Do not commit, print, expose, or embed any real API key, service-role key, OAuth secret, or webhook secret. Keep privileged credentials server-side.
- Do not claim a provider is connected until a real request succeeds and the response is validated.
- If a feature cannot be implemented with the current provider/API/browser, explain the blocker and give exact setup instructions rather than creating a fake control.
- Before editing, list the existing voice-related files and routes you found, the intended changes, and any conflict with the existing code. Then implement and run tests.

## Product behavior to implement

Angel's microphone and voice experience must be coherent and integrated into the existing chat UI.

1. **Microphone = dictation by default.** It records with explicit permission, converts speech to text, and inserts a final editable transcript into the normal chat composer. Do not auto-send dictated text. Keep interim text visibly separate and prevent duplicated words.
2. **Voice/TTS.** The user can choose a supported voice in Settings. The saved product decision describes “UNIQUE” as the desired default identity and conceptual options Aura, Velvet, Nova, Ember and Sol. Existing source currently uses provider voice IDs such as Kore/Puck/Charon/Fenrir/Zephyr. Do not silently substitute a display label for a real provider voice: map labels to supported voices, document unavailable options, and preserve the intended default if it can be implemented. Selection should play a sample automatically where supported, with loading, success, and error states.
3. **Voice output.** Use the project's existing server route `POST /api/voice/tts` if that is the correct route after inspection. Support interruption/stop, prevent overlapping audio, clean up on completion/error/unmount, and use browser speech synthesis only as a clearly understood fallback. Prefer true streaming TTS if the chosen API and SDK support it; do not fake streaming by chunking without explaining trade-offs.
4. **Transcription.** Audit and connect the existing `POST /api/voice/transcribe` route. Validate audio MIME type, request size, response schema, authentication/rate limits as appropriate, and errors. Ensure the provider model/endpoint names are real for the current SDK version. Avoid deprecated or invented model names.
5. **Angel Live is inside normal chat, not a separate page.** Build/repair a live session state with clear start/end, mic status, user/Angel transcript, speaking/listening/thinking indicators, audio visualizer/activity, mute/pause/resume, barge-in, reconnection/errors, and a visible stop control. Save a transcript to the signed-in conversation only according to the existing persistence and privacy rules. Guest behavior must be clear and temporary.
6. **Gemini Live connection.** Inspect `src/services/visual/multimodalRegistry.ts`, which currently lists the bidirectional Gemini Live channel as pending configuration and mentions `GEMINI_LIVE_ENDPOINT` and `WEBRTC_SIGNALING_SECRET`. Do not assume those are the correct configuration requirements. Verify current official Gemini Live API docs and the current `@google/genai` SDK version in the repo. Choose the supported transport (WebSocket/WebRTC) and correct server/client split. Never put a permanent Gemini key in browser code. If the official flow supports short-lived ephemeral credentials, mint them server-side with minimum scope and expiry. Otherwise proxy the session through the server where supported.
7. **Wake phrase and voice isolation.** The UI currently offers Focused speaker, Push to talk, Wake phrase, and Off. Connect settings to real runtime behavior where technically supported. A stored phrase “Angel” is not a wake-word engine. Do not claim always-on listening unless the actual engine, permissions, lifecycle, platform limitations and privacy UX are implemented. Noise suppression/primary-speaker isolation must use a real supported audio pipeline, not just a setting label. If unavailable, label it honestly as not configured.
8. **Voice commands.** Audit `src/services/voice/voiceCommandRouter.ts`. Standalone commands should support ending the conversation, stop listening, pause/resume, mute/unmute, stop speaking, and supported navigation. A keyword embedded in an unrelated sentence must not end the session. After a standalone end command, stop the live session, stop all tracks, close peer/socket resources, and return to ordinary chat.
9. **Permissions and privacy.** Request mic permission only after user action. Show denied/unsupported/busy states. Release media tracks, audio contexts, sockets, event listeners and timers on stop, failure, route change and component unmount. Display a clear indicator while microphone/camera/screen capture is active. Do not silently record in the background.
10. **Cross-device behavior.** Support browsers/devices only where tested. Clearly identify browser APIs or OS features that are unavailable. Do not claim that background wake word, lock-screen controls, always-on listening, or native device behavior works universally.
11. **Security and cost.** Keep keys server-side, validate input, enforce auth/ownership for saved transcripts, rate-limit paid endpoints, avoid logging raw audio or secrets, and return sanitized errors. Do not expose service-role credentials in API responses or client bundles.
12. **Integration health.** Add or repair a safe diagnostics/status check that tells the UI whether the server, provider credential, and Live route are configured without returning secret values. Test success, missing-key, provider rejection, timeout, malformed response, denied permission, and cleanup cases.

## Existing source paths to inspect first
- `src/services/voice/voiceService.ts`
- `src/services/voice/useVoiceDictation.ts`
- `src/services/voice/voiceCommandRouter.ts`
- `src/services/visual/multimodalRegistry.ts`
- `src/components/settings/SettingsView.tsx`
- Chat/composer and Live UI components discovered in the repository tree
- `server.ts` and the actual `server/services/voiceService.ts` (if present)
- API route handlers for `/api/voice/transcribe`, `/api/voice/tts`, and any Live session/token route
- `package.json`, lockfile, relevant tests, and serverless adapter
- Supabase conversation/message schema and RLS policies if transcript persistence is changed

## Implementation sequence
A. Report the exact current implementation and gaps, citing file paths.  
B. Verify official current Google API/SDK usage and choose the correct connection architecture.  
C. Implement the smallest coherent end-to-end slice, reusing existing code.  
D. Add tests for command routing, request validation, error handling, permission cleanup, transcript insertion, and live session lifecycle. Mock provider calls in automated tests; do not make tests require paid credentials.  
E. Run type-check, tests, and production build. Fix failures caused by your changes.  
F. Provide exact manual test instructions for the user to finish any Google AI Studio or environment setup. Do not ask them to paste secrets into the chat.  
G. Report status in four separate categories: implemented in code; automated tests passed; requires configuration/user action; not supported or not yet implemented.

## Acceptance criteria
- Dictation populates the editable composer and never auto-sends.
- Voice output can be stopped/interrupted and does not leave orphan audio playing.
- The selected display voice maps to a real provider/browser voice, or is clearly marked unavailable.
- Live connects using a verified API flow, exchanges audio both ways, shows transcript/activity, and can be ended reliably.
- A standalone end-session command cleans up all capture/session resources; a similar phrase inside a longer unrelated sentence does not.
- No permanent provider key appears in browser bundles, committed files, logs, or UI.
- Mic denial, unsupported browser, missing configuration, provider failure, timeout, and reconnect paths are handled honestly.
- Tests and build pass on the active branch.
- No merge to main and no deployment occurs.

## Required final response from Google AI Studio
Return:
1. Files changed and why.
2. Architecture and exact verified API/SDK/model identifiers used, with official documentation links.
3. Environment variable *names only*, where each is configured, and whether the user still needs to set it.
4. Test commands and exact pass/fail output.
5. Remaining blockers and step-by-step setup instructions.
6. Explicit confirmation that no secrets were exposed and no deployment/merge was performed.

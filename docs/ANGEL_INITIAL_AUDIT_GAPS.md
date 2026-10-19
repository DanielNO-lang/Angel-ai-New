# Angel Initial Audit: Findings and Gaps

Date: 19 October 2026  
Branch: feat/angel-persona-voice-foundation-2026-10-18

This is an initial source audit, not a claim of full end-to-end verification. The complete master requirements are in `docs/ANGEL_MASTER_REQUIREMENTS_AND_AUDIT.md`.

## Confirmed
- GitHub Actions run [39260282349](https://github.com/DanielNO-lang/Angel-ai-New/actions/runs/39260282349) passed dependency installation, type-check, tests and production build for commit `1808c85d56cd3dda3427452a92430b1c608625de`.
- Existing code includes voice client services, browser dictation, a voice command router, a Voice panel, backend voice/reading services, a full-stack Express server, Supabase sync, offline storage, visual context tools, workflows, media, research and agent services.
- The Gemini Live channel is marked pending configuration in `src/services/visual/multimodalRegistry.ts`.
- The code's voice list currently uses Kore, Puck, Charon, Fenrir and Zephyr. The saved product specification separately identifies UNIQUE as the desired default and Aura, Velvet, Nova, Ember and Sol as conceptual options. This needs an explicit supported-voice mapping.
- The reading service currently lists PDF, plain text, Markdown, CSV, JPEG, PNG and WebP. Other document types need verified extraction support or an honest unsupported message.
- The connected Supabase project had 15 public tables with RLS enabled. A policy-hardening migration has been applied and committed on this branch. Full ownership tests and remote/local migration-history reconciliation remain.
- The current branch CI passing does not verify browser behavior, live provider credentials, OAuth, Supabase ownership, or hosted behavior.

## Fixes made in this pass
- Camera/screen capture errors no longer leave the UI falsely marked as actively sharing. Failed or unsupported capture now returns to the off state and shows a message.
- A failed voice response no longer claims that an autonomous agent pipeline was dispatched. It now reports that the response service was unreachable and the request was not completed.
- The latest code change passed the branch verification workflow.

## Priority gaps
1. Verify the real handlers and request/response shapes for `/api/voice/transcribe`, `/api/voice/tts` and `/api/ai/generate`.
2. Verify the official Gemini Live API transport and current SDK usage, then implement and test the real bidirectional session if supported. Current source does not prove it exists.
3. Remove or accurately label the hard-coded transcription confidence value of 0.98; it is not measured confidence.
4. Connect voice settings to real runtime behavior. A stored wake phrase is not wake-word detection; a preference is not speaker isolation or noise suppression.
5. Test session end, stop listening, mute, interruption, resource cleanup, browser permission denial and mobile/desktop behavior.
6. Reconcile `package.json` and `bun.lock`. The current workflow uses `bun install --no-save` as a temporary workaround for a lockfile mismatch.
7. Audit guest/authenticated chat, Google OAuth return/session persistence, history, memory, project/files, sync conflicts and deletion.
8. Test RLS against cross-user access for messages, conversations, tasks, memories, projects, files and workflows. Reconcile local migration files with the remote migration history.
9. Audit task lifecycle, approvals, background durability, connector OAuth/scopes/revocation, and verification of external actions.
10. Verify that camera/screen frames actually reach the vision model. Capture APIs alone are not proof of model understanding.
11. Integrate reviewed Angel/Alex hero portraits and 24 individual expression assets; they are not yet verified as present in the repository.
12. Verify all remaining requirements in the master document, including intelligence routing, citations, proactive tasks, offline/PWA, device management, specialist modes, vault, health-literacy safeguards, media studio, skills, marketplace and accessibility.

## External actions needed
- Run `docs/GOOGLE_AI_STUDIO_VOICE_INTEGRATION_PROMPT.md` in Google AI Studio and return its changed files, exact test output, verified API identifiers, and required environment-variable names.
- Use `docs/GOOGLE_AI_STUDIO_CHARACTER_ASSET_PROMPT.md` with the approved reference images to produce the separate Angel and Alex assets. Review before repository integration.
- Retrieve the full contents of the three Jarvis Progress Report conversations before claiming the conversation archive is exhaustive.

## Verification rule
A feature is complete only when its source, tests, configuration and practical behavior support that claim. No merge to main and no deployment are authorized by this audit.

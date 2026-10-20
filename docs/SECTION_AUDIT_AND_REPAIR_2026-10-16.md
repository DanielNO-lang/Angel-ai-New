# Angel AI section audit and repair log

Date: 2026-10-16  
Branch: `feat/filtered-angel-backend-foundation`  
Status: draft PR only. Do not merge or deploy production without owner approval.

## Implemented in this pass

1. **Chat request lifecycle and recovery**
   - Kept the user and assistant messages in the conversation timeline when a request fails.
   - The assistant failure notice now has an explicit Retry action that resends the last user message.
   - Existing HTTP/provider/empty-stream failures remain surfaced instead of being replaced with fabricated success text.

2. **Backdrop, theme, and sidebar**
   - Replaced the multi-layer cosmic backdrop with a single, very low-opacity brand artwork layer and stable theme base colors.
   - Removed the duplicate large artwork and glow stack from the sidebar.
   - Collapsed-sidebar hover expansion is fixed-positioned and uses a negative flex margin so the expanded preview should not push the workspace.
   - System theme now resolves against the OS light preference in the application shell and backdrop.
   - Reduced global color transition duration and added a reduced-motion override.

3. **Navigation and creation suggestions**
   - Swipe opening still only triggers on Home and Chat.
   - The existing section back control uses the previous-section navigation event.
   - Home and Chat retain three randomized suggestions. Image/video, workflow, and writing suggestions route to Media Studio, Automation, and Canvas respectively; general prompts remain in Chat.

4. **Settings**
   - Added Visual Mode, Private Memory, Skills, and Plugins to the Settings navigation alongside account, profile, appearance, theme, workspace, voice, notifications, connections, and security.
   - Skills and Plugins route to their actual workspace sections.
   - Removed the redirect that silently forced Visual Mode and Privacy settings back to Account.
   - Added persistent conversational delivery preferences for warmth, humor, directness, empathy, and emotional tone. They are added to the model-facing agent instructions without changing Angel's stable identity.
   - Removed the unsupported model selector and unconnected voice-model chooser. The Settings UI now explains that those controls are not active until the live provider pipeline supports them.

5. **Performance**
   - Reduced backdrop layers, theme transitions, and section transition complexity.
   - Added local development-only startup timing logs for DOM interactive, load event, and first contentful paint. No telemetry is transmitted.

## Verification and remaining limits

- GitHub Actions passed type-check, unit tests, and production build on commit `4a223884b6edbb643e8cf0f8c17b6ceb07e2e7bc`, before the final local performance timing instrumentation commit. The final commit must pass CI before this branch is treated as verified.
- Vercel's status reports a build-rate-limit failure. The preview may not include the latest branch changes.
- No production deployment or merge was performed.
- Runtime performance numbers are not available until the latest branch is built and opened in a browser. The added diagnostics will report timings in the browser console in development.
- Real-device camera/screen sharing, browser notifications, background job scheduling, and cross-network WebRTC still require their separate environment setup and physical-device checks.
- The Settings appearance, notification, and voice options should only be described as operational when their controls are connected to the corresponding runtime service. Disconnected model and voice selection controls were removed rather than pretending to switch providers.

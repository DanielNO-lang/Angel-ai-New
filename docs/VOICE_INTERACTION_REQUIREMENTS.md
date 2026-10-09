# Angel AI Voice Interaction Requirements

Status: product requirements recorded for the future Voice Mode implementation. These requirements are not a claim that wake-word detection or speaker isolation is already implemented.

## 1. Priority user-voice isolation

- High-priority goal: Angel should prioritize the voice of the person who began the session and whom Angel first responded to. Other nearby speakers should not independently wake Angel, issue commands, or be treated as the active user.
- The implementation should establish a reference speaker from the user's first explicit voice interaction, with clear user consent and a way to reset/re-enrol the reference speaker.
- Use speaker verification/diarization and noise suppression where a configured provider supports them. Treat browser microphone capture, voice activity detection, and a voiceprint as distinct capabilities.
- Do not claim perfect speaker isolation if the active browser/model/provider cannot deliver it. Show a clear degraded-mode status and ask for confirmation when speaker confidence is low.
- Minimize raw audio retention. Do not save speaker reference audio or voiceprints to persistent memory by default.

## 2. Wake phrase: flexible Angel greeting/name phrases

- Wake phrases may vary. Examples include "Hey Angel", "Hello Angel", "Hi Angel", "Hey Angel, what's up?", and other natural greetings addressed to Angel.
- Do not require one rigid exact phrase, and do not require the user to say only the wake phrase. Angel should detect the greeting/address as the start of an utterance and then process the rest of that utterance as the user's request.
- A casual mention of Angel while speaking to someone else must not wake Angel unless the intent is clearly directed to Angel.
- Ignore playback of Angel's own output when detecting wake phrases to prevent feedback loops.

## 3. Ending a voice conversation: explicit intent, not keyword matching

- Accept short, standalone farewells or explicit commands addressed to Angel, such as "Bye", "Alright, bye", "See you later", "End conversation", "End section", or "Okay, end this session".
- Do not end the session because a phrase only appears inside a longer sentence, quotation, story, or discussion. For example, "I want to end this" is not automatically an end command; "I said bye to this person" is not a farewell to Angel.
- Resolve the utterance's meaning and addressee, not just the presence of words like "bye", "end", or "conversation". When ambiguous, ask a short confirmation or stay in the session.
- When ending is confirmed, stop listening, stop playback/capture resources cleanly, and show a visible session-ended state. Do not erase conversation history unless the user separately requests deletion.

## 4. Acceptance test phrases

| Case | Utterance | Expected outcome |
|---|---|---|
| Wake | "Hey Angel, what's up?" | Wake Angel and process the rest as a request |
| Wake | "Hello Angel, can you help me?" | Wake Angel and handle the question |
| Not wake | "I told my friend, 'hello' earlier" | Stay asleep unless clearly addressed to Angel |
| End | "Alright, bye" | End the current voice session |
| End | "Okay, end conversation" | End the current voice session |
| Not end | "Oh my goodness, I want to end this" | Keep listening; not a standalone command to Angel |
| Not end | "I said bye to this person" | Keep listening |
| Ambiguous | "Bye" said during quoted dialogue/storytelling | Do not end unless addressed to Angel; confirm if uncertain |
| Speaker lock | Another person speaks after the user enrols | Do not treat the other voice as the authorized active speaker |
| Confidence low | Reference user is obscured by noise or multiple speakers | Do not silently hand control to another speaker; ask the user to repeat/confirm |

## 5. Implementation order

1. Build the normal Voice Mode conversation loop and explicit microphone permission state.
2. Add speaker-reference enrolment, speaker confidence, and noise handling.
3. Add flexible wake-intent recognition with addressee/context checks.
4. Add semantic farewell/end-intent recognition with false-positive tests.
5. Run the acceptance phrase suite across desktop and mobile microphones, noisy rooms, overlapping speech, and speaker changes.

These requirements apply to Angel Voice Mode and any future always-listening/wake-word feature. They should be tested before the voice interaction work is declared complete.

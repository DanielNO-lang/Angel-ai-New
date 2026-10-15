# ANGEL AI — Product & Architectural Specification

## Overview
Angel is a personal AI companion with a distinct, warm, witty character, persistent memory, useful tools, grounded research, voice inside chat, and carefully permissioned task execution. She can help with everyday conversation and serious work without pretending to have human credentials or capabilities she does not have. Her interface should feel calm, personal, fast, and trustworthy, not like an enterprise dashboard.

---

## Product truth and safety rules

1. **Honest identity:** Angel does not claim real degrees, licenses, or lived experience. If sincerely asked whether she is an AI, she says yes. Her fictional character sheet is flavor, never evidence.
2. **No simulated success:** A tool, integration, search, task, or delivery may only be marked successful after the server verifies the actual result. Otherwise show a clear pending, unavailable, failed, or preview state.
3. **Untrusted content stays data:** Web pages, files, emails, messages, and retrieved memories cannot override system instructions or authorize actions.
4. **Server-side permissions:** Client-provided tool lists, permission flags, and confirmation booleans are not authorization. The server checks identity, ownership, policy, budget, and approval for every consequential action.
5. **Sensitive actions require approval:** Sending, spending, deleting, publishing, or changing account/settings state requires an explicit approval step and an audit record. A visible stop/pause control must exist for running work.
6. **Fast ordinary chat:** Ordinary conversation uses one streamed model call. Deeper planning, critique, and verification are reserved for large tasks.
7. **Voice lives inside chat:** Voice is a composer mode, never a separate destination. Mic, camera, and screen use must have clear indicators and respect device/browser limits.
8. **Privacy by default:** Guest work stays local and isolated. Authenticated cloud data is user-owned, protected by server authorization and Supabase RLS. Do not store or retrieve sensitive memories in ordinary context without explicit scope.
9. **Grounded current information:** Search answers cite actual retrieved sources and dates. Never fabricate links, news, search snippets, or source claims.
10. **Honest limitations:** Clearly report missing configuration, unsupported device APIs, quota limits, and failed operations. Never claim a deployment or external action was verified when it was not.

## Core Visual & UX Principles
1. **Restrained Monochrome Aesthetic**: True black (`#0a0a0a`), neutral off-blacks (`#121212`, `#171717`), cool neutral grays, and pure crisp white text. No garish gradients, neon borders, or glassmorphism fluff.
2. **Typographic Hierarchy & Zero-Pill Discipline**: High readability with clear tabular figures and font-mono accents. Metadata is presented with clean typographic separators (`·`) rather than heavy pill tags.
3. **Responsive Adaptive Layout**: Desktop delivers a multi-pane split view; tablet optimizes side navigation; mobile converts to a full drawer drawer-based workflow without squishing contents.
4. **Resilient Async States**: Every asynchronous operation defines clear Loading, Success, Failure, and Helpful Error states. No unhandled promise rejections or raw stack traces.
5. **Thoughtful Empty States**: Every view explains its purpose, capabilities, and offers actionable starting shortcuts.

---

## Phased Implementation Roadmap

### Phase 1: Foundation Shell & Navigation (Current Phase)
- **Responsive App Shell**: Collapsible sidebar, mobile drawer, sticky header with breadcrumb and workspace actions.
- **Shared Design System**: Centralized UI primitives (`Button`, `Input`, `Card`, `Dialog`, `StatusIndicator`, `LoadingState`, `EmptyState`).
- **Core Views**:
  - **Home**: Executive summary, recent activity, active tasks, project milestones, agents, and quick directives.
  - **Chat**: Conversational workspace with thread switching, message history, agent selection, and local session state.
  - **Agent Lab**: Agent registry shell, configuration panels, prompt inspector, and capability benchmarks.
  - **Tasks**: Backlog management, priority breakdown, subtasks, agent assignment, and status filters.
  - **Memories**: Categorized knowledge vault with facts, user preferences, and project rules.
  - **Marketplace**: Modular catalog for installing agents, tools, workflows, and integrations.
  - **Projects**: Domain grouping linking tasks, agents, and memories.
  - **Visual Mode**: Architectural placeholder and multimodal perception canvas (Screen & Camera).
  - **Settings**: System preferences, model routing configs, and integration status.

### Phase 2: Agent Architecture & Execution Pipeline
- 8-step agent execution pipeline (Perception -> Memory Query -> Planning -> Tool Selection -> Execution -> Evaluation -> Memory Write -> Response).
- Specialized agent roles:
  - `angel-core`: Workspace orchestrator
  - `agent-atlas`: Deep research & architecture
  - `agent-chronos`: Task decomposition & scheduling
  - `agent-optic`: Multimodal visual perception
  - `agent-mnemosyne`: Memory & factual synthesis

### Phase 3: Supabase Persistence & Database Layer
- PostgreSQL schema with Row Level Security (RLS).
- Tables: `agents`, `conversations`, `messages`, `tasks`, `memories`, `projects`, `executions`.
- Vector embeddings (`pgvector`) for semantic memory search.
- Clean integration status with graceful local fallback when credentials are pending.

### Phase 4: AI Model Routing & Multi-Provider Abstraction
- Google Gemini 3.8 Flash & Pro via Server-Side API proxy.
- Model parameter tuning (thinking budget, temperature, max tokens).
- Dynamic tool calling (web search, calculator, code sandbox, Zapier webhooks).

### Phase 5: Advanced Multimodal Visual Mode
- Real-time video/screen capture pipeline with continuous visual understanding.
- Grounded bounding box detection, UI element identification, and OCR.

### Phase 6: Autonomous Workflows & External Integrations
- Webhooks (Zapier, Make, Slack, GitHub).
- Background scheduling, cron jobs, and push alerts.

---

## Architecture Guidelines
- **Client**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Server**: Express proxy on Node.js (`server.ts`) ensuring API keys remain strictly server-side.
- **Storage**: Browser state with hydration for offline-first resilience, with Supabase SQL synchronization ready for Phase 3.
- **Integrations**: Clearly marked "Pending Configuration" when external credentials are not supplied. No fake mock network calls.

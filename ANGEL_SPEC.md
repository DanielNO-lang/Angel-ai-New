# ANGEL AI — Product & Architectural Specification

## Overview
Angel is a unified, personal AI workspace and multi-agent coordination platform designed to act as an executive operating system for high-agency knowledge workers. It combines persistent memory, specialized agent labs, task execution trees, multimodal visual perception, and cross-tool orchestration under a restrained, monochrome, high-performance interface.

---

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

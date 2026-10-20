import React, { useState } from 'react';
import { ArrowUpRight, Bot, Clock3, ImagePlus, MessageSquare, Search, Workflow } from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { AngelLogo } from '../ui/AngelLogo';
import { saveCapabilityHandoff } from '../../services/capabilityHandoff';

type SuggestionTarget = 'chat' | 'media_studio' | 'automation';
interface HomeSuggestion {
  id: string;
  label: string;
  description: string;
  prompt: string;
  target: SuggestionTarget;
  icon: React.ComponentType<{ className?: string }>;
}

const suggestionPools: Record<SuggestionTarget, HomeSuggestion[]> = {
  chat: [
    {
      id: 'research',
      label: 'Research a question',
      description: 'Gather credible sources and explain what matters.',
      prompt: 'Research this topic using credible, current sources. Separate confirmed facts from uncertainty and cite the sources you use: ',
      target: 'chat',
      icon: Search,
    },
    {
      id: 'learn',
      label: 'Learn something new',
      description: 'Get a clear explanation and practical examples.',
      prompt: 'Teach me this topic from the beginning. Explain it clearly, give practical examples, and check for important misconceptions: ',
      target: 'chat',
      icon: MessageSquare,
    },
    {
      id: 'plan',
      label: 'Plan my next steps',
      description: 'Turn a goal into priorities and actions.',
      prompt: 'Help me turn this goal into a practical plan with priorities, dependencies, and a clear first step: ',
      target: 'chat',
      icon: Clock3,
    },
  ],
  media_studio: [
    {
      id: 'image-concept',
      label: 'Create an image',
      description: 'Prepare an image-generation prompt in Media Studio.',
      prompt: 'Create a polished, distinctive image concept for: ',
      target: 'media_studio',
      icon: ImagePlus,
    },
    {
      id: 'visual-asset',
      label: 'Design a visual asset',
      description: 'Build a graphic concept ready for refinement.',
      prompt: 'Design a clean, professional visual asset for: ',
      target: 'media_studio',
      icon: ImagePlus,
    },
    {
      id: 'image-idea',
      label: 'Explore an art direction',
      description: 'Start a visual direction for a project.',
      prompt: 'Explore three distinct visual directions for: ',
      target: 'media_studio',
      icon: ImagePlus,
    },
  ],
  automation: [
    {
      id: 'workflow',
      label: 'Automate a routine',
      description: 'Draft a workflow for review before anything runs.',
      prompt: 'Draft a safe workflow to help with this routine. Suggest a trigger, required inputs, steps, permissions, and how to verify the result. Do not enable or execute it automatically: ',
      target: 'automation',
      icon: Workflow,
    },
    {
      id: 'repeat-work',
      label: 'Reduce repeated work',
      description: 'Map repeated steps into a draft automation.',
      prompt: 'Map this repeated task into an editable workflow. Identify the trigger, actions, required approvals, and failure recovery. Leave it disabled for review: ',
      target: 'automation',
      icon: Workflow,
    },
    {
      id: 'reminders',
      label: 'Plan a reminder flow',
      description: 'Set up a workflow idea with clear controls.',
      prompt: 'Draft a reminder workflow for this situation. Include timing, event conditions, quiet hours, and an easy way to pause it. Do not enable it: ',
      target: 'automation',
      icon: Workflow,
    },
  ],
};

function chooseOne(items: HomeSuggestion[]): HomeSuggestion {
  return items[Math.floor(Math.random() * items.length)];
}

export const HomeView: React.FC = () => {
  const {
    setActiveTab,
    createConversation,
    setActiveConversationId,
    sendMessage,
    conversations,
    tasks,
    settings,
  } = useAngel();
  const isLight = settings.theme === 'light';
  const [promptText, setPromptText] = useState('');
  const [suggestions] = useState<HomeSuggestion[]>(() => [
    chooseOne(suggestionPools.chat),
    chooseOne(suggestionPools.media_studio),
    chooseOne(suggestionPools.automation),
  ]);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  })();

  const openChatWithPrompt = (prompt: string) => {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) return;
    const conversationId = createConversation('angel-core', undefined, cleanPrompt.slice(0, 42));
    setActiveConversationId(conversationId);
    setActiveTab('chat');
    setPromptText('');
    void sendMessage(cleanPrompt, undefined, conversationId);
  };

  const openSuggestion = (suggestion: HomeSuggestion) => {
    if (suggestion.target === 'chat') {
      setPromptText(suggestion.prompt);
      return;
    }
    saveCapabilityHandoff(suggestion.target, suggestion.prompt);
    setActiveTab(suggestion.target);
  };

  const submitPrompt = (event: React.FormEvent) => {
    event.preventDefault();
    openChatWithPrompt(promptText);
  };

  const recentConversations = [...conversations]
    .filter((conversation) => !conversation.isArchived && !conversation.isSecret)
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))
    .slice(0, 4);
  const activeTasks = tasks.filter((task) => task.status !== 'completed' && task.status !== 'cancelled').slice(0, 3);

  const surface = isLight
    ? 'border-slate-200 bg-white/80 text-slate-900'
    : 'border-white/10 bg-neutral-950/45 text-neutral-100';
  const muted = isLight ? 'text-slate-500' : 'text-neutral-400';
  const quietButton = isLight
    ? 'border-slate-200 hover:bg-slate-50 text-slate-700'
    : 'border-white/10 hover:bg-white/[0.06] text-neutral-200';

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl text-center">
        <div className="mb-4 flex justify-center">
          <AngelLogo size={48} glow={false} />
        </div>
        <p className={`text-xs font-medium uppercase tracking-[0.18em] ${muted}`}>Your personal workspace</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{greeting}.</h1>
        <p className={`mx-auto mt-2 max-w-xl text-sm leading-6 ${muted}`}>
          What would you like to move forward today?
        </p>

        <form onSubmit={submitPrompt} className={`mt-7 rounded-2xl border p-2 text-left shadow-sm ${surface}`}>
          <label htmlFor="angel-home-prompt" className="sr-only">Ask Angel to help with something</label>
          <textarea
            id="angel-home-prompt"
            value={promptText}
            onChange={(event) => setPromptText(event.target.value)}
            placeholder="Ask a question, describe a task, or share an idea…"
            rows={2}
            maxLength={12000}
            className="w-full resize-y bg-transparent px-3 py-2 text-sm outline-none placeholder:opacity-50"
          />
          <div className="flex items-center justify-between gap-3 border-t border-inherit px-2 pt-2">
            <span className={`text-[11px] ${muted}`}>Your request stays in Chat until you choose a tool.</span>
            <button
              type="submit"
              disabled={!promptText.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Start chat <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">A few ways to begin</h2>
            <p className={`mt-1 text-xs ${muted}`}>Three short suggestions, refreshed when you open Home.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {suggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <button
                key={suggestion.id}
                type="button"
                onClick={() => openSuggestion(suggestion)}
                className={`flex min-h-[104px] items-start gap-3 rounded-xl border p-3.5 text-left transition-colors ${surface} hover:border-indigo-500/50`}
              >
                <span className={`mt-0.5 rounded-lg border p-2 ${quietButton}`}>
                  <Icon className="h-4 w-4 text-indigo-500" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{suggestion.label}</span>
                  <span className={`mt-1 block text-xs leading-5 ${muted}`}>{suggestion.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className={`rounded-xl border p-4 ${surface}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              <h2 className="text-sm font-semibold">Recent conversations</h2>
            </div>
            <button type="button" onClick={() => setActiveTab('chat')} className={`text-xs ${muted} hover:text-indigo-500`}>Open Chat</button>
          </div>
          {recentConversations.length === 0 ? (
            <p className={`text-xs ${muted}`}>Your recent chats will appear here.</p>
          ) : (
            <div className="space-y-1">
              {recentConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => {
                    setActiveConversationId(conversation.id);
                    setActiveTab('chat');
                  }}
                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-xs transition-colors ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.05]'}`}
                >
                  <span className="min-w-0 truncate">{conversation.title || 'Untitled conversation'}</span>
                  <span className={`shrink-0 ${muted}`}>{conversation.messageCount || 0} msgs</span>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className={`rounded-xl border p-4 ${surface}`}>
          <div className="mb-3 flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-semibold">Next up</h2>
          </div>
          {activeTasks.length === 0 ? (
            <div className="flex items-center gap-2">
              <Bot className={`h-4 w-4 ${muted}`} />
              <p className={`text-xs ${muted}`}>No open tasks in your local workspace.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveTab('tasks')}
                  className={`block w-full truncate rounded-lg px-2.5 py-2 text-left text-xs ${isLight ? 'hover:bg-slate-100' : 'hover:bg-white/[0.05]'}`}
                >
                  <span className="font-medium">{task.title}</span>
                  <span className={`ml-2 ${muted}`}>{task.priority}</span>
                </button>
              ))}
              <button type="button" onClick={() => setActiveTab('tasks')} className="mt-1 text-xs font-semibold text-indigo-500 hover:text-indigo-400">View tasks</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

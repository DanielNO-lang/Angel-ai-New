/**
 * ANGEL AI — Global State Management & Workspace Context
 * Manages conversational state, agent execution, persistent memory,
 * tasks, projects, marketplace, and visual perception.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { conversationService } from '../services/ai';
import {
  INITIAL_AGENTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MARKETPLACE_ITEMS,
  INITIAL_MEMORIES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  AVAILABLE_TOOLS,
} from '../data/seedData';
import {
  Agent,
  AgentExecutionRecord,
  AngelSettings,
  Conversation,
  MarketplaceItem,
  Memory,
  Message,
  NavigationTab,
  Project,
  Task,
  TaskStatus,
  ToolDefinition,
  VisualModeCapture,
  CommandPaletteScope,
  UserProfile,
  ThemeMode,
  SettingsSubSection,
} from '../types';

interface AppContextType {
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  activeSettingsSection: SettingsSubSection;
  setActiveSettingsSection: (section: SettingsSubSection) => void;
  isSidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  isMobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Manual Workspace Minimization & Stage Sizing
  isWorkspaceMinimized: boolean;
  setIsWorkspaceMinimized: (minimized: boolean) => void;
  toggleWorkspaceMinimized: () => void;
  workspaceSizeMode: 'full' | 'half' | 'compact';
  setWorkspaceSizeMode: (mode: 'full' | 'half' | 'compact') => void;

  // Global Command Palette & Search
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  openCommandPalette: (initialScope?: CommandPaletteScope, initialQuery?: string) => void;
  closeCommandPalette: () => void;
  commandPaletteInitialScope: CommandPaletteScope;
  commandPaletteInitialQuery: string;
  highlightedTaskId: string | null;
  setHighlightedTaskId: (id: string | null) => void;
  highlightedMemoryId: string | null;
  setHighlightedMemoryId: (id: string | null) => void;

  // Conversations & Chat
  conversations: Conversation[];
  activeConversationId: string;
  activeConversation: Conversation | undefined;
  messages: Message[];
  isChatStreaming: boolean;
  setActiveConversationId: (id: string) => void;
  createConversation: (agentId?: string, projectId?: string, initialTitle?: string) => string;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, title: string) => void;
  togglePinConversation: (id: string) => void;
  toggleArchiveConversation: (id: string) => void;
  toggleSecretConversation: (id: string) => void;
  moveConversationToSecret: (id: string) => void;
  restoreConversationFromSecret: (id: string) => void;
  secretsPasscode: string;
  setSecretsPasscode: (code: string) => void;
  isSecretsUnlocked: boolean;
  setIsSecretsUnlocked: (unlocked: boolean) => void;
  isIncognitoActive: boolean;
  setIsIncognitoActive: (active: boolean) => void;
  isSignedIn: boolean;
  isAuthPageOpen: boolean;
  setIsAuthPageOpen: (open: boolean) => void;
  authPageMode: 'signin' | 'signup';
  setAuthPageMode: (mode: 'signin' | 'signup') => void;
  signIn: (email?: string, name?: string) => void;
  signOut: () => void;
  sendMessage: (content: string, attachments?: Message['attachments']) => Promise<void>;

  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  toggleTheme: () => void;

  // Agents
  agents: Agent[];
  selectedAgentId: string;
  setSelectedAgentId: (id: string) => void;
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  deleteAgent: (id: string) => void;

  // Tasks
  tasks: Task[];
  createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  toggleTaskStatus: (id: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;

  // Memories
  memories: Memory[];
  createMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;

  // Projects
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;

  // Marketplace & Tools
  marketplaceItems: MarketplaceItem[];
  availableTools: ToolDefinition[];
  installMarketplaceItem: (id: string) => void;

  // Agent Executions
  executions: AgentExecutionRecord[];
  runAgentExecution: (agentId: string, prompt: string) => Promise<AgentExecutionRecord>;

  // Visual Mode
  visualCaptures: VisualModeCapture[];
  inspectVisualFrame: (
    dataUrl: string,
    prompt: string,
    source?: 'camera' | 'screen' | 'canvas' | 'snapshot_upload',
    options?: {
      systemInstruction?: string;
      intent?: string;
      region?: { x: number; y: number; width: number; height: number };
    }
  ) => Promise<{ analysis: string; isPendingConfig?: boolean; modelUsed?: string; timestamp?: string }>;

  // Settings & Integrations
  settings: AngelSettings;
  updateSettings: (updates: Partial<AngelSettings>) => void;
  integrationsStatus: Record<string, unknown> | null;
  refreshIntegrations: () => Promise<void>;
  triggerZapierWebhook: (eventType: string, payload: Record<string, unknown>) => Promise<{ success: boolean; message: string }>;
  dispatchAutomationEvent: (
    event: string,
    data: Record<string, unknown>,
    options?: { overrideUrl?: string; callbackUrl?: string }
  ) => Promise<{ dispatched: boolean; deliveryId?: string; statusText: string; httpStatus?: number }>;
  clearAllData: () => void;
}

const STORAGE_KEY_PREFIX = 'angel_ai_v1_';

function getStoredItem<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStoredItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [activeSettingsSection, setActiveSettingsSectionState] = useState<SettingsSubSection>(() =>
    getStoredItem<SettingsSubSection>('active_settings_section', 'account')
  );

  const setActiveSettingsSection = (section: SettingsSubSection) => {
    setActiveSettingsSectionState(section);
    setStoredItem('active_settings_section', section);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsedState] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      return true;
    }
    return getStoredItem<boolean>('is_sidebar_collapsed', false);
  });

  const setSidebarCollapsed = (collapsed: boolean) => {
    setIsSidebarCollapsedState(collapsed);
    setStoredItem('is_sidebar_collapsed', collapsed);
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsedState((prev) => {
      const next = !prev;
      setStoredItem('is_sidebar_collapsed', next);
      return next;
    });
  };

  // Automatically collapse or transform sidebar sections when window width is reduced
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsedState(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Manual Workspace Minimization & Stage Sizing State
  const [isWorkspaceMinimized, setIsWorkspaceMinimized] = useState<boolean>(false);
  const [workspaceSizeMode, setWorkspaceSizeMode] = useState<'full' | 'half' | 'compact'>('full');

  const toggleWorkspaceMinimized = () => {
    setIsWorkspaceMinimized((prev) => !prev);
  };

  const [isMobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Command Palette & Global Search State
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [commandPaletteInitialScope, setCommandPaletteInitialScope] = useState<CommandPaletteScope>('all');
  const [commandPaletteInitialQuery, setCommandPaletteInitialQuery] = useState<string>('');
  const [highlightedTaskId, setHighlightedTaskId] = useState<string | null>(null);
  const [highlightedMemoryId, setHighlightedMemoryId] = useState<string | null>(null);

  const openCommandPalette = (initialScope: CommandPaletteScope = 'all', initialQuery: string = '') => {
    setCommandPaletteInitialScope(initialScope);
    setCommandPaletteInitialQuery(initialQuery);
    setIsCommandPaletteOpen(true);
  };

  const closeCommandPalette = () => {
    setIsCommandPaletteOpen(false);
  };

  // Entities
  const [agents, setAgents] = useState<Agent[]>(() => getStoredItem('agents', INITIAL_AGENTS));
  const [selectedAgentId, setSelectedAgentId] = useState<string>('angel-core');
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getStoredItem('conversations', INITIAL_CONVERSATIONS)
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    const convs = getStoredItem<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
    return convs[0]?.id || 'conv-welcome';
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(() => {
    return getStoredItem<Record<string, Message[]>>('messages_map', {
      'conv-welcome': [
        {
          id: 'msg-w1',
          conversationId: 'conv-welcome',
          role: 'user',
          content: 'Hello Angel. Welcome to our unified AI workspace.',
          createdAt: '2026-09-22T10:00:00Z',
        },
        {
          id: 'msg-w2',
          conversationId: 'conv-welcome',
          role: 'assistant',
          content:
            'Welcome. I am **Angel Core**, your workspace orchestrator.\n\nHere is our operational status:\n- **Intelligence Layer**: Google Gemini 3.8 Flash (Server-Side) with multi-model abstraction.\n- **Agent Lab**: 5 specialized agents active (Atlas, Chronos, Optic, Mnemosyne, and Angel Core).\n- **Memory Bank**: 4 persistent knowledge records indexed.\n- **Visual Mode**: Screen sharing and camera multimodal perception ready.\n- **Supabase Architecture**: PostgreSQL DDL and Row Level Security policies generated.\n\nHow would you like to direct the workspace today?',
          createdAt: '2026-09-22T10:00:05Z',
          agentId: 'angel-core',
        },
      ],
    });
  });

  const [tasks, setTasks] = useState<Task[]>(() => getStoredItem('tasks', INITIAL_TASKS));
  const [memories, setMemories] = useState<Memory[]>(() => getStoredItem('memories', INITIAL_MEMORIES));
  const [projects, setProjects] = useState<Project[]>(() => getStoredItem('projects', INITIAL_PROJECTS));
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() =>
    getStoredItem('marketplace', INITIAL_MARKETPLACE_ITEMS)
  );
  const [availableTools] = useState<ToolDefinition[]>(AVAILABLE_TOOLS);
  const [executions, setExecutions] = useState<AgentExecutionRecord[]>(() => getStoredItem('executions', []));
  const [visualCaptures, setVisualCaptures] = useState<VisualModeCapture[]>(() => getStoredItem('visual_captures', []));

  const [userProfile, setUserProfile] = useState<UserProfile>(() =>
    getStoredItem('user_profile', {
      id: 'user_danny',
      name: 'Danny Davis',
      email: 'danielokohnwachukwu22@gmail.com',
      initials: 'DD',
      plan: 'Pro',
      status: 'online',
    })
  );

  const [settings, setSettings] = useState<AngelSettings>(() =>
    getStoredItem('settings', {
      theme: 'dark',
      accentColor: 'indigo',
      fontSize: 'base',
      compactMode: false,
      personality: {
        tone: 'balanced',
        verbosity: 'balanced',
        memoryStrictness: 'high',
      },
      models: {
        primaryProvider: 'gemini',
        geminiModel: 'gemini-3.8-flash',
        enableThinking: true,
      },
      supabase: {
        connected: false,
        hasAnonKey: false,
      },
      zapier: {
        webhookEnabled: false,
      },
    })
  );

  // Secrets Passcode state
  const [secretsPasscode, setSecretsPasscodeState] = useState<string>(() =>
    getStoredItem('secrets_passcode', '1234')
  );
  const [isSecretsUnlocked, setIsSecretsUnlocked] = useState<boolean>(false);

  const setSecretsPasscode = (code: string) => {
    setSecretsPasscodeState(code);
    setStoredItem('secrets_passcode', code);
  };

  // Incognito Mode State
  const [isIncognitoActive, setIsIncognitoActive] = useState<boolean>(false);

  // Authentication State & Guest Mode
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() =>
    getStoredItem('is_signed_in', true)
  );
  const [isAuthPageOpen, setIsAuthPageOpen] = useState<boolean>(false);
  const [authPageMode, setAuthPageMode] = useState<'signin' | 'signup'>('signin');

  // Sync theme to HTML document
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
  }, [settings.theme]);

  const [isChatStreaming, setIsChatStreaming] = useState<boolean>(false);
  const [integrationsStatus, setIntegrationsStatus] = useState<Record<string, unknown> | null>(null);

  // Sync to local storage
  useEffect(() => setStoredItem('agents', agents), [agents]);
  useEffect(() => setStoredItem('conversations', conversations), [conversations]);
  useEffect(() => setStoredItem('messages_map', messagesMap), [messagesMap]);
  useEffect(() => setStoredItem('tasks', tasks), [tasks]);
  useEffect(() => setStoredItem('memories', memories), [memories]);
  useEffect(() => setStoredItem('projects', projects), [projects]);
  useEffect(() => setStoredItem('marketplace', marketplaceItems), [marketplaceItems]);
  useEffect(() => setStoredItem('executions', executions), [executions]);
  useEffect(() => setStoredItem('visual_captures', visualCaptures), [visualCaptures]);
  useEffect(() => setStoredItem('settings', settings), [settings]);

  // Fetch backend integration health
  const refreshIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations/status');
      if (res.ok) {
        const data = await res.json();
        setIntegrationsStatus(data);
      }
    } catch (e) {
      console.warn('[Angel AI] Health check unreachable:', e);
    }
  };

  useEffect(() => {
    refreshIntegrations();
  }, []);

  // Active conversation helpers
  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const currentMessages = messagesMap[activeConversationId] || [];

  const createConversation = (agentId = selectedAgentId, projectId?: string, initialTitle?: string): string => {
    const newId = `conv-${Date.now()}`;
    const agent = agents.find((a) => a.id === agentId);
    const title = initialTitle || `Chat with ${agent?.name || 'Angel'}`;
    const now = new Date().toISOString();

    const newConv: Conversation = {
      id: newId,
      title,
      createdAt: now,
      updatedAt: now,
      agentId,
      projectId,
      pinned: false,
      messageCount: 0,
      lastMessagePreview: 'New conversation started.',
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConversationId(newId);
    setMessagesMap((prev) => ({ ...prev, [newId]: [] }));
    return newId;
  };

  const deleteConversation = (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setMessagesMap((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (activeConversationId === id) {
      const remaining = conversations.filter((c) => c.id !== id);
      if (remaining.length > 0) {
        setActiveConversationId(remaining[0].id);
      } else {
        createConversation();
      }
    }
  };

  const renameConversation = (id: string, title: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title, updatedAt: new Date().toISOString() } : c))
    );
  };

  const togglePinConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned, updatedAt: new Date().toISOString() } : c))
    );
  };

  const toggleArchiveConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived, updatedAt: new Date().toISOString() } : c))
    );
  };

  const toggleSecretConversation = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isSecret: !c.isSecret, updatedAt: new Date().toISOString() } : c))
    );
  };

  const moveConversationToSecret = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isSecret: true, updatedAt: new Date().toISOString() } : c))
    );
  };

  const restoreConversationFromSecret = (id: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isSecret: false, updatedAt: new Date().toISOString() } : c))
    );
  };

  const signIn = (email = 'danielokohnwachukwu22@gmail.com', name = 'Danny Davis') => {
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .join('')
      .substring(0, 2)
      .toUpperCase();
    const updatedUser: UserProfile = {
      id: 'user_danny',
      name,
      email,
      initials: initials || 'DD',
      plan: 'Pro',
      status: 'online',
    };
    setUserProfile(updatedUser);
    setStoredItem('user_profile', updatedUser);
    setIsSignedIn(true);
    setStoredItem('is_signed_in', true);
    setIsAuthPageOpen(false);
  };

  const signOut = () => {
    const guestUser: UserProfile = {
      id: 'user_guest',
      name: 'Guest User',
      email: 'guest@angel.local',
      initials: 'GU',
      plan: 'Free',
      status: 'offline',
    };
    setUserProfile(guestUser);
    setStoredItem('user_profile', guestUser);
    setIsSignedIn(false);
    setStoredItem('is_signed_in', false);
    setIsAuthPageOpen(false);
  };

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev: UserProfile) => {
      const next = { ...prev, ...updates };
      setStoredItem('user_profile', next);
      return next;
    });
  };

  const toggleTheme = () => {
    setSettings((prev: AngelSettings) => {
      const nextTheme: ThemeMode = prev.theme === 'dark' ? 'light' : 'dark';
      const updated: AngelSettings = { ...prev, theme: nextTheme };
      setStoredItem('settings', updated);
      return updated;
    });
  };

  // Send Message with SSE streaming
  const sendMessage = async (content: string, attachments?: Message['attachments']) => {
    if (!content.trim() && (!attachments || attachments.length === 0)) return;

    let targetConvId = activeConversationId;
    if (!targetConvId || !conversations.some((c) => c.id === targetConvId)) {
      targetConvId = createConversation(selectedAgentId);
    }

    const now = new Date().toISOString();
    const userMessageId = `msg-user-${Date.now()}`;
    const userMessage: Message = {
      id: userMessageId,
      conversationId: targetConvId,
      role: 'user',
      content,
      createdAt: now,
      attachments,
    };

    const assistantMessageId = `msg-asst-${Date.now()}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      conversationId: targetConvId,
      role: 'assistant',
      content: '',
      createdAt: now,
      agentId: selectedAgentId,
      isStreaming: true,
    };

    // Update conversation messages optimistically
    setMessagesMap((prev) => ({
      ...prev,
      [targetConvId]: [...(prev[targetConvId] || []), userMessage, assistantMessage],
    }));

    // Update conversation preview
    setConversations((prev) =>
      prev.map((c) =>
        c.id === targetConvId
          ? {
              ...c,
              updatedAt: now,
              messageCount: (c.messageCount || 0) + 2,
              lastMessagePreview: content.slice(0, 80),
            }
          : c
      )
    );

    setIsChatStreaming(true);

    try {
      const agent = agents.find((a) => a.id === selectedAgentId) || agents[0];
      const convHistory = messagesMap[targetConvId] || [];

      let runningToolCalls: Array<{
        id: string;
        toolName: string;
        input: Record<string, unknown>;
        output?: Record<string, unknown> | string;
        status: 'pending' | 'running' | 'completed' | 'failed';
        timestamp: number;
      }> = [];

      const currentConv = conversations.find((c) => c.id === targetConvId);
      const convProjectId = currentConv?.projectId || activeProjectId || undefined;

      await conversationService.sendMessage({
        conversationId: targetConvId,
        prompt: content,
        agent,
        conversationHistory: convHistory,
        contextState: {
          memories,
          tasks,
          projects,
          activeProjectId: convProjectId,
          createTask,
          updateTask,
          createMemory,
        },
        onToken: (_token, accumulatedText) => {
          setMessagesMap((prev) => {
            const msgs = prev[targetConvId] || [];
            return {
              ...prev,
              [targetConvId]: msgs.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: accumulatedText, toolCalls: runningToolCalls }
                  : m
              ),
            };
          });
        },
        onToolStart: (toolName, args) => {
          const newCall = {
            id: `call_${Date.now()}`,
            toolName,
            input: args,
            status: 'running' as const,
            timestamp: Date.now(),
          };
          runningToolCalls = [...runningToolCalls, newCall];
          setMessagesMap((prev) => {
            const msgs = prev[targetConvId] || [];
            return {
              ...prev,
              [targetConvId]: msgs.map((m) =>
                m.id === assistantMessageId ? { ...m, toolCalls: runningToolCalls } : m
              ),
            };
          });
        },
        onToolComplete: (toolName, result) => {
          runningToolCalls = runningToolCalls.map((tc) =>
            tc.toolName === toolName
              ? {
                  ...tc,
                  status: result.success ? ('completed' as const) : ('failed' as const),
                  output: result.summary,
                }
              : tc
          );
          setMessagesMap((prev) => {
            const msgs = prev[targetConvId] || [];
            return {
              ...prev,
              [targetConvId]: msgs.map((m) =>
                m.id === assistantMessageId ? { ...m, toolCalls: runningToolCalls } : m
              ),
            };
          });
        },
      });

      // Finalize assistant message streaming state
      setMessagesMap((prev) => {
        const msgs = prev[targetConvId] || [];
        return {
          ...prev,
          [targetConvId]: msgs.map((m) =>
            m.id === assistantMessageId
              ? {
                  ...m,
                  isStreaming: false,
                  toolCalls: runningToolCalls,
                }
              : m
          ),
        };
      });
    } catch (err) {
      console.error('[Angel Conversation Error]', err);
      const fallbackText = `[Angel Intelligence Notice]: Stream connection paused (${
        err instanceof Error ? err.message : String(err)
      }). Ensure API key and server connectivity.`;

      setMessagesMap((prev) => {
        const msgs = prev[targetConvId] || [];
        return {
          ...prev,
          [targetConvId]: msgs.map((m) =>
            m.id === assistantMessageId ? { ...m, isStreaming: false, content: fallbackText } : m
          ),
        };
      });
    } finally {
      setIsChatStreaming(false);
    }
  };

  // Agent methods
  const createAgent = (agentData: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `agent-${Date.now()}`;
    const now = new Date().toISOString();
    const newAgent: Agent = {
      ...agentData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setAgents((prev) => [...prev, newAgent]);
  };

  const updateAgent = (id: string, updates: Partial<Agent>) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    );
  };

  const deleteAgent = (id: string) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
    if (selectedAgentId === id) {
      setSelectedAgentId('angel-core');
    }
  };

  // Task methods
  const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `task-${Date.now()}`;
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setTasks((prev) => [newTask, ...prev]);

    // Dispatch automation event: task.created
    fetch('/api/automation/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'task.created',
        data: {
          taskId: newId,
          title: newTask.title,
          priority: newTask.priority,
          status: newTask.status,
          agentId: newTask.agentId,
          createdAt: now,
        },
      }),
    }).catch(() => {
      // Background automation dispatch - non-blocking
    });
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t))
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const newStatus: TaskStatus = t.status === 'completed' ? 'in_progress' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date().toISOString() : undefined;
        const updated = {
          ...t,
          status: newStatus,
          completedAt,
          updatedAt: new Date().toISOString(),
        };

        // Dispatch automation event: task.completed
        if (newStatus === 'completed') {
          fetch('/api/automation/dispatch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'task.completed',
              data: {
                taskId: updated.id,
                title: updated.title,
                priority: updated.priority,
                completedAt,
              },
            }),
          }).catch(() => {});
        }

        return updated;
      })
    );
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const updatedSubtasks = t.subtasks.map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        const allCompleted = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.completed);
        return {
          ...t,
          subtasks: updatedSubtasks,
          status: allCompleted ? 'completed' : t.status,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Memory methods
  const createMemory = (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `mem-${Date.now()}`;
    const now = new Date().toISOString();
    const newMem: Memory = {
      ...memoryData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setMemories((prev) => [newMem, ...prev]);

    // Dispatch automation event: memory.created
    fetch('/api/automation/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'memory.created',
        data: {
          memoryId: newId,
          title: newMem.title,
          type: newMem.type,
          agentId: newMem.agentId,
          source: newMem.source,
          createdAt: now,
        },
      }),
    }).catch(() => {});
  };

  const updateMemory = (id: string, updates: Partial<Memory>) => {
    setMemories((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates, updatedAt: new Date().toISOString() };
        // Dispatch automation event: memory.updated
        fetch('/api/automation/dispatch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'memory.updated',
            data: {
              memoryId: updated.id,
              title: updated.title,
              type: updated.type,
              updatedAt: updated.updatedAt,
            },
          }),
        }).catch(() => {});
        return updated;
      })
    );
  };

  const deleteMemory = (id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
  };

  // Project methods
  const createProject = (projectData: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newId = `proj-${Date.now()}`;
    const now = new Date().toISOString();
    const newProj: Project = {
      ...projectData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setProjects((prev) => [...prev, newProj]);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
  };

  // Marketplace methods
  const installMarketplaceItem = (id: string) => {
    setMarketplaceItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, installed: !item.installed } : item))
    );
  };

  // Agent Lab Execution Pipeline
  const runAgentExecution = async (agentId: string, prompt: string): Promise<AgentExecutionRecord> => {
    const agent = agents.find((a) => a.id === agentId) || agents[0];
    const executionRecord: AgentExecutionRecord = {
      id: `exec-${Date.now()}`,
      agentId,
      agentName: agent.name,
      taskPrompt: prompt,
      status: 'executing',
      logs: [
        {
          stage: 'requested',
          message: `Execution dispatched to agent ${agent.name}`,
          timestamp: new Date().toISOString(),
        },
      ],
      toolsUsed: [],
      startedAt: new Date().toISOString(),
    };

    setExecutions((prev) => [executionRecord, ...prev]);

    try {
      const response = await fetch('/api/agent/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          agentName: agent.name,
          systemInstructions: agent.systemInstructions,
          taskPrompt: prompt,
          modelConfig: agent.modelConfig,
          context: {
            projectId: activeProjectId || undefined,
            projectName: projects.find((p) => p.id === activeProjectId)?.name,
            activeTasks: tasks.slice(0, 8).map((t) => ({
              id: t.id,
              title: t.title,
              status: t.status,
              priority: t.priority,
            })),
          },
          memories: memories.slice(0, 8),
          allowedTools: agent.tools,
          permissions: agent.permissions,
          memoryAccess: agent.memoryAccess,
        }),
      });

      if (!response.ok) {
        throw new Error(`Execution error HTTP ${response.status}`);
      }

      const result = await response.json();

      // If pipeline discovered new memories or created tasks, save them!
      if (result.newMemoriesDiscovered && result.newMemoriesDiscovered.length > 0) {
        result.newMemoriesDiscovered.forEach((m: { title: string; content: string; type: string }) => {
          createMemory({
            title: m.title,
            content: m.content,
            type: m.type as any,
            confidence: 0.95,
            tags: ['agent-extracted', agent.name.toLowerCase()],
            agentId: agent.id,
          });
        });
      }

      if (result.tasksCreated && result.tasksCreated.length > 0) {
        result.tasksCreated.forEach((t: { title: string; priority: string; description: string }) => {
          createTask({
            title: t.title,
            priority: (t.priority || 'medium') as any,
            description: t.description,
            status: 'todo',
            agentId: agent.id,
            subtasks: [],
            tags: ['agent-created'],
          });
        });
      }

      const completedRecord: AgentExecutionRecord = {
        id: result.executionId,
        agentId: agent.id,
        agentName: agent.name,
        taskPrompt: prompt,
        status: result.status,
        logs: result.logs || [],
        result: result.output,
        toolsUsed: result.toolsExecuted || [],
        startedAt: result.startedAt,
        completedAt: result.completedAt,
        error: result.error,
      };

      setExecutions((prev) => prev.map((e) => (e.id === executionRecord.id ? completedRecord : e)));
      return completedRecord;
    } catch (err) {
      const errRecord: AgentExecutionRecord = {
        ...executionRecord,
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
        completedAt: new Date().toISOString(),
      };
      setExecutions((prev) => prev.map((e) => (e.id === executionRecord.id ? errRecord : e)));
      return errRecord;
    }
  };

  // Visual Mode Frame Inspection
  const inspectVisualFrame = async (
    dataUrl: string,
    prompt: string,
    source: 'camera' | 'screen' | 'canvas' | 'snapshot_upload' = 'camera',
    options?: {
      systemInstruction?: string;
      intent?: string;
      region?: { x: number; y: number; width: number; height: number };
    }
  ): Promise<{ analysis: string; isPendingConfig?: boolean; modelUsed?: string; timestamp?: string }> => {
    const captureId = `vis-${Date.now()}`;
    const now = new Date().toISOString();

    try {
      const response = await fetch('/api/visual/inspect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: dataUrl,
          mimeType: 'image/jpeg',
          prompt,
          systemInstruction: options?.systemInstruction,
          intent: options?.intent,
        }),
      });

      const data = await response.json();
      const analysisText = data.analysis || 'Visual inspection completed.';
      const isPendingConfig = Boolean(data.isPendingConfig);
      const modelUsed = data.modelId || 'gemini-3.8-flash';

      const captureRecord: VisualModeCapture = {
        id: captureId,
        timestamp: now,
        source,
        dataUrl,
        analysis: analysisText,
        detectedInsights: ['Visual perception verified', `Source: ${source}`],
        isPendingConfig,
        intent: options?.intent,
        region: options?.region,
      };

      setVisualCaptures((prev) => [captureRecord, ...prev]);
      return {
        analysis: analysisText,
        isPendingConfig,
        modelUsed,
        timestamp: now,
      };
    } catch (err) {
      const fallback = `[Visual Perception Error]: ${err instanceof Error ? err.message : String(err)}`;
      const captureRecord: VisualModeCapture = {
        id: captureId,
        timestamp: now,
        source,
        dataUrl,
        analysis: fallback,
        isPendingConfig: true,
        intent: options?.intent,
        region: options?.region,
      };
      setVisualCaptures((prev) => [captureRecord, ...prev]);
      return {
        analysis: fallback,
        isPendingConfig: true,
        timestamp: now,
      };
    }
  };

  const dispatchAutomationEvent = async (
    event: string,
    data: Record<string, unknown>,
    options?: { overrideUrl?: string; callbackUrl?: string }
  ): Promise<{ dispatched: boolean; deliveryId?: string; statusText: string; httpStatus?: number }> => {
    try {
      const response = await fetch('/api/automation/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, data, ...options }),
      });
      const result = await response.json();
      return {
        dispatched: Boolean(result.dispatched),
        deliveryId: result.deliveryId,
        statusText: result.statusText || (result.dispatched ? 'Dispatched' : 'Failed to dispatch'),
        httpStatus: result.httpStatus || response.status,
      };
    } catch (err: any) {
      return {
        dispatched: false,
        statusText: `Network failure: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  };

  const triggerZapierWebhook = async (
    eventType: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> => {
    const result = await dispatchAutomationEvent(eventType, payload);
    return {
      success: result.dispatched,
      message: result.statusText,
    };
  };

  const clearAllData = () => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith(STORAGE_KEY_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('Error clearing localStorage', e);
    }
    setAgents(INITIAL_AGENTS);
    setConversations(INITIAL_CONVERSATIONS);
    setTasks(INITIAL_TASKS);
    setMemories(INITIAL_MEMORIES);
    setProjects(INITIAL_PROJECTS);
    setMarketplaceItems(INITIAL_MARKETPLACE_ITEMS);
    setExecutions([]);
    setVisualCaptures([]);
    setActiveConversationId(INITIAL_CONVERSATIONS[0].id);
  };

  const updateSettings = (updates: Partial<AngelSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeSettingsSection,
        setActiveSettingsSection,
        isSidebarCollapsed,
        setSidebarCollapsed,
        toggleSidebar,
        isMobileMenuOpen,
        setMobileMenuOpen,
        isWorkspaceMinimized,
        setIsWorkspaceMinimized,
        toggleWorkspaceMinimized,
        workspaceSizeMode,
        setWorkspaceSizeMode,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        openCommandPalette,
        closeCommandPalette,
        commandPaletteInitialScope,
        commandPaletteInitialQuery,
        highlightedTaskId,
        setHighlightedTaskId,
        highlightedMemoryId,
        setHighlightedMemoryId,
        conversations,
        activeConversationId,
        activeConversation,
        messages: currentMessages,
        isChatStreaming,
        setActiveConversationId,
        createConversation,
        deleteConversation,
        renameConversation,
        togglePinConversation,
        toggleArchiveConversation,
        toggleSecretConversation,
        moveConversationToSecret,
        restoreConversationFromSecret,
        secretsPasscode,
        setSecretsPasscode,
        isSecretsUnlocked,
        setIsSecretsUnlocked,
        isIncognitoActive,
        setIsIncognitoActive,
        isSignedIn,
        isAuthPageOpen,
        setIsAuthPageOpen,
        authPageMode,
        setAuthPageMode,
        signIn,
        signOut,
        sendMessage,
        userProfile,
        updateUserProfile,
        toggleTheme,
        agents,
        selectedAgentId,
        setSelectedAgentId,
        createAgent,
        updateAgent,
        deleteAgent,
        tasks,
        createTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
        toggleSubtask,
        memories,
        createMemory,
        updateMemory,
        deleteMemory,
        projects,
        activeProjectId,
        setActiveProjectId,
        createProject,
        updateProject,
        marketplaceItems,
        availableTools,
        installMarketplaceItem,
        executions,
        runAgentExecution,
        visualCaptures,
        inspectVisualFrame,
        settings,
        updateSettings,
        integrationsStatus,
        refreshIntegrations,
        triggerZapierWebhook,
        dispatchAutomationEvent,
        clearAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAngel = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAngel must be used within an AppProvider');
  }
  return context;
};

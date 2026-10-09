/**
 * ANGEL AI — Global State Management & Workspace Context
 * Manages conversational state, agent execution, persistent memory,
 * tasks, projects, marketplace, and visual perception.
 */

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { conversationService } from '../services/ai';
import { syncWorkspaceToIndexedDB, loadWorkspaceFromIndexedDB } from '../services/db/offlineDb';
import { syncService } from '../services/syncService';
import { offlineSyncManager, SyncState } from '../services/db/offlineSyncManager';
import { buildWorkspaceExportPayload, downloadWorkspaceExportAsJSON } from '../services/data/workspaceExportService';
import { getClientSupabase, signOutFromSupabase, upsertAuthenticatedProfile } from '../services/supabaseService';
import {
  INITIAL_AGENTS,
  INITIAL_CONVERSATIONS,
  INITIAL_MARKETPLACE_ITEMS,
  INITIAL_MEMORIES,
  INITIAL_PROJECTS,
  INITIAL_TASKS,
  INITIAL_WORKFLOWS,
  AVAILABLE_TOOLS,
  INITIAL_ASSISTANTS,
  INITIAL_LIBRARY_ITEMS,
} from '../data/seedData';
import {
  Agent,
  AgentExecutionRecord,
  AngelSettings,
  AssistantEntity,
  Conversation,
  LibraryItem,
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
  Workflow,
  SyncStatus,
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

  // Focus Mode (Deep Work: hides sidebar and minimizes header)
  isFocusMode: boolean;
  setIsFocusMode: (focus: boolean) => void;
  toggleFocusMode: () => void;

  // Agent Background Processing Status (Heartbeat indicator)
  isAgentProcessing: boolean;
  setIsAgentProcessing: (processing: boolean) => void;

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
  isGuest: boolean;
  guestMode: boolean;
  discardGuestSession: () => void;
  syncStatus: SyncStatus;
  triggerManualSync: () => Promise<void>;
  isAuthPageOpen: boolean;
  setIsAuthPageOpen: (open: boolean) => void;
  authPageMode: 'signin' | 'signup';
  setAuthPageMode: (mode: 'signin' | 'signup') => void;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  sessionToken: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string, name: string) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
  requestPasswordRecovery: (email: string) => Promise<{ success: boolean; message: string }>;
  sendMessage: (content: string, attachments?: Message['attachments']) => Promise<void>;

  // User Profile
  userProfile: UserProfile;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  toggleTheme: () => void;

  // Library Items (Files, Documents, Media, References, Materials, Resources, Assets, Artifacts)
  libraryItems: LibraryItem[];
  createLibraryItem: (item: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>) => LibraryItem;
  updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => void;
  deleteLibraryItem: (id: string) => void;
  toggleFavoriteLibraryItem: (id: string) => void;

  // Assistants Lifecycle System
  assistantsList: AssistantEntity[];
  createAssistant: (asst: Omit<AssistantEntity, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>) => AssistantEntity;
  updateAssistant: (id: string, updates: Partial<AssistantEntity>) => void;
  deleteAssistant: (id: string) => void;
  duplicateAssistant: (id: string) => AssistantEntity;
  toggleArchiveAssistant: (id: string) => void;
  togglePublishAssistant: (id: string) => void;

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
  deleteProject: (id: string) => void;

  // Workflows (Persistent Multi-Step Agent Chains & Triggers)
  workflows: Workflow[];
  createWorkflow: (workflow: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>) => Workflow;
  updateWorkflow: (id: string, updates: Partial<Workflow>) => void;
  deleteWorkflow: (id: string) => void;
  toggleWorkflowEnabled: (id: string) => void;

  // Workspace Data Export & Autosave
  exportWorkspaceData: () => Promise<void>;
  lastAutosavedAt: string | null;

  // Marketplace & Tools
  marketplaceItems: MarketplaceItem[];
  availableTools: ToolDefinition[];
  installMarketplaceItem: (id: string) => void;
  uninstallMarketplaceItem: (id: string) => void;
  addMarketplaceReview: (itemId: string, rating: number, comment: string) => void;
  publishToMarketplace: (item: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'installs' | 'installed'>) => MarketplaceItem;

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

const GUEST_CONVERSATION_ID = 'conv-guest-welcome';

function hasStoredAuthSession(): boolean {
  if (typeof localStorage === 'undefined') return false;
  if (localStorage.getItem('angel_is_guest') === 'true') return false;
  const token = localStorage.getItem('angel_auth_token');
  if (!token || token === 'undefined' || token === 'guest') return false;
  // Accept only Supabase JWTs or the backend's cryptographically random 64-hex session tokens.
  return /^eyJ[A-Za-z0-9_-]*\./.test(token) || /^angel_[a-f0-9]{64}$/.test(token);
}

function createGuestConversation(): Conversation {
  const now = new Date().toISOString();
  return {
    id: GUEST_CONVERSATION_ID,
    title: 'Welcome to Angel',
    createdAt: now,
    updatedAt: now,
    agentId: 'angel-core',
    pinned: false,
    messageCount: 0,
    lastMessagePreview: 'Start a temporary chat with Angel.',
  };
}

function createGuestMessages(): Record<string, Message[]> {
  return {
    [GUEST_CONVERSATION_ID]: [{
      id: `msg-guest-${Date.now()}`,
      conversationId: GUEST_CONVERSATION_ID,
      role: 'assistant',
      content: "Hi, I'm Angel. Ask me a question, brainstorm an idea, or try voice and visual mode. Guest chats are temporary and are not saved to permanent memory.",
      createdAt: new Date().toISOString(),
      agentId: 'angel-core',
    }],
  };
}

function clearGuestScopedStorage(): void {
  if (typeof localStorage === 'undefined') return;
  const keys = [
    'agents', 'conversations', 'messages_map', 'tasks', 'memories', 'projects',
    'workflows', 'marketplace', 'executions', 'visual_captures', 'library_items',
    'assistants_list', 'user_profile',
  ];
  try {
    keys.forEach((key) => localStorage.removeItem(STORAGE_KEY_PREFIX + key));
  } catch {
    // Guest mode remains usable when browser storage is unavailable.
  }
}

interface SignUpResult {
  success: boolean;
  requiresEmailConfirmation?: boolean;
  message?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<NavigationTab>(() => {
    if (typeof window === 'undefined') return 'home';
    try {
      const isNewSession = !sessionStorage.getItem('angel_browser_session_active');
      sessionStorage.setItem('angel_browser_session_active', 'true');
      const token = hasStoredAuthSession();

      // If browser was closed and opened newly, OR user is guest/not signed in: always start from 'home'
      if (isNewSession || !token) {
        sessionStorage.setItem('angel_session_tab', 'home');
        return 'home';
      }

      // If page refreshed while user is signed in: continue from where it stopped
      const savedSessionTab = sessionStorage.getItem('angel_session_tab');
      if (savedSessionTab) {
        return savedSessionTab as NavigationTab;
      }
    } catch {
      // Fallback
    }
    return 'home';
  });

  const setActiveTab = (tab: NavigationTab) => {
    setActiveTabState(tab);
    try {
      sessionStorage.setItem('angel_session_tab', tab);
      setStoredItem('active_tab', tab);
    } catch {}
    // Return to top on click regardless of current position or if tab was already active
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('angel-return-to-top'));
    }
  };
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
  const [agents, setAgents] = useState<Agent[]>(() => hasStoredAuthSession() ? getStoredItem('agents', INITIAL_AGENTS) : INITIAL_AGENTS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('angel-core');
  const [conversations, setConversations] = useState<Conversation[]>(() =>
    hasStoredAuthSession() ? getStoredItem('conversations', INITIAL_CONVERSATIONS) : [createGuestConversation()]
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(() => {
    if (!hasStoredAuthSession()) return GUEST_CONVERSATION_ID;
    const convs = getStoredItem<Conversation[]>('conversations', INITIAL_CONVERSATIONS);
    return convs[0]?.id || 'conv-welcome';
  });

  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>(() =>
    hasStoredAuthSession()
      ? getStoredItem<Record<string, Message[]>>('messages_map', {})
      : createGuestMessages()
  );

  const [tasks, setTasks] = useState<Task[]>(() => hasStoredAuthSession() ? getStoredItem('tasks', []) : []);
  const [memories, setMemories] = useState<Memory[]>(() => hasStoredAuthSession() ? getStoredItem('memories', []) : []);
  const [projects, setProjects] = useState<Project[]>(() => hasStoredAuthSession() ? getStoredItem('projects', []) : []);
  const [workflows, setWorkflows] = useState<Workflow[]>(() =>
    hasStoredAuthSession() ? getStoredItem('workflows', []) : []
  );
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);
  const lastSavedFingerprintRef = useRef<string>('');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [marketplaceItems, setMarketplaceItems] = useState<MarketplaceItem[]>(() =>
    hasStoredAuthSession() ? getStoredItem('marketplace', INITIAL_MARKETPLACE_ITEMS) : INITIAL_MARKETPLACE_ITEMS
  );
  const [availableTools, setAvailableTools] = useState<ToolDefinition[]>(AVAILABLE_TOOLS);
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>(() =>
    hasStoredAuthSession() ? getStoredItem('library_items', []) : []
  );
  const [assistantsList, setAssistantsList] = useState<AssistantEntity[]>(() =>
    hasStoredAuthSession() ? getStoredItem('assistants_list', INITIAL_ASSISTANTS) : INITIAL_ASSISTANTS
  );
  const [executions, setExecutions] = useState<AgentExecutionRecord[]>(() => hasStoredAuthSession() ? getStoredItem('executions', []) : []);
  const [visualCaptures, setVisualCaptures] = useState<VisualModeCapture[]>(() => hasStoredAuthSession() ? getStoredItem('visual_captures', []) : []);

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    if (!hasStoredAuthSession() || typeof localStorage === 'undefined') return null;
    return localStorage.getItem('angel_auth_token');
  });
  const [authError, setAuthError] = useState<string | null>(null);

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    if (hasStoredAuthSession()) {
      return getStoredItem('user_profile', {
        id: 'user_danny',
        name: 'Danny Davis',
        email: 'danielokohnwachukwu22@gmail.com',
        initials: 'DD',
        plan: 'Pro',
        status: 'online',
      });
    }
    return {
      id: 'guest_user',
      name: 'Guest User',
      email: 'guest@angel.local',
      initials: 'GU',
      plan: 'Free',
      status: 'online',
    };
  });

  const [settings, setSettings] = useState<AngelSettings>(() => {
    const defaultSettings: AngelSettings = {
      theme: 'dark',
      accentColor: 'indigo',
      fontSize: 'base',
      compactMode: false,
      focusMode: false,
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
    };

    const saved = getStoredItem<AngelSettings>('settings', defaultSettings);
    // Explicitly restore last theme preference from local storage
    if (typeof localStorage !== 'undefined') {
      const persistedTheme = localStorage.getItem('angel_theme') as ThemeMode;
      if (persistedTheme && (persistedTheme === 'light' || persistedTheme === 'dark' || persistedTheme === 'system')) {
        saved.theme = persistedTheme;
      }
    }
    return saved;
  });

  // Focus Mode State (Deep Work: hides sidebar & minimizes header)
  const [isFocusMode, setIsFocusModeState] = useState<boolean>(() => {
    return getStoredItem<boolean>('angel_focus_mode', false);
  });

  const setIsFocusMode = (focus: boolean) => {
    setIsFocusModeState(focus);
    setStoredItem('angel_focus_mode', focus);
    setSettings((prev) => ({ ...prev, focusMode: focus }));
  };

  const toggleFocusMode = () => {
    setIsFocusMode(!isFocusMode);
  };

  // Agent Background Processing Status (Triggers heartbeat in Agent Lab tab)
  const [isAgentProcessing, setIsAgentProcessing] = useState<boolean>(false);

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

  // Authentication State & Guest Mode (Real isolation)
  const [isSignedIn, setIsSignedIn] = useState<boolean>(() => Boolean(sessionToken));
  const isGuest = !isSignedIn;
  const guestMode = !isSignedIn;

  // Offline & Real-Time Sync State (Driven by syncService)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => syncService.getStatus().status);

  useEffect(() => {
    const unsub = syncService.subscribe((event) => {
      setSyncStatus(event.status);
    });
    return unsub;
  }, []);

  useEffect(() => {
    syncService.setSessionToken(sessionToken);
  }, [sessionToken]);

  const triggerManualSync = async () => {
    if (isGuest) return;
    await syncService.syncNow(sessionToken);
  };

  const discardGuestSession = () => resetToGuestWorkspace();
  const [isAuthPageOpen, setIsAuthPageOpen] = useState<boolean>(false);
  const [authPageMode, setAuthPageMode] = useState<'signin' | 'signup'>('signin');

  const resetToGuestWorkspace = () => {
    setSessionToken(null);
    setIsSignedIn(false);
    setAuthError(null);
    setIsAuthPageOpen(false);
    setIsIncognitoActive(false);
    setIsSecretsUnlocked(false);
    setUserProfile({
      id: 'guest_user',
      name: 'Guest User',
      email: 'guest@angel.local',
      initials: 'GU',
      plan: 'Free',
      status: 'offline',
    });
    setAgents(INITIAL_AGENTS);
    setSelectedAgentId('angel-core');
    setConversations([createGuestConversation()]);
    setActiveConversationId(GUEST_CONVERSATION_ID);
    setMessagesMap(createGuestMessages());
    setTasks([]);
    setMemories([]);
    setProjects([]);
    setWorkflows([]);
    setActiveProjectId(null);
    setMarketplaceItems(INITIAL_MARKETPLACE_ITEMS);
    setLibraryItems([]);
    setAssistantsList(INITIAL_ASSISTANTS);
    setExecutions([]);
    setVisualCaptures([]);
    clearGuestScopedStorage();
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('angel_auth_token');
      localStorage.setItem('angel_is_guest', 'true');
    }
    setActiveTab('home');
  };

  // Sync theme to HTML document and persist in localStorage
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light', 'midnight');

    if (settings.theme === 'midnight') {
      root.classList.add('midnight', 'dark');
    } else if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
    } else {
      // System
      const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    }

    if (typeof localStorage !== 'undefined' && settings.theme) {
      localStorage.setItem('angel_theme', settings.theme);
    }
  }, [settings.theme]);

  const [isChatStreaming, setIsChatStreaming] = useState<boolean>(false);
  const [integrationsStatus, setIntegrationsStatus] = useState<Record<string, unknown> | null>(null);

  // Sync to local storage (Guest conversations are NOT saved to permanent storage)
  useEffect(() => { if (isSignedIn) setStoredItem('agents', agents); }, [agents, isSignedIn]);
  useEffect(() => {
    if (isSignedIn) {
      setStoredItem('conversations', conversations);
    }
  }, [conversations, isSignedIn]);
  useEffect(() => {
    if (isSignedIn) {
      setStoredItem('messages_map', messagesMap);
    }
  }, [messagesMap, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('tasks', tasks); }, [tasks, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('memories', memories); }, [memories, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('projects', projects); }, [projects, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('workflows', workflows); }, [workflows, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('marketplace', marketplaceItems); }, [marketplaceItems, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('executions', executions); }, [executions, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('visual_captures', visualCaptures); }, [visualCaptures, isSignedIn]);
  useEffect(() => setStoredItem('settings', settings), [settings]);
  useEffect(() => { if (isSignedIn) setStoredItem('library_items', libraryItems); }, [libraryItems, isSignedIn]);
  useEffect(() => { if (isSignedIn) setStoredItem('assistants_list', assistantsList); }, [assistantsList, isSignedIn]);

  // IndexedDB Local-First Hydration on App Launch (Only for persistent items)
  useEffect(() => {
    let isMounted = true;
    loadWorkspaceFromIndexedDB()
      .then((idb) => {
        if (!isMounted || !idb || !isSignedIn) return;
        if (idb.tasks && idb.tasks.length > 0) setTasks(idb.tasks);
        if (idb.memories && idb.memories.length > 0) setMemories(idb.memories);
        if (idb.projects && idb.projects.length > 0) setProjects(idb.projects);
        if (idb.workflows && idb.workflows.length > 0) setWorkflows(idb.workflows);
        if (isSignedIn) {
          if (idb.conversations && idb.conversations.length > 0) setConversations(idb.conversations);
          if (idb.messagesMap && Object.keys(idb.messagesMap).length > 0) setMessagesMap(idb.messagesMap);
        }
        if (idb.libraryItems && idb.libraryItems.length > 0) setLibraryItems(idb.libraryItems);
        if (idb.assistants && idb.assistants.length > 0) setAssistantsList(idb.assistants);
      })
      .catch((e) => {
        console.debug('[AppContext] IndexedDB initial hydration note:', e);
      });
    return () => {
      isMounted = false;
    };
  }, [isSignedIn]);

  // Supabase Auth listener & OAuth Hash Callback Processor
  useEffect(() => {
    const client = getClientSupabase();
    if (!client) return;

    // Detect OAuth errors or cancellations in URL hash
    if (typeof window !== 'undefined' && window.location.hash.includes('error=')) {
      try {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const errorDesc =
          hashParams.get('error_description') ||
          hashParams.get('error') ||
          'Google authentication was cancelled or could not be completed.';
        setAuthError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
        setAuthPageMode('signin');
        setIsAuthPageOpen(true);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch {}
    }

    // Check existing Supabase session
    client.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionToken(session.access_token);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('angel_auth_token', session.access_token);
          localStorage.removeItem('angel_is_guest');
        }
        setIsSignedIn(true);
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split('@')[0] ||
          'Daniel Nwachukwu';
        const initials =
          name
            .split(' ')
            .map((n: string) => n[0])
            .filter(Boolean)
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'DN';
        setUserProfile((prev) => ({
          ...prev,
          id: session.user.id,
          name,
          email: session.user.email || prev.email,
          initials,
          plan: 'Pro',
          status: 'online',
          avatarUrl: session.user.user_metadata?.avatar_url || prev.avatarUrl,
        }));
        setIsAuthPageOpen(false);
      }
    }).catch(() => {});

    // Listen to Supabase auth events
    const { data: authSub } = client.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setSessionToken(session.access_token);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('angel_auth_token', session.access_token);
          localStorage.removeItem('angel_is_guest');
        }
        setIsSignedIn(true);
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          session.user.email?.split('@')[0] ||
          'Daniel Nwachukwu';
        const initials =
          name
            .split(' ')
            .map((n: string) => n[0])
            .filter(Boolean)
            .join('')
            .substring(0, 2)
            .toUpperCase() || 'DN';
        setUserProfile((prev) => ({
          ...prev,
          id: session.user.id,
          name,
          email: session.user.email || prev.email,
          initials,
          plan: 'Pro',
          status: 'online',
          avatarUrl: session.user.user_metadata?.avatar_url || prev.avatarUrl,
        }));

        // Defer Supabase calls until after the auth event callback to avoid blocking auth state transitions.
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
          window.setTimeout(() => {
            void upsertAuthenticatedProfile({
              id: session.user.id,
              name,
              email: session.user.email || '',
              initials,
              avatarUrl: session.user.user_metadata?.avatar_url,
            });
          }, 0);
        }
        setIsAuthPageOpen(false);
      } else if (event === 'SIGNED_OUT') {
        setIsSignedIn(false);
        setSessionToken(null);
      }
    });

    return () => {
      authSub?.subscription?.unsubscribe();
    };
  }, []);

  // Real backend session validation & scoped cloud data sync
  useEffect(() => {
    const token = sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('angel_auth_token') : null);
    if (!token) {
      setIsSignedIn(false);
      return;
    }
    if (/^eyJ[A-Za-z0-9_-]*\./.test(token)) {
      setIsSignedIn(true);
      return;
    }

    fetch('/api/auth/session', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Unauthorized');
      })
      .then((data) => {
        if (data.authenticated && data.profile) {
          setIsSignedIn(true);
          setUserProfile((prev) => ({
            ...prev,
            id: data.profile.id,
            name: data.profile.name,
            email: data.profile.email,
            initials: data.profile.name.slice(0, 2).toUpperCase(),
            status: 'online',
            avatarUrl: data.profile.avatarUrl || prev.avatarUrl,
            title: data.profile.title || prev.title,
          }));

          // Pull scoped cloud persistence data
          fetch('/api/user/cloud-data', {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.json())
            .then((cloud) => {
              if (cloud?.data) {
                if (Array.isArray(cloud.data.tasks) && cloud.data.tasks.length > 0) setTasks(cloud.data.tasks);
                if (Array.isArray(cloud.data.memories) && cloud.data.memories.length > 0) setMemories(cloud.data.memories);
                if (Array.isArray(cloud.data.projects) && cloud.data.projects.length > 0) setProjects(cloud.data.projects);
                if (Array.isArray(cloud.data.workflows) && cloud.data.workflows.length > 0) setWorkflows(cloud.data.workflows);
                if (Array.isArray(cloud.data.libraryItems) && cloud.data.libraryItems.length > 0) setLibraryItems(cloud.data.libraryItems);
              }
            })
            .catch(() => {});
        } else {
          resetToGuestWorkspace();
        }
      })
      .catch(() => {
        // If the server is unreachable while offline, retain the local session. Online failures clear stale tokens.
        if (!navigator.onLine) {
          setIsSignedIn(true);
        } else {
          resetToGuestWorkspace();
        }
      });
  }, [sessionToken]);

  // Centralized Autosave Engine (Runs every 30 seconds, persists dirty changed state without user disruption)
  useEffect(() => {
    const AUTOSAVE_INTERVAL_MS = 30000;

    const performAutosave = async () => {
      try {
        if (isGuest) return;
        // Construct deterministic fingerprint of persistent workspace state
        const taskFingerprint = tasks.map((t) => `${t.id}:${t.updatedAt || ''}:${t.status}`).join(';');
        const memFingerprint = memories.map((m) => `${m.id}:${m.updatedAt || ''}`).join(';');
        const projFingerprint = projects.map((p) => `${p.id}:${p.updatedAt || ''}`).join(';');
        const wfFingerprint = workflows.map((w) => `${w.id}:${w.updatedAt || ''}:${w.enabled}`).join(';');
        const convFingerprint = conversations.map((c) => `${c.id}:${c.updatedAt || ''}`).join(';');
        const msgCount = Object.values(messagesMap).reduce((acc, m) => acc + (Array.isArray(m) ? m.length : 0), 0);
        const currentFingerprint = `${taskFingerprint}|${memFingerprint}|${projFingerprint}|${wfFingerprint}|${convFingerprint}|${msgCount}`;

        // Only persist if data actually changed since last autosave (avoids unnecessary writes)
        if (currentFingerprint === lastSavedFingerprintRef.current) {
          return;
        }

        await syncWorkspaceToIndexedDB({
          conversations,
          messagesMap,
          tasks,
          memories,
          projects,
          workflows,
          agents,
          libraryItems,
          assistants: assistantsList,
          activeTab,
          theme: settings.theme,
          syncStatus,
        });

        lastSavedFingerprintRef.current = currentFingerprint;
        setLastAutosavedAt(new Date().toISOString());

        // Cooperate with syncService if online and user is authenticated
        if (!isGuest && typeof navigator !== 'undefined' && navigator.onLine) {
          syncService.processQueue();
        }
      } catch (err) {
        console.warn('[AppContext] Centralized autosave caught error:', err);
      }
    };

    const timer = setInterval(performAutosave, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [
    tasks,
    memories,
    projects,
    workflows,
    conversations,
    messagesMap,
    agents,
    libraryItems,
    assistantsList,
    activeTab,
    settings.theme,
    syncStatus,
    isGuest,
  ]);

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

  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      if (isSignedIn) setStoredItem('user_profile', next);
      return next;
    });

    const token = sessionToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('angel_auth_token') : null);
    if (token) {
      fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      }).catch(() => {});
    }

    const client = getClientSupabase();
    if (client) {
      client.auth.updateUser({
        data: {
          name: updates.name,
          avatar_url: updates.avatarUrl,
          title: updates.title,
        },
      }).catch(() => {});
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return false;
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return false;
    }

    try {
      const client = getClientSupabase();
      if (client) {
        const { data, error } = await client.auth.signInWithPassword({ email: cleanEmail, password });
        if (error) {
          setAuthError(error.message || 'Unable to sign in with that email and password.');
          return false;
        }
        const session = data.session;
        if (!session?.user) {
          setAuthError('Authentication completed without an active session. Please try again.');
          return false;
        }
        const name =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          cleanEmail.split('@')[0];
        const initials = name.split(' ').map((part: string) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'U';
        setSessionToken(session.access_token);
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('angel_auth_token', session.access_token);
          localStorage.removeItem('angel_is_guest');
        }
        setUserProfile({
          id: session.user.id,
          name,
          email: cleanEmail,
          initials,
          plan: 'Pro',
          status: 'online',
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
        setIsSignedIn(true);
        setIsAuthPageOpen(false);
        return true;
      }

      // Server fallback is only for environments where Supabase browser auth is not configured.
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthError(data.error || 'Unable to sign in. Check your details or create an account.');
        return false;
      }
      if (!data.token || !data.profile) {
        setAuthError('The authentication service returned an incomplete response. Please try again.');
        return false;
      }
      const name = data.profile.name || cleanEmail.split('@')[0];
      const initials = name.split(' ').map((part: string) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'U';
      setSessionToken(data.token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('angel_auth_token', data.token);
        localStorage.removeItem('angel_is_guest');
      }
      setUserProfile({
        id: data.profile.id,
        name,
        email: data.profile.email || cleanEmail,
        initials,
        plan: 'Pro',
        status: 'online',
        avatarUrl: data.profile.avatarUrl,
        title: data.profile.title,
      });
      setIsSignedIn(true);
      setIsAuthPageOpen(false);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Authentication failed unexpectedly.';
      setAuthError(!navigator.onLine
        ? 'You appear to be offline. Please reconnect and try again.'
        : message);
      return false;
    }
  };

  const signUp = async (email: string, password: string, name: string): Promise<SignUpResult> => {
    setAuthError(null);
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split('@')[0];

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return { success: false };
    }
    if (!password || password.length < 6) {
      setAuthError('Password must be at least 6 characters long.');
      return { success: false };
    }

    try {
      const client = getClientSupabase();
      if (client) {
        const { data, error } = await client.auth.signUp({
          email: cleanEmail,
          password,
          options: { data: { full_name: cleanName, name: cleanName } },
        });
        if (error) {
          setAuthError(error.message || 'Unable to create an account with those details.');
          return { success: false };
        }

        if (data.session?.user) {
          const user = data.session.user;
          const initials = cleanName.split(' ').map((part: string) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'U';
          setSessionToken(data.session.access_token);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('angel_auth_token', data.session.access_token);
            localStorage.removeItem('angel_is_guest');
          }
          setUserProfile({
            id: user.id,
            name: cleanName,
            email: cleanEmail,
            initials,
            plan: 'Pro',
            status: 'online',
            avatarUrl: user.user_metadata?.avatar_url,
          });
          setIsSignedIn(true);
          setIsAuthPageOpen(false);
          return { success: true };
        }

        if (data.user) {
          return {
            success: true,
            requiresEmailConfirmation: true,
            message: 'Your account has been created. Check your email to confirm it, then sign in.',
          };
        }

        setAuthError('The registration service did not confirm account creation. Please try again.');
        return { success: false };
      }

      // Server fallback is only used when Supabase browser auth is not configured.
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, name: cleanName }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setAuthError(data.error || 'Unable to create your account. Please check your details.');
        return { success: false };
      }
      if (!data.token || !data.profile) {
        setAuthError('The registration service returned an incomplete response. Please try again.');
        return { success: false };
      }
      const profileName = data.profile.name || cleanName;
      const initials = profileName.split(' ').map((part: string) => part[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || 'U';
      setSessionToken(data.token);
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('angel_auth_token', data.token);
        localStorage.removeItem('angel_is_guest');
      }
      setUserProfile({
        id: data.profile.id,
        name: profileName,
        email: data.profile.email || cleanEmail,
        initials,
        plan: 'Pro',
        status: 'online',
        avatarUrl: data.profile.avatarUrl,
        title: data.profile.title,
      });
      setIsSignedIn(true);
      setIsAuthPageOpen(false);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Registration failed unexpectedly.';
      setAuthError(!navigator.onLine
        ? 'You appear to be offline. Please reconnect and try again.'
        : message);
      return { success: false };
    }
  };

  const signOut = async () => {
    if (sessionToken && !/^eyJ[A-Za-z0-9_-]*\./.test(sessionToken)) {
      fetch('/api/auth/signout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${sessionToken}` },
      }).catch(() => {});
    }
    signOutFromSupabase().catch(() => {});
    resetToGuestWorkspace();
  };

  const requestPasswordRecovery = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/auth/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      return await res.json();
    } catch (err) {
      return {
        success: false,
        message: err instanceof Error ? err.message : 'Network error requesting recovery.',
      };
    }
  };

  // Library operations
  const createLibraryItem = (itemData: Omit<LibraryItem, 'id' | 'createdAt' | 'updatedAt'>): LibraryItem => {
    const newId = `lib-${Date.now()}`;
    const now = new Date().toISOString();
    const newItem: LibraryItem = {
      ...itemData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setLibraryItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  const updateLibraryItem = (id: string, updates: Partial<LibraryItem>) => {
    setLibraryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item))
    );
  };

  const deleteLibraryItem = (id: string) => {
    setLibraryItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFavoriteLibraryItem = (id: string) => {
    setLibraryItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  // Assistant lifecycle operations
  const createAssistant = (asstData: Omit<AssistantEntity, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): AssistantEntity => {
    const newId = `asst-${Date.now()}`;
    const now = new Date().toISOString();
    const newAsst: AssistantEntity = {
      ...asstData,
      id: newId,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setAssistantsList((prev) => [newAsst, ...prev]);
    return newAsst;
  };

  const updateAssistant = (id: string, updates: Partial<AssistantEntity>) => {
    setAssistantsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a))
    );
  };

  const deleteAssistant = (id: string) => {
    setAssistantsList((prev) => prev.filter((a) => a.id !== id));
  };

  const duplicateAssistant = (id: string): AssistantEntity => {
    const target = assistantsList.find((a) => a.id === id);
    if (!target) throw new Error('Assistant not found');
    const newId = `asst-${Date.now()}`;
    const now = new Date().toISOString();
    const duplicated: AssistantEntity = {
      ...target,
      id: newId,
      name: `${target.name} (Copy)`,
      version: '1.0.0',
      executionCount: 0,
      isPublished: false,
      createdAt: now,
      updatedAt: now,
    };
    setAssistantsList((prev) => [duplicated, ...prev]);
    return duplicated;
  };

  const toggleArchiveAssistant = (id: string) => {
    setAssistantsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isArchived: !a.isArchived, updatedAt: new Date().toISOString() } : a))
    );
  };

  const togglePublishAssistant = (id: string) => {
    setAssistantsList((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isPublished: !a.isPublished, updatedAt: new Date().toISOString() } : a))
    );
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
        // The Chat composer model selector must affect the model that reaches the server.
        agent: {
          ...agent,
          modelConfig: {
            ...agent.modelConfig,
            modelId: settings.models.geminiModel || agent.modelConfig.modelId,
          },
        },
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

    // Enqueue offline/cloud mutation
    syncService.enqueueMutation('task', 'create', newId, newTask, isGuest);

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
    const now = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates, updatedAt: now };
        syncService.enqueueMutation('task', 'update', id, updated, isGuest);
        return updated;
      })
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    syncService.enqueueMutation('task', 'delete', id, { id }, isGuest);
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

        syncService.enqueueMutation('task', 'update', id, updated, isGuest);

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
        const updated = {
          ...t,
          subtasks: updatedSubtasks,
          status: allCompleted ? 'completed' : t.status,
          updatedAt: new Date().toISOString(),
        };
        syncService.enqueueMutation('task', 'update', taskId, updated, isGuest);
        return updated;
      })
    );
  };

  // Memory methods
  const createMemory = (memoryData: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (isGuest) return;
    const newId = `mem-${Date.now()}`;
    const now = new Date().toISOString();
    const newMem: Memory = {
      ...memoryData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };
    setMemories((prev) => [newMem, ...prev]);

    // Enqueue mutation
    syncService.enqueueMutation('memory', 'create', newId, newMem, isGuest);

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
    if (isGuest) return;
    setMemories((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        const updated = { ...m, ...updates, updatedAt: new Date().toISOString() };
        syncService.enqueueMutation('memory', 'update', id, updated, isGuest);
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
    if (isGuest) return;
    setMemories((prev) => prev.filter((m) => m.id !== id));
    syncService.enqueueMutation('memory', 'delete', id, { id }, isGuest);
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
    syncService.enqueueMutation('project', 'create', newId, newProj, isGuest);
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    const now = new Date().toISOString();
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const updated = { ...p, ...updates, updatedAt: now };
        syncService.enqueueMutation('project', 'update', id, updated, isGuest);
        return updated;
      })
    );
  };

  const deleteProject = (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    syncService.enqueueMutation('project', 'delete', id, { id }, isGuest);
  };

  // Workflow Library Methods (Persistent Foundation)
  const createWorkflow = (
    workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>
  ): Workflow => {
    const newId = `wf-${Date.now()}`;
    const now = new Date().toISOString();
    const newWf: Workflow = {
      ...workflowData,
      id: newId,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setWorkflows((prev) => [newWf, ...prev]);
    syncService.enqueueMutation('workflow', 'create', newId, newWf, isGuest);
    return newWf;
  };

  const updateWorkflow = (id: string, updates: Partial<Workflow>) => {
    const now = new Date().toISOString();
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, ...updates, updatedAt: now };
        syncService.enqueueMutation('workflow', 'update', id, updated, isGuest);
        return updated;
      })
    );
  };

  const deleteWorkflow = (id: string) => {
    setWorkflows((prev) => prev.filter((w) => w.id !== id));
    syncService.enqueueMutation('workflow', 'delete', id, { id }, isGuest);
  };

  const toggleWorkflowEnabled = (id: string) => {
    const now = new Date().toISOString();
    setWorkflows((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const updated = { ...w, enabled: !w.enabled, updatedAt: now };
        syncService.enqueueMutation('workflow', 'update', id, updated, isGuest);
        return updated;
      })
    );
  };

  // Workspace Data Export Service
  const exportWorkspaceData = async (): Promise<void> => {
    const payload = buildWorkspaceExportPayload({
      tasks,
      memories,
      conversations,
      messagesMap,
      projects,
      workflows,
      agents,
      libraryItems,
      userProfile,
    });
    downloadWorkspaceExportAsJSON(payload);
  };

  // Marketplace methods
  const installMarketplaceItem = (id: string) => {
    const item = marketplaceItems.find((m) => m.id === id);
    if (!item) return;

    // Toggle installed state
    setMarketplaceItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, installed: true, installs: it.installs + 1 } : it))
    );

    // If it's a tool, actually add to availableTools!
    if (item.type === 'tool' || item.category === 'tools') {
      const toolId = item.id.replace('item-tool-', '').replace('item-', '');
      const existing = availableTools.find((t) => t.id === toolId);
      if (!existing) {
        const newTool: ToolDefinition = {
          id: toolId,
          name: item.name,
          description: item.description,
          category: 'automation',
          parameters: {},
          requiresPermission: false,
          authType: 'none',
          isAvailable: true,
        };
        setAvailableTools((prev) => [...prev, newTool]);
        // Register in Angel Core agent
        setAgents((prev) =>
          prev.map((a) =>
            a.id === 'angel-core' && !a.tools.includes(toolId)
              ? { ...a, tools: [...a.tools, toolId] }
              : a
          )
        );
      }
    } else if (item.type === 'agent' || item.category === 'agents') {
      // If it's an agent, actually register in agents!
      const agentId = item.id.replace('item-agent-', 'agent-');
      if (!agents.some((a) => a.id === agentId)) {
        createAgent({
          name: item.name,
          codename: item.name.toUpperCase().slice(0, 8),
          tagline: item.description.slice(0, 60),
          description: item.description,
          systemInstructions: `You are ${item.name}, installed from the Angel Marketplace. Fulfill your role with accuracy and precision.`,
          modelConfig: {
            provider: 'gemini',
            modelId: 'gemini-3.8-flash',
            temperature: 0.7,
            maxTokens: 4096,
          },
          tools: ['web_search', 'memory_search'],
          permissions: ['workspace_read'],
          memoryAccess: { canRead: true, canWrite: false, types: ['saved_knowledge'] },
          executionMode: 'assisted',
          status: 'active',
          ownerId: 'user_default',
          avatarIcon: 'Bot',
        });
      }
    }
  };

  const uninstallMarketplaceItem = (id: string) => {
    setMarketplaceItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, installed: false } : it))
    );
  };

  const addMarketplaceReview = (itemId: string, rating: number, comment: string) => {
    const reviewId = `rev-${Date.now()}`;
    const newRev = {
      id: reviewId,
      userName: userProfile.name || 'Anonymous User',
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    setMarketplaceItems((prev) =>
      prev.map((it) => {
        if (it.id !== itemId) return it;
        const currentReviews = it.reviews || [];
        const updatedReviews = [newRev, ...currentReviews];
        const avg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        return {
          ...it,
          reviews: updatedReviews,
          reviewCount: it.reviewCount + 1,
          rating: Number(avg.toFixed(1)),
        };
      })
    );
  };

  const publishToMarketplace = (itemData: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'installs' | 'installed'>): MarketplaceItem => {
    const newId = `item-custom-${Date.now()}`;
    const newItem: MarketplaceItem = {
      ...itemData,
      id: newId,
      rating: 5.0,
      reviewCount: 1,
      installs: 1,
      installed: true,
      author: userProfile.name || 'Danny Davis',
      authorVerified: true,
    };
    setMarketplaceItems((prev) => [newItem, ...prev]);
    return newItem;
  };

  // Agent Lab Execution Pipeline
  const runAgentExecution = async (agentId: string, prompt: string): Promise<AgentExecutionRecord> => {
    setIsAgentProcessing(true);
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
    } finally {
      setIsAgentProcessing(false);
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
        isFocusMode,
        setIsFocusMode,
        toggleFocusMode,
        isAgentProcessing,
        setIsAgentProcessing,
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
        isGuest,
        guestMode,
        discardGuestSession,
        syncStatus,
        triggerManualSync,
        isAuthPageOpen,
        setIsAuthPageOpen,
        authPageMode,
        setAuthPageMode,
        authError,
        setAuthError,
        sessionToken,
        signIn,
        signUp,
        signOut,
        requestPasswordRecovery,
        sendMessage,
        userProfile,
        updateUserProfile,
        toggleTheme,
        libraryItems,
        createLibraryItem,
        updateLibraryItem,
        deleteLibraryItem,
        toggleFavoriteLibraryItem,
        assistantsList,
        createAssistant,
        updateAssistant,
        deleteAssistant,
        duplicateAssistant,
        toggleArchiveAssistant,
        togglePublishAssistant,
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
        deleteProject,
        workflows,
        createWorkflow,
        updateWorkflow,
        deleteWorkflow,
        toggleWorkflowEnabled,
        exportWorkspaceData,
        lastAutosavedAt,
        marketplaceItems,
        availableTools,
        installMarketplaceItem,
        uninstallMarketplaceItem,
        addMarketplaceReview,
        publishToMarketplace,
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

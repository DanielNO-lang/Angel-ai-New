/**
 * ANGEL AI — Master Application Entry Point
 * Coordinates workspace layout, unified mobile/tablet sidebar navigation,
 * dedicated Incognito Mode page, and Sign-in/Sign-up screen.
 */

import React, { useEffect, useRef } from 'react';
import { useIsLightTheme } from './utils/useIsLightTheme';
import { NavigationTab } from './types';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useAngel } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileTopBar } from './components/layout/MobileTopBar';
import { Header } from './components/layout/Header';
import { AuthPage } from './components/auth/AuthPage';
import { HomeView } from './components/home/HomeView';
import { ChatView } from './components/chat/ChatView';
import { AgentLabView } from './components/agent_lab/AgentLabView';
import { TasksView } from './components/tasks/TasksView';
import { MemoriesView } from './components/memories/MemoriesView';
import { ProjectsView } from './components/projects/ProjectsView';
import { RecycleBinView } from './components/recycle_bin/RecycleBinView';
import { MediaStudioView } from './components/media_studio/MediaStudioView';
import { SettingsView } from './components/settings/SettingsView';
import { AssistantsView } from './components/assistants/AssistantsView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { MoreToolsView } from './components/tools/MoreToolsView';
import { LibraryView } from './components/library/LibraryView';
import { IncognitoView } from './components/chat/IncognitoView';
import { GuestGateBanner } from './components/auth/GuestGateBanner';
import { CanvasView } from './components/canvas/CanvasView';
import { DataAnalysisView } from './components/data_analysis/DataAnalysisView';
import { AutomationView } from './components/automation/AutomationView';
import { SkillsView } from './components/skills/SkillsView';
import { PluginsView } from './components/plugins/PluginsView';
import { CommandPalette } from './components/search/CommandPalette';
import { BackdropLayer } from './components/ui/BackdropLayer';
import { NetworkStatusToast } from './components/ui/NetworkStatusToast';
import { DevicePresence } from './components/ui/DevicePresence';
import { RemoteVisualSessions } from './components/ui/RemoteVisualSessions';
import { BackgroundJobsPanel } from './components/ui/BackgroundJobsPanel';
import { ResearchWorkspace } from './components/research/ResearchWorkspace';
import { Maximize2 } from 'lucide-react';
import {
  WorkspaceStageControls,
  WorkspaceMinimizedView,
} from './components/layout/WorkspaceStageControls';

const WorkspaceContent: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    settings,
    isSignedIn,
    isIncognitoActive,
    setIsAuthPageOpen,
    setAuthPageMode,
    isWorkspaceMinimized,
    workspaceSizeMode,
    openCommandPalette,
    toggleSidebar,
    setMobileMenuOpen,
    isFocusMode,
    toggleFocusMode,
  } = useAngel();
  const isLight = useIsLightTheme(settings.theme);

  // Lightweight, local-only performance measurements. These log observed timings without
  // transmitting usage data or adding a third-party analytics dependency.
  useEffect(() => {
    if (typeof window === 'undefined' || !('performance' in window)) return;
    const frame = window.requestAnimationFrame(() => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const paints = window.performance.getEntriesByType('paint');
      const firstContentfulPaint = paints.find((entry) => entry.name === 'first-contentful-paint');
      if (import.meta.env.DEV) {
        console.info('[Angel performance]', {
          domInteractiveMs: navigation ? Math.round(navigation.domInteractive) : null,
          loadEventMs: navigation?.loadEventEnd ? Math.round(navigation.loadEventEnd) : null,
          firstContentfulPaintMs: firstContentfulPaint ? Math.round(firstContentfulPaint.startTime) : null,
        });
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    try {
      const scale = localStorage.getItem('angel_font_scale');
      const sizes: Record<string, string> = { compact: '14px', medium: '16px', comfortable: '18px' };
      if (scale && sizes[scale]) document.documentElement.style.fontSize = sizes[scale];
    } catch {}
  }, []);

  // Section Scroll Anchor: Reset scroll position to top whenever active section changes or clicked
  const mainScrollRef = useRef<HTMLElement>(null);
  const previousTabRef = useRef<NavigationTab>('home');
  const currentTabRef = useRef<NavigationTab>(activeTab);

  useEffect(() => {
    if (activeTab !== currentTabRef.current) {
      previousTabRef.current = currentTabRef.current;
      currentTabRef.current = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const handleNavigateBack = () => {
      // On mobile, section-level back controls reveal the navigation drawer instead
      // of unexpectedly hopping to a different section. Desktop keeps history behavior.
      if (typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(max-width: 767px)').matches) {
        setMobileMenuOpen(true);
        return;
      }
      setActiveTab(previousTabRef.current || 'home');
    };
    window.addEventListener('angel-navigate-back', handleNavigateBack);
    return () => window.removeEventListener('angel-navigate-back', handleNavigateBack);
  }, [setActiveTab, setMobileMenuOpen]);
  useEffect(() => {
    const handleScrollToTop = () => {
      if (mainScrollRef.current) {
        mainScrollRef.current.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    };

    handleScrollToTop();
    window.addEventListener('angel-return-to-top', handleScrollToTop);
    return () => window.removeEventListener('angel-return-to-top', handleScrollToTop);
  }, [activeTab]);

  // Global Keyboard Shortcuts Manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape exits Focus Mode
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      // Open Global Command Palette & Search across all search/command keys:
      // Overrides browser Find (Ctrl/Cmd+F), Print/Palette (Ctrl/Cmd+P), Palette (Ctrl/Cmd+K), F3, and / key
      const isModifierActive = e.ctrlKey || e.metaKey;
      const keyLower = e.key.toLowerCase();
      const activeElement = document.activeElement;
      const isTyping =
        activeElement &&
        (activeElement.tagName === 'INPUT' ||
          activeElement.tagName === 'TEXTAREA' ||
          (activeElement as HTMLElement).isContentEditable);

      if (
        (isModifierActive && (keyLower === 'k' || keyLower === 'f' || keyLower === 'p')) ||
        (isModifierActive && e.shiftKey && (keyLower === 'k' || keyLower === 'f' || keyLower === 'p')) ||
        (e.altKey && !isModifierActive && (keyLower === 'k' || keyLower === 'f')) ||
        e.key === 'F3' ||
        (!isModifierActive && !e.altKey && e.key === '/' && !isTyping)
      ) {
        e.preventDefault();
        e.stopPropagation();
        openCommandPalette('all');
        return;
      }

      // Quick Tasks: Cmd/Ctrl + Shift + T or Alt + T
      if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 't') ||
        (e.altKey && e.key.toLowerCase() === 't')
      ) {
        e.preventDefault();
        setActiveTab('tasks');
        return;
      }

      // Quick Workspace View Hotkeys: Alt + 1..7
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        if (e.key === '1') {
          e.preventDefault();
          setActiveTab('home');
        } else if (e.key === '2') {
          e.preventDefault();
          setActiveTab('chat');
        } else if (e.key === '3') {
          e.preventDefault();
          setActiveTab('tasks');
        } else if (e.key === '4') {
          e.preventDefault();
          setActiveTab('projects');
        } else if (e.key === '5') {
          e.preventDefault();
          setActiveTab('agent_lab');
        } else if (e.key === '6') {
          e.preventDefault();
          setActiveTab('memories');
        }
        return;
      }

      // Toggle Sidebar: Cmd/Ctrl + B
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSidebar();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCommandPalette, setActiveTab, toggleSidebar]);

  // Mobile & Tablet swipe-to-right gesture to open sidebar drawer
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let isTracking = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      // Allow a right-swipe from any sidebar-enabled page, not only the screen edge.
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      startX = touch.clientX;
      startY = touch.clientY;
      isTracking = true;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      isTracking = false;

      // Swiped right with dominant horizontal velocity (> 45px deltaX and deltaX > 1.5 * abs(deltaY))
      if ((activeTab === 'home' || activeTab === 'chat') && deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        setMobileMenuOpen(true);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [activeTab, setMobileMenuOpen]);

  const renderActiveView = () => {
    // 1. Incognito Mode: dedicated isolated page comprising only the chats and chat bar
    if (isIncognitoActive) {
      return <IncognitoView />;
    }

    // 2. Guests can use basic chat, voice, and visual mode. Persistent sections offer an optional sign-in gate.
    const guestLockedSections: Record<string, { name: string; description: string }> = {
      library: { name: 'Library', description: 'Keep documents, files, and saved resources in your personal workspace.' },
      research: { name: 'Research', description: 'Save source-grounded research reports to your private workspace.' },
      projects: { name: 'Projects', description: 'Organize long-term work and preserve project context between sessions.' },
      agent_lab: { name: 'Agent Lab', description: 'Build and manage persistent autonomous agents and workflows.' },
      tasks: { name: 'Tasks', description: 'Save tasks and track progress when you return.' },
      schedule: { name: 'Schedule', description: 'Keep planned work and upcoming tasks available between sessions.' },
      more: { name: 'Tools', description: 'Configure advanced tools and integrations for your workspace.' },
      memories: { name: 'Memory Vault', description: 'Review and manage memory that belongs to your signed-in workspace.' },
    };
    const lockedSection = guestLockedSections[activeTab];
    if (!isSignedIn && lockedSection) {
      return (
        <GuestGateBanner
          featureName={lockedSection.name}
          featureDescription={lockedSection.description}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'chat':
        return <ChatView />;
      case 'voice':
      case 'visual_mode':
        return <ChatView />;
      case 'canvas':
        return <CanvasView />;
      case 'data_analysis':
        return <DataAnalysisView />;
      case 'automation':
        return <AutomationView />;
      case 'skills':
        return <SkillsView />;
      case 'plugins':
        return <PluginsView />;
      case 'projects':
        return <ProjectsView />;
      case 'tasks':
      case 'schedule':
        return <TasksView />;
      case 'library':
        return <LibraryView />;
      case 'research':
        return <ResearchWorkspace />;
      case 'agent_lab':
        return <AgentLabView />;
      case 'memories':
        return <MemoriesView />;
      case 'media_studio':
        return <MediaStudioView />;
      case 'assistants':
        return <AssistantsView />;
      case 'marketplace':
        return <MarketplaceView />;
      case 'more':
        return <MoreToolsView />;
      case 'settings':
      case 'profile':
        return <SettingsView />;
      case 'recycle_bin':
        return <RecycleBinView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div
      className={`relative flex h-[100dvh] min-h-[100dvh] overflow-hidden font-sans antialiased selection:bg-indigo-600/30 selection:text-white transition-colors duration-500 ease-in-out ${
        isLight
          ? 'light text-slate-900 bg-transparent'
          : settings.theme === 'midnight'
          ? 'midnight dark text-white bg-transparent'
          : 'dark text-neutral-100 bg-transparent'
      } accent-${settings.accentColor || 'indigo'} ${
        settings.fontSize === 'sm'
          ? 'text-sm'
          : settings.fontSize === 'lg'
          ? 'text-base'
          : settings.fontSize === 'xl'
          ? 'text-lg'
          : 'text-sm'
      }`}
    >
      {/* Independent globally-consistent backdrop layer (fixed, inset-0, z-index: 0, pointer-events: none) */}
      <BackdropLayer />

      {/* Actual Angel UI rendered at a higher stacking level (z-10) above the backdrop */}
      <div className="relative z-10 flex h-full w-full min-h-0 pl-0 transition-all duration-300 ease-in-out">
        {/* Persistent Collapsible Sidebar (hidden in Focus Mode) */}
        <Sidebar />

        {/* Main Workspace Stage with independent scrolling context and manual minimize/sizing support */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-full min-h-0 overflow-hidden relative transition-all duration-300 ease-in-out ${
            workspaceSizeMode === 'half'
              ? 'max-w-4xl mx-auto shadow-2xl border-x border-inherit'
              : 'w-full'
          }`}
        >
          {/* Top-Right Manual Workspace Stage Controls (Minimize, Half-Screen Sizing) */}
          <WorkspaceStageControls />

          {isWorkspaceMinimized ? (
            <WorkspaceMinimizedView />
          ) : (
            <>
              {activeTab === 'home' && <Header />}
              {activeTab !== 'home' && activeTab !== 'chat' && !isIncognitoActive && <MobileTopBar />}
              <main
                ref={mainScrollRef}
                className={`flex-1 min-h-0 ${
                  activeTab === 'chat'
                    ? 'overflow-hidden flex flex-col'
                    : 'overflow-y-auto overscroll-contain custom-scrollbar'
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={false}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className={activeTab === 'chat' ? 'h-full flex flex-col flex-1 min-h-0' : 'min-h-full'}
                  >
                    {renderActiveView()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </>
          )}
        </div>
      </div>

      {/* Focus Mode Quick Restore Button */}
      {isFocusMode && (
        <button
          onClick={toggleFocusMode}
          className={`fixed bottom-5 left-5 z-40 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-xl border transition-all cursor-pointer animate-in fade-in duration-150 ${
            isLight
              ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-slate-400/20'
              : 'bg-[#151926] hover:bg-neutral-800 text-white border-white/10 shadow-black/80'
          }`}
          title="Exit Focus Mode (Escape or Click)"
        >
          <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Exit Focus Mode</span>
        </button>
      )}

      {/* Network Connectivity & PWA Service Worker Status Listener Toast */}
      <NetworkStatusToast />
      <DevicePresence />
      {activeTab === 'chat' && <RemoteVisualSessions />}
      <BackgroundJobsPanel />

      {/* Global Workspace Search & Command Palette */}
      <CommandPalette />

      {/* Sign-in / Sign-up Screen */}
      <AuthPage />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <WorkspaceContent />
    </AppProvider>
  );
}

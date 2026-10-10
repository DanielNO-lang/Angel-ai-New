/**
 * ANGEL AI — Master Application Entry Point
 * Coordinates workspace layout, unified mobile/tablet sidebar navigation,
 * dedicated Incognito Mode page, and Sign-in/Sign-up screen.
 */

import React, { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useAngel } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AuthPage } from './components/auth/AuthPage';
import { HomeView } from './components/home/HomeView';
import { ChatView } from './components/chat/ChatView';
import { VoiceModeView } from './components/voice/VoiceModeView';
import { VisualModeView } from './components/visual_mode/VisualModeView';
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
import { OnboardingTour } from './components/ui/OnboardingTour';
import { Maximize2 } from 'lucide-react';
import {
  WorkspaceStageControls,
  WorkspaceMinimizedView,
} from './components/layout/WorkspaceStageControls';
import { MobileTopBar } from './components/layout/MobileTopBar';

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
    isFocusMode,
    toggleFocusMode,
  } = useAngel();
  const isLight = settings.theme === 'light';

  // Section Scroll Anchor: Reset scroll position to top whenever active section changes or clicked
  const mainScrollRef = useRef<HTMLElement>(null);
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
        } else if (e.key === '7') {
          e.preventDefault();
          setActiveTab('visual_mode');
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
      // Only initiate swipe-to-open from the left portion of the screen (first 80px) or general left drag
      if (touch.clientX < 80) {
        startX = touch.clientX;
        startY = touch.clientY;
        isTracking = true;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTracking || e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;
      isTracking = false;

      // Swiped right with dominant horizontal velocity (> 45px deltaX and deltaX > 1.5 * abs(deltaY))
      if (deltaX > 45 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
        setMobileMenuOpen(true);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [setMobileMenuOpen]);

  const renderActiveView = () => {
    // 1. Incognito Mode: dedicated isolated page comprising only the chats and chat bar
    if (isIncognitoActive) {
      return <IncognitoView />;
    }

    // 2. Guests can use basic chat, voice, and visual mode. Persistent sections offer an optional sign-in gate.
    const guestLockedSections: Record<string, { name: string; description: string }> = {
      library: { name: 'Library', description: 'Keep documents, files, and saved resources in your personal workspace.' },
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
        return <VoiceModeView />;
      case 'visual_mode':
        return <VisualModeView />;
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
      className={`relative flex min-h-screen font-sans antialiased selection:bg-indigo-600/30 selection:text-white transition-colors duration-500 ease-in-out ${
        settings.theme === 'light'
          ? 'light text-slate-900 bg-transparent'
          : settings.theme === 'midnight'
          ? 'midnight dark text-white bg-transparent'
          : 'dark text-neutral-100 bg-transparent'
      } ${
        settings.fontSize === 'sm'
          ? 'text-xs'
          : settings.fontSize === 'lg'
          ? 'text-base'
          : settings.fontSize === 'xl'
          ? 'text-lg'
          : 'text-[13px]'
      }`}
    >
      {/* Independent globally-consistent backdrop layer (fixed, inset-0, z-index: 0, pointer-events: none) */}
      <BackdropLayer />

      {/* Actual Angel UI rendered at a higher stacking level (z-10) above the backdrop */}
      <div className="relative z-10 flex w-full min-h-screen transition-all duration-300 ease-in-out">
        {/* Persistent Collapsible Sidebar (hidden in Focus Mode) */}
        <Sidebar />

        {/* Main Workspace Stage with independent scrolling context and manual minimize/sizing support */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative transition-all duration-300 ease-in-out ${
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
                    initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(1px)' }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
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

      {/* First-Time User Onboarding Guided Tour */}
      <OnboardingTour />

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

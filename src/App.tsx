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
    isIncognitoActive,
    isWorkspaceMinimized,
    workspaceSizeMode,
    openCommandPalette,
    toggleSidebar,
    isFocusMode,
    toggleFocusMode,
  } = useAngel();
  const isLight = settings.theme === 'light';

  // Section Scroll Anchor: Reset scroll position to top whenever active section changes
  const mainScrollRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
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
      // Open Command Palette: Cmd/Ctrl + K
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
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

  const renderActiveView = () => {
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
      className={`relative flex min-h-screen font-sans antialiased selection:bg-indigo-600/30 selection:text-white transition-all duration-300 ease-in-out ${
        isLight
          ? 'light text-slate-900 bg-white'
          : 'dark text-neutral-100 bg-[#0B0E14]'
      } ${
        settings.fontSize === 'sm'
          ? 'text-xs'
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
              {activeTab === 'home' ? <Header /> : <MobileTopBar />}
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

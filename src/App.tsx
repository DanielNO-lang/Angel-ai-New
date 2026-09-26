/**
 * ANGEL AI — Master Application Entry Point
 * Coordinates workspace layout, unified mobile/tablet sidebar navigation,
 * dedicated Incognito Mode page, and Sign-in/Sign-up screen.
 */

import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useAngel } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { HomeView } from './components/home/HomeView';
import { ChatView } from './components/chat/ChatView';
import { IncognitoView } from './components/chat/IncognitoView';
import { AuthPage } from './components/auth/AuthPage';
import { AgentLabView } from './components/agent_lab/AgentLabView';
import { TasksView } from './components/tasks/TasksView';
import { MemoriesView } from './components/memories/MemoriesView';
import { MarketplaceView } from './components/marketplace/MarketplaceView';
import { ProjectsView } from './components/projects/ProjectsView';
import { VisualModeView } from './components/visual_mode/VisualModeView';
import { VoiceModeView } from './components/voice/VoiceModeView';
import { AssistantsView } from './components/assistants/AssistantsView';
import { MoreToolsView } from './components/more/MoreToolsView';
import { RecycleBinView } from './components/recycle_bin/RecycleBinView';
import { MediaStudioView } from './components/media_studio/MediaStudioView';
import { SettingsView } from './components/settings/SettingsView';
import { CommandPalette } from './components/search/CommandPalette';
import { BackdropLayer } from './components/ui/BackdropLayer';
import {
  WorkspaceStageControls,
  WorkspaceMinimizedView,
} from './components/layout/WorkspaceStageControls';
import { MobileTopBar } from './components/layout/MobileTopBar';

const WorkspaceContent: React.FC = () => {
  const {
    activeTab,
    settings,
    isIncognitoActive,
    isWorkspaceMinimized,
    workspaceSizeMode,
  } = useAngel();
  const isLight = settings.theme === 'light';

  // Dedicated Incognito Page when active
  if (isIncognitoActive) {
    return (
      <div className="relative min-h-screen">
        <BackdropLayer />
        <div className="relative z-10">
          <IncognitoView />
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return <HomeView />;
      case 'chat':
        return <ChatView />;
      case 'voice':
        return <VoiceModeView />;
      case 'agent_lab':
        return <AgentLabView />;
      case 'tasks':
        return <TasksView />;
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
      case 'projects':
        return <ProjectsView />;
      case 'visual_mode':
        return <VisualModeView />;
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
      className={`relative flex min-h-screen font-sans antialiased selection:bg-indigo-600/30 selection:text-white transition-colors duration-150 ${
        isLight
          ? 'light text-slate-900'
          : 'dark text-neutral-100'
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
      <div className="relative z-10 flex w-full min-h-screen">
        {/* Persistent Collapsible Sidebar (and responsive slide-in drawer on mobile/tablet) */}
        <Sidebar />

        {/* Main Workspace Stage with independent scrolling context and manual minimize/sizing support */}
        <div
          className={`flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative transition-all duration-300 ${
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
              {activeTab === 'home' ? <Header /> : activeTab === 'tasks' ? null : <MobileTopBar />}
              <main className="flex-1 min-h-0 overflow-y-auto overscroll-contain custom-scrollbar">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8, filter: 'blur(2px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, y: -6, filter: 'blur(1px)' }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                    className="min-h-full"
                  >
                    {renderActiveView()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </>
          )}
        </div>
      </div>

      {/* Global Workspace Search & Command Palette */}
      <CommandPalette />

      {/* Sign-in / Sign-up Screen with AI Intelligence Short Clip */}
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

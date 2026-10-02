/**
 * ANGEL AI — Interactive Onboarding Tour Tooltips
 * Highlights the sidebar, primary workspace sections, and core AI capabilities
 * for new users upon their first visit, with persistence in localStorage.
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Bot,
  MessageSquare,
  Eye,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface TourStep {
  title: string;
  description: string;
  badge: string;
  icon: React.FC<{ className?: string }>;
  tabTarget?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome to Angel AI',
    description:
      'Your next-generation personal AI workspace. Connect intelligent agents, persistent memories, projects, and multimodal vision in one unified console.',
    badge: 'Overview',
    icon: Sparkles,
  },
  {
    title: 'Sidebar & Workspace Navigation',
    description:
      'Easily navigate between Agent Lab, Projects, Tasks Schedule, Memory Bank, and Media Studios. You can hover to expand or collapse into rail mode.',
    badge: 'Navigation',
    icon: Bot,
    tabTarget: 'agent_lab',
  },
  {
    title: 'Conversational Workspace',
    description:
      'Initiate multi-model conversations powered by Google Gemini. Organize threads into pinned, recent, and archived chats seamlessly.',
    badge: 'Chat',
    icon: MessageSquare,
    tabTarget: 'chat',
  },
  {
    title: 'Visual Perception & Voice Mode',
    description:
      'Inspect screen shares, live camera feeds, and uploaded imagery with real-time AI perception, or use hands-free voice dictation.',
    badge: 'Multimodal',
    icon: Eye,
    tabTarget: 'visual_mode',
  },
  {
    title: 'Global Search & Command Palette',
    description:
      'Press Windows + K (or Cmd + K) at any time to instantly search tasks, memories, projects, and execute system commands across Angel.',
    badge: 'Power Tools',
    icon: Search,
  },
];

export const OnboardingTour: React.FC = () => {
  const { settings, setActiveTab } = useAngel();
  const isLight = settings.theme === 'light';

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);

  useEffect(() => {
    // Check if user has already seen onboarding
    if (typeof localStorage !== 'undefined') {
      const completed = localStorage.getItem('angel_onboarding_completed');
      if (!completed) {
        // Small delay to let the UI mount smoothly
        const timer = setTimeout(() => setIsOpen(true), 1200);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Expose global trigger for settings
  useEffect(() => {
    (window as unknown as { startAngelTour?: () => void }).startAngelTour = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    return () => {
      delete (window as unknown as { startAngelTour?: () => void }).startAngelTour;
    };
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      const target = TOUR_STEPS[nextStep].tabTarget;
      if (target) {
        setActiveTab(target as any);
      }
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      const target = TOUR_STEPS[prevStep].tabTarget;
      if (target) {
        setActiveTab(target as any);
      }
    }
  };

  const handleComplete = () => {
    setIsOpen(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('angel_onboarding_completed', 'true');
    }
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg p-6 rounded-3xl border shadow-2xl transition-all duration-200 ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800 shadow-slate-300/60'
            : 'bg-[#121622] border-white/10 text-neutral-100 shadow-black/80'
        }`}
      >
        {/* Top Header Badge & Close Button */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-inherit/40">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <StepIcon className="w-4 h-4" />
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 font-semibold">
              {step.badge} • Step {currentStep + 1} of {TOUR_STEPS.length}
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="p-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity"
            title="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-2.5 my-4">
          <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-neutral-300">
            {step.description}
          </p>
        </div>

        {/* Progress Dots & Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-inherit/40">
          {/* Progress Dots */}
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === currentStep
                    ? 'w-6 bg-indigo-600'
                    : 'w-1.5 bg-slate-300 dark:bg-neutral-700'
                }`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isLight
                    ? 'text-slate-600 hover:bg-slate-100'
                    : 'text-neutral-300 hover:bg-neutral-800'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <span>{currentStep === TOUR_STEPS.length - 1 ? 'Get Started' : 'Next'}</span>
              {currentStep === TOUR_STEPS.length - 1 ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

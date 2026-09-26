import React from 'react';
import {
  CreditCard,
  User,
  Palette,
  Sun,
  Sliders,
  Mic,
  Eye,
  Brain,
  Shield,
  Bell,
  Network,
  Lock,
} from 'lucide-react';
import { SettingsSubSection } from '../types';

export interface NavItem {
  id: SettingsSubSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description: string;
}

export interface NavCategory {
  category: string;
  items: NavItem[];
}

export const SETTINGS_CATEGORIES: NavCategory[] = [
  {
    category: 'Account & Profile',
    items: [
      {
        id: 'account',
        label: 'Account',
        icon: CreditCard,
        description: 'Subscription, credentials, & billing',
      },
      {
        id: 'profile',
        label: 'Profile',
        icon: User,
        description: 'Identity, avatar, bio, & timezone',
      },
    ],
  },
  {
    category: 'Appearance & Theme',
    items: [
      {
        id: 'appearance',
        label: 'Appearance',
        icon: Palette,
        description: 'Typography, accents, & density',
      },
      {
        id: 'theme',
        label: 'Theme',
        icon: Sun,
        description: 'Dark, light, & cosmic backdrop',
      },
    ],
  },
  {
    category: 'Workspace',
    items: [
      {
        id: 'workspace',
        label: 'Workspace Settings',
        icon: Sliders,
        description: 'Models, composer, & shortcuts',
      },
    ],
  },
  {
    category: 'AI Capabilities',
    items: [
      {
        id: 'voice',
        label: 'Voice & Speech',
        icon: Mic,
        description: 'TTS synthesis & voice models',
      },
      {
        id: 'visual',
        label: 'Visual Multimodal',
        icon: Eye,
        description: 'Camera streams & vision FPS',
      },
      {
        id: 'memory',
        label: 'Memory Vault',
        icon: Brain,
        description: 'Context retention & episodic recall',
      },
    ],
  },
  {
    category: 'Security & System',
    items: [
      {
        id: 'privacy',
        label: 'Privacy & Incognito',
        icon: Shield,
        description: 'Zero-retention & telemetry',
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
        description: 'Push alerts & background chimes',
      },
      {
        id: 'connections',
        label: 'Connections & SQL',
        icon: Network,
        description: 'Database schema & API webhooks',
      },
      {
        id: 'security',
        label: 'Security & Reset',
        icon: Lock,
        description: 'Credentials & factory wipe',
      },
    ],
  },
];

export function getSettingsCategoryAndItem(sectionId: SettingsSubSection) {
  for (const cat of SETTINGS_CATEGORIES) {
    const item = cat.items.find((i) => i.id === sectionId);
    if (item) {
      return { category: cat.category, item };
    }
  }
  return {
    category: 'Settings',
    item: {
      id: sectionId,
      label: sectionId.charAt(0).toUpperCase() + sectionId.slice(1),
      icon: Sliders,
      description: '',
    },
  };
}

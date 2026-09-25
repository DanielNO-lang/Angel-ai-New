/**
 * ANGEL AI — Modular Marketplace
 * Ecosystem of installable agents, tools, workflows, and templates.
 */

import React, { useState } from 'react';
import {
  ArrowDownToLine,
  Bot,
  Check,
  Download,
  Filter,
  Layers,
  Search,
  Sparkles,
  Star,
  Tag,
  Wrench,
  Zap,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { MarketplaceCategory, MarketplaceItem } from '../../types';
import { Button, EmptyState } from '../ui';

export const MarketplaceView: React.FC = () => {
  const { marketplaceItems, installMarketplaceItem, setActiveTab, setSelectedAgentId } = useAngel();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Artifacts' },
    { id: 'agents', label: 'Agents' },
    { id: 'tools', label: 'Tools' },
    { id: 'workflows', label: 'Workflows' },
    { id: 'templates', label: 'Templates' },
  ];

  const filteredItems = marketplaceItems.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTags = item.tags.some((t) => t.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchTags) return false;
    }
    return true;
  });

  const handleInstall = (item: MarketplaceItem) => {
    if (item.installed) return;
    installMarketplaceItem(item.id);
  };

  const getCategoryIcon = (category: MarketplaceCategory) => {
    switch (category) {
      case 'agents':
        return Bot;
      case 'tools':
        return Wrench;
      case 'workflows':
        return Zap;
      case 'templates':
        return Layers;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-8 space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-300">
              <Layers className="w-4 h-4" />
            </span>
            <span className="text-xs font-mono tracking-wider uppercase text-neutral-400">
              Modular Artifact Registry
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-100 mt-1">
            Marketplace
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Discover and install modular agents, domain tools, automated workflows, and workspace templates.
          </p>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search agents, tools, workflows..."
            className="w-full bg-neutral-900/80 border border-neutral-800 rounded-xl px-3 py-2 pl-9 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-hidden focus:border-neutral-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-xs'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Marketplace Items */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Layers className="w-6 h-6 text-neutral-400" />}
          title="No marketplace artifacts found"
          description="The Marketplace hosts modular specialized agents, external tools, multi-step workflows, and workspace templates ready to extend Angel."
          actionLabel="Reset Search & Filters"
          onAction={() => {
            setSearchQuery('');
            setSelectedCategory('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => {
          const Icon = getCategoryIcon(item.category);
          return (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-neutral-800/80 bg-neutral-900/40 hover:border-neutral-700 transition-all flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-neutral-200 group-hover:border-neutral-600 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                    <Star className="w-3.5 h-3.5 fill-current text-neutral-300" />
                    <span>{item.rating.toFixed(1)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-neutral-100">
                      {item.name}
                    </h3>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-950 border border-neutral-800 text-neutral-400">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed line-clamp-3">
                    {item.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1 pt-1">
                  {item.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800/60 mt-4 flex items-center justify-between">
                <div className="text-[11px] font-mono text-neutral-500">
                  <span>By {item.author}</span>
                  <span className="mx-1.5">•</span>
                  <span>v{item.version}</span>
                </div>

                <button
                  onClick={() => handleInstall(item)}
                  disabled={item.installed}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    item.installed
                      ? 'bg-neutral-900 border border-neutral-800 text-neutral-400 cursor-default'
                      : 'bg-neutral-100 hover:bg-white text-neutral-950 shadow-xs'
                  }`}
                >
                  {item.installed ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Installed</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Install</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};

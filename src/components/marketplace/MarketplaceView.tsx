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
  const { settings, marketplaceItems, installMarketplaceItem, setActiveTab, setSelectedAgentId } = useAngel();
  const isLight = settings?.theme === 'light';

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
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 transition-colors duration-150 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Fixed Non-Transparent Header */}
        <div
          className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-3.5 border-b transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs ${
            isLight
              ? 'bg-white border-slate-200 text-slate-900'
              : 'bg-[#0B0E14] border-white/10 text-neutral-100'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-2 rounded-2xl border ${
                isLight
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                  : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <Layers className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Marketplace</h1>
              <span className="text-[11px] font-mono opacity-60">Modular Artifact Registry</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search className={`w-4 h-4 absolute left-3 top-2.5 ${isLight ? 'text-slate-400' : 'text-neutral-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search agents, tools, workflows..."
              className={`w-full rounded-xl px-3 py-2 pl-9 text-xs transition-colors focus:outline-hidden ${
                isLight
                  ? 'bg-white border border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 shadow-2xs'
                  : 'bg-neutral-900/80 border border-neutral-800 text-neutral-200 placeholder-neutral-500 focus:border-neutral-500'
              }`}
            />
          </div>

          {/* Category Pills */}
          <div
            className={`flex items-center gap-1.5 p-1 rounded-xl text-xs border ${
              isLight ? 'bg-slate-100 border-slate-200' : 'bg-neutral-900/60 border border-neutral-800'
            }`}
          >
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                  selectedCategory === cat.id
                    ? isLight
                      ? 'bg-white text-indigo-600 border border-indigo-200/80 font-semibold shadow-2xs'
                      : 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-xs'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
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
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between group ${
                    isLight
                      ? 'bg-white border-slate-200/90 hover:border-indigo-300 shadow-xs hover:shadow-md'
                      : 'bg-neutral-900/40 border-neutral-800/80 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-colors ${
                          isLight
                            ? 'bg-slate-50 border-slate-200 text-slate-700 group-hover:border-indigo-400 group-hover:text-indigo-600'
                            : 'bg-neutral-950 border-neutral-800 text-neutral-200 group-hover:border-neutral-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
                        <Star className="w-3.5 h-3.5 fill-current text-amber-400" />
                        <span className={isLight ? 'text-slate-600 font-semibold' : 'text-neutral-300'}>
                          {item.rating.toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className={`text-sm font-semibold ${isLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                          {item.name}
                        </h3>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-600'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                      <p className={`text-xs mt-1 leading-relaxed line-clamp-3 ${isLight ? 'text-slate-600' : 'text-neutral-400'}`}>
                        {item.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1 pt-1">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${
                            isLight
                              ? 'bg-slate-50 border-slate-200 text-slate-600'
                              : 'bg-neutral-950 border-neutral-800/80 text-neutral-400'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`pt-4 border-t mt-4 flex items-center justify-between ${
                      isLight ? 'border-slate-100' : 'border-neutral-800/60'
                    }`}
                  >
                    <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-neutral-500'}`}>
                      <span>By {item.author}</span>
                      <span className="mx-1.5">•</span>
                      <span>v{item.version}</span>
                    </div>

                    <button
                      onClick={() => handleInstall(item)}
                      disabled={item.installed}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        item.installed
                          ? isLight
                            ? 'bg-slate-100 border border-slate-200 text-slate-500 cursor-default'
                            : 'bg-neutral-900 border border-neutral-800 text-neutral-400 cursor-default'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                      }`}
                    >
                      {item.installed ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
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
    </div>
  );
};

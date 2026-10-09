/**
 * ANGEL AI — Plugins & Extensibility Layer Workspace
 * Manages plugin lifecycle, permission manifests, settings configuration,
 * and hosts the Architectural Boundary Clarity Matrix separating:
 * Skills, Tools, Plugins, Integrations, and Agents.
 */

import React, { useState } from 'react';
import {
  Puzzle,
  Search,
  CheckCircle2,
  AlertCircle,
  Settings,
  Shield,
  Layers,
  ExternalLink,
  RotateCcw,
  Flame,
  Terminal,
  Database,
  GitBranch,
  Share2,
  Activity,
  Bot,
  Wrench,
  HelpCircle,
  Check,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';
import { PluginDefinition, AngelArchitectureConcept } from '../../types';
import {
  getSavedPlugins,
  savePlugins,
  ANGEL_ARCHITECTURE_CONCEPTS,
} from '../../services/plugins/pluginManager';

export const PluginsView: React.FC = () => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  // Plugins state
  const [plugins, setPlugins] = useState<PluginDefinition[]>(() => getSavedPlugins());
  const [selectedPluginId, setSelectedPluginId] = useState<string>(plugins[0]?.id || '');
  const [activeTabMode, setActiveTabMode] = useState<'installed' | 'boundary_matrix' | 'config'>('installed');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Settings editing state
  const [editingSettings, setEditingSettings] = useState<Record<string, any>>({});

  const selectedPlugin = plugins.find((p) => p.id === selectedPluginId) || plugins[0];

  React.useEffect(() => {
    if (selectedPlugin) {
      setEditingSettings({ ...selectedPlugin.settingsValues });
    }
  }, [selectedPluginId]);

  const filteredPlugins = plugins.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.codename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleToggleStatus = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = plugins.map((p) => {
      if (p.id === id) {
        const nextStatus = p.status === 'active' ? 'disabled' : 'active';
        return { ...p, status: nextStatus as any };
      }
      return p;
    });
    setPlugins(updated);
    savePlugins(updated);
    setStatusNotice('Updated plugin status!');
    setTimeout(() => setStatusNotice(null), 2500);
  };

  const handleSaveSettings = () => {
    if (!selectedPlugin) return;
    const updated = plugins.map((p) =>
      p.id === selectedPlugin.id ? { ...p, settingsValues: editingSettings } : p
    );
    setPlugins(updated);
    savePlugins(updated);
    setActiveTabMode('installed');
    setStatusNotice(`Saved settings for "${selectedPlugin.name}"!`);
    setTimeout(() => setStatusNotice(null), 3000);
  };

  return (
    <div
      className={`min-h-full p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-150 ${
        isLight ? 'bg-[#F8FAFC] text-slate-900' : 'bg-[#0B0E14] text-neutral-100'
      }`}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div
          className={`p-4 sm:p-6 rounded-3xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`p-3 rounded-2xl border ${
                isLight
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              }`}
            >
              <Puzzle className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Plugins & Extensibility Layer</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Sandboxed Engine
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Verified third-party connectors, manifest permission validation, and dynamic settings schema.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabMode('installed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${
                activeTabMode === 'installed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-white/5 text-neutral-300'
              }`}
            >
              Installed Plugins ({plugins.length})
            </button>
            <button
              onClick={() => setActiveTabMode('boundary_matrix')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 ${
                activeTabMode === 'boundary_matrix'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : isLight
                  ? 'bg-slate-100 text-slate-700'
                  : 'bg-white/5 text-neutral-300'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Architecture Boundaries
            </button>
          </div>
        </div>

        {/* Status Notice Toast */}
        {statusNotice && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Flame className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusNotice}</span>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: INSTALLED PLUGINS & CONFIGURATION
            ======================================================== */}
        {activeTabMode === 'installed' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Plugin List */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 font-medium">
                Installed Extensions ({plugins.length})
              </span>

              {filteredPlugins.map((plugin) => {
                const isSelected = plugin.id === selectedPlugin?.id;
                return (
                  <div
                    key={plugin.id}
                    onClick={() => setSelectedPluginId(plugin.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                          : 'bg-[#15231F] border-emerald-500/40 shadow-md'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300'
                        : 'bg-[#10141E] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{plugin.name}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-300">
                            v{plugin.version}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 line-clamp-2">{plugin.description}</p>
                      </div>

                      <button
                        onClick={(e) => handleToggleStatus(plugin.id, e)}
                        className={`p-1.5 rounded-lg border text-xs cursor-pointer ${
                          plugin.status === 'active'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                            : 'bg-neutral-500/10 border-neutral-500/20 text-neutral-400'
                        }`}
                      >
                        {plugin.status === 'active' ? 'Active' : 'Disabled'}
                      </button>
                    </div>

                    <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] font-medium text-neutral-400">
                      <span>Auth: {plugin.authType}</span>
                      <span className="text-emerald-400 font-semibold">{plugin.healthStatus}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Detail & Configuration Inspector */}
            {selectedPlugin && (
              <div
                className={`lg:col-span-7 p-6 rounded-3xl border space-y-6 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium font-semibold text-emerald-400 uppercase tracking-wider">
                      Plugin Manifest & Sandboxed Permissions
                    </span>
                    <h2 className="text-lg font-bold">{selectedPlugin.name}</h2>
                    <span className="text-xs text-neutral-400">
                      Author: {selectedPlugin.author} • Engine Compat: {selectedPlugin.angelVersionCompat}
                    </span>
                  </div>

                  <button
                    onClick={() => setActiveTabMode('config')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configure Settings
                  </button>
                </div>

                {/* Declared Permissions */}
                <div className="space-y-2">
                  <span className="text-xs font-bold font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Security Permission Manifest
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.permissions.map((perm) => (
                      <span
                        key={perm}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs"
                      >
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Provided Tools & Capabilities */}
                <div className="space-y-2">
                  <span className="text-xs font-bold font-medium text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-4 h-4 text-indigo-400" />
                    Injected Tools Registered in Workspace Tool Registry
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedPlugin.providedTools.length === 0 ? (
                      <span className="text-neutral-500 text-xs italic">No direct tools injected.</span>
                    ) : (
                      selectedPlugin.providedTools.map((tool) => (
                        <span
                          key={tool}
                          className="px-2.5 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium text-xs"
                        >
                          {tool}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                {/* Lifecycle Hooks */}
                <div className="p-4 rounded-2xl bg-black/20 border border-white/5 space-y-2 text-xs font-medium text-neutral-300">
                  <span className="font-bold text-neutral-400 uppercase text-[10px]">
                    Registered Lifecycle Hooks:
                  </span>
                  <div className="flex gap-4">
                    <span>onInstall: {selectedPlugin.lifecycleHooks.onInstall ? 'Active' : 'N/A'}</span>
                    <span>onActivate: {selectedPlugin.lifecycleHooks.onActivate ? 'Active' : 'N/A'}</span>
                    <span>onDeactivate: {selectedPlugin.lifecycleHooks.onDeactivate ? 'Active' : 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            SUB-TAB: SETTINGS CONFIGURATION FORM
            ======================================================== */}
        {activeTabMode === 'config' && selectedPlugin && (
          <div
            className={`max-w-2xl mx-auto p-6 rounded-3xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div>
              <h2 className="text-lg font-bold">Configure {selectedPlugin.name}</h2>
              <p className="text-xs text-neutral-400">
                Adjust plugin runtime environment properties and authentication credentials.
              </p>
            </div>

            <div className="space-y-4">
              {selectedPlugin.settingsSchema.map((field) => (
                <div key={field.key} className="space-y-1">
                  <label className="text-xs font-medium font-bold text-neutral-300 flex justify-between">
                    <span>{field.label} {field.required && <span className="text-rose-400">*</span>}</span>
                    <span className="text-[10px] text-neutral-500">{field.key}</span>
                  </label>
                  {field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={Boolean(editingSettings[field.key])}
                        onChange={(e) =>
                          setEditingSettings({ ...editingSettings, [field.key]: e.target.checked })
                        }
                      />
                      <span>Enable {field.label}</span>
                    </label>
                  ) : (
                    <input
                      type={field.type === 'password' ? 'password' : 'text'}
                      value={editingSettings[field.key] || ''}
                      onChange={(e) =>
                        setEditingSettings({ ...editingSettings, [field.key]: e.target.value })
                      }
                      className={`w-full px-3 py-2 rounded-xl border text-xs outline-none font-medium ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                      }`}
                    />
                  )}
                  {field.description && <p className="text-[10px] text-neutral-400">{field.description}</p>}
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  onClick={() => setActiveTabMode('installed')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSettings}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: ARCHITECTURAL BOUNDARY CLARITY MATRIX
            Strict separation: Skills vs Tools vs Plugins vs Integrations vs Agents
            ======================================================== */}
        {activeTabMode === 'boundary_matrix' && (
          <div className="space-y-6">
            <div
              className={`p-6 rounded-3xl border space-y-2 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <h2 className="text-lg font-bold">Angel AI Architectural Boundary Clarity</h2>
              <p className="text-xs text-neutral-400">
                To maintain architectural integrity, Angel AI defines strict conceptual and functional boundaries
                between Agents, Skills, Tools, Plugins, and Integrations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ANGEL_ARCHITECTURE_CONCEPTS.map((concept) => (
                <div
                  key={concept.concept}
                  className={`p-5 rounded-3xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-base text-emerald-400">{concept.concept}</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">
                      Core Concept
                    </span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed">{concept.definition}</p>

                  <div className="space-y-1.5 pt-2 border-t border-white/5 text-[11px] font-medium">
                    <div>
                      <span className="text-neutral-500 block">Primary Role:</span>
                      <span className="text-neutral-300">{concept.primaryRole}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Execution Model:</span>
                      <span className="text-neutral-300">{concept.executionModel}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Concrete Examples:</span>
                      <span className="text-cyan-400">{concept.example}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

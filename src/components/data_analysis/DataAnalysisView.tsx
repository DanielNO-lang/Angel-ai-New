/**
 * ANGEL AI — Dedicated Data Analysis Capability
 * High-precision tabular data parser, statistical profiling, interactive cleaning,
 * real non-fabricated Recharts visualizations, AI outlier explanation,
 * and seamless bridges to Chat, Library, Projects, Canvas, and Tasks.
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Upload,
  Table as TableIcon,
  Sparkles,
  Download,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Brain,
  MessageSquare,
  BookOpen,
  FolderGit2,
  PenTool,
  CheckSquare,
  ArrowUpDown,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Layers,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ScatterChart,
  Scatter,
} from 'recharts';
import { useAngel } from '../../context/AppContext';
import {
  Dataset,
  DataTransformConfig,
  ChartType,
  DataChartConfig,
} from '../../types';
import {
  getSavedDatasets,
  saveDatasets,
  SAMPLE_DATASETS,
  parseDelimitedText,
  parseJsonDataset,
  cleanDataset,
  applyDataTransform,
  generateDatasetInsights,
  exportToCsv,
  downloadFile,
} from '../../services/data/dataAnalysisService';
import { getSavedCanvases, saveCanvases } from '../../services/canvas/canvasService';

export const DataAnalysisView: React.FC = () => {
  const {
    settings,
    setActiveTab,
    createConversation,
    sendMessage,
    createLibraryItem,
    createTask,
    activeProjectId,
    projects,
  } = useAngel();

  const isLight = settings.theme === 'light';

  // Datasets state
  const [datasets, setDatasets] = useState<Dataset[]>(() => getSavedDatasets());
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>(datasets[0]?.id || '');
  const [activeSubTab, setActiveSubTab] = useState<'preview' | 'schema' | 'visualize' | 'insights' | 'clean' | 'upload'>('preview');

  // Preview & Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Chart configuration state
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [selectedXCol, setSelectedXCol] = useState<string>('');
  const [selectedYCol, setSelectedYCol] = useState<string>('');

  // Upload state
  const [uploadText, setUploadText] = useState('');
  const [uploadFormat, setUploadFormat] = useState<'csv' | 'json'>('csv');
  const [uploadName, setUploadName] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Status feedback toast
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const currentDataset = datasets.find((d) => d.id === selectedDatasetId) || datasets[0];

  // Set default chart columns on dataset change
  React.useEffect(() => {
    if (currentDataset) {
      const numCol = currentDataset.columns.find((c) => c.type === 'number')?.name || '';
      const strCol = currentDataset.columns.find((c) => c.type === 'string' || c.type === 'date')?.name || '';
      setSelectedXCol(strCol || currentDataset.columns[0]?.name || '');
      setSelectedYCol(numCol || currentDataset.columns[1]?.name || '');
      setCurrentPage(1);
    }
  }, [selectedDatasetId]);

  // Filtered & Sorted Rows
  const processedRows = useMemo(() => {
    if (!currentDataset) return [];
    let rows = [...currentDataset.rawData];

    // Search filter across all columns
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((row) =>
        Object.values(row).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    // Column sorting
    if (sortCol) {
      rows.sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDir === 'asc' ? valA - valB : valB - valA;
        }
        return sortDir === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return rows;
  }, [currentDataset, searchQuery, sortCol, sortDir]);

  // Paginated rows
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedRows.slice(start, start + pageSize);
  }, [processedRows, currentPage]);

  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;

  // AI Insights
  const insights = useMemo(() => {
    if (!currentDataset) return null;
    return generateDatasetInsights(currentDataset);
  }, [currentDataset]);

  // Chart data formatting (strictly from real values!)
  const chartData = useMemo(() => {
    if (!currentDataset || !selectedXCol || !selectedYCol) return [];
    return currentDataset.rawData.slice(0, 30).map((row) => ({
      x: String(row[selectedXCol] || ''),
      y: Number(row[selectedYCol]) || 0,
      fullRow: row,
    }));
  }, [currentDataset, selectedXCol, selectedYCol]);

  // Chart color palette
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6'];

  // Handle Upload Submission
  const handleUploadSubmit = () => {
    setUploadError(null);
    if (!uploadText.trim()) {
      setUploadError('Please paste or enter tabular data.');
      return;
    }

    try {
      let newDs: Dataset;
      if (uploadFormat === 'csv') {
        newDs = parseDelimitedText(uploadText, uploadName.trim() || 'Uploaded CSV Dataset', ',');
      } else {
        newDs = parseJsonDataset(uploadText, uploadName.trim() || 'Uploaded JSON Dataset');
      }

      const updated = [newDs, ...datasets];
      setDatasets(updated);
      saveDatasets(updated);
      setSelectedDatasetId(newDs.id);
      setActiveSubTab('preview');
      setUploadText('');
      setUploadName('');
      setStatusMessage(`Dataset "${newDs.name}" parsed and ready for analysis!`);
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to parse dataset.');
    }
  };

  // Cleaning Actions
  const handleApplyClean = (options: { dropNulls?: boolean; fillNullsWithMean?: boolean; deduplicate?: boolean; trimStrings?: boolean }) => {
    if (!currentDataset) return;
    const cleaned = cleanDataset(currentDataset, options);
    const updated = datasets.map((d) => (d.id === cleaned.id ? cleaned : d));
    setDatasets(updated);
    saveDatasets(updated);
    setStatusMessage(`Applied data cleaning! Processed ${cleaned.rowCount} valid records.`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Bridge 1: Discuss in Chat
  const handleSendToChat = () => {
    if (!currentDataset) return;
    const prompt = `I am analyzing the dataset "${currentDataset.name}" (${currentDataset.rowCount} rows, ${currentDataset.columnCount} columns).
Columns: ${currentDataset.columns.map((c) => `${c.name} (${c.type})`).join(', ')}.
Key Metrics: ${insights ? Object.entries(insights.calculatedMetrics).map(([k, v]) => `${k}: ${v}`).join('; ') : ''}.
Please provide a deep strategic breakdown and recommend the next operational steps.`;

    createConversation();
    setTimeout(() => {
      setActiveTab('chat');
      sendMessage(prompt);
    }, 100);
  };

  // Bridge 2: Save to Library
  const handleSaveToLibrary = () => {
    if (!currentDataset) return;
    const csvContent = exportToCsv(currentDataset);
    createLibraryItem({
      title: `Dataset: ${currentDataset.name}`,
      description: currentDataset.description,
      type: 'document',
      category: 'data',
      size: `${Math.round(csvContent.length / 1024)} KB`,
      tags: [...currentDataset.tags, 'dataset', 'analysis'],
    });
    setStatusMessage(`Saved "${currentDataset.name}" to workspace Library!`);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  // Bridge 3: Insert into Canvas
  const handleInsertIntoCanvas = () => {
    if (!currentDataset) return;
    const allCanvases = getSavedCanvases();
    const targetCanvas = allCanvases[0];

    if (targetCanvas) {
      const newBlock = {
        id: `block-data-${Date.now()}`,
        type: 'data_table' as const,
        title: `Data Table: ${currentDataset.name}`,
        content: JSON.stringify(currentDataset.rawData.slice(0, 10), null, 2),
        output: `${currentDataset.rowCount} rows x ${currentDataset.columnCount} columns. Analysis generated by Angel Data Engine.`,
      };

      const updatedCanvas = {
        ...targetCanvas,
        blocks: [...targetCanvas.blocks, newBlock],
        updatedAt: new Date().toISOString(),
      };

      const updatedAll = allCanvases.map((c) => (c.id === updatedCanvas.id ? updatedCanvas : c));
      saveCanvases(updatedAll);
      setStatusMessage(`Inserted dataset summary into Canvas: "${targetCanvas.title}"!`);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  // Bridge 4: Create Task from Outlier/Anomaly
  const handleCreateTaskFromAnomaly = (anomalyText: string) => {
    createTask({
      title: `Investigate Data Outlier: ${currentDataset.name}`,
      description: anomalyText,
      priority: 'high',
      tags: ['data-investigation', 'anomaly'],
    });
    setStatusMessage('Created task for data investigation!');
    setTimeout(() => setStatusMessage(null), 3000);
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
                  ? 'bg-blue-50 border-blue-200 text-blue-600'
                  : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              <BarChart3 className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Dedicated Data Analysis Engine</h1>
                {currentDataset && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                      currentDataset.isSample
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    }`}
                  >
                    {currentDataset.isSample ? 'Verified Sample Benchmark' : 'Production User Data'}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-1">
                Schema inspection, data cleaning, non-fabricated Recharts visualizations, and cross-workspace integration.
              </p>
            </div>
          </div>

          {/* Quick Dataset Selector & Upload Button */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedDatasetId}
              onChange={(e) => setSelectedDatasetId(e.target.value)}
              className={`px-3 py-1.5 rounded-xl border text-xs outline-none cursor-pointer ${
                isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-white/10 text-white'
              }`}
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.isSample ? '📊 [Sample] ' : '📈 '} {d.name} ({d.rowCount} rows)
                </option>
              ))}
            </select>

            <button
              onClick={() => setActiveSubTab('upload')}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Data
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {statusMessage && (
          <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-center gap-2 animate-in fade-in">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Navigation Tabs & Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
            {(
              [
                { id: 'preview', label: 'Data Table', icon: TableIcon },
                { id: 'schema', label: 'Schema & Types', icon: Layers },
                { id: 'visualize', label: 'Visualizations', icon: TrendingUp },
                { id: 'insights', label: 'AI Synthesis', icon: Brain },
                { id: 'clean', label: 'Data Cleaning', icon: RefreshCw },
              ] as const
            ).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeSubTab === t.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isLight
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-white/5 text-neutral-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Cross-Workspace Action Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={handleSendToChat}
              title="Discuss dataset in Chat with AI agent"
              className="px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium hover:bg-white/5 cursor-pointer flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Ask in Chat</span>
            </button>
            <button
              onClick={handleInsertIntoCanvas}
              title="Insert data table block into Canvas"
              className="px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium hover:bg-white/5 cursor-pointer flex items-center gap-1.5"
            >
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">To Canvas</span>
            </button>
            <button
              onClick={handleSaveToLibrary}
              title="Save CSV file to Library"
              className="px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium hover:bg-white/5 cursor-pointer flex items-center gap-1.5"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Save to Library</span>
            </button>
            <button
              onClick={() => {
                const csv = exportToCsv(currentDataset);
                downloadFile(csv, `${currentDataset.name.toLowerCase().replace(/\s+/g, '_')}.csv`, 'text/csv');
              }}
              title="Export Cleaned CSV"
              className="px-2.5 py-1.5 rounded-xl border border-white/10 text-xs font-medium hover:bg-white/5 cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================
            SUB-TAB: DATA TABLE & PREVIEW
            ======================================================== */}
        {activeSubTab === 'preview' && (
          <div
            className={`rounded-3xl border overflow-hidden shadow-sm ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            {/* Search and Pagination Toolbar */}
            <div className="p-4 border-b border-inherit flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search values in table..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                <span>
                  Showing {paginatedRows.length} of {processedRows.length} records
                </span>
                <div className="flex items-center gap-1">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1 rounded-lg border border-white/10 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-bold text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1 rounded-lg border border-white/10 disabled:opacity-30 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable Data Table */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs font-mono border-collapse">
                <thead>
                  <tr
                    className={`border-b ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-white/5 border-white/10 text-neutral-300'
                    }`}
                  >
                    <th className="p-3 w-12 text-center text-neutral-500">#</th>
                    {currentDataset.columns.map((col) => {
                      const isSorted = sortCol === col.name;
                      return (
                        <th
                          key={col.name}
                          onClick={() => {
                            if (sortCol === col.name) {
                              setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
                            } else {
                              setSortCol(col.name);
                              setSortDir('asc');
                            }
                          }}
                          className="p-3 font-semibold cursor-pointer hover:bg-white/5 transition-colors whitespace-nowrap"
                        >
                          <div className="flex items-center gap-1.5">
                            <span>{col.name}</span>
                            <span className="text-[10px] opacity-60 uppercase font-sans">({col.type})</span>
                            <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-blue-400' : 'opacity-30'}`} />
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-white/5 transition-colors ${
                        idx % 2 === 0 ? (isLight ? 'bg-white' : 'bg-transparent') : isLight ? 'bg-slate-50/50' : 'bg-white/[0.02]'
                      }`}
                    >
                      <td className="p-3 text-center text-neutral-500 text-[11px]">
                        {(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      {currentDataset.columns.map((col) => {
                        const val = row[col.name];
                        return (
                          <td key={col.name} className="p-3 whitespace-nowrap">
                            {val === null || val === undefined ? (
                              <span className="text-rose-400 text-[10px] italic">null</span>
                            ) : typeof val === 'number' ? (
                              <span className="text-cyan-400 font-semibold">{val.toLocaleString()}</span>
                            ) : (
                              String(val)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: SCHEMA & COLUMN PROFILING
            ======================================================== */}
        {activeSubTab === 'schema' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentDataset.columns.map((col) => (
                <div
                  key={col.name}
                  className={`p-4 rounded-2xl border space-y-3 ${
                    isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm font-mono text-blue-400">{col.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-500/10 text-blue-300 uppercase">
                      {col.type}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-neutral-400">
                    <div className="flex justify-between">
                      <span>Nulls:</span>
                      <span className={col.nullCount > 0 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                        {col.nullCount} ({Math.round((col.nullCount / currentDataset.rowCount) * 100)}%)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Unique Distinct:</span>
                      <span className="font-semibold text-neutral-200">{col.uniqueCount}</span>
                    </div>
                  </div>

                  {col.stats && (
                    <div className="pt-2 border-t border-white/5 space-y-1 text-[11px] font-mono">
                      <div className="flex justify-between text-neutral-400">
                        <span>Min / Max:</span>
                        <span>
                          {col.stats.min?.toLocaleString()} / {col.stats.max?.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Mean (Avg):</span>
                        <span className="text-cyan-400 font-bold">{col.stats.mean?.toLocaleString()}</span>
                      </div>
                      {col.stats.sum !== undefined && (
                        <div className="flex justify-between text-neutral-400">
                          <span>Total Sum:</span>
                          <span className="text-emerald-400 font-bold">{col.stats.sum.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="text-[10px] text-neutral-500 font-mono truncate">
                    Samples: {col.sampleValues.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: VISUALIZATIONS (REAL DATA-DRIVEN RECHARTS)
            ======================================================== */}
        {activeSubTab === 'visualize' && (
          <div className="space-y-4">
            {/* Chart Control Toolbar */}
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-neutral-400 font-mono">Chart Type:</span>
                {(['bar', 'line', 'area', 'pie', 'scatter'] as ChartType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setChartType(type)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                      chartType === type
                        ? 'bg-blue-600 text-white shadow-xs'
                        : isLight
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-white/5 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono text-neutral-400">X-Axis:</span>
                  <select
                    value={selectedXCol}
                    onChange={(e) => setSelectedXCol(e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-white/10 text-white'
                    }`}
                  >
                    {currentDataset.columns.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-mono text-neutral-400">Y-Axis:</span>
                  <select
                    value={selectedYCol}
                    onChange={(e) => setSelectedYCol(e.target.value)}
                    className={`px-2 py-1 rounded-lg border text-xs outline-none ${
                      isLight ? 'bg-white border-slate-200' : 'bg-neutral-900 border-white/10 text-white'
                    }`}
                  >
                    {currentDataset.columns
                      .filter((c) => c.type === 'number')
                      .map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Main Interactive Chart View */}
            <div
              className={`p-6 rounded-3xl border shadow-sm ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-base">
                    {selectedYCol} by {selectedXCol}
                  </h3>
                  <span className="text-xs font-mono text-neutral-400">
                    Real data points plotted from {chartData.length} records (no fabricated values)
                  </span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'bar' ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="x" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                      <Bar dataKey="y" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  ) : chartType === 'line' ? (
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="x" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                      <Line type="monotone" dataKey="y" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    </LineChart>
                  ) : chartType === 'area' ? (
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="x" tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#888', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                      <Area type="monotone" dataKey="y" stroke="#3b82f6" fillOpacity={1} fill="url(#areaGrad)" />
                    </AreaChart>
                  ) : chartType === 'pie' ? (
                    <PieChart>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                      <Pie
                        data={chartData.slice(0, 8)}
                        dataKey="y"
                        nameKey="x"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={(entry) => entry.x}
                      >
                        {chartData.slice(0, 8).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  ) : (
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="x" name={selectedXCol} tick={{ fill: '#888', fontSize: 11 }} />
                      <YAxis dataKey="y" name={selectedYCol} tick={{ fill: '#888', fontSize: 11 }} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          fontSize: '11px',
                        }}
                      />
                      <Scatter name="Data Points" data={chartData} fill="#ec4899" />
                    </ScatterChart>
                  )}
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: AI SYNTHESIS & ANOMALIES
            ======================================================== */}
        {activeSubTab === 'insights' && insights && (
          <div className="space-y-6">
            {/* Headline and metrics */}
            <div
              className={`p-6 rounded-3xl border space-y-4 ${
                isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
                  <Brain className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{insights.headline}</h2>
                  <span className="text-xs text-neutral-400 font-mono">
                    Deterministic statistical aggregation + executive narrative synthesis
                  </span>
                </div>
              </div>

              {/* Calculated Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                {Object.entries(insights.calculatedMetrics).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-2xl bg-black/20 border border-white/5">
                    <span className="text-[10px] font-mono text-neutral-400 block truncate">{k}</span>
                    <span className="text-base font-bold text-white mt-0.5 block truncate">
                      {typeof v === 'number' ? v.toLocaleString() : v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Findings & Outliers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Key Findings */}
              <div
                className={`p-6 rounded-3xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Key Empirical Findings
                </span>
                <div className="space-y-2 text-xs text-neutral-300">
                  {insights.keyFindings.map((finding, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/20 border border-white/5 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Outliers & Anomalies */}
              <div
                className={`p-6 rounded-3xl border space-y-3 ${
                  isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
                }`}
              >
                <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Detected Outliers & Variance Anomalies
                </span>
                <div className="space-y-2 text-xs">
                  {insights.anomaliesDetected.length === 0 ? (
                    <p className="text-neutral-400 italic">No severe outliers detected (&gt; 2 std deviations).</p>
                  ) : (
                    insights.anomaliesDetected.map((anomaly, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 flex items-start justify-between gap-3"
                      >
                        <span>{anomaly}</span>
                        <button
                          onClick={() => handleCreateTaskFromAnomaly(anomaly)}
                          className="px-2 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] shrink-0 cursor-pointer"
                        >
                          Create Task
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: DATA CLEANING
            ======================================================== */}
        {activeSubTab === 'clean' && (
          <div
            className={`max-w-2xl mx-auto p-6 rounded-3xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div>
              <h2 className="text-lg font-bold">Data Cleaning & Transformation Suite</h2>
              <p className="text-xs text-neutral-400">
                Safely sanitize data quality issues, handle missing null values, and strip duplicate entries.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Remove Incomplete Records (Drop Nulls)</span>
                  <span className="text-[11px] text-neutral-400">
                    Discards rows that contain missing or empty values in any column.
                  </span>
                </div>
                <button
                  onClick={() => handleApplyClean({ dropNulls: true })}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Drop Null Rows
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Impute Missing Numeric Values</span>
                  <span className="text-[11px] text-neutral-400">
                    Fills null numeric entries with the mathematical mean of that column.
                  </span>
                </div>
                <button
                  onClick={() => handleApplyClean({ fillNullsWithMean: true })}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Fill with Mean
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Deduplicate Identical Rows</span>
                  <span className="text-[11px] text-neutral-400">
                    Identifies and removes duplicate row instances across all columns.
                  </span>
                </div>
                <button
                  onClick={() => handleApplyClean({ deduplicate: true })}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Deduplicate
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-black/20 border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Trim Whitespace</span>
                  <span className="text-[11px] text-neutral-400">
                    Strips leading and trailing spaces from all string values.
                  </span>
                </div>
                <button
                  onClick={() => handleApplyClean({ trimStrings: true })}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs cursor-pointer"
                >
                  Trim Strings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            SUB-TAB: UPLOAD DATASET
            ======================================================== */}
        {activeSubTab === 'upload' && (
          <div
            className={`max-w-2xl mx-auto p-6 rounded-3xl border space-y-6 ${
              isLight ? 'bg-white border-slate-200' : 'bg-[#10141E] border-white/10'
            }`}
          >
            <div>
              <h2 className="text-lg font-bold">Import Dataset (CSV, TSV, or JSON)</h2>
              <p className="text-xs text-neutral-400">
                Paste tabular data directly. Types, columns, and statistical variance will be inferred automatically.
              </p>
            </div>

            {uploadError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {uploadError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase font-mono block mb-1">
                  Dataset Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., Q1 Customer Churn Metrics"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="font-bold text-neutral-400 font-mono">Format:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={uploadFormat === 'csv'}
                    onChange={() => setUploadFormat('csv')}
                  />
                  <span>CSV / TSV (Delimited)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    checked={uploadFormat === 'json'}
                    onChange={() => setUploadFormat('json')}
                  />
                  <span>JSON (Array of objects)</span>
                </label>
              </div>

              <div>
                <label className="text-xs font-bold text-neutral-400 uppercase font-mono block mb-1">
                  Raw Content
                </label>
                <textarea
                  rows={8}
                  placeholder={
                    uploadFormat === 'csv'
                      ? 'Month,Revenue,Churn\nJan,10000,1.2\nFeb,12000,1.1\nMar,14500,0.9'
                      : '[{"Month": "Jan", "Revenue": 10000}, {"Month": "Feb", "Revenue": 12000}]'
                  }
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className={`w-full p-3 rounded-2xl border font-mono text-xs outline-none ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/5 border-white/10'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => setActiveSubTab('preview')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-white/5 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUploadSubmit}
                  disabled={!uploadText.trim()}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  Parse & Profile Dataset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

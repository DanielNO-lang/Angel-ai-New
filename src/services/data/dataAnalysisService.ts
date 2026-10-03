/**
 * ANGEL AI — Data Analysis Service
 * Robust tabular parsing, statistical calculation, cleaning, filtering,
 * aggregation, chart generation, and cross-workspace export bridges.
 */

import {
  Dataset,
  DataColumnMeta,
  DataColumnType,
  DataFilterCondition,
  DataTransformConfig,
  DataInsightSummary,
  ChartType,
} from '../../types';

const DATASETS_STORAGE_KEY = 'angel_saved_datasets';

/**
 * High-fidelity built-in sample datasets (clearly flagged isSample: true)
 */
export const SAMPLE_DATASETS: Dataset[] = [
  {
    id: 'sample-saas-metrics-2026',
    name: 'SaaS Revenue, Churn & Unit Economics (2026)',
    description: 'Quarterly and monthly recurring revenue, churn percentages, net revenue retention, and acquisition costs across customer tiers.',
    isSample: true,
    rowCount: 12,
    columnCount: 6,
    columns: [
      { name: 'Month', type: 'string', sampleValues: ['Jan 2026', 'Feb 2026', 'Mar 2026'], nullCount: 0, uniqueCount: 12 },
      { name: 'MRR_USD', type: 'number', sampleValues: [142000, 156000, 169000], nullCount: 0, uniqueCount: 12, stats: { min: 142000, max: 248000, mean: 191500, sum: 2298000 } },
      { name: 'New_Customers', type: 'number', sampleValues: [38, 45, 52], nullCount: 0, uniqueCount: 11, stats: { min: 38, max: 88, mean: 59, sum: 708 } },
      { name: 'Churn_Rate_Pct', type: 'number', sampleValues: [1.8, 1.6, 1.4], nullCount: 0, uniqueCount: 8, stats: { min: 0.9, max: 1.8, mean: 1.34 } },
      { name: 'NRR_Pct', type: 'number', sampleValues: [118, 122, 124], nullCount: 0, uniqueCount: 9, stats: { min: 118, max: 136, mean: 126 } },
      { name: 'LTV_CAC_Ratio', type: 'number', sampleValues: [4.2, 4.5, 4.8], nullCount: 0, uniqueCount: 10, stats: { min: 4.2, max: 6.8, mean: 5.4 } },
    ],
    rawData: [
      { Month: 'Jan 2026', MRR_USD: 142000, New_Customers: 38, Churn_Rate_Pct: 1.8, NRR_Pct: 118, LTV_CAC_Ratio: 4.2 },
      { Month: 'Feb 2026', MRR_USD: 156000, New_Customers: 45, Churn_Rate_Pct: 1.6, NRR_Pct: 122, LTV_CAC_Ratio: 4.5 },
      { Month: 'Mar 2026', MRR_USD: 169000, New_Customers: 52, Churn_Rate_Pct: 1.4, NRR_Pct: 124, LTV_CAC_Ratio: 4.8 },
      { Month: 'Apr 2026', MRR_USD: 178000, New_Customers: 55, Churn_Rate_Pct: 1.5, NRR_Pct: 125, LTV_CAC_Ratio: 5.1 },
      { Month: 'May 2026', MRR_USD: 189000, New_Customers: 60, Churn_Rate_Pct: 1.3, NRR_Pct: 127, LTV_CAC_Ratio: 5.3 },
      { Month: 'Jun 2026', MRR_USD: 198000, New_Customers: 62, Churn_Rate_Pct: 1.2, NRR_Pct: 128, LTV_CAC_Ratio: 5.5 },
      { Month: 'Jul 2026', MRR_USD: 205000, New_Customers: 59, Churn_Rate_Pct: 1.4, NRR_Pct: 126, LTV_CAC_Ratio: 5.4 },
      { Month: 'Aug 2026', MRR_USD: 214000, New_Customers: 68, Churn_Rate_Pct: 1.2, NRR_Pct: 129, LTV_CAC_Ratio: 5.8 },
      { Month: 'Sep 2026', MRR_USD: 226000, New_Customers: 74, Churn_Rate_Pct: 1.1, NRR_Pct: 131, LTV_CAC_Ratio: 6.1 },
      { Month: 'Oct 2026', MRR_USD: 235000, New_Customers: 79, Churn_Rate_Pct: 1.0, NRR_Pct: 133, LTV_CAC_Ratio: 6.4 },
      { Month: 'Nov 2026', MRR_USD: 241000, New_Customers: 81, Churn_Rate_Pct: 1.0, NRR_Pct: 134, LTV_CAC_Ratio: 6.6 },
      { Month: 'Dec 2026', MRR_USD: 248000, New_Customers: 88, Churn_Rate_Pct: 0.9, NRR_Pct: 136, LTV_CAC_Ratio: 6.8 },
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    tags: ['saas', 'revenue', 'financials', 'sample'],
  },
  {
    id: 'sample-ai-agent-telemetry',
    name: 'AI Agent Execution Telemetry & Latencies',
    description: 'Telemetry logs across Angel Core, Optic, Composer, and Sentinel agents measuring latency, tokens consumed, tool execution rate, and success rates.',
    isSample: true,
    rowCount: 8,
    columnCount: 6,
    columns: [
      { name: 'Agent', type: 'string', sampleValues: ['Angel Core', 'Optic Vision', 'Code Composer'], nullCount: 0, uniqueCount: 8 },
      { name: 'Execution_Count', type: 'number', sampleValues: [420, 280, 540], nullCount: 0, uniqueCount: 8, stats: { min: 140, max: 620, mean: 375, sum: 3000 } },
      { name: 'Avg_Latency_ms', type: 'number', sampleValues: [850, 1420, 1100], nullCount: 0, uniqueCount: 8, stats: { min: 620, max: 1850, mean: 1145 } },
      { name: 'Tokens_In_k', type: 'number', sampleValues: [340, 180, 520], nullCount: 0, uniqueCount: 8, stats: { min: 90, max: 520, mean: 285, sum: 2280 } },
      { name: 'Tokens_Out_k', type: 'number', sampleValues: [120, 45, 210], nullCount: 0, uniqueCount: 8, stats: { min: 35, max: 210, mean: 108, sum: 865 } },
      { name: 'Success_Rate_Pct', type: 'number', sampleValues: [99.2, 97.8, 98.6], nullCount: 0, uniqueCount: 7, stats: { min: 95.4, max: 99.6, mean: 98.1 } },
    ],
    rawData: [
      { Agent: 'Angel Core', Execution_Count: 620, Avg_Latency_ms: 780, Tokens_In_k: 510, Tokens_Out_k: 195, Success_Rate_Pct: 99.5 },
      { Agent: 'Optic Vision', Execution_Count: 290, Avg_Latency_ms: 1650, Tokens_In_k: 380, Tokens_Out_k: 72, Success_Rate_Pct: 97.8 },
      { Agent: 'Code Composer', Execution_Count: 540, Avg_Latency_ms: 1120, Tokens_In_k: 490, Tokens_Out_k: 210, Success_Rate_Pct: 98.9 },
      { Agent: 'Sentinel Security', Execution_Count: 310, Avg_Latency_ms: 620, Tokens_In_k: 180, Tokens_Out_k: 55, Success_Rate_Pct: 99.6 },
      { Agent: 'Data Analyst', Execution_Count: 420, Avg_Latency_ms: 1350, Tokens_In_k: 410, Tokens_Out_k: 140, Success_Rate_Pct: 98.2 },
      { Agent: 'Research Scout', Execution_Count: 380, Avg_Latency_ms: 1850, Tokens_In_k: 460, Tokens_Out_k: 160, Success_Rate_Pct: 96.4 },
      { Agent: 'Task Automator', Execution_Count: 300, Avg_Latency_ms: 890, Tokens_In_k: 190, Tokens_Out_k: 68, Success_Rate_Pct: 99.1 },
      { Agent: 'Media Synthesizer', Execution_Count: 140, Avg_Latency_ms: 2200, Tokens_In_k: 90, Tokens_Out_k: 35, Success_Rate_Pct: 95.4 },
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
    tags: ['telemetry', 'agents', 'latency', 'sample'],
  },
];

/**
 * Storage helpers
 */
export function getSavedDatasets(): Dataset[] {
  try {
    const raw = localStorage.getItem(DATASETS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fall through
  }
  return SAMPLE_DATASETS;
}

export function saveDatasets(datasets: Dataset[]): void {
  try {
    localStorage.setItem(DATASETS_STORAGE_KEY, JSON.stringify(datasets));
  } catch (err) {
    console.error('Failed to save datasets:', err);
  }
}

/**
 * Inactive or empty string checker
 */
function isNullOrEmpty(val: any): boolean {
  return val === null || val === undefined || (typeof val === 'string' && val.trim() === '');
}

/**
 * Inferred type discovery for a column
 */
export function inferColumnType(values: any[]): DataColumnType {
  const nonNulls = values.filter((v) => !isNullOrEmpty(v));
  if (nonNulls.length === 0) return 'string';

  let numericCount = 0;
  let booleanCount = 0;
  let dateCount = 0;

  for (const val of nonNulls) {
    if (typeof val === 'boolean' || val === 'true' || val === 'false') {
      booleanCount++;
      continue;
    }
    const cleanStr = String(val).replace(/[$,%]/g, '').trim();
    if (!isNaN(Number(cleanStr)) && cleanStr !== '') {
      numericCount++;
      continue;
    }
    const parsedDate = Date.parse(String(val));
    if (!isNaN(parsedDate) && String(val).length > 5 && isNaN(Number(val))) {
      dateCount++;
    }
  }

  const threshold = nonNulls.length * 0.75;
  if (numericCount >= threshold) return 'number';
  if (booleanCount >= threshold) return 'boolean';
  if (dateCount >= threshold) return 'date';
  return 'string';
}

/**
 * Calculate column statistics
 */
export function computeColumnMeta(name: string, rawValues: any[]): DataColumnMeta {
  const type = inferColumnType(rawValues);
  const nullCount = rawValues.filter(isNullOrEmpty).length;
  const uniqueCount = new Set(rawValues.filter((v) => !isNullOrEmpty(v))).size;
  const sampleValues = rawValues.filter((v) => !isNullOrEmpty(v)).slice(0, 3);

  let stats: DataColumnMeta['stats'] | undefined;

  if (type === 'number') {
    const nums = rawValues
      .map((v) => Number(String(v).replace(/[$,%]/g, '').trim()))
      .filter((n) => !isNaN(n));

    if (nums.length > 0) {
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const sum = nums.reduce((acc, cur) => acc + cur, 0);
      const mean = Math.round((sum / nums.length) * 100) / 100;
      const sorted = [...nums].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

      // Variance & StdDev
      const variance = nums.reduce((acc, cur) => acc + Math.pow(cur - mean, 2), 0) / nums.length;
      const stdDev = Math.round(Math.sqrt(variance) * 100) / 100;

      stats = { min, max, mean, median, sum: Math.round(sum * 100) / 100, stdDev };
    }
  }

  return {
    name,
    type,
    sampleValues,
    nullCount,
    uniqueCount,
    stats,
  };
}

/**
 * Parses raw CSV or TSV string into structured Dataset
 */
export function parseDelimitedText(
  text: string,
  name: string,
  delimiter = ','
): Dataset {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    throw new Error('Dataset must contain a header row and at least one data row.');
  }

  // Parse header
  const headers = lines[0].split(delimiter).map((h) => h.replace(/^["']|["']$/g, '').trim());
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawTokens = lines[i].split(delimiter).map((t) => t.replace(/^["']|["']$/g, '').trim());
    const rowObj: Record<string, any> = {};

    headers.forEach((header, colIdx) => {
      const val = rawTokens[colIdx];
      if (val === undefined || val === '') {
        rowObj[header] = null;
      } else {
        const cleanNum = Number(val.replace(/[$,%]/g, ''));
        rowObj[header] = !isNaN(cleanNum) && isNaN(Number(val)) === false ? cleanNum : val;
      }
    });

    rows.push(rowObj);
  }

  const columns: DataColumnMeta[] = headers.map((colName) => {
    const colValues = rows.map((r) => r[colName]);
    return computeColumnMeta(colName, colValues);
  });

  return {
    id: `dataset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name || 'Uploaded Dataset',
    description: `Parsed from ${lines.length - 1} rows and ${headers.length} columns.`,
    isSample: false, // Explicitly false for user uploads
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
    rawData: rows,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['user-upload'],
  };
}

/**
 * Parses raw JSON string into structured Dataset
 */
export function parseJsonDataset(jsonString: string, name: string): Dataset {
  const parsed = JSON.parse(jsonString);
  const rows = Array.isArray(parsed) ? parsed : parsed.data || parsed.rows || [parsed];

  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error('JSON dataset must be an array of objects or contain a "data" array.');
  }

  const allKeys = new Set<string>();
  rows.forEach((r) => {
    if (typeof r === 'object' && r !== null) {
      Object.keys(r).forEach((k) => allKeys.add(k));
    }
  });

  const headers = Array.from(allKeys);
  const columns: DataColumnMeta[] = headers.map((colName) => {
    const colValues = rows.map((r) => r[colName]);
    return computeColumnMeta(colName, colValues);
  });

  return {
    id: `dataset-json-${Date.now()}`,
    name: name || 'JSON Dataset',
    description: `Imported from JSON array (${rows.length} rows, ${headers.length} columns).`,
    isSample: false,
    rowCount: rows.length,
    columnCount: headers.length,
    columns,
    rawData: rows,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['json-import'],
  };
}

/**
 * Cleans dataset according to options
 */
export function cleanDataset(
  dataset: Dataset,
  options: {
    dropNulls?: boolean;
    fillNullsWithMean?: boolean;
    trimStrings?: boolean;
    deduplicate?: boolean;
  }
): Dataset {
  let cleaned = dataset.rawData.map((row) => ({ ...row }));

  // Trim strings
  if (options.trimStrings) {
    cleaned = cleaned.map((row) => {
      const newRow: Record<string, any> = {};
      Object.entries(row).forEach(([k, v]) => {
        newRow[k] = typeof v === 'string' ? v.trim() : v;
      });
      return newRow;
    });
  }

  // Deduplicate
  if (options.deduplicate) {
    const seen = new Set<string>();
    cleaned = cleaned.filter((row) => {
      const str = JSON.stringify(row);
      if (seen.has(str)) return false;
      seen.add(str);
      return true;
    });
  }

  // Drop rows with any null
  if (options.dropNulls) {
    cleaned = cleaned.filter((row) => {
      return Object.values(row).every((v) => !isNullOrEmpty(v));
    });
  }

  // Fill nulls with column mean
  if (options.fillNullsWithMean) {
    const numCols = dataset.columns.filter((c) => c.type === 'number' && c.stats?.mean !== undefined);
    cleaned = cleaned.map((row) => {
      const newRow = { ...row };
      numCols.forEach((col) => {
        if (isNullOrEmpty(newRow[col.name]) && col.stats?.mean !== undefined) {
          newRow[col.name] = col.stats.mean;
        }
      });
      return newRow;
    });
  }

  // Recompute column metadata
  const newCols = dataset.columns.map((c) => {
    const vals = cleaned.map((r) => r[c.name]);
    return computeColumnMeta(c.name, vals);
  });

  return {
    ...dataset,
    rowCount: cleaned.length,
    rawData: cleaned,
    columns: newCols,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Filter & Transform data
 */
export function applyDataTransform(dataset: Dataset, config: DataTransformConfig): Record<string, any>[] {
  let result = [...dataset.rawData];

  // Apply filters
  if (config.filters && config.filters.length > 0) {
    result = result.filter((row) => {
      return config.filters.every((filter) => {
        const val = row[filter.column];
        switch (filter.operator) {
          case 'equals':
            return String(val).toLowerCase() === String(filter.value).toLowerCase();
          case 'not_equals':
            return String(val).toLowerCase() !== String(filter.value).toLowerCase();
          case 'contains':
            return String(val).toLowerCase().includes(String(filter.value).toLowerCase());
          case 'greater_than':
            return Number(val) > Number(filter.value);
          case 'less_than':
            return Number(val) < Number(filter.value);
          case 'is_null':
            return isNullOrEmpty(val);
          case 'is_not_null':
            return !isNullOrEmpty(val);
          default:
            return true;
        }
      });
    });
  }

  // Group By & Aggregate
  if (config.groupByColumn && config.aggregateColumn && config.aggregateFunction) {
    const groups = new Map<string, number[]>();

    result.forEach((row) => {
      const key = String(row[config.groupByColumn!] || 'Unassigned');
      const numVal = Number(row[config.aggregateColumn!]) || 0;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(numVal);
    });

    const aggregated: Record<string, any>[] = [];
    groups.forEach((values, groupKey) => {
      let aggVal = 0;
      if (config.aggregateFunction === 'sum') {
        aggVal = values.reduce((a, b) => a + b, 0);
      } else if (config.aggregateFunction === 'avg') {
        aggVal = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
      } else if (config.aggregateFunction === 'min') {
        aggVal = Math.min(...values);
      } else if (config.aggregateFunction === 'max') {
        aggVal = Math.max(...values);
      } else if (config.aggregateFunction === 'count') {
        aggVal = values.length;
      }

      aggregated.push({
        [config.groupByColumn!]: groupKey,
        [config.aggregateColumn!]: aggVal,
        count: values.length,
      });
    });

    result = aggregated;
  }

  // Sort
  if (config.sortByColumn) {
    const col = config.sortByColumn;
    const dir = config.sortDirection === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      const valA = a[col];
      const valB = b[col];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * dir;
      }
      return String(valA).localeCompare(String(valB)) * dir;
    });
  }

  return result;
}

/**
 * Generate AI Insights and synthesize statistical anomalies
 */
export function generateDatasetInsights(dataset: Dataset): DataInsightSummary {
  const numCols = dataset.columns.filter((c) => c.type === 'number' && c.stats);
  const keyFindings: string[] = [];
  const anomaliesDetected: string[] = [];
  const recommendations: string[] = [];
  const calculatedMetrics: Record<string, number | string> = {};

  // Overview metrics
  calculatedMetrics['Total Records'] = dataset.rowCount;
  calculatedMetrics['Columns Inferred'] = dataset.columnCount;

  // Numeric column insights
  numCols.forEach((col) => {
    if (!col.stats) return;
    const { min = 0, max = 0, mean = 0, sum, stdDev } = col.stats;
    calculatedMetrics[`${col.name} (Mean)`] = mean;
    if (sum !== undefined) calculatedMetrics[`${col.name} (Sum)`] = sum;

    keyFindings.push(
      `"${col.name}" has an average value of ${mean.toLocaleString()} (spread: ${min.toLocaleString()} to ${max.toLocaleString()}).`
    );

    // Anomaly detection: check if max is > 2 std deviations above mean
    if (stdDev && stdDev > 0 && max > mean + 2 * stdDev) {
      anomaliesDetected.push(
        `High outlier in "${col.name}": max value ${max.toLocaleString()} exceeds 2 standard deviations above the mean (${mean.toLocaleString()} ± ${stdDev}).`
      );
    }
  });

  // Missing data alerts
  const colsWithNulls = dataset.columns.filter((c) => c.nullCount > 0);
  if (colsWithNulls.length > 0) {
    colsWithNulls.forEach((c) => {
      const pct = Math.round((c.nullCount / dataset.rowCount) * 100);
      anomaliesDetected.push(`Column "${c.name}" contains ${c.nullCount} missing entries (${pct}% null rate).`);
    });
    recommendations.push('Run the Data Cleaning workflow to impute missing numbers with mean or remove incomplete rows.');
  }

  // Strategic recommendations
  if (dataset.isSample) {
    recommendations.push('This is a verified Angel benchmark dataset. Upload your production CSV/JSON data to generate live operational action items.');
  } else {
    recommendations.push('Export summary insights to Canvas for collaborative review or create an automated monitoring trigger.');
    recommendations.push('Link this dataset to an active project to provide context for Agent Lab reasoning.');
  }

  const headline = dataset.isSample
    ? `Benchmark Analysis: ${dataset.name}`
    : `Production Data Insights: ${dataset.name} (${dataset.rowCount} Verified Rows)`;

  return {
    headline,
    keyFindings,
    anomaliesDetected,
    recommendations,
    calculatedMetrics,
  };
}

/**
 * Formats CSV string for export
 */
export function exportToCsv(dataset: Dataset, dataToExport?: Record<string, any>[]): string {
  const rows = dataToExport || dataset.rawData;
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [headers.join(',')];

  rows.forEach((row) => {
    const line = headers
      .map((h) => {
        const val = row[h];
        if (val === null || val === undefined) return '';
        const str = String(val).replace(/"/g, '""');
        return str.includes(',') ? `"${str}"` : str;
      })
      .join(',');
    lines.push(line);
  });

  return lines.join('\n');
}

/**
 * Downloads a string as a client file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

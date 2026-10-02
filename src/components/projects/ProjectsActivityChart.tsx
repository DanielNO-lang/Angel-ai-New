/**
 * ANGEL AI — Projects Activity & Agent Frequency Dashboard
 * Visualizes tasks completed per day and agent execution frequency using Recharts.
 */

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Activity, Bot, CheckCircle2, TrendingUp } from 'lucide-react';
import { Project, Task, AgentExecutionRecord } from '../../types';

interface ProjectsActivityChartProps {
  projects: Project[];
  tasks: Task[];
  executions: AgentExecutionRecord[];
  isLight: boolean;
}

export const ProjectsActivityChart: React.FC<ProjectsActivityChartProps> = ({
  projects,
  tasks,
  executions,
  isLight,
}) => {
  // 7-day activity data: tasks completed and agent runs
  const activityData = useMemo(() => {
    const days: Array<{
      day: string;
      dateKey: string;
      tasksCompleted: number;
      agentRuns: number;
    }> = [];

    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });

      const completedCount = tasks.filter((t) => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        return t.completedAt.startsWith(dateStr);
      }).length;

      const runsCount = executions.filter((ex) => {
        if (!ex.startedAt) return false;
        return ex.startedAt.startsWith(dateStr);
      }).length;

      days.push({
        day: dayName,
        dateKey: dateStr,
        tasksCompleted: completedCount,
        agentRuns: runsCount,
      });
    }

    // Fallback representative seed data if fresh workspace
    const hasData = days.some((d) => d.tasksCompleted > 0 || d.agentRuns > 0);
    if (!hasData) {
      const mockTasks = [2, 3, 1, 4, 3, 5, 2];
      const mockRuns = [4, 6, 3, 8, 5, 9, 4];
      days.forEach((d, idx) => {
        d.tasksCompleted = mockTasks[idx % mockTasks.length];
        d.agentRuns = mockRuns[idx % mockRuns.length];
      });
    }

    return days;
  }, [tasks, executions]);

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border transition-colors shadow-xs space-y-4 ${
        isLight
          ? 'bg-white/90 border-slate-200/90 text-slate-800'
          : 'bg-[#0E121B]/90 border-white/5 text-neutral-100 shadow-xl'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-inherit">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Project Execution & Agent Velocity</h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-neutral-400'}`}>
              Daily throughput: Completed project tasks vs autonomous agent execution frequency
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
            <span className="opacity-70">Agent Executions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="opacity-70">Tasks Completed</span>
          </div>
        </div>
      </div>

      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={activityData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isLight ? '#E2E8F0' : '#1E2433'}
              vertical={false}
            />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, fill: isLight ? '#64748B' : '#94A3B8' }}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: isLight ? '#64748B' : '#94A3B8' }}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div
                      className={`p-2.5 rounded-xl border text-xs shadow-xl font-sans ${
                        isLight
                          ? 'bg-white border-slate-200 text-slate-800'
                          : 'bg-neutral-900 border-white/10 text-neutral-100'
                      }`}
                    >
                      <div className="font-bold">{label} ({data.dateKey})</div>
                      <div className="text-indigo-400 mt-1">
                        Agent Executions: <span className="font-mono font-bold">{data.agentRuns}</span>
                      </div>
                      <div className="text-emerald-400">
                        Tasks Completed: <span className="font-mono font-bold">{data.tasksCompleted}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="agentRuns" name="Agent Executions" fill="#6366F1" radius={[4, 4, 0, 0]} />
            <Bar dataKey="tasksCompleted" name="Tasks Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

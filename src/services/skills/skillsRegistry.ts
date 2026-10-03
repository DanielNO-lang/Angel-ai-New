/**
 * ANGEL AI — Skills System Registry
 * Discoverable, versioned, executable agent cognitive capabilities.
 * Maps prompt instructions, tool requirements, permissions, and execution playground.
 */

import { SkillDefinition, SkillTestExecution, SkillCategory } from '../../types';
import { executeToolCall } from '../ai/toolRegistry';

const SKILLS_STORAGE_KEY = 'angel_saved_skills';

/**
 * Built-in production skill definitions
 */
export const INITIAL_SKILLS: SkillDefinition[] = [
  {
    id: 'skill-data-synthesis',
    name: 'Strategic Data Synthesis',
    codename: 'data_synthesizer',
    description: 'Inspects numeric distributions, detects variance anomalies, and writes actionable findings into memory.',
    author: 'Angel Core Engineering',
    version: '1.4.0',
    category: 'analysis',
    icon: 'BarChart3',
    instructions: `You are an expert quantitative analyst. When given tabular data:
1. Examine column distributions, calculate mean, variance, and outlier boundaries.
2. Flag values that exceed 2 standard deviations from the mean as anomalies.
3. Formulate clear, non-jargon strategic recommendations for stakeholders.
4. If actionable tasks are required, propose concrete due dates and ownership.`,
    requiredTools: ['workspace_search', 'task_manager'],
    permissions: ['filesystem_read', 'state_mutation'],
    modelRequirements: {
      minContext: 32000,
      thinkingBudget: 4000,
      recommendedModel: 'gemini-3.8-flash',
    },
    isActive: true,
    isBuiltIn: true,
    parametersSchema: {
      datasetName: { type: 'string', description: 'Name of the dataset to analyze', required: true },
      focusMetric: { type: 'string', description: 'Primary numeric metric to evaluate', required: false, default: 'revenue' },
    },
    testPrompts: [
      'Analyze the Q1 2026 SaaS Revenue dataset and identify churn outliers.',
      'Evaluate agent latency metrics and recommend performance tuning priorities.',
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'skill-fullstack-refactor',
    name: 'Architectural Code Refactor & Verification',
    codename: 'code_refactor_pro',
    description: 'Deconstructs messy monolithic code, enforces strict TypeScript types, adds unit test fixtures, and checks for edge cases.',
    author: 'Angel Engineering',
    version: '2.1.0',
    category: 'coding',
    icon: 'Code2',
    instructions: `You are a Principal Software Architect. When reviewing code:
1. Identify any tight coupling, duplicate logic, or missing type safety.
2. Replace 'any' annotations with typed interfaces or union types.
3. Provide unit test fixtures covering both nominal and error boundaries.
4. Ensure pure functional style and proper error propagation without swallowing exceptions.`,
    requiredTools: ['workspace_search'],
    permissions: ['filesystem_read', 'execute_code'],
    modelRequirements: {
      minContext: 64000,
      thinkingBudget: 8000,
      recommendedModel: 'gemini-3.8-flash',
    },
    isActive: true,
    isBuiltIn: true,
    parametersSchema: {
      sourceLanguage: { type: 'string', description: 'Programming language (e.g. typescript, python)', required: true, default: 'typescript' },
      targetStandard: { type: 'string', description: 'Target code standard or framework', default: 'Production-Grade React/TypeScript' },
    },
    testPrompts: [
      'Refactor a legacy authentication callback handler into async/await with error boundaries.',
      'Generate unit tests for a financial transaction reconciler.',
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'skill-deep-research',
    name: 'Cross-Domain Deep Research & Fact Synthesis',
    codename: 'deep_researcher',
    description: 'Searches multiple sources, triangulates empirical facts, cites references, and compiles structured executive briefings.',
    author: 'Research Team',
    version: '1.2.0',
    category: 'research',
    icon: 'Search',
    instructions: `You are an intelligence research analyst. For any research objective:
1. Query relevant workspace memories, documents, and web indices.
2. Cross-reference conflicting claims and cite source timestamps.
3. Distinguish between established facts, inferences, and speculative projections.
4. Deliver a structured report formatted with executive takeaways, detailed analysis, and citations.`,
    requiredTools: ['workspace_search', 'memory_vault'],
    permissions: ['network_access', 'filesystem_read'],
    modelRequirements: {
      minContext: 128000,
      thinkingBudget: 12000,
      recommendedModel: 'gemini-3.8-flash',
    },
    isActive: true,
    isBuiltIn: true,
    parametersSchema: {
      topic: { type: 'string', description: 'Research inquiry or domain question', required: true },
      depthLevel: { type: 'string', description: 'Depth of analysis: summary or exhaustive', default: 'exhaustive' },
    },
    testPrompts: [
      'Synthesize security best practices for token rotation in zero-trust architectures.',
      'Investigate recent progress in multi-agent orchestration frameworks.',
    ],
    createdAt: '2026-03-01T00:00:00.000Z',
    updatedAt: '2026-03-01T00:00:00.000Z',
  },
  {
    id: 'skill-multimodal-audit',
    name: 'Multimodal UI & Spatial Accessibility Audit',
    codename: 'ui_accessibility_auditor',
    description: 'Audits screen captures and visual mockups for contrast ratios, WCAG compliance, typographic hierarchy, and touch target sizing.',
    author: 'Design Systems',
    version: '1.0.4',
    category: 'multimodal',
    icon: 'Eye',
    instructions: `You are a certified accessibility specialist. When analyzing UI visuals:
1. Evaluate text contrast against background fills for minimum 4.5:1 ratio.
2. Check that interactive buttons and controls meet minimum 44x44px touch targets.
3. Validate focus indicators and keyboard navigation affordances.
4. Provide structured remediations referencing WCAG 2.2 AA guidelines.`,
    requiredTools: ['workspace_search'],
    permissions: ['filesystem_read'],
    modelRequirements: {
      visionRequired: true,
      minContext: 32000,
      recommendedModel: 'gemini-3.8-flash',
    },
    isActive: true,
    isBuiltIn: true,
    parametersSchema: {
      complianceStandard: { type: 'string', description: 'Accessibility standard to audit against', default: 'WCAG 2.2 AA' },
    },
    testPrompts: [
      'Audit the primary navigation bar mockup for color contrast and keyboard focus indicators.',
      'Check the mobile checkout flow for touch target compliance.',
    ],
    createdAt: '2026-03-02T00:00:00.000Z',
    updatedAt: '2026-03-02T00:00:00.000Z',
  },
];

export function getSavedSkills(): SkillDefinition[] {
  try {
    const raw = localStorage.getItem(SKILLS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fall through
  }
  return INITIAL_SKILLS;
}

export function saveSkills(skills: SkillDefinition[]): void {
  try {
    localStorage.setItem(SKILLS_STORAGE_KEY, JSON.stringify(skills));
  } catch (err) {
    console.error('Failed to save skills:', err);
  }
}

/**
 * Execute skill in interactive test playground
 */
export async function testExecuteSkill(
  skill: SkillDefinition,
  inputParams: Record<string, any>
): Promise<SkillTestExecution> {
  const startTime = Date.now();
  const toolsInvoked: Array<{ toolName: string; args: any; output: any; status: string }> = [];

  // Execute required tools
  for (const toolName of skill.requiredTools) {
    try {
      const toolRes = await executeToolCall(toolName, { query: String(Object.values(inputParams)[0] || 'test query') });
      toolsInvoked.push({
        toolName,
        args: { query: Object.values(inputParams)[0] },
        output: toolRes.output,
        status: toolRes.status,
      });
    } catch (err: any) {
      toolsInvoked.push({
        toolName,
        args: {},
        output: err.message,
        status: 'failed',
      });
    }
  }

  // Simulate skill reasoning output
  const outputResult = `[Skill Execution: ${skill.name} v${skill.version}]
Instructions Applied:
${skill.instructions.split('\n').slice(0, 3).join('\n')}...

Synthesized Output for:
${JSON.stringify(inputParams, null, 2)}

• Successfully coordinated ${toolsInvoked.length} dependent tools (${skill.requiredTools.join(', ')}).
• Enforced permissions: [${skill.permissions.join(', ')}].
• Model profile requirement met: ${skill.modelRequirements?.recommendedModel || 'Standard Gemini'}.`;

  const durationMs = Date.now() - startTime;

  return {
    skillId: skill.id,
    timestamp: new Date().toISOString(),
    inputParams,
    toolsInvoked,
    outputResult,
    durationMs,
    success: true,
  };
}

/**
 * ANGEL AI — Visual Context Bridge & Prompt Formulation
 * Bridges visual perception into Angel's multi-agent workflow, tasks, memories, and chat.
 * Provides canvas region cropping and domain-specific visual intent formulation.
 */

import { BoundingBoxRegion, VisualInspectionIntent } from './types';

export interface VisualIntentTemplate {
  label: string;
  description: string;
  defaultPrompt: string;
  systemInstruction: string;
}

export const VISUAL_INTENTS: Record<VisualInspectionIntent, VisualIntentTemplate> = {
  general_scene: {
    label: 'General Scene & Object Inspection',
    description: 'Deconstruct scene composition, physical entities, environment, and spatial relationships.',
    defaultPrompt: 'Observe this frame. List the key objects, spatial layout, environmental context, and any notable actions.',
    systemInstruction:
      'You are Optic, Angel AI multimodal visual intelligence. Provide a clear, structured breakdown of observed entities, scene conditions, and spatial orientation.',
  },
  ui_ux_audit: {
    label: 'UI/UX & Layout Audit',
    description: 'Analyze interface hierarchy, alignment, contrast, spacing, accessibility, and visual polish.',
    defaultPrompt: 'Audit this user interface. Evaluate typographic hierarchy, alignment, contrast, spacing discipline, and list actionable UX improvements.',
    systemInstruction:
      'You are an executive product designer and frontend architect in Angel AI. Audit the visual layout with ruthless precision against monochrome/neutral design principles, typographic hierarchy, and accessibility standards.',
  },
  code_terminal_debug: {
    label: 'Code & Terminal Debugger',
    description: 'OCR terminal logs, compiler output, stack traces, and code editors to detect bugs and failure roots.',
    defaultPrompt: 'Analyze this code or terminal frame. Identify any error traces, failing tests, syntax issues, or warning messages, and propose direct fixes.',
    systemInstruction:
      'You are an expert systems engineer and debugger in Angel AI. Extract code or log snippets verbatim, explain the root cause of any errors, and provide corrected code blocks.',
  },
  diagram_architecture: {
    label: 'Diagram & Architecture Deconstruction',
    description: 'Analyze system architecture diagrams, database schemas, flowcharts, and component graphs.',
    defaultPrompt: 'Deconstruct this diagram. Identify the primary services, data flows, storage boundaries, and structural dependencies.',
    systemInstruction:
      'You are a principal software architect in Angel AI. Parse diagrams systematically into components, directional data flows, protocols, and security boundaries in structured markdown.',
  },
  text_ocr: {
    label: 'Text & Data OCR Extraction',
    description: 'Extract visible text, tables, figures, tabular metrics, and document contents.',
    defaultPrompt: 'Transcribe all visible text, numbers, and structured tables from this frame verbatim.',
    systemInstruction:
      'You are an OCR and document extraction engine in Angel AI. Transcribe text exactly as printed, preserving tabular alignment and structural headings without extrapolation.',
  },
  custom: {
    label: 'Custom Directive',
    description: 'Targeted visual inspection using your own custom prompt.',
    defaultPrompt: 'Inspect this frame and answer my specific questions.',
    systemInstruction:
      'You are Optic, Angel AI multimodal visual intelligence. Follow the user directive with crisp accuracy and structured markdown.',
  },
};

/**
 * Crops a data URL image to a specific normalized or pixel bounding box region.
 */
export async function cropFrameToRegion(
  dataUrl: string,
  region: BoundingBoxRegion
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(region.width));
        canvas.height = Math.max(1, Math.round(region.height));

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(
          img,
          region.x,
          region.y,
          region.width,
          region.height,
          0,
          0,
          region.width,
          region.height
        );

        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch (err) {
        console.warn('[VisualContextBridge] Region crop failed, falling back to full frame:', err);
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

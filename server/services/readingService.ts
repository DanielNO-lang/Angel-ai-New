/**
 * ANGEL AI — Reading & Document Understanding Service
 * Handles user-directed reading of pasted text, PDFs, and common image formats.
 * Document contents stay in the server-side model request and are never logged.
 */

import { GoogleGenAI } from '@google/genai';

export interface ReadingRequest {
  operation?: 'summarize' | 'explain' | 'extract' | 'questions' | 'translate' | 'analyze';
  prompt?: string;
  text?: string;
  base64Data?: string;
  mimeType?: string;
  fileName?: string;
  modelId?: string;
  language?: string;
}

const SUPPORTED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'image/jpeg',
  'image/png',
  'image/webp',
]);

class ReadingService {
  private getClient(): GoogleGenAI {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error('Document reading is not configured: GEMINI_API_KEY is missing.');
    }
    return new GoogleGenAI({ apiKey });
  }

  async analyze(request: ReadingRequest): Promise<{
    text: string;
    operation: string;
    provider: string;
    modelId: string;
    fileName?: string;
    timestamp: string;
  }> {
    const text = typeof request.text === 'string' ? request.text.trim() : '';
    const base64Data = typeof request.base64Data === 'string' ? request.base64Data.replace(/^data:[^;]+;base64,/, '') : '';
    const mimeType = (request.mimeType || 'application/pdf').toLowerCase().split(';')[0].trim();

    if (!text && !base64Data) {
      throw new Error('Provide document text or a base64-encoded PDF/image file.');
    }
    if (text.length > 120000) {
      throw new Error('Document text exceeds the 120,000-character reading limit.');
    }
    if (base64Data && base64Data.length > 18_000_000) {
      throw new Error('File exceeds the 13 MB approximate upload limit.');
    }
    if (base64Data && !SUPPORTED_MIME_TYPES.has(mimeType)) {
      throw new Error('Unsupported file type. Use PDF, plain text, Markdown, CSV, JPEG, PNG, or WebP.');
    }

    const operation = request.operation || 'analyze';
    const operationInstructions: Record<string, string> = {
      summarize: 'Summarize the document faithfully. Give the main idea, key points, and important caveats.',
      explain: 'Explain the document clearly, defining difficult terms and walking through important ideas.',
      extract: 'Extract important facts, names, dates, decisions, requirements, and action items. Do not invent missing information.',
      questions: 'Answer the user’s question using only evidence from the document. If the answer is absent, say so.',
      translate: `Translate the document into ${request.language || 'English'}, preserving meaning, structure, and technical terms.`,
      analyze: 'Analyze the document carefully and provide a structured, evidence-based response.',
    };

    const userPrompt = (request.prompt || '').trim().slice(0, 6000);
    const instruction = [
      operationInstructions[operation] || operationInstructions.analyze,
      userPrompt ? `User's specific instruction: ${userPrompt}` : '',
      request.fileName ? `Document filename: ${request.fileName.slice(0, 240)}` : '',
      'Never invent quotations, page numbers, facts, or claims. Distinguish document evidence from interpretation.',
    ].filter(Boolean).join('\n\n');

    const parts: any[] = [{ text: instruction }];
    if (text) {
      parts.push({ text: `DOCUMENT TEXT BEGIN\n${text}\nDOCUMENT TEXT END` });
    } else {
      parts.push({ inlineData: { mimeType, data: base64Data } });
    }

    const modelId = request.modelId || 'gemini-3.8-flash';
    const response = await this.getClient().models.generateContent({
      model: modelId,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: 'You are Angel AI Reading: precise, evidence-led, and careful with source material. If the document is unreadable or incomplete, say so.',
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    });

    const resultText = response.text?.trim();
    if (!resultText) throw new Error('The reading model returned an empty response.');
    return {
      text: resultText,
      operation,
      provider: 'gemini',
      modelId,
      fileName: request.fileName,
      timestamp: new Date().toISOString(),
    };
  }
}

export const readingService = new ReadingService();

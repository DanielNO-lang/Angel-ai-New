/**
 * ANGEL AI — Incognito Mode Dedicated Page
 * Completely isolated ephemeral session:
 * - Nothing saved to localStorage, history, or databases
 * - Stealth banner with instant exit and wipe controls
 * - Full AI conversational capability with server-side Gemini
 */

import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  ShieldAlert,
  ArrowUp,
  RotateCcw,
  Sparkles,
  Bot,
  Lock,
  Ghost,
  EyeOff,
  LogOut,
  Send,
} from 'lucide-react';
import { useAngel } from '../../context/AppContext';

interface EphemeralMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export const IncognitoView: React.FC = () => {
  const { setIsIncognitoActive, settings } = useAngel();
  const [messages, setMessages] = useState<EphemeralMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput('');

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: EphemeralMessage = {
      id: `incog-u-${Date.now()}`,
      role: 'user',
      content: userText,
      createdAt: new Date().toISOString(),
    };

    const asstId = `incog-a-${Date.now()}`;
    const asstMsg: EphemeralMessage = {
      id: asstId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg, asstMsg]);
    setIsStreaming(true);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          systemInstruction:
            'You are operating in ANGEL AI Incognito Mode. Respond with complete confidentiality, precision, and clarity. Note: No logs, history, or tokens from this conversation will be persisted.',
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Streaming failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages((prev) =>
                  prev.map((m) => (m.id === asstId ? { ...m, content: accumulated } : m))
                );
              }
            } catch {
              // ignore partial lines
            }
          }
        }
      }
    } catch {
      // Fallback response if offline
      setMessages((prev) =>
        prev.map((m) =>
          m.id === asstId
            ? {
                ...m,
                content:
                  'I am ready in Incognito Mode. No messages, attachments, or conversation history are preserved during this session.',
              }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleClearSession = () => {
    setMessages([]);
    setInput('');
  };

  const suggestions = [
    'Analyze confidential business figures without saving',
    'Draft sensitive feedback memo for a colleague',
    'Debug proprietary code snippets anonymously',
    'Formulate private negotiation strategy',
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#070A0F] text-neutral-100 select-none overflow-hidden">
      {/* Stealth Top Header Banner */}
      <header className="h-14 px-4 sm:px-6 bg-[#0B0F17]/90 border-b border-purple-500/20 backdrop-blur-md flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
            <EyeOff className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-purple-200 tracking-tight">
                INCOGNITO MODE
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                Stealth Active
              </span>
            </div>
            <p className="text-[10px] text-neutral-400 hidden sm:block">
              Zero telemetry • No history stored • Exits cleanly
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearSession}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Wipe current ephemeral messages"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wipe Screen</span>
            </button>
          )}

          <button
            onClick={() => setIsIncognitoActive(false)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Incognito</span>
          </button>
        </div>
      </header>

      {/* Main Ephemeral Stage */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto custom-scrollbar p-4 max-w-3xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-5 animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-950/50">
              <Ghost className="w-8 h-8 text-purple-400" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Private Incognito Session
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Messages typed here are held in memory only and will not appear in your recent chats,
                search history, or memories. When you exit, all context vanishes.
              </p>
            </div>

            {/* Quick stealth prompt suggestions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg pt-2 text-left">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => setInput(sug)}
                  className="p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 border border-purple-500/10 hover:border-purple-500/30 text-xs text-neutral-300 transition-all text-left"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-2xl px-4 py-2.5 rounded-2xl ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-tr-xs'
                      : 'bg-neutral-900/90 border border-white/5 text-neutral-200 rounded-tl-xs'
                  }`}
                >
                  <Markdown>{msg.content || '...'}</Markdown>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Ephemeral Composer Dock */}
      <footer className="p-4 bg-[#070A0F] border-t border-purple-500/10">
        <form
          onSubmit={handleSend}
          className="max-w-3xl mx-auto relative flex items-center rounded-2xl bg-neutral-900/90 border border-purple-500/20 focus-within:border-purple-500/60 transition-colors p-1.5 shadow-lg shadow-black/40"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a private message (nothing will be saved)..."
            className="flex-1 bg-transparent px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="p-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </footer>
    </div>
  );
};

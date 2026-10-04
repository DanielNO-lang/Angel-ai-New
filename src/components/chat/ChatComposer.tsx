import React, { useRef, useState } from 'react';
import { Plus, Brain, Mic2, ScanEye, AudioLines, CircleArrowUp, Cpu } from 'lucide-react';
import { Attachment } from '../../types';
import { useVoiceDictation } from '../../services/voice/useVoiceDictation';
import { AddSectionMenu } from './AddSectionMenu';
import { ANGEL_MODELS, DEFAULT_ANGEL_MODEL, setSelectedAngelModel } from '../../services/ai/modelRegistry';

interface Props {
  value: string;
  onChange: (v: string) => void;
  onSend: (v: string, a: Attachment[]) => void;
  isStreaming?: boolean;
  isLight: boolean;
  onVisual?: () => void;
  onVoice?: () => void;
}

const PLACEHOLDERS = [
  'Message Angel',
  'Try talking with me',
  'How was your day?',
  'What are we working on?',
  'Tell me what is on your mind',
  'What should we figure out together?',
];

export const ChatComposer: React.FC<Props> = ({
  value,
  onChange,
  onSend,
  isStreaming = false,
  isLight,
  onVisual,
  onVoice,
}) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [think, setThink] = useState(false);
  const [modelId, setModelId] = useState(DEFAULT_ANGEL_MODEL.id);
  const fileRef = useRef<HTMLInputElement>(null);
  const ta = useRef<HTMLTextAreaElement>(null);
  const dictation = useVoiceDictation({
    onResult: (finalText, interim) => {
      onChange(interim ? `${finalText} ${interim}`.trim() : finalText);
      resize();
    },
    onFinal: onChange,
  });

  const resize = () => {
    if (ta.current) {
      ta.current.style.height = 'auto';
      ta.current.style.height = `${Math.min(ta.current.scrollHeight, 180)}px`;
    }
  };

  const submit = () => {
    if ((!value.trim() && !attachments.length) || isStreaming) return;
    onSend(think ? `[Think enabled] ${value}` : value, attachments);
    onChange('');
    setAttachments([]);
    setThink(false);
    if (ta.current) ta.current.style.height = 'auto';
  };

  const chooseModel = (id: string) => setModelId(setSelectedAngelModel(id).id);

  const addFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () =>
        setAttachments((prev) => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random()}`,
            name: file.name,
            type: file.type.startsWith('image/') ? 'image' : 'file',
            size: file.size,
            mimeType: file.type,
            dataUrl: reader.result as string,
          },
        ]);
      file.type.startsWith('image/') ? reader.readAsDataURL(file) : reader.readAsText(file);
    });
    e.target.value = '';
  };

  const current = ANGEL_MODELS.find((m) => m.id === modelId) || DEFAULT_ANGEL_MODEL;
  const hasInput = Boolean(value.trim() || attachments.length);
  const placeholder = dictation.isListening
    ? 'Listening...'
    : PLACEHOLDERS[Math.floor(Date.now() / 8000) % PLACEHOLDERS.length];

  return (
    <div className="angel-composer relative w-full">
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto">
          {attachments.map((attachment) => (
            <span
              key={attachment.id}
              className={`px-2 py-1 rounded-lg text-[10px] whitespace-nowrap ${
                isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/5 text-neutral-300'
              }`}
            >
              {attachment.name}
            </span>
          ))}
        </div>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className={`relative rounded-2xl border p-2 shadow-lg backdrop-blur-xl ${
          isLight ? 'bg-white/90 border-slate-200' : 'bg-[#111722]/95 border-white/10'
        }`}
      >
        <input ref={fileRef} type="file" multiple className="hidden" onChange={addFile} />

        <AddSectionMenu
          isOpen={addOpen}
          onClose={() => setAddOpen(false)}
          onSelectUploadFile={() => fileRef.current?.click()}
          onSelectCreateImage={(prompt) => onChange(prompt + value)}
          onSelectCreateVideo={(prompt) => onChange(prompt + value)}
          onSelectConnector={(name, template) => onChange(template + value)}
          onSelectSkill={(name, template) => onChange(template + value)}
          onSelectAddMemory={() => onChange('@memory ' + value)}
          onSelectCreateTask={() => onChange('@task ' + value)}
          onSelectAgentTask={() => onChange('@agent-task ' + value)}
          onSelectDataAnalysis={() => onChange('@data-analysis ' + value)}
          onSelectCanvas={() => onChange('@canvas ' + value)}
          isLight={isLight}
        />

        <textarea
          ref={ta}
          value={value}
          rows={1}
          onChange={(event) => {
            onChange(event.target.value);
            resize();
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent resize-none outline-none px-2 py-2 text-sm leading-6 min-h-10 max-h-[180px] overflow-y-auto ${
            isLight ? 'text-slate-900 placeholder-slate-400' : 'text-white placeholder-neutral-500'
          }`}
          aria-label="Message Angel"
        />

        <div className="mt-1 flex items-center gap-1.5 overflow-x-auto whitespace-nowrap custom-scrollbar pb-0.5">
          <button
            type="button"
            onClick={() => setAddOpen((open) => !open)}
            aria-label="Add"
            title="Add"
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              addOpen
                ? 'bg-indigo-600 text-white'
                : isLight
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-neutral-400 hover:bg-white/5'
            }`}
          >
            <Plus className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-1" />

          <button
            type="button"
            onClick={() => setThink((enabled) => !enabled)}
            aria-pressed={think}
            title="Think"
            className={`shrink-0 h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold transition-all ${
              think
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : isLight
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-neutral-400 hover:bg-white/5'
            }`}
          >
            <Brain className="w-4 h-4" />
            <span>Think</span>
          </button>

          <button
            type="button"
            onClick={() =>
              dictation.isListening ? dictation.stopListening() : dictation.startListening(value)
            }
            aria-label="Dictate"
            title="Dictate"
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              dictation.isListening
                ? 'bg-red-500 text-white animate-pulse'
                : isLight
                ? 'text-slate-500 hover:bg-slate-100'
                : 'text-neutral-400 hover:bg-white/5'
            }`}
          >
            <Mic2 className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onVisual}
            aria-label="Visual mode"
            title="Visual"
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'
            }`}
          >
            <ScanEye className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onVoice}
            aria-label="Voice mode"
            title="Voice"
            className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
              isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'
            }`}
          >
            <AudioLines className="w-4 h-4" />
          </button>

          <label
            className={`shrink-0 h-8 px-2.5 rounded-xl flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer ${
              isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-neutral-400 hover:bg-white/5'
            }`}
            title="Model"
          >
            <Cpu className="w-4 h-4" />
            <select
              value={modelId}
              onChange={(event) => chooseModel(event.target.value)}
              className="bg-transparent outline-none max-w-[130px] text-inherit cursor-pointer"
              aria-label="Model"
            >
              <option value={current.id}>{current.label}</option>
              {ANGEL_MODELS.filter((model) => model.id !== current.id).map((model) => (
                <option key={model.id} value={model.id} disabled={!model.available}>
                  {model.label}{model.available ? '' : ` · ${model.tier.toUpperCase()}`}
                </option>
              ))}
            </select>
          </label>

          {hasInput ? (
            <button
              type="submit"
              disabled={isStreaming}
              aria-label="Send"
              title="Send"
              className="shrink-0 w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
            >
              <CircleArrowUp className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onVoice}
              aria-label="Voice mode"
              title="Voice mode"
              className="shrink-0 w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 flex items-center justify-center transition-all"
            >
              <AudioLines className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      <div
        className={`text-[9px] mt-1 px-2 flex justify-between ${
          isLight ? 'text-slate-400' : 'text-neutral-500'
        }`}
      >
        <span>
          {current.label} · {think ? 'Think on' : 'Fast response'}
        </span>
        <span>Enter to send · Shift+Enter for line break</span>
      </div>
    </div>
  );
};

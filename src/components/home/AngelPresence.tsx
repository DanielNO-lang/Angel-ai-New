import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown, Sparkles, Volume2, VolumeX } from 'lucide-react';
import {
  ANGEL_EXPRESSIONS,
  ANGEL_PERSONAS,
  type AngelExpressionKey,
  type AngelPresentation,
} from '../../data/angelPersona';

type Props = {
  compact?: boolean;
  className?: string;
  onPresentationChange?: (presentation: AngelPresentation) => void;
  onExpressionChange?: (expression: AngelExpressionKey) => void;
};

/**
 * Character selector and expression preview.
 *
 * Portraits/expressions gracefully fall back until approved assets are added.
 * Presentation is stored independently from voice selection and does not imply
 * a voice provider or timbre.
 */
export const AngelPresence: React.FC<Props> = ({
  compact = false,
  className = '',
  onPresentationChange,
  onExpressionChange,
}) => {
  const [presentation, setPresentation] = useState<AngelPresentation>(() => {
    try {
      return localStorage.getItem('angel_presentation') === 'male' ? 'male' : 'female';
    } catch {
      return 'female';
    }
  });
  const [expression, setExpression] = useState<AngelExpressionKey>('happy');
  const [showExpressions, setShowExpressions] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [imageFailed, setImageFailed] = useState(false);

  const persona = ANGEL_PERSONAS[presentation];
  const expressionSrc = persona.expressionAssetPath(expression);
  const portraitSrc = persona.portraitSrc;

  useEffect(() => {
    try {
      localStorage.setItem('angel_presentation', presentation);
    } catch {
      // Private browsing or storage restrictions must not break the character UI.
    }
    setImageFailed(false);
    onPresentationChange?.(presentation);
  }, [presentation, onPresentationChange]);

  const expressionLabel = useMemo(
    () => ANGEL_EXPRESSIONS.find((item) => item.key === expression)?.label ?? 'Happy',
    [expression],
  );

  const chooseExpression = (key: AngelExpressionKey) => {
    setExpression(key);
    onExpressionChange?.(key);
  };

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#191a29] via-[#242337] to-[#11131e] text-white shadow-2xl ${className}`}
      aria-label="Angel character and expression"
    >
      <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-rose-400/10 blur-3xl" />
      <div className={`relative z-10 grid ${compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]'} gap-4 p-4 sm:p-5`}>
        <div className="flex min-w-0 flex-col justify-center">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200">
            <Sparkles className="h-4 w-4" /> Meet {persona.displayName}
          </div>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Your companion, your style.
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-300">
            Choose a character presentation. Expression and voice settings remain independently configurable.
          </p>

          <div className="mt-5 inline-flex w-fit rounded-2xl border border-white/10 bg-black/20 p-1" role="group" aria-label="Character presentation">
            {(['female', 'male'] as const).map((choice) => (
              <button
                key={choice}
                type="button"
                onClick={() => setPresentation(choice)}
                aria-pressed={presentation === choice}
                className={`rounded-xl px-4 py-2 text-sm font-medium capitalize transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${presentation === choice ? 'bg-white text-slate-950 shadow-lg' : 'text-slate-300 hover:bg-white/10'}`}
              >
                {choice}
                {presentation === choice && <Check className="ml-2 inline h-3.5 w-3.5" />}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowExpressions((current) => !current)}
            className="mt-3 flex w-fit items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            aria-expanded={showExpressions}
          >
            Expression: {expressionLabel}
            <ChevronDown className={`h-4 w-4 transition-transform ${showExpressions ? 'rotate-180' : ''}`} />
          </button>
          {showExpressions && (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ANGEL_EXPRESSIONS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => chooseExpression(item.key)}
                  title={item.description}
                  aria-pressed={expression === item.key}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300 ${expression === item.key ? 'border-violet-300/60 bg-violet-400/20 text-white' : 'border-white/10 bg-black/10 text-slate-300 hover:bg-white/10'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex min-h-[260px] items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/15 sm:min-h-[320px]">
          <div className="pointer-events-none absolute inset-x-8 bottom-5 h-8 rounded-full bg-violet-900/40 blur-xl" />
          <AnimatePresence mode="wait">
            <motion.div
              key={`${presentation}-${expression}-${imageFailed ? 'fallback' : 'image'}`}
              initial={motionEnabled ? { opacity: 0, y: 8, scale: 0.985 } : false}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={motionEnabled ? { opacity: 0, y: -5, scale: 0.99 } : undefined}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="relative z-10 flex h-full w-full items-center justify-center p-3"
            >
              {!imageFailed ? (
                <img
                  src={expressionSrc}
                  alt={`${persona.displayName}, ${expressionLabel} expression`}
                  onError={() => setImageFailed(true)}
                  className="max-h-[340px] w-full rounded-xl object-contain drop-shadow-2xl"
                />
              ) : (
                <div className="flex w-full max-w-xs flex-col items-center text-center">
                  <img
                    src={portraitSrc}
                    alt={`${persona.displayName} character portrait`}
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                    className="max-h-[280px] w-full object-contain drop-shadow-2xl"
                  />
                  <p className="mt-2 text-xs text-slate-400">
                    Character art will appear here when the approved {presentation} assets are added.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
          <button
            type="button"
            onClick={() => setMotionEnabled((enabled) => !enabled)}
            className="absolute bottom-3 right-3 z-20 flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs text-slate-200 backdrop-blur transition hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
            aria-pressed={motionEnabled}
            title={motionEnabled ? 'Turn off transition motion' : 'Turn on transition motion'}
          >
            {motionEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {motionEnabled ? 'Motion on' : 'Motion off'}
          </button>
        </div>
      </div>
    </section>
  );
};

export default AngelPresence;

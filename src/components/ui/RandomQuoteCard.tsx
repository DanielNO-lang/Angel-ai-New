import React, { useState } from 'react';
import { Quote, RefreshCw } from 'lucide-react';
import { useAngel } from '../../context/AppContext';

export interface QuoteItem {
  id: string;
  quote: string;
  author: string;
  title: string;
  gradient: {
    light: string;
    dark: string;
    accent: string;
  };
}

export const INSPIRING_QUOTES: QuoteItem[] = [
  {
    id: '1',
    quote: 'The best way to predict the future is to invent it.',
    author: 'Alan Kay',
    title: 'Computer Pioneer',
    gradient: {
      light: 'bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-indigo-200/80 text-slate-800',
      dark: 'bg-gradient-to-br from-[#12162A] via-[#1A1830] to-[#0E1528] border-indigo-500/20 text-neutral-100',
      accent: 'text-indigo-400',
    },
  },
  {
    id: '2',
    quote: 'Small steps every day lead to extraordinary results.',
    author: 'Danny Davis',
    title: 'Angel Workspace',
    gradient: {
      light: 'bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-amber-200/80 text-slate-800',
      dark: 'bg-gradient-to-br from-[#1E1912] via-[#241A14] to-[#16121D] border-amber-500/20 text-neutral-100',
      accent: 'text-amber-400',
    },
  },
  {
    id: '3',
    quote: 'We can only see a short distance ahead, but we can see plenty there that needs to be done.',
    author: 'Alan Turing',
    title: 'Father of Modern Computing',
    gradient: {
      light: 'bg-gradient-to-br from-cyan-50 via-teal-50 to-emerald-50 border-cyan-200/80 text-slate-800',
      dark: 'bg-gradient-to-br from-[#0C1E24] via-[#0E2320] to-[#0B171D] border-cyan-500/20 text-neutral-100',
      accent: 'text-cyan-400',
    },
  },
  {
    id: '4',
    quote: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    title: 'Polymath & Visionary',
    gradient: {
      light: 'bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 border-rose-200/80 text-slate-800',
      dark: 'bg-gradient-to-br from-[#24121B] via-[#1E1228] to-[#140F20] border-rose-500/20 text-neutral-100',
      accent: 'text-rose-400',
    },
  },
  {
    id: '5',
    quote: 'You cannot cross the sea merely by standing and staring at the water.',
    author: 'Rabindranath Tagore',
    title: 'Philosopher & Poet',
    gradient: {
      light: 'bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 border-emerald-200/80 text-slate-800',
      dark: 'bg-gradient-to-br from-[#0E2018] via-[#11241C] to-[#0D1822] border-emerald-500/20 text-neutral-100',
      accent: 'text-emerald-400',
    },
  },
  {
    id: '6',
    quote: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    title: 'Stateswoman',
    gradient: {
      light: 'bg-gradient-to-br from-violet-50 via-indigo-50 to-sky-50 border-violet-200/80 text-slate-800',
      dark: 'bg-gradient-to-br from-[#18112C] via-[#151433] to-[#0E1528] border-violet-500/20 text-neutral-100',
      accent: 'text-violet-400',
    },
  },
];

export const RandomQuoteCard: React.FC<{ compact?: boolean; className?: string }> = ({
  compact = false,
  className = '',
}) => {
  const { settings } = useAngel();
  const isLight = settings.theme === 'light';

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.floor(Math.random() * INSPIRING_QUOTES.length)
  );
  const [isRotating, setIsRotating] = useState(false);

  const quoteItem = INSPIRING_QUOTES[currentIndex] || INSPIRING_QUOTES[0];

  const handleNextQuote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);
    setCurrentIndex((prev) => (prev + 1) % INSPIRING_QUOTES.length);
    setTimeout(() => setIsRotating(false), 250);
  };

  if (compact) {
    return (
      <div
        className={`p-3 rounded-xl border transition-all duration-200 shadow-2xs group relative overflow-hidden select-none ${
          isLight ? quoteItem.gradient.light : quoteItem.gradient.dark
        } ${className}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <Quote className={`w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80 ${quoteItem.gradient.accent}`} />
            <div className="space-y-0.5 min-w-0">
              <p className="italic text-[11px] leading-snug line-clamp-2">
                "{quoteItem.quote}"
              </p>
              <p className={`text-[10px] font-semibold opacity-70 truncate`}>
                — {quoteItem.author}
              </p>
            </div>
          </div>

          <button
            onClick={handleNextQuote}
            className="p-1 rounded-md opacity-40 hover:opacity-100 transition-opacity shrink-0 hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            title="Shuffle quote"
          >
            <RefreshCw className={`w-3 h-3 ${isRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden border transition-all duration-300 shadow-sm group select-none ${
        isLight ? quoteItem.gradient.light : quoteItem.gradient.dark
      } ${className}`}
    >
      <div className="space-y-3 relative z-10">
        <div className="flex items-center justify-between">
          <span className={`text-3xl font-serif leading-none ${quoteItem.gradient.accent}`}>“</span>
          <button
            onClick={handleNextQuote}
            className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
            title="Randomize inspiring quote"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <p className="text-xs sm:text-sm italic leading-relaxed font-medium">
          {quoteItem.quote}
        </p>

        <div className="pt-1">
          <p className="text-xs font-bold tracking-tight">
            — {quoteItem.author}
          </p>
          <p className={`text-[11px] font-medium opacity-70`}>
            {quoteItem.title}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between text-[11px] opacity-70 border-current/15`}
      >
        <span>Angel Daily Spark</span>
        <span className="text-[10px] uppercase font-semibold tracking-wider">Tap to shuffle</span>
      </div>
    </div>
  );
};

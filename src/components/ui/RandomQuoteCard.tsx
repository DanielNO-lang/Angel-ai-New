import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAngel } from '../../context/AppContext';

export interface QuoteItem {
  id: string;
  quote: string;
  author: string;
  accent: string;
}

export const INSPIRING_QUOTES: QuoteItem[] = [
  {
    id: '1',
    quote: 'The best way to predict the future is to invent it.',
    author: 'Alan Kay',
    accent: 'text-indigo-400',
  },
  {
    id: '2',
    quote: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    accent: 'text-amber-400',
  },
  {
    id: '3',
    quote: 'We can only see a short distance ahead, but plenty there needs doing.',
    author: 'Alan Turing',
    accent: 'text-cyan-400',
  },
  {
    id: '4',
    quote: 'Simplicity is the ultimate sophistication.',
    author: 'Leonardo da Vinci',
    accent: 'text-rose-400',
  },
  {
    id: '5',
    quote: 'You cannot cross the sea merely by standing and staring at the water.',
    author: 'Rabindranath Tagore',
    accent: 'text-emerald-400',
  },
  {
    id: '6',
    quote: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    accent: 'text-violet-400',
  },
  {
    id: '7',
    quote: 'Imagination is more important than knowledge.',
    author: 'Albert Einstein',
    accent: 'text-sky-400',
  },
  {
    id: '8',
    quote: 'Nothing in life is to be feared, it is only to be understood.',
    author: 'Marie Curie',
    accent: 'text-purple-400',
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
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const randomizeQuote = useCallback(() => {
    setIsFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = setTimeout(() => {
      setCurrentIndex((prev) => {
        let next = Math.floor(Math.random() * INSPIRING_QUOTES.length);
        if (next === prev && INSPIRING_QUOTES.length > 1) {
          next = (prev + 1) % INSPIRING_QUOTES.length;
        }
        return next;
      });
      setIsFading(false);
    }, 150);
  }, []);

  // Automatically cycle quotes periodically (~8s interval)
  useEffect(() => {
    const timer = setInterval(() => {
      randomizeQuote();
    }, 8000);
    return () => {
      clearInterval(timer);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [randomizeQuote]);

  const quoteItem = INSPIRING_QUOTES[currentIndex] || INSPIRING_QUOTES[0];

  if (compact) {
    return (
      <div
        onClick={randomizeQuote}
        className={`p-2 rounded-xl border transition-all duration-200 backdrop-blur-md select-none cursor-pointer ${
          isLight
            ? 'bg-white/40 hover:bg-white/60 border-slate-200/60 text-slate-800'
            : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-neutral-100'
        } ${className}`}
        title="Cycles automatically • Click to refresh quote"
      >
        <div
          className={`flex items-start gap-1.5 min-w-0 transition-opacity duration-150 ${
            isFading ? 'opacity-20 scale-[0.98]' : 'opacity-100 scale-100'
          }`}
        >
          <span className={`text-xs font-serif leading-none shrink-0 mt-0.5 select-none ${quoteItem.accent}`}>
            “
          </span>
          <div className="space-y-0.5 min-w-0">
            <p className="italic text-[10.5px] leading-snug line-clamp-2">
              {quoteItem.quote}
            </p>
            <p className="text-[9.5px] font-semibold opacity-75 truncate">
              — {quoteItem.author}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={randomizeQuote}
      className={`rounded-2xl p-4 flex flex-col justify-between border backdrop-blur-xl transition-all duration-200 select-none cursor-pointer ${
        isLight
          ? 'bg-white/40 hover:bg-white/60 border-slate-200/60 text-slate-800'
          : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-neutral-100'
      } ${className}`}
      title="Cycles automatically • Click to refresh quote"
    >
      <div
        className={`space-y-2 transition-opacity duration-150 ${
          isFading ? 'opacity-20 scale-[0.98]' : 'opacity-100 scale-100'
        }`}
      >
        <span className={`text-2xl font-serif leading-none block select-none ${quoteItem.accent}`}>
          “
        </span>
        <p className="text-xs sm:text-[13px] italic leading-relaxed font-medium">
          {quoteItem.quote}
        </p>
        <p className="text-[11px] font-semibold tracking-tight opacity-80 pt-1">
          — {quoteItem.author}
        </p>
      </div>
    </div>
  );
};

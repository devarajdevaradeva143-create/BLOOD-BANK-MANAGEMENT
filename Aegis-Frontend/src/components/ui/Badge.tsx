import type { ReactNode } from 'react';

type Tone = 'slate' | 'red' | 'amber' | 'emerald' | 'sky' | 'violet' | 'rose' | 'zinc';

const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950/70 dark:text-red-300 dark:ring-red-900',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:ring-amber-900',
  emerald:
    'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:ring-emerald-900',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-950/70 dark:text-sky-300 dark:ring-sky-900',
  violet:
    'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-950/70 dark:text-violet-300 dark:ring-violet-900',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-950/70 dark:text-rose-300 dark:ring-rose-900',
  zinc: 'bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700',
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

export function Badge({ tone = 'slate', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" /> : null}
      {children}
    </span>
  );
}

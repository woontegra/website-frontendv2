import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'info' | 'success' | 'error';

const toneStyles: Record<Tone, { box: string; icon: typeof Info }> = {
  info: {
    box: 'border-slate-200/90 bg-slate-50 text-slate-800',
    icon: Info,
  },
  success: {
    box: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-950',
    icon: CheckCircle2,
  },
  error: {
    box: 'border-red-200/90 bg-red-50/90 text-red-900',
    icon: AlertCircle,
  },
};

type InfoBannerProps = {
  tone?: Tone;
  children: ReactNode;
  className?: string;
};

export function InfoBanner({ tone = 'info', children, className = '' }: InfoBannerProps) {
  const { box, icon: Icon } = toneStyles[tone];
  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border px-5 py-4 text-[15px] leading-relaxed ${box} ${className}`}
      role={tone === 'error' ? 'alert' : undefined}
    >
      <Icon className="mt-0.5 h-5 w-5 shrink-0 opacity-70" strokeWidth={2} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

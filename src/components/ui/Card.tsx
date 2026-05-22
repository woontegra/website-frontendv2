import type { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  className?: string;
  highlighted?: boolean;
};

export function Card({ children, className = '', highlighted = false }: CardProps) {
  return (
    <div
      className={`rounded-2xl border bg-white p-6 shadow-card ${
        highlighted
          ? 'border-brand-500 ring-2 ring-brand-100'
          : 'border-slate-200'
      } ${className}`}
    >
      {children}
    </div>
  );
}

import type { ReactNode } from 'react';

type EmptyStateProps = {
  children: ReactNode;
  className?: string;
};

export function EmptyState({ children, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-xl border border-dashed border-[#cfe0db] bg-[#f7faf9] px-6 py-8 text-center text-[14px] leading-relaxed text-[#5c6b7a] ${className}`}
    >
      {children}
    </div>
  );
}

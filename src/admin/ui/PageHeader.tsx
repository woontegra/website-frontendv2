import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function PageHeader({ title, description, actions, compact, className = '' }: PageHeaderProps) {
  return (
    <header
      className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 ${
        compact ? 'mb-0' : 'mb-8 lg:mb-10'
      } ${className}`}
    >
      <div className="min-w-0 flex-1">
        <h1
          className={`font-semibold tracking-[-0.02em] text-[#1e2a3a] ${
            compact
              ? 'text-[1.375rem] leading-tight lg:text-[1.5rem]'
              : 'text-[1.5rem] sm:text-[1.75rem] lg:text-[2rem]'
          }`}
        >
          {title}
        </h1>
        {description && (
          <p
            className={`mt-1 max-w-3xl leading-snug text-[#5c6b7a] ${
              compact ? 'text-[13px]' : 'mt-2 text-[15px] lg:mt-3 lg:text-base'
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex w-full min-w-0 flex-wrap gap-2 sm:w-auto sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}

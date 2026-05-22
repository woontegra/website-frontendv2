import type { ReactNode } from 'react';
import { adminInputClass, adminLabelClass } from '@/admin/ui/adminUiClasses';

type FieldGroupProps = {
  label: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
};

export function FieldGroup({ label, hint, children, className = '' }: FieldGroupProps) {
  return (
    <label className={`block ${className}`.trim()}>
      <span className={adminLabelClass}>{label}</span>
      {hint && <span className="mt-1 block text-[13px] text-[#5c6b7a]">{hint}</span>}
      <div className="mt-2.5">{children}</div>
    </label>
  );
}

export function FieldGrid({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`grid ${className || 'grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6'}`}>{children}</div>;
}

export function ReadOnlyField({
  label,
  value,
  emptyLabel = 'Henüz girilmedi',
  compact = false,
}: {
  label: string;
  value: string | null | undefined;
  emptyLabel?: string;
  compact?: boolean;
}) {
  const text = value?.trim();
  return (
    <div>
      <p className={compact ? 'text-[12px] font-medium text-[#5c6b7a]' : adminLabelClass}>{label}</p>
      <p
        className={`text-[#1e2a3a] ${compact ? 'mt-1 text-[13px] leading-snug line-clamp-3' : 'mt-2 text-[15px] leading-relaxed'}`}
      >
        {text ? text : <span className="text-slate-400">{emptyLabel}</span>}
      </p>
    </div>
  );
}

export { adminInputClass };

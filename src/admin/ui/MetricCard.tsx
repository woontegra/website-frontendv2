import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { adminAccentBtnClass, adminMutedPanelClass } from '@/admin/ui/adminUiClasses';

type MetricCardProps = {
  value: string;
  label: string;
  description?: string;
  footer?: ReactNode;
  editing?: boolean;
  editForm?: ReactNode;
  highlight?: boolean;
  compact?: boolean;
};

export function MetricCard({
  value,
  label,
  description,
  footer,
  editing = false,
  editForm,
  highlight = false,
  compact = false,
}: MetricCardProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border transition-shadow ${
        compact ? 'p-3.5' : 'min-h-[200px] rounded-2xl p-6'
      } ${
        editing
          ? 'border-[#b8cdc8] bg-white ring-2 ring-[#0f5c56]/10 shadow-sm'
          : highlight
            ? 'border-[#dbe4ea] bg-white shadow-[0_2px_8px_rgba(26,36,51,0.08)]'
            : `${adminMutedPanelClass} shadow-[0_1px_2px_rgba(26,36,51,0.04)]`
      }`}
    >
      {editing && editForm ? (
        <div className="flex flex-col">{editForm}</div>
      ) : (
        <>
          <p
            className={`font-semibold leading-none tracking-tight text-slate-900 ${
              compact ? 'text-xl' : 'text-[2rem]'
            }`}
          >
            {value || '—'}
          </p>
          <p className={`font-medium text-slate-800 ${compact ? 'mt-1.5 text-[13px]' : 'mt-3 text-[15px]'}`}>
            {label || 'Metrik'}
          </p>
          {description && (
            <p className={`text-slate-500 ${compact ? 'mt-1 text-[12px] leading-snug' : 'mt-2 text-[14px]'}`}>
              {description}
            </p>
          )}
          {footer && <div className={compact ? 'mt-2.5' : 'mt-5'}>{footer}</div>}
        </>
      )}
    </div>
  );
}

export function MetricCardGrid({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`grid grid-cols-1 gap-3 ${className}`}>{children}</div>;
}

export function MetricCardButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full rounded-lg border border-[#dbe4ea] bg-[#f7faf9] py-2 text-[13px] font-medium text-[#1e2a3a] transition hover:border-[#c5d3dc] hover:bg-white disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function MetricSaveRow({
  saving,
  onSave,
  onCancel,
}: {
  saving: boolean;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-auto flex gap-2 pt-4">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-[13px] font-medium disabled:opacity-50 ${adminAccentBtnClass}`}
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Kaydet
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-lg border border-[#dbe4ea] px-3 py-2 text-[13px] font-medium text-[#4a5c6d] hover:bg-[#f7faf9]"
      >
        Vazgeç
      </button>
    </div>
  );
}

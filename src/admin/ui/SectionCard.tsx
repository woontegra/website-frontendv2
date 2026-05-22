import type { ReactNode } from 'react';
import { MapPin } from 'lucide-react';
import {
  adminAccentBtnClass,
  adminCardClass,
  adminCardHeaderBorderClass,
  adminCardHeaderTintClass,
  adminMutedPanelSubtleClass,
} from '@/admin/ui/adminUiClasses';

type SectionCardProps = {
  title: string;
  description: string;
  locationNote?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  compact?: boolean;
  tintedHeader?: boolean;
};

export function SectionCard({
  title,
  description,
  locationNote,
  action,
  children,
  className = '',
  compact = false,
  tintedHeader = false,
}: SectionCardProps) {
  return (
    <section className={`${adminCardClass} h-full ${className}`}>
      <div
        className={`flex flex-col gap-2 ${adminCardHeaderBorderClass} sm:flex-row sm:items-start sm:justify-between ${
          tintedHeader ? adminCardHeaderTintClass : 'bg-white'
        } ${compact ? 'px-3.5 py-3 sm:px-4' : 'gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8'}`}
      >
        <div className="min-w-0 flex-1 sm:pr-3">
          <h2
            className={`font-semibold tracking-[-0.01em] text-[#1e2a3a] ${
              compact ? 'text-[15px] leading-snug' : 'text-[1.25rem] sm:text-[1.35rem]'
            }`}
          >
            {title}
          </h2>
          <p className={`leading-snug text-[#5c6b7a] ${compact ? 'mt-1 text-[13px]' : 'mt-2 text-[15px]'}`}>
            {description}
          </p>
          {locationNote && (
            <p
              className={`flex items-start gap-1.5 ${adminMutedPanelSubtleClass} text-[#5c6b7a] ${
                compact ? 'mt-2 px-2.5 py-1.5 text-[12px] leading-snug' : 'mt-4 gap-2 px-4 py-3 text-[14px]'
              }`}
            >
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" strokeWidth={2} />
              <span>{locationNote}</span>
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={`min-w-0 ${compact ? 'px-3.5 py-3.5 sm:px-4' : 'px-4 py-6 sm:px-6 sm:py-7 lg:px-10 lg:py-9'}`}>
        {children}
      </div>
    </section>
  );
}

export function SectionEditActions({
  isEditing,
  saving,
  disabled,
  onEdit,
  onSave,
  onCancel,
  compact = false,
}: {
  isEditing: boolean;
  saving: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  compact?: boolean;
}) {
  const btn = compact ? 'rounded-lg px-3 py-1.5 text-[12px]' : 'rounded-xl px-4 py-2 text-[13px]';
  if (isEditing) {
    return (
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={onSave}
          disabled={disabled || saving}
          className={`inline-flex items-center gap-1.5 font-medium disabled:opacity-50 ${adminAccentBtnClass} ${btn}`}
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`border border-[#dbe4ea] bg-white font-medium text-[#4a5c6d] hover:border-[#c5d3dc] hover:bg-[#f7faf9] ${btn}`}
        >
          Vazgeç
        </button>
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onEdit}
      disabled={disabled || saving}
      className={`border border-[#dbe4ea] bg-white font-medium text-[#1e2a3a] shadow-[0_1px_2px_rgba(26,36,51,0.04)] hover:border-[#c5d3dc] hover:bg-[#f7faf9] disabled:opacity-50 ${btn}`}
    >
      Düzenle
    </button>
  );
}
